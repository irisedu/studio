import { useState, useEffect, useRef, useCallback } from 'react';
import {
	Button,
	MenuTrigger,
	Popover,
	Menu,
	MenuItem,
	Separator,
	TextField,
	Input
} from 'react-aria-components';
import { open as openDialog } from '@tauri-apps/api/dialog';
import { homeDir, basename } from '@tauri-apps/api/path';
import {
	renameFile,
	removeFile,
	removeDir,
	createDir,
	writeFile
} from '@tauri-apps/api/fs';
import { Tree } from 'react-arborist';
import useResizeObserver from 'use-resize-observer';

import { useSelector, useDispatch } from 'react-redux';
import { setOpenDirectory } from '$state/appSlice.js';
import { openTab, changeTab, setTabs } from '$state/tabsSlice.js';

import { ROOT_ID, DirectoryTree, filterFileOp } from './DirectoryTree.js';
import DeleteDialog from '$components/DeleteDialog.jsx';
import OverwriteDialog from '$components/OverwriteDialog.jsx';
import { FILE_PREFIX, pathIcon, makeTab } from '$components/tabs/FileTab.jsx';
import '$components/Sidebar.css';

import Folder from '~icons/tabler/folder-filled';
import ChevronDown from '~icons/tabler/chevron-down';
import ChevronRight from '~icons/tabler/chevron-right';

async function openProject(dispatch) {
	const selected = await openDialog({
		directory: true,
		multiple: false,
		title: 'Open Project',
		defaultPath: await homeDir()
	});

	if (selected) {
		dispatch(setOpenDirectory(selected));
	}
}

function updateTabs(renameMap, openDirectory, dispatch, tabs, currentTab) {
	dispatch(
		setTabs(
			tabs.map((tab) => {
				if (!tab.id.startsWith(FILE_PREFIX)) return tab;

				const tabFile = tab.id.substr(FILE_PREFIX.length);

				// Moved
				if (renameMap[tabFile]) {
					return makeTab(openDirectory, renameMap[tabFile]);
				}

				// Overwritten
				if (
					Object.entries(renameMap).some(([, target]) => target === tabFile)
				) {
					return makeTab(openDirectory, tabFile);
				}

				return tab;
			})
		)
	);

	if (!currentTab.startsWith(FILE_PREFIX)) return;

	const currentTabFile = currentTab.slice(FILE_PREFIX.length);
	if (renameMap[currentTabFile])
		setTimeout(() =>
			dispatch(changeTab(FILE_PREFIX + renameMap[currentTabFile]))
		);
}

function treeCreate(tree, type) {
	let parentId = null;

	if (tree.selectedNodes.length) {
		const parent = tree.selectedNodes[0];
		if (parent.isLeaf) {
			parentId = parent.parent.id === ROOT_ID ? null : parent.parent.id;
			parent.parent.open(); // TODO this should not be necessary
		} else {
			parentId = parent.id;
			parent.open(); // TODO
		}
	}

	setTimeout(() => tree.create({ type, parentId })); // TODO
}

