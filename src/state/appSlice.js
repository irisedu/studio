import { createSlice } from '@reduxjs/toolkit';

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
