/**
 * Main entry point. ElectronJS/Monkshu native.
 * (C) TekMonks. All rights reserved.
 * License: See enclosed LICENSE file.
 */
const fs = require("fs");
const path = require("path");
global.CONSTANTS = require(`${__dirname}/lib/constants.js`);
const log = require(`${CONSTANTS.LIBDIR}/log.js`);
const config = require(`${CONSTANTS.LIBDIR}/config.js`);
const appconf = require(`${_getMainAppPath()}/conf/application.json`);
const { app, BrowserWindow, Menu, shell, Tray, ipcMain, nativeImage } = require("electron");

const isMac = process.platform === "darwin";
const menuTemplate = [
	...(isMac ? [{
		label: app.name, submenu: [{ role: "about" }, { type: "separator" }, { role: "services" },
		{ type: "separator" }, { role: "hide" }, { role: "hideOthers" }, { role: "unhide" },
		{ type: "separator" }, { role: "quit" }]
	}] : []),
	{ label: "File", submenu: [{ role: "quit" }] },
	{ role: "help", submenu: [{ label: "Learn More", click: async () => { shell.openExternal(appconf.homepage) } }] }
];

function _getMainAppPath() {
	const entries = fs.readdirSync(`${CONSTANTS.ROOTDIR}/../app/`);
	const res = path.resolve(`${CONSTANTS.ROOTDIR}/../app/${entries[0]}`;
	LOG.debug(`_getMainAppPath: ${res}`);
	return res;
}

function createWindow() {
	LOG.debug("createWindow: Enter");
	const logoImage = nativeImage.createFromPath(`${_getMainAppPath()}/${appconf.logo}`);
	LOG.debug("createWindow: logoImage");
	const mainWindow = new BrowserWindow({
		width: 800, height: 600, frame: appconf.frame, webPreferences: {
			nativeWindowOpen: true, preload: `${CONSTANTS.LIBDIR}/preload.js`
		}, contextIsolation: true,
		icon: logoImage
	});
	LOG.debug("createWindow: mainWindow");
	if (!appconf.frame) {
		LOG.debug("createWindow: mainWindow.removeMenu()");
		mainWindow.removeMenu();
	}
	if (config.get("__electron_test_bounds")) {
		const res = config.get("__electron_test_bounds");
		LOG.debug(`createWindow: mainWindow.setBounds(${res})`);
		mainWindow.setBounds(res);
	}
	mainWindow.on("close", _ => {
		LOG.debug(`createWindow: mainWindow.om close`);
		config.set("__electron_test_bounds", mainWindow.getBounds())
	});

	if (appconf.file) {
		LOG.debug(`createWindow: mainWindow.loadFile`);
		mainWindow.loadFile(`${_getMainAppPath()}/${appconf.file}`);
	}
	else if (appconf.url) {
		LOG.debug(`createWindow: mainWindow.loadFile`);
		mainWindow.loadURL(appconf.url);
	}
	else {
		LOG.error("No lauch command specified, exiting."); 
		process.exit(1);
	}

	new Tray(logoImage.resize({ width: 16, height: 16 })).setToolTip(appconf.apptooltip);
	app.setAppUserModelId(appconf.appid);
	LOG.debug("createWindow: Exit");
}

function initSync() {
	const appFilesDir = `${CONSTANTS.DATADIR}/${appconf.appid}`;
	if (!fs.existsSync(appFilesDir)) try {	// create root app data dir
		fs.mkdirSync(appFilesDir, { recursive: true });
	} catch (err) { };

	log.initGlobalLoggerSync(`${appFilesDir}/log.ndjson`); LOG.overrideConsole();
	LOG.debug("initSync: Log initialized");
	config.initSync(appconf.appid);
	LOG.debug(`initSync: config.initSync(${appconf.appid}) Done`);
	const menu = Menu.buildFromTemplate(menuTemplate)
	Menu.setApplicationMenu(menu)
	LOG.debug(`initSync: Menu.setApplicationMenu(menu)`);
	app.whenReady().then(_ => createWindow());

	app.on("activate", _ => {
		const noWindows = BrowserWindow.getAllWindows().length;
		LOG.debug(`initSync: activate noWindows[${noWindows}]`);
		if (noWindows == 0) {
			LOG.debug(`initSync: activate createWindow()`);
			createWindow();
			LOG.debug(`initSync: activate createWindow() Done`);
		}
	});
	app.on("window-all-closed", _ => {
		LOG.debug(`initSync: window-all-closed`);
		app.quit()
		LOG.debug(`initSync: window-all-closed Done`);
	});

	// add in IPC functions
	ipcMain.on("api", (event, args) => {
		LOG.debug(`initSync: ipcMain.on api`);
		const electron = require("electron");	// this allows calling Electron APIs below
		const apiName = args[0], funcPointer = eval(`${apiName}`), funcArgs = args.slice(1),
			funcContextName = apiName.split(".").slice(0, -1).join("."),
			funcContext = funcContextName == apiName ? null : eval(funcContextName);
		if (funcPointer) {
			const reply = typeof funcPointer == "function" ? funcPointer.apply(funcContext, funcArgs) : funcPointer;
			try { event.returnValue = { result: true, reply } } catch (err) {
				LOG.error(`Error calling API ${apiName}, error is: ${err}`);
				event.returnValue = { result: false, error: err };
			}
		} else {
			LOG.error(`Error calling API ${apiName}, error is: Unknown API ${apiName}`);
			event.returnValue = { result: false, error: `Unknown API ${apiName}` };
		}
	});

	ipcMain.handle("apiAsync", async (_event, args) => {
		LOG.debug(`initSync: ipcMain.on apiAsync`);
		const electron = require("electron");	// this allows calling Electron APIs below
		const apiName = args[0], funcPointer = eval(`${apiName}`), funcArgs = args.slice(1),
			funcContextName = apiName.split(".").slice(0, -1).join("."),
			funcContext = funcContextName == apiName ? null : eval(funcContextName);
		if (funcPointer && typeof funcPointer == "function") {
			const reply = typeof funcPointer == "function" ? await funcPointer.apply(funcContext, funcArgs) : funcPointer;
			try { return { result: true, reply } } catch (err) {
				LOG.error(`Error calling API ${apiName}, error is: ${err}`);
				return { result: false, error: err };
			}
		} else {
			LOG.error(`Error calling API ${apiName}, error is: Unknown API ${apiName}`);
			return { result: false, error: `Unknown API ${apiName}` };
		}
	});
}

initSync();
LOG.debug(`initSync() Done`);