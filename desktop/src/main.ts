import "reflect-metadata";
import Electron, {
  app,
  BrowserWindow,
  ClearStorageDataOptions,
  dialog,
  globalShortcut,
  IpcMain,
  ipcMain,
  OpenDialogSyncOptions,
  shell
} from "electron";
import path from "path";
import logger from "electron-log";
import { AppService } from "./app-service";
import pkg from "../package.json";
import { Updater } from "./updater/updater";
import { UpdateInfo } from "electron-updater";
import { Platform } from "@elevate/shared/enums";
import { container, inject, singleton } from "tsyringe";
import { HttpClient } from "./clients/http.client";
import _ from "lodash";
import { Channel, IpcTunnelService, RuntimeInfo } from "@elevate/shared/electron";
import fs from "fs";
import { IpcMainTunnelService } from "./ipc-main-tunnel.service";
import { IpcSyncMessageListener } from "./listeners/ipc-sync-message.listener";
import { IpcComputeActivityListener } from "./listeners/ipc-compute-activity.listener";
import { IpcStravaLinkListener } from "./listeners/ipc-strava-link.listener";
import { IpcProfileBackupListener } from "./listeners/ipc-profile-backup.listener";

const IS_ELECTRON_DEV = !app.isPackaged;
logger.transports.file.level = IS_ELECTRON_DEV ? "debug" : "info";
logger.transports.console.level = IS_ELECTRON_DEV ? "debug" : "info";
logger.transports.file.maxSize = 1048576 * 2; // 2MB

/*
TODO: Fix electron-updater not fully integrated with rollup:
The current workaround to import electron-updater is: package.json > build > files > "./node_modules/%%/%"
*/

const { autoUpdater } = require("electron-updater"); // Import should remains w/ "require"

@singleton()
class Main {
  constructor(
    @inject(AppService) private readonly appService: AppService,
    @inject(IpcMainTunnelService) private readonly ipcTunnelService: IpcTunnelService,
    @inject(IpcSyncMessageListener) private readonly ipcSyncMessageListener: IpcSyncMessageListener,
    @inject(IpcComputeActivityListener) private readonly ipcComputeActivityListener: IpcComputeActivityListener,
    @inject(IpcStravaLinkListener) private readonly ipcStravaLinkListener: IpcStravaLinkListener,
    @inject(IpcProfileBackupListener) private readonly ipcProfileBackupListener: IpcProfileBackupListener,
    @inject(HttpClient) private readonly httpClient: HttpClient
  ) {}

  private static readonly DEFAULT_SCREEN_RATIO: number = 0.95;
  private static readonly LARGE_SCREEN_RATIO: number = 0.85;

  private app: Electron.App;
  private ipcMain: IpcMain;
  private mainWindow: BrowserWindow;

  private static getWorkingAreaSize(display: Electron.Display): Electron.Size {
    const screenWidth = display.size.width * display.scaleFactor;
    const screenHeight = display.size.height * display.scaleFactor;

    const windowRatio = screenWidth > 1920 && screenHeight > 1080 ? Main.LARGE_SCREEN_RATIO : Main.DEFAULT_SCREEN_RATIO;

    return {
      width: Math.round(display.workAreaSize.width * windowRatio),
      height: Math.round(display.workAreaSize.height * windowRatio)
    };
  }

  public onElectronReady(): void {
    const gotTheLock = this.app.requestSingleInstanceLock();

    // If failed to obtain the lock, another instance of application is already running with the lock => exit immediately.
    // @see https://github.com/electron/electron/blob/master/docs/api/app.md#apprequestsingleinstancelock
    if (!gotTheLock) {
      logger.info("We failed to obtain application the lock. Exit now"); // TODO Inject logger with DI
      this.app.quit();
    } else {
      this.app.on("second-instance", () => {
        // Someone tried to run a second instance, we should focus our window.
        if (this.mainWindow) {
          if (this.mainWindow.isMinimized()) {
            this.mainWindow.restore();
          }
          this.mainWindow.focus();
        }
      });

      if (this.appService.isLinux() || !this.appService.isPackaged) {
        this.startElevate();
        return;
      }

      const elevateUpdater = new Updater(autoUpdater, logger);
      elevateUpdater.update().then(
        (updateInfo: UpdateInfo) => {
          logger.info(`Updated to ${updateInfo.version} or already up to date.`);
          this.startElevate(() => {
            elevateUpdater.close();
          });
        },
        error => {
          logger.warn("Update failed", error);
          this.startElevate(() => {
            elevateUpdater.close();
          });
        }
      );
    }
  }

