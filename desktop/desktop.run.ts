import * as Electron from "electron";
import { app, BrowserWindow, globalShortcut, screen } from "electron";
import * as path from "path";
import * as url from "url";

class DesktopRun {

	private static readonly WINDOW_WIDTH: number = 1024;
	private static readonly WINDOW_HEIGHT: number = 950;

	private readonly app: Electron.App;
	private readonly isPackaged: boolean;
	private appWindow: BrowserWindow;

	constructor(app: Electron.App) {
		this.app = app;
		this.isPackaged = this.app.isPackaged;
	}

	public createWindow(): void {
		const size = screen.getPrimaryDisplay().workAreaSize;

		// Create the browser window.
		const winWidth = DesktopRun.WINDOW_WIDTH;
		const winHeight = DesktopRun.WINDOW_HEIGHT;

		this.appWindow = new BrowserWindow({
			x: (size.width / 2) - (winWidth / 2),
			y: (size.height / 2) - (winHeight / 2),
			width: (this.isPackaged) ? winWidth : winWidth * 1.5,
			height: winHeight,
			frame: true
		});

		this.appWindow.loadURL(
			url.format({
				pathname: path.join(__dirname, "app", "index.html"),
				protocol: "file:",
				slashes: true,
			}),
		);

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
		globalShortcut.register("f5", () => {
			console.log("f5 is pressed, reload app");
			this.appWindow.reload();
		});

		globalShortcut.register("CommandOrControl+R", () => {
			console.log("CommandOrControl+R is pressed, reload app");
			this.appWindow.reload();
		});

	}

	public run(): void {

		if (this.isPackaged) {
			console.log("Running in production");
		} else {
			console.log("Running in development");
		}

		console.log("App running into: " + this.app.getAppPath());

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
	(new DesktopRun(app)).run();
} catch (err) {
	console.error(err);
}
