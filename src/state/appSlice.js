import { createSlice } from '@reduxjs/toolkit';
import { setTabs } from './tabsSlice.js';

export const appSlice = createSlice({
	name: 'app',
	initialState: {
		darkTheme: false,
		openDirectory: null
	},
	reducers: {
		setDarkTheme(state, action) {
			state.darkTheme = action.payload;
		},
		setOpenDirectory(state, action) {
			state.openDirectory = action.payload;
		}
	}
});

export const { setDarkTheme, setOpenDirectory } = appSlice.actions;

export default appSlice.reducer;

export const openDirectoryMiddleware =
	({ getState, dispatch }) =>
	(next) =>
	(action) => {
		if (setOpenDirectory.match(action)) {
			dispatch(setTabs(getState().tabs.tabs.filter((t) => t.type !== 'file')));
		}

		return next(action);
	};
