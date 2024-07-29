export function insertNbsp(type) {
	return (state, dispatch) => {
		const { $from } = state.selection;
		const index = $from.index();

		if (!$from.parent.canReplaceWith(index, index, type)) return false;

		if (dispatch) dispatch(state.tr.replaceSelectionWith(type.create()));

		return true;
	};
}

export function clearFormatting(normalType) {
	return (state, dispatch) => {
		if (dispatch) {
			const { from, to } = state.selection;

			dispatch(
				state.tr
					.removeMark(from, to)
					.setBlockType(from, to, normalType)
					.setStoredMarks([])
					.scrollIntoView()
			);
		}

		return true;
	};
}
