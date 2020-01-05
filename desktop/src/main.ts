import * as Electron from "electron";
import { app, BrowserWindow, globalShortcut, ipcMain } from "electron";
import * as path from "path";
import * as url from "url";
import logger from "electron-log";
import { IpcMainMessagesService } from "./listeners/ipc-main-messages-service";
import { Proxy } from "./proxy";
import { Service } from "./service";
import { HttpClient } from "typed-rest-client/HttpClient";
import * as pkg from "../package.json";
import { Updater } from "./updater/updater";
import { UpdateInfo } from "electron-updater";

const IS_ELECTRON_DEV = (process.env.ELECTRON_ENV && process.env.ELECTRON_ENV === "dev");

logger.transports.file.level = (IS_ELECTRON_DEV) ? "debug" : "info";
logger.transports.console.level = (IS_ELECTRON_DEV) ? "debug" : "info";
logger.transports.file.maxSize = 1048576 * 2; // 2MB

/*
TODO: Fix electron-updater not fully integrated with rollup:
The current workaround to import electron-updater is: package.json > build > files > "./node_modules/%%/%"
*/

const {autoUpdater} = require("electron-updater"); // Import should remains w/ "require"

class Main {

	constructor(electronApp: Electron.App) {
		this.app = electronApp;
		this.isPackaged = app.isPackaged;
	}

	private static readonly WINDOW_SIZE_RATIO: number = 0.8;

	public ipcMainMessagesService: IpcMainMessagesService;

	private readonly app: Electron.App;
	private readonly isPackaged: boolean;
	private appWindow: BrowserWindow;

	public onElectronReady(): void {

		const gotTheLock = this.app.requestSingleInstanceLock();

		// If failed to obtain the lock, another instance of application is already running with the lock => exit immediately.
		// @see https://github.com/electron/electron/blob/master/docs/api/app.md#apprequestsingleinstancelock
		if (!gotTheLock) {
			logger.info("We failed to obtain application the lock. Exit now");
			this.app.quit();
		} else {

			this.app.on("second-instance", () => {
				// Someone tried to run a second instance, we should focus our window.
				if (this.appWindow) {
					if (this.appWindow.isMinimized()) {
						this.appWindow.restore();
					}
					this.appWindow.focus();
				}
			});

			const elevateUpdater = new Updater(autoUpdater, logger);
			elevateUpdater.update().then((updateInfo: UpdateInfo) => {
				logger.info(`Updated to ${updateInfo.version} or already up to date.`);
				this.startElevate();
			}, error => {
				logger.warn("Update failed", error);
				this.startElevate();
			});
		}
	}

	private startElevate(): void {

		// Create the browser window.
		const workAreaSize: Electron.Size = Electron.screen.getPrimaryDisplay().workAreaSize;
		const width = Math.floor(workAreaSize.width * Main.WINDOW_SIZE_RATIO);
		const height = Math.floor(workAreaSize.height * Main.WINDOW_SIZE_RATIO);

		const windowOptions: Electron.BrowserWindowConstructorOptions = {
			width: width,
			height: height,
			center: true,
			frame: false,
			show: false,
			autoHideMenuBar: true,
			webPreferences: {
				nodeIntegration: true
			}
		};

		if (Service.instance().isLinux()) {
			windowOptions.icon = path.join(__dirname, "/../build/icon.png");
		}

		this.appWindow = new BrowserWindow(windowOptions);

		// Create the request listener to listen renderer request events
		this.ipcMainMessagesService = new IpcMainMessagesService(ipcMain, this.appWindow.webContents);
		this.ipcMainMessagesService.listen();

		this.appWindow.loadURL(
			url.format({
				pathname: path.join(__dirname, "app", "index.html"),
				protocol: "file:",
				slashes: true,
			})
		);

		this.appWindow.once("ready-to-show", () => {
			this.appWindow.show();
		});

		// Detect a proxy on the system before listening for message from renderer
		Proxy.resolve(this.appWindow).then(httpProxy => {
			logger.info("Using proxy value: " + httpProxy);
			Service.instance().httpClient = new HttpClient("vsts-node-api", null, (httpProxy) ? {proxy: {proxyUrl: httpProxy}} : null);
			Service.instance().ipcMainMessages = this.ipcMainMessagesService;
		});

		if (!this.isPackaged) {
			this.appWindow.webContents.openDevTools();
		}

		// Emitted when the window is closed.
		this.appWindow.on("closed", () => {
			// Dereference the window object, usually you would store window
			// in an array if your app supports multi windows, this is the time
			// when you should delete the corresponding element.
			this.appWindow = null;
		});

		// Shortcuts
		globalShortcut.register("CommandOrControl+R", () => {
			logger.debug("CommandOrControl+R is pressed, reload app");
			this.appWindow.reload();
		});

		globalShortcut.register("f5", () => {
			logger.debug("f5 is pressed, reload app");
			this.appWindow.reload();
		});

		globalShortcut.register("CommandOrControl+F12", () => {
			logger.debug("CommandOrControl+F12 is pressed, toggle dev tools");
			this.appWindow.webContents.toggleDevTools();
		});
	}

	public run(): void {

		if (this.isPackaged) {
			logger.log("Running in production");
		} else {
			logger.log("Running in development");
		}

		logger.log("App running into: " + this.app.getAppPath());

		// This method will be called when Electron has finished
		// initialization and is ready to create browser windows.
		// Some APIs can only be used after this event occurs.
		this.app.on("ready", () => {
			this.onElectronReady();
		});

		// Quit when all windows are closed.
		this.app.on("window-all-closed", () => {
			// On OS X it is common for this.applications and their menu bar
			// to stay active until the user quits explicitly with Cmd + Q
			if (process.platform !== "darwin") {
				this.app.quit();
			}
		});

		this.app.on("activate", () => {
			// On OS X it"s common to re-create a window in the app when the
			// dock icon is clicked and there are no other windows open.
			if (!this.appWindow) {
				this.onElectronReady();
			}
		});
	}
}

try {

	if (IS_ELECTRON_DEV) {
		require("electron-reloader")(module);
		logger.debug("electron-reloader is ENABLED");
	}

	logger.info("Version: " + pkg.version);
	logger.info("System details:", Service.instance().printRuntimeInfo());

	(new Main(app)).run();

} catch (err) {
	logger.error(err);
}
