import { configureStore } from '@reduxjs/toolkit';
import { rememberReducer, rememberEnhancer } from 'redux-remember';

import appReducer from './appSlice.js';
import tabsReducer, { openMiddleware } from './tabsSlice.js';

export default configureStore({
	middleware: (getDefaultMiddleware) =>
		getDefaultMiddleware({
			serializableCheck: false
		}).concat([openMiddleware]),
	reducer: rememberReducer({
		app: appReducer,
		tabs: tabsReducer
	}),
	enhancers: (getDefaultEnhancers) =>
		getDefaultEnhancers().concat([
			rememberEnhancer(window.localStorage, ['app'])
		])
});