function Node({ tree, node, style, dragHandle }) {
	const [renameText, setRenameText] = useState('');
	const renameRef = useRef();
	const clickTimeout = useRef();

	return (
		<div style={style} className="cursor-pointer select-none">
			<div
				className={`px-2 border-2 border-transparent rounded-md flex flex-row gap-2 items-center${node.isSelected ? ' bg-iris-200' : ''}${node.isFocused ? ' border-iris-400' : ''}`}
				ref={dragHandle}
				onClick={(e) => {
					if (e.ctrlKey) {
						if (node.isSelected) node.deselect();
						else node.selectMulti();

						e.stopPropagation();
						return;
					}

					if (e.shiftKey) return;

					if (node.isLeaf && e.detail === 2) {
						tree.props.dispatch(
							openTab(makeTab(tree.props.openDirectory, node.id))
						);
						return;
					}

					if (!node.isSelected) {
						node.select();
						return;
					}

					node.toggle();
				}}
			>
				{node.data.isFolder ? (
					<Folder className="text-iris-500 w-5 h-5" />
				) : (
					pathIcon(node.id)
				)}

				{node.isEditing ? (
					<div
						onClick={(e) => e.stopPropagation()}
						className="grow max-w-[60%]"
					>
						<TextField
							aria-label="Rename"
							onFocusChange={(focused) => {
								if (focused) {
									setRenameText(node.data.name);
									setTimeout(() => renameRef.current.select());
								} else {
									node.reset();
								}
							}}
							onKeyDown={(e) =>
								e.key === 'Enter' &&
								renameText.length &&
								node.submit(renameText)
							}
							onKeyUp={(e) => e.key === 'Escape' && node.reset()}
							value={renameText}
							onChange={(text) =>
								setRenameText(text.replace(/[^A-Za-z0-9-./]/g, ''))
							}
							autoFocus
						>
							<Input
								className="react-aria-Input outline-none"
								ref={renameRef}
							/>
						</TextField>
					</div>
				) : (
					<span
						className="text-lg overflow-x-hidden whitespace-nowrap text-ellipsis"
						onClick={(e) => {
							if (e.ctrlKey || e.shiftKey) return;

							if (e.detail > 1) {
								if (clickTimeout.current) {
									clearTimeout(clickTimeout.current);
									clickTimeout.current = null;
								}
								return;
							}

							if (node.isSelected) {
								e.stopPropagation();
								clickTimeout.current = setTimeout(() => {
									node.edit();
									clickTimeout.current = null;
								}, 300);
							}
						}}
					>
						{node.data.name}
					</span>
				)}

				{node.data.isFolder && node.data.children.length > 0 && (
					<>
						<div className="grow" />
						{node.isOpen ? (
							<ChevronDown className="text-iris-500 w-5 h-5" />
						) : (
							<ChevronRight className="text-iris-500 w-5 h-5" />
						)}
					</>
				)}
			</div>
		</div>
	);
}

