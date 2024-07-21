import { useEffect, useState, useRef } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { color } from '@uiw/codemirror-extensions-color';
import { hyperLink } from '@uiw/codemirror-extensions-hyper-link';
import { githubDark, githubLight } from '@uiw/codemirror-theme-github';
import { LanguageDescription } from '@codemirror/language';
import { languages } from '@codemirror/language-data';
import { readTextFile, writeTextFile } from '@tauri-apps/api/fs';

import { useDispatch, useSelector } from 'react-redux';
import { setTabState } from '$state/tabsSlice.js';

async function getLanguageExtension(path) {
	const ext = LanguageDescription.matchFilename(languages, path);
	if (ext) return await ext.load();
}

function CodeMirrorEditor({ tabData }) {
	const dispatch = useDispatch();
	const dark = useSelector((store) => store.app.darkTheme);
	const state = useSelector((store) => store.tabs.tabState[tabData.id]);

	const editor = useRef();

	// Initial CM state
	const [initialValue, setInitialValue] = useState();
	const [initialState, setInitialState] = useState();
	const [extensions, setExtensions] = useState();

	// Autosave - must not have any dependencies as initialization (below) depends on this
	const autosaveTimeout = useRef();
	function autosave() {
		if (!editor.current) return;
		if (autosaveTimeout.current) clearTimeout(autosaveTimeout.current);

		dispatch(
			setTabState({
				id: tabData.id,
				state: {
					prevState: editor.current.state.toJSON()
				}
			})
		);
	}

	// Initialization only
	useEffect(() => {
		const currState = state || {};

		if (currState.prevState) {
			setInitialState({ json: currState.prevState });
			setInitialValue(currState.prevState.doc);
		} else if (!currState.modified) {
			readTextFile(tabData.path).then((contents) => {
				setInitialValue(contents);
			});
		}

		getLanguageExtension(tabData.path).then((ext) => {
			const exts = [color, hyperLink];
			if (ext) exts.push(ext);

			setExtensions(exts);
		});

		return autosave;
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	useEffect(() => {
		function onKeyDown(e) {
			if (!e.ctrlKey || e.repeat) return;

			if (e.key === 's') {
				writeTextFile(tabData.path, editor.current.state.doc.toString());
				dispatch(setTabState({ id: tabData.id, state: null }));

				if (autosaveTimeout.current) clearTimeout(autosaveTimeout.current);
			}
		}

		document.addEventListener('keydown', onKeyDown);

		return () => document.removeEventListener('keydown', onKeyDown);
	}, [dispatch, tabData.id, tabData.path]);

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
			onChange={() => {
				const currState = state || {};

				if (!currState.modified) {
					dispatch(
						setTabState({
							id: tabData.id,
							state: { modified: true }
						})
					);
				}

				if (autosaveTimeout.current) clearTimeout(autosaveTimeout.current);

				autosaveTimeout.current = setTimeout(() => {
					autosave();
				}, 5000);
			}}
		/>
	);
}

export default CodeMirrorEditor;
