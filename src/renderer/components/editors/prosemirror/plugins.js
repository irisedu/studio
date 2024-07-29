import { history } from 'prosemirror-history';
import { keymap } from 'prosemirror-keymap';
import { baseKeymap, docKeymap } from './keymap.js';
import { inputRules } from 'prosemirror-inputrules';
import { baseRules, docRules } from './inputrules.js';

const _basePlugins = [history()];

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
