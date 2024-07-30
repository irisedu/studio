import { tableNodeTypes } from 'prosemirror-tables';
import { TextSelection } from 'prosemirror-state';

export function insertNbsp(state, dispatch) {
	const nbsp = state.schema.nodes.nbsp;

	if (dispatch) dispatch(state.tr.replaceSelectionWith(nbsp.create()));

	return true;
}

export function clearFormatting(state, dispatch) {
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
}

// https://github.com/ProseMirror/prosemirror-tables/issues/91#issuecomment-794837907
function createTable(state, rowsCount, colsCount, withHeaderRow) {
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

export function addTable(
	state,
	dispatch,
	{ rowsCount, colsCount, withHeaderRow }
) {
	const { anchor } = state.selection;

	if (dispatch) {
		const nodes = createTable(state, rowsCount, colsCount, withHeaderRow);
		const tr = state.tr.replaceSelectionWith(nodes).scrollIntoView();
		const resolvedPos = tr.doc.resolve(anchor + 1);

		tr.setSelection(TextSelection.near(resolvedPos));

		dispatch(tr);
	}

	return true;
}

export function getSidenote(state) {
	const sidenote = state.schema.nodes.sidenote;
	const { $from } = state.selection;

	for (let i = 0; i <= $from.depth; i++) {
		if ($from.node(i).type === sidenote) return $from.start(i);
	}

	return null;
}

export function insertSidenote(state, dispatch) {
	const sidenote = state.schema.nodes.sidenote;
	const { anchor } = state.selection;

	if (getSidenote(state)) return false;

	if (dispatch) {
		const tr = state.tr.replaceSelectionWith(
			sidenote.createAndFill({}, state.selection.content().content)
		);

		tr.setSelection(TextSelection.near(tr.doc.resolve(anchor + 2)));
		dispatch(tr);
	}

	return true;
}

export function setSidenoteNumbering(numbered) {
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
