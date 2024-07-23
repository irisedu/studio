import { configureStore } from '@reduxjs/toolkit';
import { rememberReducer, rememberEnhancer } from 'redux-remember';

import appReducer, { openDirectoryMiddleware } from './appSlice.js';
import tabsReducer, { tabMiddleware } from './tabsSlice.js';

export default configureStore({
	middleware: (getDefaultMiddleware) =>
		getDefaultMiddleware().concat([openDirectoryMiddleware, tabMiddleware]),
	reducer: rememberReducer({
		app: appReducer,
		tabs: tabsReducer
	}),
	enhancers: (getDefaultEnhancers) =>
		getDefaultEnhancers().concat([
			rememberEnhancer(window.localStorage, ['app', 'tabs'])
		])
});
