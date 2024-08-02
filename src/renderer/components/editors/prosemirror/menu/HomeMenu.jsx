import { useState } from 'react';
import {
	useEditorEventCallback,
	useEditorEffect
} from '@nytimes/react-prosemirror';
import { languages } from '@codemirror/language-data';
import {
	Button,
	ToggleButton,
	MenuTrigger,
	Popover,
	Menu,
	MenuItem,
	Modal,
	Dialog,
	Heading,
	ListBoxItem
} from 'react-aria-components';
import { Dropdown } from 'iris/aria-components';
import { setBlockType } from 'prosemirror-commands';
import { wrapInList, liftListItem } from 'prosemirror-schema-list';
import {
	isNode,
	ToggleMarkButton,
	CommandButton,
	MenuBarTooltip
} from './components.jsx';
import {
	clearFormatting,
	replaceNode,
	getSidenote,
	insertSidenote,
	setSidenoteNumbering
} from '../commands.js';
import { docSchema } from '../schema.js';
import {
	getMathPreviewEnabled,
	setMathPreviewEnabled,
	toggleInlineMath,
	insertDisplayMath
} from '../katex.js';
import {
	useVisibility,
	useVisibilityParent,
	VisibilityContext,
	VisibilityGroup
} from './VisibilityContext.jsx';

import Bold from '~icons/tabler/bold';
import Italic from '~icons/tabler/italic';
import Underline from '~icons/tabler/underline';
import SmallCaps from '~icons/tabler/letter-a-small';
import Code from '~icons/tabler/code';
import ClearFormatting from '~icons/tabler/clear-formatting';
import TextStyle from '~icons/tabler/text-size';
import Math from '~icons/tabler/math';
import MathPreview from '~icons/tabler/math-function';
import OrderedList from '~icons/tabler/list-numbers';
import BulletList from '~icons/tabler/list';
import Outdent from '~icons/tabler/indent-decrease';
import Sidenote from '~icons/tabler/layout-sidebar-right-collapse-filled';
import SidenoteNumbering from '~icons/tabler/number-1-small';

function CodeLanguageDialog({ isOpen, setIsOpen, language, setLanguage }) {
	const setCode = useEditorEventCallback((view, language) => {
		replaceNode(docSchema.nodes.code_block, { language })(
			view.state,
			view.dispatch,
			view
		);

		view.focus();
	});

	return (
		<Modal isDismissable isOpen={isOpen} onOpenChange={setIsOpen}>
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
						setIsOpen(false);
					}}
				>
					Create
				</Button>
			</Dialog>
		</Modal>
	);
}

function TextStyleMenu({ index }) {
	const [visible, setVisible] = useVisibility(index);
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

	useEditorEffect((view) => {
		const normal = setBlockType(docSchema.nodes.paragraph)(
			view.state,
			null,
			view
		);
		const headings =
			setBlockType(docSchema.nodes.heading, { level: 0 })(
				view.state,
				null,
				view
			) && !getSidenote(view.state);
		const codeBlock = setBlockType(docSchema.nodes.code_block)(
			view.state,
			null,
			view
		);

		if (setVisible) setVisible(normal || headings || codeBlock);
		setNormalVisible(normal);
		setHeadingsVisible(headings);
		setCodeVisible(codeBlock);

		setActive(
			isNode(view.state, docSchema.nodes.heading) ||
				isNode(view.state, docSchema.nodes.code_block)
		);
	});

	return (
		<>
			<CodeLanguageDialog
				isOpen={codeDialogOpen}
				setIsOpen={setCodeDialogOpen}
				language={language}
				setLanguage={setLanguage}
			/>

			<MenuTrigger>
				<MenuBarTooltip tooltip="Text Style">
					<ToggleButton
						className={`round-button${visible ? '' : ' hidden'}`}
						aria-label="Text Style"
						isSelected={active}
					>
						<TextStyle className="text-iris-500 w-3/5 h-3/5 m-auto" />
					</ToggleButton>
				</MenuBarTooltip>
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
	);
}

function MathPreviewToggle() {
	const [active, setActive] = useState(false);
	const onChange = useEditorEventCallback((view, value) => {
		setMathPreviewEnabled(value)(view.state, view.dispatch);
		setActive(value);

		view.focus();
	});

	useEditorEffect((view) => {
		setActive(getMathPreviewEnabled(view.state));
	});

	return (
		<MenuBarTooltip tooltip="Math Preview">
			<ToggleButton
				className="round-button"
				isSelected={active}
				onChange={onChange}
				aria-label="Math Preview"
			>
				<MathPreview className="text-iris-500 w-3/5 h-3/5 m-auto" />
			</ToggleButton>
		</MenuBarTooltip>
	);
}