function Sidebar() {
	const dispatch = useDispatch();
	const openDirectory = useSelector((state) => state.app.openDirectory);
	const tabs = useSelector((state) => state.tabs.tabs);
	const currentTab = useSelector((state) => state.tabs.currentTab);

	const [dirDisplay, setDirDisplay] = useState(null);
	const tree = useRef();
	const {
		ref: resizeRef,
		width: treeWidth,
		height: treeHeight
	} = useResizeObserver();

	const [treeData, setTreeData] = useState(new DirectoryTree(tree));
	const reloadDir = useCallback(() => {
		treeData.readFromDir(openDirectory).then(setTreeData);
	}, [treeData, openDirectory]);

	const [deleteOpen, setDeleteOpen] = useState(false);
	const [deletePaths, setDeletePaths] = useState([]);
	const deleteCb = useRef();
	function promptDelete() {
		const nodes = filterFileOp(tree.current.selectedNodes);
		setDeletePaths(nodes.map((n) => n.data.name));
		deleteCb.current = () => {
			setTreeData(treeData.onDelete(nodes));

			Promise.all(
				nodes.map((n) => {
					return n.data.isFolder
						? removeDir(n.id, { recursive: true })
						: removeFile(n.id);
				})
			);

			dispatch(
				setTabs(
					tabs.filter((t) => !nodes.some((n) => t.id === FILE_PREFIX + n.id))
				)
			);
		};

		setDeleteOpen(true);
	}

	const [overwriteOpen, setOverwriteOpen] = useState(false);
	const [overwritePaths, setOverwritePaths] = useState([]);
	const overwriteCb = useRef();

	const [contextOpen, setContextOpen] = useState(false);
	const contextTarget = useRef();

	useEffect(() => {
		if (!openDirectory) return;

		basename(openDirectory).then(setDirDisplay);
		reloadDir();
	}, [reloadDir, openDirectory]);

	return (
		<div className="font-sans text-lg w-full h-full p-2">
			<DeleteDialog
				isOpen={deleteOpen}
				setIsOpen={setDeleteOpen}
				targetFiles={deletePaths}
				callbackRef={deleteCb}
			/>

			<OverwriteDialog
				isOpen={overwriteOpen}
				setIsOpen={setOverwriteOpen}
				targetFiles={overwritePaths}
				callbackRef={overwriteCb}
			/>

			<div ref={contextTarget} className="fixed" />
			<Popover
				placement="bottom left"
				isOpen={contextOpen}
				onOpenChange={setContextOpen}
				triggerRef={contextTarget}
			>
				<Menu aria-label="File tree menu">
					<MenuItem
						onAction={() => {
							treeCreate(tree.current, 'leaf');
							setContextOpen(false);
						}}
					>
						New file
					</MenuItem>
					<MenuItem
						onAction={() => {
							treeCreate(tree.current, 'internal');
							setContextOpen(false);
						}}
					>
						New folder
					</MenuItem>

					{tree.current && tree.current.selectedNodes.length > 0 && (
						<MenuItem
							onAction={() => {
								promptDelete();
								setContextOpen(false);
							}}
						>
							Delete selected
						</MenuItem>
					)}
					<MenuItem
						onAction={() => {
							openDirectory && reloadDir();
							setContextOpen(false);
						}}
					>
						Refresh
					</MenuItem>
				</Menu>
			</Popover>

			<MenuTrigger>
				<Button className="sidebar__button flex flex-row items-center gap-2">
					<Folder className="text-iris-500 w-5 h-5" />
					<span className="whitespace-nowrap overflow-hidden text-ellipsis">
						{dirDisplay || '<no open project>'}
					</span>
					<div className="grow" />
					<ChevronDown className="text-iris-500 w-5 h-5" />
				</Button>

				<Popover>
					<Menu>
						<MenuItem onAction={() => openDirectory && reloadDir()}>
							Refresh
						</MenuItem>
						<MenuItem onAction={() => openProject(dispatch)}>
							Open project
						</MenuItem>
					</Menu>
				</Popover>
			</MenuTrigger>

			<Separator className="react-aria-Separator my-2" />

			<div
				className="w-full h-full"
				ref={resizeRef}
				onKeyDown={(e) => {
					if (e.key === 'Delete' && tree.current.selectedNodes.length) {
						promptDelete();
					} else if (e.key === 'Escape') {
						if (contextOpen) setContextOpen(false);
					}
				}}
				onContextMenu={(e) => {
					const proxy = contextTarget.current;
					proxy.style.left = `${e.pageX}px`;
					proxy.style.top = `${e.pageY}px`;

					setContextOpen(true);
					e.preventDefault();
				}}
			>
				<Tree
					data={treeData.data}
					disableEdit={false}
					disableDrop={(args) => treeData.disableDrop(args)}
					onCreate={async (args) => {
						const { newTree, newNode } = treeData.onCreate(args, openDirectory);
						setTreeData(newTree);

						if (newNode.isFolder) {
							await createDir(newNode.id);
						} else {
							await writeFile(newNode.id, '');
						}

						return newNode;
					}}
					onRename={async (args) => {
						const res = await treeData.onRename(args);
						if (!res) return;

						const {
							newTree,
							oldId,
							newId,
							immediateParentId,
							renameMap,
							fileExists
						} = res;

						const doRename = async () => {
							setTreeData(newTree);
							setTimeout(() => tree.current.select(newId), 20);

							await createDir(immediateParentId, { recursive: true });
							await renameFile(oldId, newId);

							updateTabs(renameMap, openDirectory, dispatch, tabs, currentTab);
						};

						if (fileExists) {
							overwriteCb.current = doRename;
							setOverwritePaths([newId]);
							setOverwriteOpen(true);
						} else {
							await doRename();
						}
					}}
					onMove={async (args) => {
						const { newTree, nodeInfo, renameMap } = await treeData.onMove(
							args,
							openDirectory
						);

						const doMove = async () => {
							setTreeData(newTree);

							await Promise.all(
								nodeInfo.map((info) => {
									return renameFile(info.id, info.newId);
								})
							);

							updateTabs(renameMap, openDirectory, dispatch, tabs, currentTab);
						};

						const overwritePaths = nodeInfo
							.filter((i) => i.exists)
							.map((i) => i.newId);

						if (overwritePaths.length) {
							overwriteCb.current = doMove;
							setOverwritePaths(overwritePaths);
							setOverwriteOpen(true);
						} else {
							await doMove();
						}
					}}
					width={treeWidth}
					height={treeHeight}
					rowHeight={34}
					openByDefault={false}
					ref={tree}
					openDirectory={openDirectory}
					dispatch={dispatch}
				>
					{Node}
				</Tree>
			</div>
		</div>
	);
}

export default Sidebar;
