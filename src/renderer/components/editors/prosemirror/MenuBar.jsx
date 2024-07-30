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
	Separator
} from 'react-aria-components';
import { Submenu } from 'iris/aria-components';
import { clearFormatting, addTable, insertSidenote } from './commands.js';

import Undo from '~icons/tabler/arrow-back-up';
import Redo from '~icons/tabler/arrow-forward-up';
import Bold from '~icons/tabler/bold';
import Italic from '~icons/tabler/italic';
import Underline from '~icons/tabler/underline';
import SmallCaps from '~icons/tabler/letter-a-small';
import Code from '~icons/tabler/code';
import Heading from '~icons/tabler/heading';
import ClearFormatting from '~icons/tabler/clear-formatting';
import OrderedList from '~icons/tabler/list-numbers';
import BulletList from '~icons/tabler/list';
import Outdent from '~icons/tabler/indent-decrease';
import Table from '~icons/tabler/table';
import Sidenote from '~icons/tabler/layout-sidebar-right-collapse-filled';

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
	const [active, setActive] = useState(false);
	const onChange = useEditorEventCallback((view, value) => {
		toggleMark(markType)(view.state, view.dispatch, view);
		setActive(!value);

		view.focus();
	});

	useEditorEffect((view) => {
		setActive(markActive(view.state, markType));
	});

	return (
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
	);
}

function HeadingMenu() {
	const [visible, setVisible] = useState(false);
	const [active, setActive] = useState(false);

	const setNormal = useEditorEventCallback((view) => {
		setBlockType(docSchema.nodes.paragraph)(view.state, view.dispatch, view);
	});

	const changeHeading = useEditorEventCallback((view, level) => {
		setBlockType(docSchema.nodes.heading, { level })(
			view.state,
			view.dispatch,
			view
		);
	});

	useEditorEffect((view) => {
		setVisible(
			setBlockType(docSchema.nodes.paragraph)(view.state, null, view) ||
				setBlockType(docSchema.nodes.heading)(view.state, null, view)
		);
		setActive(isNode(view.state, docSchema.nodes.heading));
	});

	return (
		visible && (
			<MenuTrigger>
				<TooltipTrigger delay={300}>
					<ToggleButton
						className="round-button"
						aria-label="Heading"
						isSelected={active}
					>
						<Heading className="text-iris-500 w-3/5 h-3/5 m-auto" />
					</ToggleButton>
					<Tooltip placement="bottom">Heading</Tooltip>
				</TooltipTrigger>
				<Popover>
					<Menu>
						<MenuItem onAction={setNormal}>Normal text</MenuItem>
						<MenuItem onAction={() => changeHeading(2)}>Heading 2</MenuItem>
						<MenuItem onAction={() => changeHeading(3)}>Heading 3</MenuItem>
						<MenuItem onAction={() => changeHeading(4)}>Heading 4</MenuItem>
					</Menu>
				</Popover>
			</MenuTrigger>
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

function MenuBar() {
	return (
		<div className="flex flex-row items-center gap-2 p-2">
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

			<div className="w-5" />

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

			<div className="w-5" />

			<HeadingMenu />
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
		</div>
	);
}

export default MenuBar;
