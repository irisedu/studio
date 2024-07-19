import { createSlice } from '@reduxjs/toolkit';

import * as welcomeTab from '$components/tabs/WelcomeTab.jsx';

export const tabsSlice = createSlice({
	name: 'tabs',
	initialState: {
		// Modules cannot go into Redux state
		tabs: [{ ...welcomeTab }],
		currentTab: null
	},
	reducers: {
		openTab(state, action) {
			const tabObj = action.payload;
			if (!state.tabs.some((t) => t.id === tabObj.id)) state.tabs.push(tabObj);

			state.currentTab = tabObj.id;
		},
		closeTab(state, action) {
			const tabId = action.payload;
			state.tabs = state.tabs.filter((t) => t.id !== tabId);
		},
		advanceTab(state, action) {
			const offset = action.payload;
			if (!state.tabs.length) return;

			const idx = state.tabs.findIndex((t) => t.id === state.currentTab);
			const newIdx =
				(((idx + offset) % state.tabs.length) + state.tabs.length) %
				state.tabs.length;
			state.currentTab = state.tabs[newIdx].id;
		},
		changeTab(state, action) {
			state.currentTab = action.payload;
		},
		setTabs(state, action) {
			state.tabs = action.payload;
		}
	}
});

export const { openTab, closeTab, advanceTab, changeTab, setTabs } =
	tabsSlice.actions;

export default tabsSlice.reducer;

export const openMiddleware =
	({ dispatch }) =>
	(next) =>
	(action) => {
		if (openTab.match(action)) {
			setTimeout(() => dispatch(changeTab(action.payload.id)));
		}

		return next(action);
	};
