import { useState, useEffect, useRef } from 'react';
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
import { homeDir, basename, sep } from '@tauri-apps/api/path';
import {
	readDir,
	renameFile,
	removeFile,
	removeDir,
	createDir,
	exists,
	writeFile
} from '@tauri-apps/api/fs';
import { Tree } from 'react-arborist';
import useResizeObserver from 'use-resize-observer';

import DeleteDialog from '$components/DeleteDialog.jsx';
import OverwriteDialog from '$components/OverwriteDialog.jsx';
import { FILE_PREFIX, pathIcon, makeTab } from '$components/tabs/FileTab.jsx';
import '$components/Sidebar.css';

import Folder from '~icons/tabler/folder-filled';
import ChevronDown from '~icons/tabler/chevron-down';
import ChevronRight from '~icons/tabler/chevron-right';

const ROOT_ID = '__REACT_ARBORIST_INTERNAL_ROOT__';

function dirToTree(entries) {
	const out = [];

	for (const entry of entries) {
		const isFolder = entry.children !== undefined;
		out.push({
			id: entry.path,
			name: entry.name,
			isFolder,
			children: isFolder ? dirToTree(entry.children) : undefined
		});
	}

	return out;
}

function sortTree(tree) {
	tree.sort((a, b) => {
		if (a.isFolder && !b.isFolder) return -1;
		if (b.isFolder && !a.isFolder) return 1;

		return a.name.localeCompare(b.name);
	});

	tree.forEach((node) => node.children && sortTree(node.children));
}

function reloadDir(openDirectory, setTreeData) {
	readDir(openDirectory, { recursive: true }).then((entries) => {
		setTreeData(dirToTree(entries));
	});
}

async function openProject(setOpenDirectory) {
	const selected = await openDialog({
		directory: true,
		multiple: false,
		title: 'Open Project',
		defaultPath: await homeDir()
	});

	if (selected) {
		setOpenDirectory(selected);
	}
}

function disableDrop({ parentNode, dragNodes }) {
	if (dragNodes.every((n) => n.parent.id === parentNode.id)) return true;
	return false;
}

function modifyTree(treeData, cb) {
	return treeData.map((node) => {
		const newNode = structuredClone(node);
		if (node.children) newNode.children = modifyTree(node.children, cb);
		cb(newNode);

		return newNode;
	});
}

function nodeAncestors(node) {
	const ancestors = [];

	while (node.parent) {
		ancestors.push(node.parent.id);
		node = node.parent;
	}

	return ancestors;
}

function filterFileOp(nodes) {
	return nodes.filter((n) => {
		const ancestors = nodeAncestors(n);
		return !nodes.some((p) => ancestors.includes(p.id));
	});
}

function renameDescendants(from, to, renameMap, children) {
	return children.map((c) => {
		const newId = to + c.id.slice(from.length);
		renameMap[c.id] = newId;
		return {
			id: newId,
			name: c.name,
			isFolder: c.isFolder,
			children: c.children && renameDescendants(from, to, c.children)
		};
	});
}

function updateTabs(
	renameMap,
	openDirectory,
	tabs,
	setTabs,
	currentTab,
	setCurrentTab
) {
	setTabs(
		tabs.map((tab) => {
			if (!tab.id.startsWith(FILE_PREFIX)) return tab;
			const tabFile = tab.id.substr(FILE_PREFIX.length);

			if (renameMap[tabFile]) {
				return makeTab(openDirectory, renameMap[tabFile]);
			}

			return tab;
		})
	);

	if (!currentTab.startsWith(FILE_PREFIX)) return;

	const currentTabFile = currentTab.slice(FILE_PREFIX.length);
	if (renameMap[currentTabFile])
		setTimeout(
			() => setCurrentTab(FILE_PREFIX + renameMap[currentTabFile]),
			40
		);
}

async function onRenameInternal(
	id,
	newId,
	origParentId,
	insertParentId,
	immediateParentId,
	fileExists,
	newSubtree,
	origNode,
	openDirectory,
	tree,
	treeData,
	setTreeData,
	tabs,
	setTabs,
	currentTab,
	setCurrentTab,
	renameMap
) {
	// Remove the original node from the tree
	let newTree = modifyTree(treeData, (node) => {
		if (node.children) node.children = node.children.filter((c) => c.id !== id);
	}).filter((c) => c.id !== id);

	if (!fileExists) {
		// Insert the new node
		if (origNode.level === 0 && insertParentId === origParentId) {
			newTree.push(newSubtree);
		} else {
			newTree = modifyTree(newTree, (node) => {
				if (node.id === insertParentId) node.children.push(newSubtree);
			});
		}
	}

	setTreeData(newTree);
	setTimeout(() => tree.select(newId), 20);

	await createDir(immediateParentId, { recursive: true });
	await renameFile(id, newId);

	updateTabs(
		renameMap,
		openDirectory,
		tabs,
		setTabs,
		currentTab,
		setCurrentTab
	);
}

