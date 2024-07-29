import { Schema } from 'prosemirror-model';

// Some portions from https://github.com/ProseMirror/prosemirror-schema-basic/blob/master/src/schema-basic.ts
// Copyright (C) 2015-2017 by Marijn Haverbeke <marijn@haverbeke.berlin> and others (MIT)
const baseSchemaDef = {
	nodes: {
		doc: { content: 'block+' },
		text: { group: 'inline' },

		paragraph: {
			group: 'block',
			content: 'inline*',
			toDOM() {
				return ['p', 0];
			},
			parseDOM: [{ tag: 'p' }]
		},

		heading: {
			group: 'block',
			content: 'inline*',
			attrs: { level: { default: 2, validate: 'number' } },
			defining: true,
			toDOM(node) {
				return ['h' + node.attrs.level, 0];
			},
			parseDOM: [
				{ tag: 'h2', attrs: { level: 2 } },
				{ tag: 'h3', attrs: { level: 3 } },
				{ tag: 'h4', attrs: { level: 4 } }
			]
		},

		nbsp: {
			group: 'inline',
			inline: true,
			toDOM() {
				return ['span', { class: 'display-nbsp' }, '\u00A0'];
			},
			parseDOM: [{ tag: 'span.display-nbsp' }]
		}
	},
	marks: {
		em: {
			toDOM() {
				return ['em', 0];
			},
			parseDOM: [
				{ tag: 'i' },
				{ tag: 'em' },
				{ style: 'font-style=italic' },
				{ style: 'font-style=normal', clearMark: (m) => m.type.name == 'em' }
			]
		},
		strong: {
			toDOM() {
				return ['strong', 0];
			},
			parseDOM: [
				{ tag: 'strong' },
				// This works around a Google Docs misbehavior where
				// pasted content will be inexplicably wrapped in `<b>`
				// tags with a font-weight normal.
				{
					tag: 'b',
					getAttrs: (node) => node.style.fontWeight != 'normal' && null
				},
				{ style: 'font-weight=400', clearMark: (m) => m.type.name == 'strong' },
				{
					style: 'font-weight',
					getAttrs: (value) => /^(bold(er)?|[5-9]\d{2,})$/.test(value) && null
				}
			]
		},
		u: {
			toDOM() {
				return ['u', 0];
			},
			parseDOM: [{ tag: 'u' }, { style: 'text-decoration=underline' }]
		},
		s: {
			toDOM() {
				return ['s', 0];
			},
			parseDOM: [{ tag: 's' }, { style: 'text-decoration=line-through' }]
		},

		code: {
			toDOM() {
				return ['code', 0];
			},
			parseDOM: [{ tag: 'code' }]
		}
	}
};

const docSchemaDef = {
	nodes: {
		...baseSchemaDef.nodes,
		doc: { content: 'block+' }
	},
	marks: {
		...baseSchemaDef.marks
	}
};

export const baseSchema = new Schema(baseSchemaDef);
export const docSchema = new Schema(docSchemaDef);
