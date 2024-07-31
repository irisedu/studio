import { history } from 'prosemirror-history';
import { keymap } from 'prosemirror-keymap';
import { baseKeymap, docKeymap } from './keymap.js';
import { inputRules } from 'prosemirror-inputrules';
import { baseRules, docRules } from './inputrules.js';
import { gapCursor } from 'prosemirror-gapcursor';
import { dropCursor } from 'prosemirror-dropcursor';
import { tableEditing, columnResizing } from 'prosemirror-tables';
import { cmArrowHandlers } from './codemirror.js';
import { katexPlugin } from './katex.js';

const _basePlugins = [
	history(),
	dropCursor({
		class: 'ProseMirror-dropcursor',
		color: false
	}),
	katexPlugin,
	gapCursor(),
	columnResizing(),
	tableEditing(),
	cmArrowHandlers
];

export const basePlugins = [
	..._basePlugins,
	keymap(baseKeymap),
	inputRules({ rules: baseRules })
];

export const docPlugins = [
	..._basePlugins,
	keymap(docKeymap),
	inputRules({ rules: docRules })
];