  public run(electronApp: Electron.App, electronIpcMain: IpcMain): void {
    this.app = electronApp;
    this.ipcMain = electronIpcMain;

    logger.info("System details:", this.appService.printRuntimeInfo());

    this.appService.isPackaged = this.app.isPackaged;

    if (this.appService.isPackaged) {
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
      this.closeApp();
    });

    this.app.on("activate", () => {
      // On OS X it"s common to re-create a window in the app when the
      // dock icon is clicked and there are no other windows open.
      if (!this.mainWindow) {
        this.onElectronReady();
      }
    });
  }

  private minimizeApp(): void {
    this.mainWindow.minimize();
  }

  private enableFullscreen(): void {
    this.mainWindow.setFullScreen(true);
    // return this.isFullscreen();
  }

  private disableFullscreen(): void {
    this.mainWindow.setFullScreen(false);
    // return this.isFullscreen();
  }

  private isFullscreen(): boolean {
    return this.mainWindow.isFullScreen();
  }

  private closeApp(): void {
    // On OS X it is common for this.applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== Platform.MACOS) {
      this.app.quit();
    }
  }

  private restartApp(): void {
    this.app.relaunch();
    this.app.exit(0);
  }

  private resetMainBrowserWindowData(window: Electron.BrowserWindow): Promise<void> {
    const session = window.webContents.session;
    return session
      .clearStorageData()
      .then(() => {
        return session.clearCache();
      })
      .then(() => {
        return session.clearAuthCache();
      })
      .then(() => {
        return session.clearHostResolverCache();
      })
      .then(() => {
        return this.restartApp();
      });
  }

  private clearStorageData(window: Electron.BrowserWindow, options?: ClearStorageDataOptions): Promise<void> {
    return window.webContents.session.clearStorageData(options);
  }

  private standardChannelsListening(): void {
    // Electron
    this.ipcTunnelService.on<void, void>(Channel.minimizeApp, () => {
      return this.minimizeApp();
    });

    this.ipcTunnelService.on<void, void>(Channel.enableFullscreen, () => {
      return this.enableFullscreen();
    });

    this.ipcTunnelService.on<void, void>(Channel.disableFullscreen, () => {
      return this.disableFullscreen();
    });

    this.ipcTunnelService.on<void, boolean>(Channel.isFullscreen, () => {
      return this.isFullscreen();
    });

    this.ipcTunnelService.on<void, void>(Channel.closeApp, () => {
      return this.closeApp();
    });

    this.ipcTunnelService.on<void, void>(Channel.restartApp, () => {
      return this.restartApp();
    });

    this.ipcTunnelService.on<void, void>(Channel.resetApp, () => {
      return this.resetMainBrowserWindowData(this.mainWindow);
    });

    this.ipcTunnelService.on<ClearStorageDataOptions, void>(
      Channel.clearStorageData,
      (options?: ClearStorageDataOptions) => {
        return this.clearStorageData(this.mainWindow, options);
      }
    );

    this.ipcTunnelService.on<OpenDialogSyncOptions, string[]>(
      Channel.showOpenDialogSync,
      (options: OpenDialogSyncOptions) => {
        return dialog.showOpenDialogSync(this.mainWindow, options);
      }
    );

    this.ipcTunnelService.on<string, void>(Channel.openExternal, (pPath: string) => {
      return pPath ? shell.openExternal(path.normalize(pPath)) : Promise.reject(`Given path is empty`);
    });

    this.ipcTunnelService.on<string, string>(Channel.openPath, (pPath: string) => {
      return pPath ? shell.openPath(path.normalize(pPath)) : Promise.reject(`Given path is empty`);
    });

    this.ipcTunnelService.on<string, void>(Channel.showItemInFolder, (pPath: string) => {
      return pPath ? shell.showItemInFolder(path.normalize(pPath)) : Promise.reject(`Given path is empty`);
    });

    this.ipcTunnelService.on<string, string>(
      Channel.getPath,
      (
        name:
          | "home"
          | "appData"
          | "userData"
          | "cache"
          | "temp"
          | "exe"
          | "module"
          | "desktop"
          | "documents"
          | "downloads"
          | "music"
          | "pictures"
          | "videos"
          | "recent"
          | "logs"
          | "crashDumps"
      ) => {
        return this.app.getPath(name);
      }
    );

    // File system
    this.ipcTunnelService.on<string, boolean>(Channel.existsSync, (pPath: string) => {
      return pPath ? fs.existsSync(path.normalize(pPath)) : false;
    });

    this.ipcTunnelService.on<string, boolean>(Channel.isDirectory, (pPath: string) => {
      return pPath ? fs.statSync(path.normalize(pPath)).isDirectory() : false;
    });

    this.ipcTunnelService.on<string, boolean>(Channel.isFile, (pPath: string) => {
      return pPath ? fs.statSync(path.normalize(pPath)).isFile() : false;
    });

    // Runtime info
    this.ipcTunnelService.on<void, RuntimeInfo>(Channel.runtimeInfo, () => {
      return this.appService.getRuntimeInfo();
    });
  }

  private startElevate(onReady: () => void = null): void {
    // Create the browser window.
    const workAreaSize: Electron.Size = Main.getWorkingAreaSize(Electron.screen.getPrimaryDisplay());
    const windowOptions: Electron.BrowserWindowConstructorOptions = {
      title: "App",
      width: workAreaSize.width,
      height: workAreaSize.height,
      center: true,
      frame: false,

      // show: false,
      autoHideMenuBar: true,
      webPreferences: {
        contextIsolation: true, // Force for security purposes
        nodeIntegration: false, // Force for security purposes
        enableRemoteModule: false, // Force for security purposes
        preload: path.join(__dirname, "pre-loader.js")
      }
    };

    this.mainWindow = new BrowserWindow(windowOptions);

    // Configure tunnel service to receive and send message from Renderer
    (this.ipcTunnelService as IpcMainTunnelService).configure(this.ipcMain, this.mainWindow);

    this.setupListeners();

    // Load app
    const url = new URL(`file:${path.join(__dirname, "app", "index.html")}`);
    this.mainWindow.loadURL(url.href);

    this.mainWindow.once("ready-to-show", () => {
      this.mainWindow.show();
      if (onReady) {
        onReady();
      }
    });

    // Detect a proxy on the system before listening for message from renderer
    this.httpClient.detectProxy(this.mainWindow);

    // Emitted when the window is closed.
    this.mainWindow.on("closed", () => {
      // Dereference the window object, usually you would store window
      // in an array if your app supports multi windows, this is the time
      // when you should delete the corresponding element.
      this.mainWindow = null;
    });

    // Define "development" and "in prod" behavior
    if (IS_ELECTRON_DEV) {
      // Development...
      // Open dev tool by default
      this.mainWindow.webContents.openDevTools();
    } else {
      // Production...
      // Disable dev tool shortcut
      globalShortcut.register("CommandOrControl+Shift+I" as Electron.Accelerator, _.noop);

      // Disable app window reload shortcuts
      globalShortcut.register("CommandOrControl+R" as Electron.Accelerator, _.noop);
      globalShortcut.register("CommandOrControl+Shift+R" as Electron.Accelerator, _.noop);
    }

    // Toggle dev tool shortcut
    globalShortcut.register("Alt+Shift+D+E+V" as Electron.Accelerator, () => {
      this.mainWindow.webContents.toggleDevTools();
    });
  }

  private setupListeners(): void {
    // Listen for standard app messages (close, restart, ...)
    this.standardChannelsListening();

    // Listen for sync related messages
    this.ipcSyncMessageListener.startListening(this.ipcTunnelService);

    // Listen for activity compute request
    this.ipcComputeActivityListener.startListening(this.ipcTunnelService);

    // Listen for strava account linking
    this.ipcStravaLinkListener.startListening(this.ipcTunnelService);

    // Listen for backup profile requests
    this.ipcProfileBackupListener.startListening(this.ipcTunnelService);
  }
}

try {
  if (IS_ELECTRON_DEV) {
    logger.debug("Electron is in DEV mode");
  }

  logger.info("Version: " + pkg.version);
  container.resolve(Main).run(app, ipcMain); // Run app
} catch (err) {
  logger.error(err);
}
