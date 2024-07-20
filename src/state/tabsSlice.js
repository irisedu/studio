import { createSlice } from '@reduxjs/toolkit';

import {
	data as welcomeTabData,
	tab as welcomeTab
} from '$components/tabs/WelcomeTab.jsx';
import { tab as diagnosticsTab } from '$components/tabs/DiagnosticsTab.jsx';
import { makeTab as makeFileTab } from '$components/tabs/FileTab.jsx';

function getTabByOffset(state, offset) {
	const idx = state.tabs.findIndex((t) => t.id === state.currentTab);
	const newIdx =
		(((idx + offset) % state.tabs.length) + state.tabs.length) %
		state.tabs.length;
	return state.tabs[newIdx].id;
}

export const tabsSlice = createSlice({
	name: 'tabs',
	initialState: {
		tabs: [welcomeTabData],
		currentTab: null
	},
	reducers: {
		openTab(state, action) {
			const tabData = action.payload;
			if (!state.tabs.some((t) => t.id === tabData.id))
				state.tabs.push(tabData);
		},
		closeTab(state, action) {
			const tabId = action.payload;

			if (tabId === state.currentTab) {
				state.currentTab = getTabByOffset(state, -1);
			}

			state.tabs = state.tabs.filter((t) => t.id !== tabId);
		},
		advanceTab(state, action) {
			const offset = action.payload;
			if (!state.tabs.length) return;

			state.currentTab = getTabByOffset(state, offset);
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

export const openTabMiddleware =
	({ dispatch }) =>
	(next) =>
	(action) => {
		if (openTab.match(action)) {
			setTimeout(() => dispatch(changeTab(action.payload.id)));
		}

		return next(action);
	};

export function makeTab(data) {
	if (data.type === 'normal') {
		switch (data.id) {
			case welcomeTab.id:
				return welcomeTab;
			case diagnosticsTab.id:
				return diagnosticsTab;
		}
	} else if (data.type === 'file') {
		return makeFileTab(data);
	}
}
