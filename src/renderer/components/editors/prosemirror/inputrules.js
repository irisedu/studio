import { InputRule } from 'prosemirror-inputrules';

const smartQuotes = [
	new InputRule(/(?:^|[\s{[(<'"\u2018\u201C])(")$/, '“'), // open double quote
	new InputRule(/"$/, '”'), // close double quote
	new InputRule(/(?:^|[\s{[(<'"\u2018\u201C])(')$/, '‘'), // open single quote
	new InputRule(/'$/, '’') // close single quote
];

const smartyPants = [
	new InputRule(/--$/, '–'), // en
	new InputRule(/–-$/, '—'), // em
	new InputRule(/\.\.\.$/, '…'), // ellipsis
	...smartQuotes
];

// https://github.com/ProseMirror/prosemirror-inputrules/blob/master/src/rules.ts
export const baseRules = [...smartyPants];

export const docRules = [...baseRules];
