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
	exitCode
} from 'prosemirror-commands';

import { baseSchema, docSchema } from './schema.js';
import { insertNbsp } from './commands.js';

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

	'Mod-Space': insertNbsp(baseSchema.nodes.nbsp)
};

export const docKeymap = {
	...baseKeymap,

	'Mod-Space': insertNbsp(docSchema.nodes.nbsp)
};
