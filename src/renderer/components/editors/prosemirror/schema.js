import { Schema } from 'prosemirror-model';

// https://github.com/ProseMirror/prosemirror-schema-basic/blob/master/src/schema-basic.ts
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

		nbsp: {
			group: 'inline',
			inline: true,
			toDOM() {
				return ['span', { class: 'display-nbsp' }, '\u00A0'];
			},
			parseDOM: [{ tag: 'span.display-nbsp' }]
		}
	},
	marks: {}
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
