import { useState, useRef } from 'react';
import { ProseMirror } from '@nytimes/react-prosemirror';
import { EditorState } from 'prosemirror-state';
import { Node } from 'prosemirror-model';
import { docSchema } from './prosemirror/schema.js';
import { docPlugins } from './prosemirror/plugins.js';
import { useFileEditor } from './editorUtils.js';
import MenuBar from './prosemirror/menu/MenuBar.jsx';
import nodeViews from './prosemirror/nodeViews.js';

import 'prosemirror-view/style/prosemirror.css';
import './prosemirror/styles.css';
import 'katex/dist/katex.min.css';

const editorProps = {
	attributes: {
		spellcheck: 'false',
		class:
			'outline-none max-w-[70ch] min-h-[1rem] box-content px-8 mr-[20ch] border-l-2 border-r-2 border-iris-300'
	}
};

const stateConfig = {
	plugins: docPlugins
};

const defaultState = EditorState.create({
	...stateConfig,
	schema: docSchema
});

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
			return JSON.stringify({
				version: 1,
				data: stateRef.current.doc.toJSON()
			});
		},
		restoreFile(contents) {
			const newState = EditorState.create({
				...stateConfig,
				doc: Node.fromJSON(docSchema, JSON.parse(contents).data)
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
				nodeViews={nodeViews}
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
				<MenuBar />

				<div className="grow w-full overflow-y-scroll bg-iris-100 p-16">
					<div ref={setMount} />
				</div>
			</ProseMirror>
		</div>
	);
}

export default ProseMirrorEditor;
