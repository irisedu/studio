import { configureStore } from '@reduxjs/toolkit';
import { rememberReducer, rememberEnhancer } from 'redux-remember';

import appReducer, { openDirectoryMiddleware } from './appSlice.js';
import tabsReducer, { openTabMiddleware } from './tabsSlice.js';

export default configureStore({
	middleware: (getDefaultMiddleware) =>
		getDefaultMiddleware().concat([openDirectoryMiddleware, openTabMiddleware]),
	reducer: rememberReducer({
		app: appReducer,
		tabs: tabsReducer
	}),
	enhancers: (getDefaultEnhancers) =>
		getDefaultEnhancers().concat([
			rememberEnhancer(window.localStorage, ['app', 'tabs'])
		])
});
