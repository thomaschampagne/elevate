import { AppUpdater } from "electron-updater/out/AppUpdater";
import * as Electron from "electron";
import { BrowserWindow } from "electron";
import logger, { IElectronLog } from "electron-log";
import * as url from "url";
import * as path from "path";
import { UpdateInfo } from "electron-updater";

enum UpdateEvent {
	CHECKING_FOR_UPDATE = "checking-for-update",
	UPDATE_AVAILABLE = "update-available",
	UPDATE_NOT_AVAILABLE = "update-not-available",
	ERROR = "error",
	DOWNLOAD_PROGRESS = "download-progress",
	UPDATE_DOWNLOADED = "update-downloaded",
}

export class Updater {

	public static readonly ENABLE_AUTO_INSTALL_ON_APP_QUIT: boolean = false;

	private appUpdater: AppUpdater;
	private updateWindow: Electron.BrowserWindow;

	constructor(appUpdater: AppUpdater, updateLogger: IElectronLog) {
		this.appUpdater = appUpdater;
		this.appUpdater.autoInstallOnAppQuit = Updater.ENABLE_AUTO_INSTALL_ON_APP_QUIT;
		this.appUpdater.logger = updateLogger;
		this.updateWindow = null;
	}

	public createUpdateWindow(): Promise<BrowserWindow> {

		const windowOptions: Electron.BrowserWindowConstructorOptions = {
			width: 400,
			height: 200,
			center: true,
			frame: false,
			show: false,
			autoHideMenuBar: true,
			resizable: false,
			movable: false,
			webPreferences: {
				nodeIntegration: true
			}
		};

		const updateWindow = new BrowserWindow(windowOptions);

		updateWindow.once("ready-to-show", () => {
			updateWindow.show();
		});

		return updateWindow.loadURL(url.format({
			pathname: path.join(__dirname, "/updater/index.html"),
			protocol: "file:",
			slashes: true,
		})).then(() => {
			return Promise.resolve(updateWindow);
		});
	}

	public update(): Promise<UpdateInfo> {

		return this.createUpdateWindow().then(updateWindow => {

			this.updateWindow = updateWindow;

			return new Promise((resolve, reject) => {

				this.appUpdater.on(UpdateEvent.CHECKING_FOR_UPDATE, () => {
					this.notifyUpdateStatus("Checking for update...");
				});

				this.appUpdater.on(UpdateEvent.UPDATE_AVAILABLE, (updateInfo: UpdateInfo) => {
					this.notifyUpdateStatus("New version " + updateInfo.version + " available.");
				});

				this.appUpdater.on(UpdateEvent.UPDATE_NOT_AVAILABLE, (updateInfo: UpdateInfo) => {
					resolve(updateInfo);
				});

				this.appUpdater.on(UpdateEvent.ERROR, err => {
					reject(err);
				});

				this.appUpdater.on(UpdateEvent.DOWNLOAD_PROGRESS, progressObj => {
					this.notifyDownloadProgress(progressObj);
				});

				this.appUpdater.on(UpdateEvent.UPDATE_DOWNLOADED, (updateInfo: UpdateInfo) => {
					this.notifyUpdateStatus("Applying update " + updateInfo.version + ".");
					setTimeout(() => {
						this.appUpdater.quitAndInstall();
					}, 500);
				});

				// Start update checking
				this.appUpdater.checkForUpdates().catch(err => {
					logger.error("Update error", err);
				});
			});

		}).then((updateInfo: UpdateInfo) => {
			setTimeout(() => {
				this.updateWindow.close();
			});
			return Promise.resolve(updateInfo);

		}).catch(err => {
			setTimeout(() => {
				this.updateWindow.close();
			});
			logger.error("Update error", err);
			return Promise.reject(err);
		});
	}

	private notifyUpdateStatus(message: string): void {
		logger.info(message);
		this.updateWindow.webContents.send("update-status", message);
	}

	private notifyDownloadProgress(progress: object): void {
		logger.info("Downloading", JSON.stringify(progress));
		this.updateWindow.webContents.send("download-progress", progress);
	}
}
