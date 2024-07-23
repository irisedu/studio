import { contextBridge, ipcRenderer } from 'electron';
import os from 'os';
import path from 'path';

contextBridge.exposeInMainWorld('win', {
	close: () => ipcRenderer.send('window:close'),
	toggleMaximize: () => ipcRenderer.send('window:maximize'),
	minimize: () => ipcRenderer.send('window:minimize'),
	openDialog: (args) => ipcRenderer.invoke('window:openDialog', args)
});

contextBridge.exposeInMainWorld('process', {
	versions: process.versions,
	arch: process.arch
});

contextBridge.exposeInMainWorld('os', {
	platform: os.platform(),
	release: os.release(),
	homedir: os.homedir(),
	sep: path.sep
});

contextBridge.exposeInMainWorld('app', {
	getVersion: () => ipcRenderer.invoke('app:version')
});

contextBridge.exposeInMainWorld('fs', {
	rm: (args) => ipcRenderer.invoke('fs:rm', args),
	rename: (args) => ipcRenderer.invoke('fs:rename', args),
	mkdir: (args) => ipcRenderer.invoke('fs:mkdir', args),
	writeTextFile: (args) => ipcRenderer.invoke('fs:writeText', args),
	readTextFile: (args) => ipcRenderer.invoke('fs:readText', args),
	exists: (args) => ipcRenderer.invoke('fs:exists', args),
	readDir: (args) => ipcRenderer.invoke('fs:readDir', args)
});
