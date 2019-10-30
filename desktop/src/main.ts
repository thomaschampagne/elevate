import * as Electron from "electron";
import { app, BrowserWindow, globalShortcut, ipcMain } from "electron";
import * as path from "path";
import * as url from "url";
import logger from "electron-log";
import { IpcMainMessagesService } from "./listeners/ipc-main-messages-service";
import { Proxy } from "./proxy";
import { Service } from "./service";
import { HttpClient } from "typed-rest-client/HttpClient";

const IS_ELECTRON_DEV = (process.env.ELECTRON_ENV && process.env.ELECTRON_ENV === "dev");

logger.transports.file.level = (IS_ELECTRON_DEV) ? "debug" : "info";
logger.transports.console.level = (IS_ELECTRON_DEV) ? "debug" : "info";
logger.transports.file.maxSize = 1048576 * 2; // 2MB

class Main {


	constructor(electronApp: Electron.App) {
		this.app = electronApp;
		this.isPackaged = this.app.isPackaged;
	}

	private static readonly WINDOW_SIZE_RATIO: number = 0.8;
	private static readonly ICON_PATH_WINDOWS: string = "res/icons/win/icon.ico";
	private static readonly ICON_PATH_LINUX: string = "res/icons/linux/512x512.png";
	private static readonly ICON_PATH_MACOS: string = "res/icons/mac/icon.icns";

	public ipcMainMessagesService: IpcMainMessagesService;

	private readonly app: Electron.App;
	private readonly isPackaged: boolean;
	private appWindow: BrowserWindow;

	public static getIconPath(): string {

		switch (Service.currentPlatform()) {
			case Service.PLATFORM.WINDOWS:
				return path.join(__dirname, Main.ICON_PATH_WINDOWS);
			case Service.PLATFORM.LINUX:
				return path.join(__dirname, Main.ICON_PATH_LINUX);
			case Service.PLATFORM.MACOS:
				return path.join(__dirname, Main.ICON_PATH_MACOS);
			default:
				return null;
		}
	}

	public createWindow(): void {

		const gotTheLock = app.requestSingleInstanceLock();

		// If failed to obtain the lock, another instance of application is already running with the lock => exit immediately.
		// @see https://github.com/electron/electron/blob/master/docs/api/app.md#apprequestsingleinstancelock
		if (!gotTheLock) {
			logger.info("We failed to obtain application the lock. Exit now");
			app.quit();
		} else {

			// Create the browser window.
			const workAreaSize: Electron.Size = Electron.screen.getPrimaryDisplay().workAreaSize;
			const width = Math.floor(workAreaSize.width * Main.WINDOW_SIZE_RATIO);
			const height = Math.floor(workAreaSize.height * Main.WINDOW_SIZE_RATIO);

			this.appWindow = new BrowserWindow({
				width: width,
				height: height,
				center: true,
				frame: false,
				autoHideMenuBar: true,
				icon: Main.getIconPath(),
				webPreferences: {
					nodeIntegration: true
				}
			});

			this.appWindow.loadURL(
				url.format({
					pathname: path.join(__dirname, "app", "index.html"),
					protocol: "file:",
					slashes: true,
				}),
			);

			// Detect a proxy on the system before listening for message from renderer
			Proxy.resolve(this.appWindow).then(httpProxy => {

				logger.info("Using proxy value: " + httpProxy);
				Service.instance().httpClient = new HttpClient("vsts-node-api", null, (httpProxy) ? {proxy: {proxyUrl: httpProxy}} : null);

				// Create the request listener to listen renderer request events
				this.ipcMainMessagesService = new IpcMainMessagesService(ipcMain, this.appWindow.webContents);
				this.ipcMainMessagesService.listen();
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
		this.app.on("ready", this.createWindow);

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
				this.createWindow();
			}
		});
	}
}

try {

	if (IS_ELECTRON_DEV) {
		require("electron-reloader")(module);
		logger.debug("electron-reloader is ENABLED");
	}

	logger.info("System", Service.printSystemDetails());
	logger.info("Device fingerprint", Service.getDeviceFingerPrint());

	(new Main(app)).run();

} catch (err) {
	logger.error(err);
}
