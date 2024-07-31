import { useState } from 'react';
import { docSchema } from './schema.js';
import { undo, redo } from 'prosemirror-history';
import { toggleMark, setBlockType } from 'prosemirror-commands';
import { wrapInList, liftListItem } from 'prosemirror-schema-list';
import {
	isInTable,
	deleteTable,
	addColumnAfter,
	addColumnBefore,
	deleteColumn,
	addRowAfter,
	addRowBefore,
	deleteRow,
	mergeCells,
	splitCell,
	setCellAttr,
	toggleHeaderRow,
	toggleHeaderColumn,
	toggleHeaderCell
} from 'prosemirror-tables';
import {
	useEditorEventCallback,
	useEditorEffect
} from '@nytimes/react-prosemirror';
import {
	Button,
	ToggleButton,
	TooltipTrigger,
	Tooltip,
	MenuTrigger,
	Popover,
	Menu,
	MenuItem,
	Separator,
	Modal,
	Dialog,
	Heading,
	ListBoxItem
} from 'react-aria-components';
import { Submenu, Dropdown } from 'iris/aria-components';
import { languages } from '@codemirror/language-data';
import {
	clearFormatting,
	addTable,
	insertSidenote,
	getSidenote,
	setSidenoteNumbering,
	insertNode,
	replaceNode
} from './commands.js';

import Undo from '~icons/tabler/arrow-back-up';
import Redo from '~icons/tabler/arrow-forward-up';
import Bold from '~icons/tabler/bold';
import Italic from '~icons/tabler/italic';
import Underline from '~icons/tabler/underline';
import SmallCaps from '~icons/tabler/letter-a-small';
import Code from '~icons/tabler/code';
import TextStyle from '~icons/tabler/text-size';
import ClearFormatting from '~icons/tabler/clear-formatting';
import OrderedList from '~icons/tabler/list-numbers';
import BulletList from '~icons/tabler/list';
import Outdent from '~icons/tabler/indent-decrease';
import Table from '~icons/tabler/table';
import Sidenote from '~icons/tabler/layout-sidebar-right-collapse-filled';
import SidenoteNumbering from '~icons/tabler/number-1-small';

function markActive(state, markType) {
	// https://github.com/ProseMirror/prosemirror-example-setup/blob/43c1d95fb8669a86c3869338da00dd6bd974197d/src/menu.ts#L58-L62
	const { from, $from, to, empty } = state.selection;
	if (empty) return !!markType.isInSet(state.storedMarks || $from.marks());

	return state.doc.rangeHasMark(from, to, markType);
}

function isNode(state, nodeType) {
	return state.selection.$from.parent.type === nodeType;
}

function CommandButton({ Icon, command, tooltip, alwaysVisible, ...props }) {
	const [visible, setVisible] = useState(false);
	const onPress = useEditorEventCallback((view) => {
		command(view.state, view.dispatch, view);

		view.focus();
	});

	useEditorEffect((view) => {
		setVisible(command(view.state, null, view));
	});

	return (
		(alwaysVisible || visible) && (
			<TooltipTrigger delay={300}>
				<Button className="round-button" onPress={onPress} {...props}>
					<Icon className="text-iris-500 w-3/5 h-3/5 m-auto" />
				</Button>
				<Tooltip placement="bottom">{tooltip}</Tooltip>
			</TooltipTrigger>
		)
	);
}

function ToggleMarkButton({ Icon, markType, tooltip, ...props }) {
	const [visible, setVisible] = useState(false);
	const [active, setActive] = useState(false);
	const onChange = useEditorEventCallback((view, value) => {
		toggleMark(markType)(view.state, view.dispatch, view);
		setActive(!value);

		view.focus();
	});

	useEditorEffect((view) => {
		setVisible(toggleMark(markType)(view.state, null, view));
		setActive(markActive(view.state, markType));
	});

	return (
		visible && (
			<TooltipTrigger delay={300}>
				<ToggleButton
					className="round-button"
					isSelected={active}
					onChange={onChange}
					{...props}
				>
					<Icon className="text-iris-500 w-3/5 h-3/5 m-auto" />
				</ToggleButton>
				<Tooltip placement="bottom">{tooltip}</Tooltip>
			</TooltipTrigger>
		)
	);
}

