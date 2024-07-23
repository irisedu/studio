import { defineConfig, externalizeDepsPlugin } from 'electron-vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import Icons from 'unplugin-icons/vite';
import svgr from 'vite-plugin-svgr';

export default defineConfig({
	main: {
		plugins: [externalizeDepsPlugin()],
		build: {
			minify: 'esbuild',
			rollupOptions: {
				output: { format: 'cjs' }
			}
		}
	},
	preload: {
		plugins: [externalizeDepsPlugin()],
		build: {
			minify: 'esbuild',
			rollupOptions: {
				output: { format: 'cjs' }
			}
		}
	},
	renderer: {
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
		resolve: {
			alias: [
				{
					find: '$assets',
					replacement: path.join(import.meta.dirname, 'src/renderer/assets')
				},
				{
					find: '$hooks',
					replacement: path.join(import.meta.dirname, 'src/renderer/hooks')
				},
				{
					find: '$components',
					replacement: path.join(import.meta.dirname, 'src/renderer/components')
				},
				{
					find: '$state',
					replacement: path.join(import.meta.dirname, 'src/renderer/state')
				}
			]
		},
		build: {
			minify: 'esbuild'
		},
		clearScreen: false
	}
});