async function onRename(
	{ id, name },
	openDirectory,
	tree,
	treeData,
	setTreeData,
	tabs,
	setTabs,
	currentTab,
	setCurrentTab,
	setOverwriteOpen,
	setOverwritePaths,
	overwriteCb
) {
	const origNode = tree.get(id);
	const origName = origNode.data.name;
	if (origName === name) return;

	const origParentId = id.slice(0, -origName.length - 1);

	let newSubtree;
	let prevId = origParentId;
	let prevNode;
	let newId;
	let insertParentId = origParentId; // parent to insert the newSubtree
	let immediateParentId = origParentId; // immediate parent for use with recursive mkdir
	const renameMap = {};

	const split = name.split(sep);
	split.forEach((part, i) => {
		const partId = prevId + sep + part;
		prevId = partId;

		const isFolder = i !== split.length - 1 || origNode.data.isFolder;

		if (i === split.length - 2) immediateParentId = partId;
		if (i === split.length - 1) {
			newId = partId;
			renameMap[id] = newId;
		}

		// Part of the subtree might already exist
		if (tree.get(partId)) {
			if (isFolder) insertParentId = partId;
			return;
		}

		const newNode = {
			id: partId,
			name: part,
			isFolder,
			children: isFolder ? [] : undefined
		};

		// Update descendants
		if (i === split.length - 1 && origNode.data.children) {
			newNode.children = renameDescendants(
				id,
				newId,
				renameMap,
				origNode.data.children
			);
		}

		if (!newSubtree) newSubtree = newNode;
		if (prevNode) prevNode.children.push(newNode);
		prevNode = newNode;
	});

	const fileExists = await exists(newId);

	const doRename = async () =>
		await onRenameInternal(
			id,
			newId,
			origParentId,
			insertParentId,
			immediateParentId,
			fileExists,
			newSubtree,
			origNode,
			openDirectory,
			tree,
			treeData,
			setTreeData,
			tabs,
			setTabs,
			currentTab,
			setCurrentTab,
			renameMap
		);

	if (fileExists && overwriteCb) {
		overwriteCb.current = doRename;
		setOverwritePaths([newId]);
		setOverwriteOpen(true);
		return;
	}

	await doRename();
}

function onDelete(nodes, tree, treeData, setTreeData, tabs, setTabs) {
	const nodeFilter = (n1) => !nodes.some((n2) => n1.id === n2.id);

	setTreeData(
		modifyTree(treeData, (node) => {
			if (node.children) {
				node.children = node.children.filter(nodeFilter);
			}
		}).filter(nodeFilter)
	);

	tree.focus(nodes[0].prev);
	tree.deselectAll();

	Promise.all(
		nodes.map((n) => {
			return n.data.isFolder
				? removeDir(n.id, { recursive: true })
				: removeFile(n.id);
		})
	);

	setTabs(
		tabs.filter((t) => !nodes.some((n) => t.id.startsWith(FILE_PREFIX + n.id)))
	);
}

async function onMoveInternal(
	parentId,
	nodeInfo,
	openDirectory,
	treeData,
	setTreeData,
	tabs,
	setTabs,
	currentTab,
	setCurrentTab,
	renameMap
) {
	// Remove old
	let newTree = modifyTree(treeData, (node) => {
		if (node.children)
			node.children = node.children.filter(
				(c) => !nodeInfo.some((i) => i.id === c.id)
			);
	}).filter((c) => !nodeInfo.some((i) => i.id === c.id));

	// Insert new
	const newChildren = nodeInfo.filter((n) => !n.exists).map((n) => n.data);

	if (parentId === null) {
		newTree = newTree.concat(newChildren);
	} else {
		newTree = modifyTree(newTree, (node) => {
			if (node.id !== parentId) return;

			node.children = node.children.concat(newChildren);
		});
	}

	setTreeData(newTree);

	await Promise.all(
		nodeInfo.map((info) => {
			return renameFile(info.id, info.newId);
		})
	);

	updateTabs(
		renameMap,
		openDirectory,
		tabs,
		setTabs,
		currentTab,
		setCurrentTab
	);
}

