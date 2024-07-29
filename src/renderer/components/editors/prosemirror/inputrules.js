import {
	InputRule,
	textblockTypeInputRule,
	wrappingInputRule
} from 'prosemirror-inputrules';
import { baseSchema, docSchema } from './schema.js';

// Some input rules from ProseMirror examples
// Copyright (C) 2015-2017 by Marijn Haverbeke <marijn@haverbeke.berlin> and others (MIT)

const smartQuotes = [
	// cycles
	new InputRule(/“"$/, '”'),
	new InputRule(/”"$/, '"'),
	new InputRule(/""$/, '“'),

	new InputRule(/‘'$/, '’'),
	new InputRule(/’'$/, "'"),
	new InputRule(/''$/, '‘'),

	// normal
	new InputRule(/(?:^|[\s{[(<`'"\u2018\u201C])(")$/, '“'), // open double quote
	new InputRule(/"$/, '”'), // close double quote
	new InputRule(/(?:^|[\s{[(<`'"\u2018\u201C])(')$/, '‘'), // open single quote
	new InputRule(/'$/, '’') // close single quote
];

// https://github.com/ProseMirror/prosemirror-inputrules/blob/master/src/rules.ts
const smartyPants = [
	new InputRule(/--$/, '–'), // en
	new InputRule(/–-$/, '—'), // em
	new InputRule(/\.\.\.$/, '…'), // ellipsis
	...smartQuotes
];

function markRule(delimiter, delimiterLength, markType, opts) {
	return new InputRule(
		new RegExp(`(^|[\\s])${delimiter}(.+)${delimiter}$`, 'i'),
		(state, match, start, end) => {
			const mark = markType.create();
			const offset = match[1].length;

			start += offset;

			return state.tr
				.addMark(start, end, mark)
				.delete(end - delimiterLength + 1, end)
				.delete(start, start + delimiterLength)
				.removeStoredMark(mark);
		},
		opts
	);
}

function schemaCommonRules(schema) {
	return [
		markRule('/', 1, schema.marks.em, { inCode: true }),
		markRule('\\*', 1, schema.marks.strong, { inCode: true }),
		markRule('__', 2, schema.marks.u, { inCode: true }),
		markRule('~~', 2, schema.marks.s, { inCode: true }),
		markRule('`', 1, schema.marks.code),

		// https://github.com/ProseMirror/prosemirror-example-setup/blob/master/src/inputrules.ts
		textblockTypeInputRule(/^(#{2,4})\s$/, schema.nodes.heading, (match) => ({
			level: match[1].length
		})),

		wrappingInputRule(
			/^(\d+)\.\s$/,
			schema.nodes.ordered_list,
			(match) => ({ order: +match[1] }),
			(match, node) => node.childCount + node.attrs.order == +match[1]
		),
		wrappingInputRule(/^\s*([-+*])\s$/, schema.nodes.bullet_list)
	];
}

const _baseRules = [...smartyPants];

export const baseRules = [..._baseRules, ...schemaCommonRules(baseSchema)];

export const docRules = [..._baseRules, ...schemaCommonRules(docSchema)];
