import { Plugin, Selection, PluginKey } from 'prosemirror-state';
import { Decoration, DecorationSet } from 'prosemirror-view';
import KaTeX from 'katex';
import { toggleMark } from 'prosemirror-commands';
import { insertNode } from './commands.js';

const pluginKey = new PluginKey('katex');

function getKaTeXDecorations(doc, selection, preview) {
	const decos = [];

	function render(node, pos, focused, displayMode) {
		const elem = document.createElement('span');
		elem.classList.add('katex-render');

		if (!preview && !focused) return elem;

		if (displayMode) elem.classList.add('katex-render--display');
		if (preview) elem.classList.add('katex-render--preview');
		if (focused && !preview) elem.classList.add('katex-render--focus');

		const $pos = doc.resolve(pos);
		const { $head } = Selection.near($pos, 1);
		elem.dataset.pos = $head.pos;

		const content = node.textContent.trim();
		if (!content.length) elem.classList.add('katex-render--empty');

		try {
			KaTeX.render(content, elem, { displayMode });
		} catch (err) {
			elem.classList.add('katex-render--error');
			elem.innerHTML = err.toString();
		}

		return elem;
	}

	doc.descendants((node, pos) => {
		// Based on https://github.com/benrbray/prosemirror-math/blob/master/lib/math-nodeview.ts
		// Copyright © 2020-2024 Benjamin R. Bray (MIT)

		const key = (focused) => `${node.textContent}_${focused}_${preview}`;

		if (node.type.name === 'math_display') {
			const focused = selection.$head.parent === node;

			decos.push(
				Decoration.widget(pos, () => render(node, pos, focused, true), {
					key: key(focused)
				})
			);
		} else if (node.marks.some((m) => m.type.name === 'math_inline')) {
			const focused = node === doc.nodeAt(Math.max(0, selection.head - 1)); // ???

			decos.push(
				Decoration.widget(pos, () => render(node, pos, focused, false), {
					side: -1,
					key: key(focused)
				})
			);
		}
	});

	return DecorationSet.create(doc, decos);
}

export const katexPlugin = new Plugin({
	state: {
		init(_, { doc, selection }) {
			return {
				preview: false,
				decorations: getKaTeXDecorations(doc, selection, false)
			};
		},
		apply(tr, old) {
			const preview =
				tr.getMeta(pluginKey) === undefined
					? old.preview
					: tr.getMeta(pluginKey);

			return {
				preview,
				decorations: getKaTeXDecorations(tr.doc, tr.selection, preview)
			};
		}
	},
	props: {
		decorations(state) {
			return this.getState(state).decorations;
		},
		handleClick(view, _, event) {
			const renderElem = event.target.closest('.katex-render');
			if (renderElem) {
				view.dispatch(
					view.state.tr
						.setMeta(pluginKey, false)
						.setSelection(
							Selection.near(view.state.doc.resolve(renderElem.dataset.pos))
						)
				);

				return true;
			}
		}
	}
});

export function getMathPreviewEnabled(state) {
	const pluginState = katexPlugin.getState(state);
	return pluginState && pluginState.preview;
}

export function setMathPreviewEnabled(enabled) {
	return (state, dispatch) => {
		if (dispatch) {
			const tr = state.tr.setMeta(pluginKey, enabled);

			if (enabled) tr.removeStoredMark(state.schema.marks.math_inline);

			dispatch(tr);
		}

		return true;
	};
}

export function toggleInlineMath(state, dispatch) {
	const inlineMath = state.schema.marks.math_inline;
	if (!toggleMark(inlineMath)(state, null)) return false;

	if (dispatch) {
		let tr;
		toggleMark(inlineMath)(state, (cmdTr) => (tr = cmdTr));
		tr.setMeta(pluginKey, false);

		dispatch(tr);
	}

	return true;
}

export function insertDisplayMath(state, dispatch) {
	const displayMath = state.schema.nodes.math_display;
	if (!insertNode(displayMath)(state, null)) return false;

	if (dispatch) {
		let tr;
		insertNode(displayMath)(state, (cmdTr) => (tr = cmdTr));
		tr.setMeta(pluginKey, false);

		dispatch(tr);
	}

	return true;
}