function SidenoteNumberingToggle({ index }) {
	const [visible, setVisible] = useVisibility(index);
	const [active, setActive] = useState(false);
	const onChange = useEditorEventCallback((view, value) => {
		setSidenoteNumbering(value)(view.state, view.dispatch, view);
		setActive(value);

		view.focus();
	});

	useEditorEffect((view) => {
		const sidenotePos = getSidenote(view.state);
		if (setVisible) setVisible(!!sidenotePos);
		if (sidenotePos)
			setActive(view.state.doc.resolve(sidenotePos).parent.attrs.numbered);
	});

	return (
		<MenuBarTooltip tooltip="Sidenote Numbering">
			<ToggleButton
				className={`round-button${visible ? '' : ' hidden'}`}
				isSelected={active}
				onChange={onChange}
				aria-label="Sidenote Numbering"
			>
				<SidenoteNumbering className="text-iris-500 w-3/5 h-3/5 m-auto" />
			</ToggleButton>
		</MenuBarTooltip>
	);
}

function HomeMenu({ index }) {
	const { childVisibility, setChildVisibility } = useVisibilityParent(index);

	let groupIdx = 0;
	let formatIdx = 0;
	let listIdx = 0;
	let sidenoteIdx = 0;

	return (
		<VisibilityContext.Provider value={{ childVisibility, setChildVisibility }}>
			<VisibilityGroup index={groupIdx++} className="flex flex-row gap-2">
				<ToggleMarkButton
					index={formatIdx++}
					Icon={Bold}
					markType={docSchema.marks.strong}
					tooltip="Bold"
					keys={['Mod', 'B']}
				/>
				<ToggleMarkButton
					index={formatIdx++}
					Icon={Italic}
					markType={docSchema.marks.em}
					tooltip="Italic"
					keys={['Mod', 'I']}
				/>
				<ToggleMarkButton
					index={formatIdx++}
					Icon={Underline}
					markType={docSchema.marks.u}
					tooltip="Underline"
					keys={['Mod', 'U']}
				/>
				<ToggleMarkButton
					index={formatIdx++}
					Icon={SmallCaps}
					markType={docSchema.marks.smallcaps}
					tooltip="Small Caps"
				/>
				<ToggleMarkButton
					index={formatIdx++}
					Icon={Code}
					markType={docSchema.marks.code}
					tooltip="Inline Code"
					keys={['Mod', '`']}
				/>

				<TextStyleMenu index={formatIdx++} />

				<CommandButton
					index={formatIdx++}
					Icon={ClearFormatting}
					command={clearFormatting}
					tooltip="Clear Formatting"
				/>
			</VisibilityGroup>

			{/* Does not need VisibilityGroup since preview toggle is always visible */}
			<div className="flex flex-row gap-2">
				<ToggleMarkButton
					Icon={() => (
						<>
							<Math className="text-iris-500 inline w-4 h-4" />
							<sup className="text-iris-500 font-bold" aria-hidden>
								i
							</sup>
						</>
					)}
					command={toggleInlineMath}
					markType={docSchema.marks.math_inline}
					tooltip="Inline Math"
					keys={['Alt', 'Space']}
				/>

				<CommandButton
					Icon={() => (
						<>
							<Math className="text-iris-500 inline w-4 h-4" />
							<sup className="text-iris-500 font-bold" aria-hidden>
								d
							</sup>
						</>
					)}
					command={insertDisplayMath}
					tooltip="Display Math"
					keys={['Shift', 'Alt', 'Space']}
				/>

				<MathPreviewToggle />
			</div>

			<VisibilityGroup index={groupIdx++} className="flex flex-row gap-2">
				<CommandButton
					index={listIdx++}
					Icon={OrderedList}
					command={wrapInList(docSchema.nodes.ordered_list)}
					tooltip="Number List"
				/>
				<CommandButton
					index={listIdx++}
					Icon={BulletList}
					command={wrapInList(docSchema.nodes.bullet_list)}
					tooltip="Bullet List"
				/>
				<CommandButton
					index={listIdx++}
					Icon={Outdent}
					command={liftListItem(docSchema.nodes.list_item)}
					tooltip="List Outdent"
				/>
			</VisibilityGroup>

			<VisibilityGroup index={groupIdx++} className="flex flex-row gap-2">
				<CommandButton
					index={sidenoteIdx++}
					Icon={Sidenote}
					command={insertSidenote}
					tooltip="Sidenote"
				/>
				<SidenoteNumberingToggle index={sidenoteIdx++} />
			</VisibilityGroup>
		</VisibilityContext.Provider>
	);
}

export default HomeMenu;
