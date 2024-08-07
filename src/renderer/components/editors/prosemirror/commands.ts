import type { NodeType, Attrs } from 'prosemirror-model';
import { tableNodeTypes } from 'prosemirror-tables';
import {
	TextSelection,
	type Command,
	type EditorState
} from 'prosemirror-state';

export function insertNode(nodeType: NodeType): Command {
	return (state, dispatch) => {
		if (dispatch)
			dispatch(
				state.tr.replaceSelectionWith(nodeType.create()).scrollIntoView()
			);

		return true;
	};
}

export function replaceNode(nodeType: NodeType, attrs?: Attrs): Command {
	return (state, dispatch) => {
		const { $from } = state.selection;
		const from = $from.before();
		const to = $from.after();

		if (dispatch) {
			const node = nodeType.createAndFill(attrs);

			if (node) {
				const tr = state.tr.replaceWith(from, to, node);
				dispatch(tr.setSelection(TextSelection.near(tr.doc.resolve(from))));
			}
		}

		return true;
	};
}

export const clearFormatting: Command = (state, dispatch) => {
	if (dispatch) {
		const { from, to } = state.selection;

		dispatch(
			state.tr
				.removeMark(from, to)
				.setBlockType(from, to, state.schema.nodes.paragraph)
				.setStoredMarks([])
				.scrollIntoView()
		);
	}

	return true;
};

// https://github.com/ProseMirror/prosemirror-tables/issues/91#issuecomment-794837907
function createTable(
	state: EditorState,
	rowsCount: number,
	colsCount: number,
	withHeaderRow: boolean
) {
	const types = tableNodeTypes(state.schema);
	const headerCells = [];
	const cells = [];

	for (let i = 0; i < colsCount; i++) {
		const cell = types.cell.createAndFill();

		if (cell) {
			cells.push(cell);
		}

		if (withHeaderRow) {
			const headerCell = types.header_cell.createAndFill();

			if (headerCell) {
				headerCells.push(headerCell);
			}
		}
	}

	const rows = [];

	for (let i = 0; i < rowsCount; i++) {
		rows.push(
			types.row.createChecked(
				null,
				withHeaderRow && i === 0 ? headerCells : cells
			)
		);
	}

	return types.table.createChecked(null, rows);
}

export function addTable({
	rowsCount,
	colsCount,
	withHeaderRow
}: {
	rowsCount: number;
	colsCount: number;
	withHeaderRow: boolean;
}): Command {
	return (state, dispatch) => {
		const { anchor } = state.selection;

		if (dispatch) {
			const nodes = createTable(state, rowsCount, colsCount, withHeaderRow);
			const tr = state.tr.replaceSelectionWith(nodes).scrollIntoView();
			const resolvedPos = tr.doc.resolve(anchor + 1);

			tr.setSelection(TextSelection.near(resolvedPos));

			dispatch(tr);
		}

		return true;
	};
}

export function getSidenote(state: EditorState) {
	const sidenote = state.schema.nodes.sidenote;
	const { $from } = state.selection;

	for (let i = 0; i <= $from.depth; i++) {
		if ($from.node(i).type === sidenote) return $from.start(i);
	}

	return null;
}

export const insertSidenote: Command = (state, dispatch) => {
	const sidenote = state.schema.nodes.sidenote;
	const { anchor } = state.selection;

	if (getSidenote(state)) return false;

	if (dispatch) {
		const node = sidenote.createAndFill({}, state.selection.content().content);

		if (node) {
			const tr = state.tr.replaceSelectionWith(node);

			tr.setSelection(TextSelection.near(tr.doc.resolve(anchor + 2)));
			dispatch(tr);
		}
	}

	return true;
};

export function setSidenoteNumbering(numbered: boolean): Command {
	return (state, dispatch) => {
		const sidenotePos = getSidenote(state);
		if (!sidenotePos) return false;

		if (dispatch) {
			dispatch(
				state.tr.setNodeAttribute(sidenotePos - 1, 'numbered', numbered)
			);
		}

		return true;
	};
}
