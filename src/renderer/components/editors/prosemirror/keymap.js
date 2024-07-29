import { undo, redo } from 'prosemirror-history';
import { undoInputRule } from 'prosemirror-inputrules';
import {
	chainCommands,
	newlineInCode,
	createParagraphNear,
	liftEmptyBlock,
	splitBlock,
	deleteSelection,
	joinBackward,
	joinForward,
	selectNodeBackward,
	selectNodeForward,
	selectAll,
	exitCode,
	toggleMark
} from 'prosemirror-commands';

import { baseSchema, docSchema } from './schema.js';
import { insertNbsp, clearFormatting } from './commands.js';

function schemaCommonKeymap(schema) {
	return {
		'Mod-Space': insertNbsp(schema.nodes.nbsp),

		'Mod-i': toggleMark(schema.marks.em),
		'Mod-b': toggleMark(schema.marks.strong),
		'Mod-u': toggleMark(schema.marks.u),
		'Alt-Shift-5': toggleMark(schema.marks.s),

		'Mod-`': toggleMark(schema.marks.code),

		'Mod-\\': clearFormatting(schema.nodes.paragraph)
	};
}

// https://github.com/ProseMirror/prosemirror-commands/blob/master/src/commands.ts
export const baseKeymap = {
	Enter: chainCommands(
		newlineInCode,
		createParagraphNear,
		liftEmptyBlock,
		splitBlock
	),
	Backspace: chainCommands(deleteSelection, joinBackward, selectNodeBackward),
	Delete: chainCommands(deleteSelection, joinForward, selectNodeForward),
	'Mod-z': chainCommands(undoInputRule, undo),
	'Mod-y': redo,
	'Mod-Shift-z': redo,
	'Mod-a': selectAll,
	'Mod-Enter': exitCode,

	...schemaCommonKeymap(baseSchema)
};

export const docKeymap = {
	...baseKeymap,
	...schemaCommonKeymap(docSchema)
};
