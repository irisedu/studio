import { InputRule } from 'prosemirror-inputrules';
import { baseSchema, docSchema } from './schema.js';

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

function commonFormattingRules(schema) {
	return [
		markRule('/', 1, schema.marks.em, { inCode: true }),
		markRule('\\*', 1, schema.marks.strong, { inCode: true }),
		markRule('__', 2, schema.marks.u, { inCode: true }),
		markRule('~~', 2, schema.marks.s, { inCode: true }),
		markRule('`', 1, schema.marks.code)
	];
}

// https://github.com/ProseMirror/prosemirror-inputrules/blob/master/src/rules.ts
const _baseRules = [...smartyPants];

export const baseRules = [..._baseRules, ...commonFormattingRules(baseSchema)];

export const docRules = [..._baseRules, ...commonFormattingRules(docSchema)];
