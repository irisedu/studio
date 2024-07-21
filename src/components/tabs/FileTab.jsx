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

import File from '~icons/tabler/file-filled';
import TXT from '~icons/tabler/file-type-txt';
import JSON from '~icons/tabler/json';
import TOML from '~icons/tabler/toml';
import HTML from '~icons/tabler/brand-html5';
import CSS from '~icons/tabler/brand-css3';
import JS from '~icons/tabler/file-type-js';
import PDF from '~icons/tabler/file-type-pdf';
import TeX from '~icons/tabler/tex';
import SVG from '~icons/tabler/file-type-svg';
import JPG from '~icons/tabler/file-type-jpg';
import PNG from '~icons/tabler/file-type-png';

export const FILE_PREFIX = 'file-';

export function pathIcon(path) {
	const className = 'text-iris-500 w-5 h-5';

	if (path.endsWith('.txt')) {
		return <TXT className={className} />;
	} else if (path.endsWith('.json')) {
		return <JSON className={className} />;
	} else if (path.endsWith('.toml')) {
		return <TOML className={className} />;
	} else if (path.endsWith('.html') || path.endsWith('.njk')) {
		return <HTML className={className} />;
	} else if (path.endsWith('.css')) {
		return <CSS className={className} />;
	} else if (path.endsWith('.js')) {
		return <JS className={className} />;
	} else if (path.endsWith('.tex')) {
		return <TeX className={className} />;
	} else if (path.endsWith('.pdf')) {
		return <PDF className={className} />;
	} else if (path.endsWith('.svg')) {
		return <SVG className={className} />;
	} else if (path.endsWith('.jpg') || path.endsWith('.jpeg')) {
		return <JPG className={className} />;
	} else if (path.endsWith('.png')) {
		return <PNG className={className} />;
	}

	return <File className={className} />;
}

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

function makeFileEditor(tabData) {
	return <CodeMirrorEditor tabData={tabData} />;
}

export function makeTabData(openDirectory, path) {
	return {
		id: FILE_PREFIX + path,
		type: 'file',
		generation: 0,
		path,
		fileName: path.slice(openDirectory.length + 1)
	};
}

export function makeTab(data) {
	return {
		id: data.id,
		generation: data.generation,
		title: data.fileName,
		getView() {
			return makeFileEditor(data);
		},
		getIcon() {
			return pathIcon(data.path);
		}
	};
}
