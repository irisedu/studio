import { useState, useRef } from 'react';
import {
	ProseMirror,
	useEditorEventCallback,
	useEditorEffect
} from '@nytimes/react-prosemirror';
import { EditorState } from 'prosemirror-state';
import { Node } from 'prosemirror-model';
import { keymap } from 'prosemirror-keymap';
import { history, undo, redo } from 'prosemirror-history';
import { toggleMark } from 'prosemirror-commands';
import { inputRules } from 'prosemirror-inputrules';
import { docSchema } from './prosemirror/schema.js';
import { docKeymap } from './prosemirror/keymap.js';
import { docRules } from './prosemirror/inputrules.js';
import { Button, ToggleButton } from 'react-aria-components';
import { useFileEditor } from './editorUtils.js';

import Undo from '~icons/tabler/arrow-back-up';
import Redo from '~icons/tabler/arrow-forward-up';
import Bold from '~icons/tabler/bold';
import Italic from '~icons/tabler/italic';
import Underline from '~icons/tabler/underline';
import Code from '~icons/tabler/code';

import 'prosemirror-view/style/prosemirror.css';
import './prosemirror/styles.css';

const editorProps = {
	attributes: {
		spellcheck: 'false',
		class:
			'outline-none max-w-[70ch] box-content px-8 mr-[20ch] text-lg border-l-2 border-r-2 border-iris-300'
	}
};

const stateConfig = {
	plugins: [history(), keymap(docKeymap), inputRules({ rules: docRules })]
};

const defaultState = EditorState.create({
	...stateConfig,
	schema: docSchema
});

function CommandButton({ Icon, command, ...props }) {
	const onPress = useEditorEventCallback((view) => {
		command(view.state, view.dispatch, view);

		view.focus();
	});

	return (
		<Button className="round-button" onPress={onPress} {...props}>
			<Icon className="text-iris-500 w-6 h-6 m-auto" />
		</Button>
	);
}

function markActive(state, markType) {
	// https://github.com/ProseMirror/prosemirror-example-setup/blob/43c1d95fb8669a86c3869338da00dd6bd974197d/src/menu.ts#L58-L62
	const { from, $from, to, empty } = state.selection;
	if (empty) return !!markType.isInSet(state.storedMarks || $from.marks());

	return state.doc.rangeHasMark(from, to, markType);
}

function ToggleMarkButton({ Icon, markType, ...props }) {
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
		<ToggleButton
			className="round-button"
			isSelected={active}
			onChange={onChange}
			{...props}
		>
			<Icon className="text-iris-500 w-6 h-6 m-auto" />
		</ToggleButton>
	);
}

function ProseMirrorEditor({ tabData }) {
	const [mount, setMount] = useState();

	const [editorState, setEditorState] = useState(defaultState);
	const stateRef = useRef(defaultState);

	const { onEditorChange, autosave } = useFileEditor({
		tabData,
		getAutosave() {
			return stateRef.current.toJSON();
		},
		restoreAutosave(state) {
			const prevState = EditorState.fromJSON(
				{ ...stateConfig, schema: docSchema },
				state
			);

			setEditorState(prevState);
			stateRef.current = prevState;
		},
		getFile() {
			return JSON.stringify(stateRef.current.doc.toJSON());
		},
		restoreFile(contents) {
			const newState = EditorState.create({
				...stateConfig,
				doc: Node.fromJSON(docSchema, JSON.parse(contents))
			});

			setEditorState(newState);
			stateRef.current = newState;
		}
	});

	return (
		<div className="flex flex-col h-full">
			<ProseMirror
				{...editorProps}
				mount={mount}
				state={editorState}
				dispatchTransaction={(tr) => {
					setEditorState((s) => {
						const newState = s.apply(tr);

						if (!s.doc.eq(newState.doc)) onEditorChange();

						stateRef.current = newState;
						return newState;
					});
				}}
				handleDOMEvents={{
					focusout: autosave
				}}
			>
				<div className="flex flex-row items-center gap-2 p-2">
					<CommandButton Icon={Undo} command={undo} aria-label="Undo" />
					<CommandButton Icon={Redo} command={redo} aria-label="Redo" />

					<div className="w-5" />

					<ToggleMarkButton
						Icon={Bold}
						markType={docSchema.marks.strong}
						aria-label="Bold"
					/>
					<ToggleMarkButton
						Icon={Italic}
						markType={docSchema.marks.em}
						aria-label="Italic"
					/>
					<ToggleMarkButton
						Icon={Underline}
						markType={docSchema.marks.u}
						aria-label="Underline"
					/>
					<ToggleMarkButton
						Icon={Code}
						markType={docSchema.marks.code}
						aria-label="Inline code"
					/>
				</div>

				<div className="grow w-full overflow-y-scroll bg-iris-100 p-8">
					<div ref={setMount} />
				</div>
			</ProseMirror>
		</div>
	);
}

export default ProseMirrorEditor;
