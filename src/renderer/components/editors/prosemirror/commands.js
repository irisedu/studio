export function insertNbsp(state, dispatch) {
	const nbsp = state.schema.nodes.nbsp;
	const { $from } = state.selection;
	const index = $from.index();

	if (!$from.parent.canReplaceWith(index, index, nbsp)) return false;

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