function TextStyleMenu() {
	const [normalVisible, setNormalVisible] = useState(false);
	const [headingsVisible, setHeadingsVisible] = useState(false);
	const [codeVisible, setCodeVisible] = useState(false);
	const [active, setActive] = useState(false);
	const [codeDialogOpen, setCodeDialogOpen] = useState(false);
	const [language, setLanguage] = useState('');

	const setBlock = useEditorEventCallback((view, type, attrs) => {
		setBlockType(type, attrs || {})(view.state, view.dispatch, view);
		view.focus();
	});

	const setCode = useEditorEventCallback((view, language) => {
		replaceNode(docSchema.nodes.code_block, { language })(
			view.state,
			view.dispatch,
			view
		);

		view.focus();
	});

	useEditorEffect((view) => {
		setNormalVisible(
			setBlockType(docSchema.nodes.paragraph)(view.state, null, view)
		);
		setHeadingsVisible(
			setBlockType(docSchema.nodes.heading, { level: 0 })(
				view.state,
				null,
				view
			) && !getSidenote(view.state)
		);
		setCodeVisible(
			setBlockType(docSchema.nodes.code_block)(view.state, null, view)
		);

		setActive(
			isNode(view.state, docSchema.nodes.heading) ||
				isNode(view.state, docSchema.nodes.code_block)
		);
	});

	return (
		(normalVisible || headingsVisible || codeVisible) && (
			<>
				<Modal
					isDismissable
					isOpen={codeDialogOpen}
					onOpenChange={setCodeDialogOpen}
				>
					<Dialog>
						<Heading slot="title">Insert code block</Heading>
						<Dropdown
							label="Language"
							selectedKey={language}
							onSelectionChange={setLanguage}
						>
							<ListBoxItem id="">Plain text</ListBoxItem>
							{languages.map((lang) => (
								<ListBoxItem
									key={lang.name}
									id={lang.alias.length ? lang.alias[0] : lang.name}
									textValue={lang.name}
								>
									{lang.name}
									{lang.alias.length && !lang.alias[0].includes(' ') && (
										<>
											{' '}
											(<span className="font-mono">{lang.alias[0]}</span>)
										</>
									)}
								</ListBoxItem>
							))}
						</Dropdown>
						<Button
							className="react-aria-Button border-iris-300"
							autoFocus
							onPress={() => {
								setCode(language);
								setCodeDialogOpen(false);
							}}
						>
							Create
						</Button>
					</Dialog>
				</Modal>

				<MenuTrigger>
					<TooltipTrigger delay={300}>
						<ToggleButton
							className="round-button"
							aria-label="Text Style"
							isSelected={active}
						>
							<TextStyle className="text-iris-500 w-3/5 h-3/5 m-auto" />
						</ToggleButton>
						<Tooltip placement="bottom">Text Style</Tooltip>
					</TooltipTrigger>
					<Popover>
						<Menu>
							{normalVisible && (
								<MenuItem onAction={() => setBlock(docSchema.nodes.paragraph)}>
									Normal text
								</MenuItem>
							)}
							{headingsVisible && (
								<>
									<MenuItem
										onAction={() =>
											setBlock(docSchema.nodes.heading, { level: 2 })
										}
									>
										Heading 2
									</MenuItem>
									<MenuItem
										onAction={() =>
											setBlock(docSchema.nodes.heading, { level: 3 })
										}
									>
										Heading 3
									</MenuItem>
									<MenuItem
										onAction={() =>
											setBlock(docSchema.nodes.heading, { level: 4 })
										}
									>
										Heading 4
									</MenuItem>
								</>
							)}
							{codeVisible && (
								<MenuItem
									onAction={() => {
										setCodeDialogOpen(true);
									}}
								>
									Code Block
								</MenuItem>
							)}
						</Menu>
					</Popover>
				</MenuTrigger>
			</>
		)
	);
}

function TableMenu() {
	const [active, setActive] = useState(false);

	const insertTable = useEditorEventCallback((view) => {
		addTable(view.state, view.dispatch, {
			rowsCount: 2,
			colsCount: 2,
			withHeaderRow: true
		});
	});

	const runCommand = useEditorEventCallback((view, command) => {
		command(view.state, view.dispatch, view);
	});

	useEditorEffect((view) => {
		// HACK: avoid new menu items from flashing on screen during animate out
		setTimeout(() => setActive(isInTable(view.state)), 200);
	});

	return (
		<MenuTrigger>
			<TooltipTrigger delay={300}>
				<ToggleButton
					className="round-button"
					aria-label="Table"
					isSelected={active}
				>
					<Table className="text-iris-500 w-3/5 h-3/5 m-auto" />
				</ToggleButton>
				<Tooltip placement="bottom">Table</Tooltip>
			</TooltipTrigger>
			<Popover>
				<Menu>
					{!active && <MenuItem onAction={insertTable}>Insert table</MenuItem>}
					{active && (
						<>
							<MenuItem onAction={() => runCommand(addColumnBefore)}>
								Add column before
							</MenuItem>
							<MenuItem onAction={() => runCommand(addColumnAfter)}>
								Add column after
							</MenuItem>
							<MenuItem onAction={() => runCommand(deleteColumn)}>
								Delete column
							</MenuItem>

							<Separator />

							<MenuItem onAction={() => runCommand(addRowBefore)}>
								Add row before
							</MenuItem>
							<MenuItem onAction={() => runCommand(addRowAfter)}>
								Add row after
							</MenuItem>
							<MenuItem onAction={() => runCommand(deleteRow)}>
								Delete row
							</MenuItem>

							<Separator />

							<MenuItem onAction={() => runCommand(mergeCells)}>
								Merge cells
							</MenuItem>
							<MenuItem onAction={() => runCommand(splitCell)}>
								Split cell
							</MenuItem>

							<Separator />

							<MenuItem onAction={() => runCommand(toggleHeaderRow)}>
								Toggle header row
							</MenuItem>
							<MenuItem onAction={() => runCommand(toggleHeaderColumn)}>
								Toggle header column
							</MenuItem>
							<MenuItem onAction={() => runCommand(toggleHeaderCell)}>
								Toggle header cell
							</MenuItem>

							<Separator />

							<Submenu label="Justify">
								<MenuItem
									onAction={() => runCommand(setCellAttr('justify', 'left'))}
								>
									Left
								</MenuItem>
								<MenuItem
									onAction={() => runCommand(setCellAttr('justify', 'center'))}
								>
									Center
								</MenuItem>
								<MenuItem
									onAction={() => runCommand(setCellAttr('justify', 'right'))}
								>
									Right
								</MenuItem>
							</Submenu>

							<Separator />

							<MenuItem onAction={() => runCommand(deleteTable)}>
								Delete table
							</MenuItem>
						</>
					)}
				</Menu>
			</Popover>
		</MenuTrigger>
	);
}

