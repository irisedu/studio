import { useState, useRef } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { history, historyField } from '@codemirror/commands';
import { color } from '@uiw/codemirror-extensions-color';
import { hyperLink } from '@uiw/codemirror-extensions-hyper-link';
import { githubDark, githubLight } from '@uiw/codemirror-theme-github';
import { LanguageDescription } from '@codemirror/language';
import { languages } from '@codemirror/language-data';
import { useFileEditor } from './editorUtils.js';

import { useSelector } from 'react-redux';

const stateFields = {
	history: historyField
};

async function getLanguageExtension(path) {
	const ext = LanguageDescription.matchFilename(languages, path);
	if (ext) return await ext.load();
}

function CodeMirrorEditor({ tabData }) {
	const dark = useSelector((store) => store.app.darkTheme);

	const editor = useRef();

	// Initial CM state
	const [initialValue, setInitialValue] = useState();
	const [initialState, setInitialState] = useState();
	const [extensions, setExtensions] = useState();

	const { onEditorChange, autosave } = useFileEditor({
		tabData,
		getAutosave() {
			return editor.current && editor.current.state.toJSON(stateFields);
		},
		restoreAutosave(state) {
			setInitialState({ json: state, fields: stateFields });
			setInitialValue(state.doc);
		},
		getFile() {
			return editor.current.state.doc.toString();
		},
		restoreFile: setInitialValue,
		doInit() {
			getLanguageExtension(tabData.path).then((ext) => {
				const exts = [color, hyperLink, history()];
				if (ext) exts.push(ext);

				setExtensions(exts);
			});
		}
	});

	return (
		<CodeMirror
			height="100%"
			style={{ height: '100%' }}
			extensions={extensions}
			theme={dark ? githubDark : githubLight}
			value={initialValue}
			initialState={initialState}
			onCreateEditor={(view) => {
				editor.current = view;
				view.focus();
			}}
			onChange={onEditorChange}
			onUpdate={(viewUpdate) => {
				if (viewUpdate.focusChanged && !viewUpdate.view.hasFocus) autosave();
			}}
		/>
	);
}

export default CodeMirrorEditor;
