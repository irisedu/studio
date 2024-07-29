import { useState } from 'react';
import { docSchema } from './schema.js';
import { undo, redo } from 'prosemirror-history';
import { toggleMark, setBlockType } from 'prosemirror-commands';
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
	MenuItem
} from 'react-aria-components';
import { clearFormatting } from './commands.js';

import Undo from '~icons/tabler/arrow-back-up';
import Redo from '~icons/tabler/arrow-forward-up';
import Bold from '~icons/tabler/bold';
import Italic from '~icons/tabler/italic';
import Underline from '~icons/tabler/underline';
import Code from '~icons/tabler/code';
import Heading from '~icons/tabler/heading';
import ClearFormatting from '~icons/tabler/clear-formatting';

function markActive(state, markType) {
	// https://github.com/ProseMirror/prosemirror-example-setup/blob/43c1d95fb8669a86c3869338da00dd6bd974197d/src/menu.ts#L58-L62
	const { from, $from, to, empty } = state.selection;
	if (empty) return !!markType.isInSet(state.storedMarks || $from.marks());

	return state.doc.rangeHasMark(from, to, markType);
}

function isNode(state, nodeType) {
	return state.selection.$from.parent.type === nodeType;
}

function CommandButton({ Icon, command, tooltip, ...props }) {
	const onPress = useEditorEventCallback((view) => {
		command(view.state, view.dispatch, view);

		view.focus();
	});

	return (
		<TooltipTrigger delay={300}>
			<Button className="round-button" onPress={onPress} {...props}>
				<Icon className="text-iris-500 w-6 h-6 m-auto" />
			</Button>
			<Tooltip placement="bottom">{tooltip}</Tooltip>
		</TooltipTrigger>
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
				<Icon className="text-iris-500 w-6 h-6 m-auto" />
			</ToggleButton>
			<Tooltip placement="bottom">{tooltip}</Tooltip>
		</TooltipTrigger>
	);
}

function HeadingMenu() {
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
		setActive(isNode(view.state, docSchema.nodes.heading));
	});

	return (
		<MenuTrigger>
			<TooltipTrigger delay={300}>
				<ToggleButton
					className="round-button"
					aria-label="Heading"
					isSelected={active}
				>
					<Heading className="text-iris-500 w-6 h-6 m-auto" />
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
			/>
			<CommandButton
				Icon={Redo}
				command={redo}
				aria-label="Redo"
				tooltip="Redo"
			/>

			<CommandButton
				Icon={ClearFormatting}
				command={clearFormatting(docSchema.nodes.paragraph)}
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
				Icon={Code}
				markType={docSchema.marks.code}
				aria-label="Inline Code"
				tooltip="Inline Code"
			/>

			<div className="w-5" />

			<HeadingMenu />
		</div>
	);
}

export default MenuBar;