async function onMove(
	{ dragIds, parentId },
	openDirectory,
	tree,
	treeData,
	setTreeData,
	tabs,
	setTabs,
	currentTab,
	setCurrentTab,
	setOverwriteOpen,
	setOverwritePaths,
	overwriteCb
) {
	const nodes = filterFileOp(dragIds.map((id) => tree.get(id))).filter(
		(n) =>
			n.parent.id !== parentId &&
			!(parentId === null && n.parent.id === ROOT_ID)
	);

	const renameMap = {};
	const nodeInfo = await Promise.all(
		nodes.map((node) => {
			const id = node.id;
			const newId = (parentId || openDirectory) + sep + node.data.name;
			renameMap[id] = newId;

			const newData = structuredClone(node.data);
			newData.id = newId;
			if (node.data.children)
				newData.children = renameDescendants(
					id,
					newId,
					renameMap,
					node.data.children
				);

			return exists(newId).then((res) => ({
				id,
				newId,
				data: newData,
				exists: res
			}));
		})
	);

	const doMove = async () =>
		await onMoveInternal(
			parentId,
			nodeInfo,
			openDirectory,
			treeData,
			setTreeData,
			tabs,
			setTabs,
			currentTab,
			setCurrentTab,
			renameMap
		);

	const overwritePaths = nodeInfo.filter((i) => i.exists).map((i) => i.newId);
	if (overwritePaths.length) {
		overwriteCb.current = doMove;
		setOverwritePaths(overwritePaths);
		setOverwriteOpen(true);
		return;
	}

	await doMove();
}

async function onCreate(
	{ parentId, type },
	openDirectory,
	tree,
	treeData,
	setTreeData
) {
	const isFolder = type === 'internal';
	const baseFileName = isFolder ? 'new-folder' : 'new-file';
	const baseDirectory = parentId || openDirectory;

	let fileName = baseFileName;
	let fileNum = 1;
	while (tree.get(baseDirectory + sep + fileName)) {
		fileName = `${baseFileName}-${fileNum}`;
		fileNum++;
	}

	const newNode = {
		id: baseDirectory + sep + fileName,
		name: fileName,
		isFolder,
		children: isFolder ? [] : undefined
	};

	let newTree;

	if (parentId === null) {
		newTree = treeData.concat([newNode]);
	} else {
		newTree = modifyTree(treeData, (node) => {
			if (node.id !== parentId) return;
			node.children.push(newNode);
		});
	}

	setTreeData(newTree);

	if (isFolder) {
		await createDir(newNode.id);
	} else {
		await writeFile(newNode.id, '');
	}

	setTimeout(() => {
		const node = tree.get(newNode.id);
		node.select();
		node.edit();
	}, 20);

	return newNode;
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
						tree.props.openTab(makeTab(tree.props.openDirectory, node.id));
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
							<Input ref={renameRef} />
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

function Sidebar({
	openDirectory,
	setOpenDirectory,
	tabs,
	setTabs,
	openTab,
	currentTab,
	setCurrentTab
}) {
	const [dirDisplay, setDirDisplay] = useState(null);
	const [treeData, setTreeDataInternal] = useState([]);
	const {
		ref: resizeRef,
		width: treeWidth,
		height: treeHeight
	} = useResizeObserver();
	const tree = useRef();

	const [deleteOpen, setDeleteOpen] = useState(false);
	const [deletePaths, setDeletePaths] = useState([]);
	const deleteCb = useRef();
	function promptDelete() {
		const nodes = filterFileOp(tree.current.selectedNodes);
		setDeletePaths(nodes.map((n) => n.data.name));
		deleteCb.current = () =>
			onDelete(nodes, tree.current, treeData, setTreeData, tabs, setTabs);
		setDeleteOpen(true);
	}

	const [overwriteOpen, setOverwriteOpen] = useState(false);
	const [overwritePaths, setOverwritePaths] = useState([]);
	const overwriteCb = useRef();

	const [contextOpen, setContextOpen] = useState(false);
	const contextTarget = useRef();

	function setTreeData(value) {
		sortTree(value);
		setTreeDataInternal(value);
	}

	useEffect(() => {
		if (!openDirectory) return;

		basename(openDirectory).then(setDirDisplay);
		reloadDir(openDirectory, setTreeData);
	}, [openDirectory]);

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
							openDirectory && reloadDir(openDirectory, setTreeData);
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
						<MenuItem
							onAction={() =>
								openDirectory && reloadDir(openDirectory, setTreeData)
							}
						>
							Refresh
						</MenuItem>
						<MenuItem onAction={() => openProject(setOpenDirectory)}>
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
					data={treeData}
					disableDrop={disableDrop}
					disableEdit={false}
					onRename={(args) =>
						onRename(
							args,
							openDirectory,
							tree.current,
							treeData,
							setTreeData,
							tabs,
							setTabs,
							currentTab,
							setCurrentTab,
							setOverwriteOpen,
							setOverwritePaths,
							overwriteCb
						)
					}
					onMove={(args) =>
						onMove(
							args,
							openDirectory,
							tree.current,
							treeData,
							setTreeData,
							tabs,
							setTabs,
							currentTab,
							setCurrentTab,
							setOverwriteOpen,
							setOverwritePaths,
							overwriteCb
						)
					}
					onCreate={(args) => {
						onCreate(args, openDirectory, tree.current, treeData, setTreeData);
					}}
					width={treeWidth}
					height={treeHeight}
					rowHeight={34}
					openByDefault={false}
					ref={tree}
					openDirectory={openDirectory}
					openTab={openTab}
				>
					{Node}
				</Tree>
			</div>
		</div>
	);
}

export default Sidebar;