function SidenoteNumberingToggle() {
	const [active, setActive] = useState(false);
	const [sidenotePos, setSidenotePos] = useState();
	const onChange = useEditorEventCallback((view, value) => {
		setSidenoteNumbering(value)(view.state, view.dispatch, view);
		setActive(value);

		view.focus();
	});

	useEditorEffect((view) => {
		const sidenotePos = getSidenote(view.state);
		setSidenotePos(sidenotePos);
		if (sidenotePos)
			setActive(view.state.doc.resolve(sidenotePos).parent.attrs.numbered);
	});

	return (
		sidenotePos && (
			<TooltipTrigger delay={300}>
				<ToggleButton
					className="round-button"
					isSelected={active}
					onChange={onChange}
					aria-label="Sidenote Numbering"
				>
					<SidenoteNumbering className="text-iris-500 w-3/5 h-3/5 m-auto" />
				</ToggleButton>
				<Tooltip placement="bottom">Sidenote Numbering</Tooltip>
			</TooltipTrigger>
		)
	);
}

function MenuBar() {
	return (
		<div className="flex flex-row items-center gap-6 p-2 overflow-auto">
			<div className="flex flex-row gap-2">
				<CommandButton
					Icon={Undo}
					command={undo}
					aria-label="Undo"
					tooltip="Undo"
					alwaysVisible
				/>
				<CommandButton
					Icon={Redo}
					command={redo}
					aria-label="Redo"
					tooltip="Redo"
					alwaysVisible
				/>

				<CommandButton
					Icon={ClearFormatting}
					command={clearFormatting}
					aria-label="Clear Formatting"
					tooltip="Clear Formatting"
				/>
			</div>

			<div className="flex flex-row gap-2">
				<ToggleMarkButton
					Icon={Bold}
					markType={docSchema.marks.strong}
					aria-label="Bold"
					tooltip="Bold"
				/>
				<ToggleMarkButton
					Icon={Italic}
					markType={docSchema.marks.em}
					aria-label="Italic"
					tooltip="Italic"
				/>
				<ToggleMarkButton
					Icon={Underline}
					markType={docSchema.marks.u}
					aria-label="Underline"
					tooltip="Underline"
				/>
				<ToggleMarkButton
					Icon={SmallCaps}
					markType={docSchema.marks.smallcaps}
					aria-label="Small Caps"
					tooltip="Small Caps"
				/>
				<ToggleMarkButton
					Icon={Code}
					markType={docSchema.marks.code}
					aria-label="Inline Code"
					tooltip="Inline Code"
				/>
			</div>

			<div className="flex flex-row gap-2">
				<TextStyleMenu />

				<CommandButton
					Icon={() => <span className="text-iris-500 text-xl">—</span>}
					command={insertNode(docSchema.nodes.horizontal_rule)}
					aria-label="Horizontal Rule"
					tooltip="Horizontal Rule"
				/>

				<TableMenu />

				<CommandButton
					Icon={OrderedList}
					command={wrapInList(docSchema.nodes.ordered_list)}
					aria-label="Number List"
					tooltip="Number List"
				/>
				<CommandButton
					Icon={BulletList}
					command={wrapInList(docSchema.nodes.bullet_list)}
					aria-label="Bullet List"
					tooltip="Bullet List"
				/>
				<CommandButton
					Icon={Outdent}
					command={liftListItem(docSchema.nodes.list_item)}
					aria-label="List Outdent"
					tooltip="List Outdent"
				/>

				<CommandButton
					Icon={Sidenote}
					command={insertSidenote}
					aria-label="Sidenote"
					tooltip="Sidenote"
				/>
				<SidenoteNumberingToggle />
			</div>
		</div>
	);
}

export default MenuBar;
