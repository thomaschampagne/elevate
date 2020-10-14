import { AppUpdater } from "electron-updater/out/AppUpdater";
import Electron, { app, BrowserWindow } from "electron";
import logger, { ElectronLog } from "electron-log";
import url from "url";
import path from "path";
import fs from "fs";
import ini from "ini";
import { UpdateInfo } from "electron-updater";

enum UpdateEvent {
  CHECKING_FOR_UPDATE = "checking-for-update",
  UPDATE_AVAILABLE = "update-available",
  UPDATE_NOT_AVAILABLE = "update-not-available",
  ERROR = "error",
  DOWNLOAD_PROGRESS = "download-progress",
  UPDATE_DOWNLOADED = "update-downloaded"
}

export class Updater {
  public static readonly ENABLE_AUTO_INSTALL_ON_APP_QUIT: boolean = false;
  public static readonly ENABLE_UPDATE_PRE_RELEASE: boolean = false;

  private appUpdater: AppUpdater;
  private updateWindow: Electron.BrowserWindow;

  constructor(appUpdater: AppUpdater, updateLogger: ElectronLog) {
    this.appUpdater = appUpdater;
    this.appUpdater.autoInstallOnAppQuit = Updater.ENABLE_AUTO_INSTALL_ON_APP_QUIT;
    this.appUpdater.allowPrerelease = this.arePreReleasesAllowed();
    this.appUpdater.logger = updateLogger;
    this.updateWindow = null;
  }

  public arePreReleasesAllowed(): boolean {
    const configFilePath = app.getPath("userData") + "/config.ini";
    const configFileFound = fs.existsSync(configFilePath);
    logger.info(`Config file "${configFilePath}" found: ${configFileFound}`);
    if (configFileFound) {
      const config = ini.parse(fs.readFileSync(configFilePath, "utf-8"));
      return config && config.allowPrerelease === true;
    }
    return Updater.ENABLE_UPDATE_PRE_RELEASE;
  }

  public createUpdateWindow(): Promise<BrowserWindow> {
    const windowOptions: Electron.BrowserWindowConstructorOptions = {
      title: "Updater",
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

    return updateWindow
      .loadURL(
        url.format({
          pathname: path.join(__dirname, "/updater/index.html"),
          protocol: "file:",
          slashes: true
        })
      )
      .then(() => {
        return Promise.resolve(updateWindow);
      });
  }

  public update(): Promise<UpdateInfo> {
    logger.info("Allowing pre-releases upgrades: " + this.appUpdater.allowPrerelease);

    return this.createUpdateWindow()
      .then(updateWindow => {
        this.updateWindow = updateWindow;

        return new Promise((resolve, reject) => {
          this.appUpdater.on(UpdateEvent.CHECKING_FOR_UPDATE, () => {
            this.notifyUpdateStatus("Checking for updates...");
          });

          this.appUpdater.on(UpdateEvent.UPDATE_AVAILABLE, (updateInfo: UpdateInfo) => {
            logger.info("update-available", JSON.stringify(updateInfo));
            this.notifyUpdateStatus("Downloading new version " + updateInfo.version + "...");
          });

          this.appUpdater.on(UpdateEvent.UPDATE_NOT_AVAILABLE, (updateInfo: UpdateInfo) => {
            resolve(updateInfo);
          });

          this.appUpdater.on(UpdateEvent.ERROR, err => {
            logger.error("App updater on error called", err);
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
            logger.error("Check for updates error", err);
          });
        });
      })
      .then((updateInfo: UpdateInfo) => {
        return Promise.resolve(updateInfo);
      })
      .catch(err => {
        logger.error("Update error", err);
        return Promise.reject(err);
      });
  }

  public close(): void {
    this.updateWindow.destroy();
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
