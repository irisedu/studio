import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import Icons from 'unplugin-icons/vite';
import svgr from 'vite-plugin-svgr';

// https://vitejs.dev/config/
export default defineConfig(async () => ({
	plugins: [
		react(),
		Icons({
			compiler: 'jsx',
			jsx: 'react'
		}),
		svgr({
			svgrOptions: {
				dimensions: false
			}
		})
	],

	// Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
	//
	// 1. prevent vite from obscuring rust errors
	clearScreen: false,
	// 2. tauri expects a fixed port, fail if that port is not available
	server: {
		port: 1420,
		strictPort: true,
		watch: {
			// 3. tell vite to ignore watching `src-tauri`
			ignored: ['**/src-tauri/**']
		}
	},
	resolve: {
		alias: [
			{
				find: '$assets',
				replacement: path.join(import.meta.dirname, 'src/assets')
			},
			{
				find: '$hooks',
				replacement: path.join(import.meta.dirname, 'src/hooks')
			},
			{
				find: '$components',
				replacement: path.join(import.meta.dirname, 'src/components')
			},
			{
				find: '$state',
				replacement: path.join(import.meta.dirname, 'src/state')
			}
		]
	}
}));
