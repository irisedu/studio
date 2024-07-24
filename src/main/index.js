import {
	app,
	shell,
	BrowserWindow,
	ipcMain,
	dialog,
	Menu,
	MenuItem
} from 'electron';
import path from 'path';
import fs from 'fs';
import os from 'os';
import icon from '../../public/icon.png?asset';

function readDirRecursive(dir) {
	return fs.readdirSync(dir, { withFileTypes: true }).map((dirent) => {
		const obj = {
			path: path.join(dir, dirent.name),
			name: dirent.name
		};

		if (dirent.isDirectory()) obj.children = readDirRecursive(obj.path);

		return obj;
	});
}

function createWindow() {
	const mainWindow = new BrowserWindow({
		width: 900,
		height: 670,
		show: false,
		autoHideMenuBar: true,
		frame: process.platform === 'darwin',
		...(process.platform === 'linux' ? { icon } : {}),
		webPreferences: {
			preload: path.join(import.meta.dirname, '../preload/index.cjs'),
			sandbox: false
		}
	});

	const menu = new Menu();

	menu.append(
		new MenuItem({
			label: 'Inspect Element',
			accelerator:
				process.platform === 'darwin' ? 'Cmd+Shift+I' : 'Ctrl+Shift+I',
			role: 'toggleDevTools'
		})
	);

	menu.append(
		new MenuItem({
			label: 'Refresh',
			accelerator: process.platform === 'darwin' ? 'Cmd+R' : 'Ctrl+R',
			role: 'reload'
		})
	);

	mainWindow.setMenu(menu);

	mainWindow.on('ready-to-show', () => {
		mainWindow.show();
	});

	mainWindow.webContents.setWindowOpenHandler((details) => {
		shell.openExternal(details.url);
		return { action: 'deny' };
	});

	ipcMain.on('window:close', (e) => {
		BrowserWindow.fromWebContents(e.sender).close();
	});

	ipcMain.on('window:maximize', (e) => {
		const window = BrowserWindow.fromWebContents(e.sender);

		if (window.isMaximized) window.unmaximize();
		else window.maximize();
	});

	ipcMain.on('window:minimize', (e) => {
		BrowserWindow.fromWebContents(e.sender).minimize();
	});

	ipcMain.handle('window:openDialog', (e, args) => {
		return dialog.showOpenDialogSync(
			BrowserWindow.fromWebContents(e.sender),
			args
		);
	});

	ipcMain.handle('app:version', () => {
		return app.getVersion();
	});

	ipcMain.handle('fs:rm', (_, file) => {
		return fs.promises.rm(file, { force: true, recursive: true });
	});

	ipcMain.handle('fs:rename', async (_, args) => {
		// Rename, overwrite directories, allow child to overwrite parent
		const tmp = await fs.promises.mkdtemp(
			path.join(os.tmpdir(), 'iris-studio-')
		);

		const tmpDest = path.join(tmp, path.basename(args.from));

		await fs.promises.cp(args.from, tmpDest, { recursive: true });
		await fs.promises.rm(args.from, { force: true, recursive: true });

		await fs.promises.rm(args.to, { force: true, recursive: true });

		await fs.promises.cp(tmpDest, args.to, { recursive: true });
		await fs.promises.rm(tmp, { force: true, recursive: true });
	});

	ipcMain.handle('fs:mkdir', (_, dir) => {
		return fs.promises.mkdir(dir, { recursive: true });
	});

	ipcMain.handle('fs:writeText', (_, args) => {
		return fs.promises.writeFile(args.file, args.data);
	});

	ipcMain.handle('fs:readText', (_, args) => {
		return fs.promises.readFile(args, { encoding: 'utf8' });
	});

	ipcMain.handle('fs:exists', async (_, args) => {
		try {
			await fs.promises.stat(args);
			return true;
		} catch {
			return false;
		}
	});

	ipcMain.handle('fs:readDir', (_, args) => {
		return readDirRecursive(args);
	});

	ipcMain.handle('shell:openPath', (_, args) => {
		return shell.openPath(args);
	});

	ipcMain.handle('shell:showItemInFolder', (_, args) => {
		return shell.showItemInFolder(args);
	});

	if (process.env['ELECTRON_RENDERER_URL']) {
		mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL']);
	} else {
		mainWindow.loadFile(
			path.join(import.meta.dirname, '../renderer/index.html')
		);
	}
}

app.whenReady().then(() => {
	app.setAppUserModelId('seki.pw.iris-studio');

	createWindow();

	app.on('activate', function () {
		if (BrowserWindow.getAllWindows().length === 0) createWindow();
	});
});

app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') {
		app.quit();
	}
});
