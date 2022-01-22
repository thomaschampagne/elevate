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
import { AppService } from "./app-service";
import pkg from "../package.json";
import { container, inject, registry, singleton } from "tsyringe";
import _ from "lodash";
import fs from "fs";
import { IpcMainTunnelService } from "./ipc-main-tunnel.service";
import { IpcSyncMessageListener } from "./listeners/ipc-sync-message.listener";
import { IpcComputeActivityListener } from "./listeners/ipc-compute-activity.listener";
import { IpcStravaLinkListener } from "./listeners/ipc-strava-link.listener";
import { IpcProfileBackupListener } from "./listeners/ipc-profile-backup.listener";
import { Logger } from "./logger";
import { UpdateHandler } from "./updates/update-handler";
import { IpcSharedStorageListener } from "./listeners/ipc-shared-storage.listener";
import { IpcStorageService } from "./ipc-storage-service";
import { HttpClient } from "./clients/http.client";
import { EnvironmentToken } from "./environments/environment.interface";
import { DevEnvironment } from "./environments/environment.dev";
import { ProdEnvironment } from "./environments/environment.prod";
import { Channel } from "@elevate/shared/electron/channels.enum";
import { IpcTunnelService } from "@elevate/shared/electron/ipc-tunnel";
import { RuntimeInfo } from "@elevate/shared/electron/runtime-info";
import { IpcMessage } from "@elevate/shared/electron/ipc-message";
import { Platform } from "@elevate/shared/enums/platform.enum";
import { UserScreen } from "./tools/user-screen";
import { platform } from "os";
import { RuntimeInfoProviderToken } from "./runtime-info/runtime-info.provider";
import { RuntimeInfoService } from "./runtime-info/runtime-Info.service";
import { IpcComputeSplitsListener } from "./listeners/ipc-compute-splits.listener";

const IS_ELECTRON_DEV = !app.isPackaged;

@singleton()
@registry([
  { token: EnvironmentToken, useClass: IS_ELECTRON_DEV ? DevEnvironment : ProdEnvironment },
  { token: RuntimeInfoProviderToken, useClass: RuntimeInfoService }
])
class Main {
  constructor(
    @inject(AppService) private readonly appService: AppService,
    @inject(UpdateHandler) private readonly updateHandler: UpdateHandler,
    @inject(IpcMainTunnelService) private readonly ipcTunnelService: IpcTunnelService,
    @inject(IpcSyncMessageListener) private readonly ipcSyncMessageListener: IpcSyncMessageListener,
    @inject(IpcComputeActivityListener) private readonly ipcComputeActivityListener: IpcComputeActivityListener,
    @inject(IpcComputeSplitsListener) private readonly ipcComputeSplitsListener: IpcComputeSplitsListener,
    @inject(IpcStravaLinkListener) private readonly ipcStravaLinkListener: IpcStravaLinkListener,
    @inject(IpcProfileBackupListener) private readonly ipcProfileBackupListener: IpcProfileBackupListener,
    @inject(IpcSharedStorageListener) private readonly ipcSharedStorageListener: IpcSharedStorageListener,
    @inject(IpcStorageService) private readonly ipcStorage: IpcStorageService,
    @inject(HttpClient) private readonly httpClient: HttpClient,
    @inject(Logger) private readonly logger: Logger
  ) {}

  private static readonly DEFAULT_SCREEN_RATIO: number = 0.95;
  private static readonly LARGE_SCREEN_RATIO: number = 0.85;

  private static readonly FORBIDDEN_SHORTCUTS: string[] = [
    "CommandOrControl+Shift+I",
    "CommandOrControl+R",
    "CommandOrControl+Shift+R"
  ];

  private app: Electron.App;
  private ipcMain: IpcMain;
  private mainWindow: BrowserWindow;

  public static computeAppTargetSize(): Electron.Size {
    const { width, height } = UserScreen.computeScreenRes();

    const windowRatio = width > 1920 && height > 1080 ? Main.LARGE_SCREEN_RATIO : Main.DEFAULT_SCREEN_RATIO;

    const primaryDisplay = UserScreen.getPrimaryDisplay();

    return {
      width: Math.round(primaryDisplay.workAreaSize.width * windowRatio),
      height: Math.round(primaryDisplay.workAreaSize.height * windowRatio)
    };
  }

  public onElectronReady(): void {
    const gotTheLock = this.app.requestSingleInstanceLock();

    // If failed to obtain the lock, another instance of application is already running with the lock => exit immediately.
    // @see https://github.com/electron/electron/blob/master/docs/api/app.md#apprequestsingleinstancelock
    if (!gotTheLock) {
      this.logger.info("We failed to obtain application the lock. Exit now");
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

      this.startElevate();
    }
  }

  public run(electronApp: Electron.App, electronIpcMain: IpcMain): void {
    this.app = electronApp;
    this.ipcMain = electronIpcMain;

    this.appService.isPackaged = this.app.isPackaged;

    if (this.appService.isPackaged) {
      this.logger.info("Running in production");
    } else {
      this.logger.info("Running in development");
    }

    this.logger.info("App running into: " + this.app.getAppPath());

    // This method will be called when Electron has finished
    // initialization and is ready to create browser windows.
    // Some APIs can only be used after this event occurs.
    this.app.on("ready", () => {
      this.onElectronReady();
    });

    // Quit when all windows are closed.
    this.app.on("window-all-closed", () => {
      this.closeApp(false);
    });

    this.app.on("activate", () => {
      // On macOS it's common to re-create a window in the app when the
      // dock icon is clicked and there are no other windows open.
      if (!this.mainWindow) {
        this.createMainBrowserWindow();
      }
    });

    // Configure shortcuts on focus
    this.app.on("browser-window-focus", () => {
      // Toggle dev tool shortcut
      globalShortcut.register("D+Ctrl+Alt+E+V+Shift", () => {
        this.mainWindow.webContents.toggleDevTools();
      });

      if (!IS_ELECTRON_DEV) {
        Main.FORBIDDEN_SHORTCUTS.forEach(shortcut => globalShortcut.register(shortcut, _.noop));
      }
    });

    // Un-configure shortcuts on focus
    this.app.on("browser-window-blur", () => {
      if (!IS_ELECTRON_DEV) {
        Main.FORBIDDEN_SHORTCUTS.forEach(shortcut => globalShortcut.unregister(shortcut));
      }
    });

    // Setup user agent fallback without Electron pattern and app name
    this.app.userAgentFallback = this.app.userAgentFallback
      .replace(" Electron/" + process.versions.electron, "")
      .replace(` ${pkg.name}/${pkg.version}`, "");
  }

  private minimizeApp(): void {
    this.mainWindow.minimize();
  }

  private maximizeApp(): void {
    this.mainWindow.maximize();
  }

  private unMaximizeApp(): void {
    this.mainWindow.unmaximize();
  }

  private restoreApp(): void {
    this.mainWindow.restore();
  }

  private enableFullscreen(): void {
    return this.mainWindow.setFullScreen(true);
  }

  private disableFullscreen(): void {
    return this.mainWindow.setFullScreen(false);
  }

  private closeApp(force: boolean): void {
    if (force) {
      this.app.quit();
      return;
    }

    // On OS X it is common for this.applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    // if (process.platform !== Platform.MACOS) {
    this.app.quit();
    // }
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
        this.ipcStorage.clear();
        return Promise.resolve();
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

    this.ipcTunnelService.on<void, void>(Channel.maximizeApp, () => {
      return this.maximizeApp();
    });

    this.ipcTunnelService.on<void, void>(Channel.unMaximizeApp, () => {
      return this.unMaximizeApp();
    });

    this.ipcTunnelService.on<void, void>(Channel.restoreApp, () => {
      return this.restoreApp();
    });

    this.ipcTunnelService.on<void, void>(Channel.enableFullscreen, () => {
      return this.enableFullscreen();
    });

    this.ipcTunnelService.on<void, void>(Channel.disableFullscreen, () => {
      return this.disableFullscreen();
    });

    this.ipcTunnelService.on<boolean, void>(Channel.closeApp, force => {
      return this.closeApp(force);
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
      return pPath ? shell.openExternal(pPath) : Promise.reject(`Given path is empty`);
    });

    this.ipcTunnelService.on<string, string>(Channel.openPath, (pPath: string) => {
      return pPath ? shell.openPath(path.normalize(pPath)) : Promise.reject(`Given path is empty`);
    });

    this.ipcTunnelService.on<void, string>(Channel.getLogFilePath, () => {
      return path.normalize(this.logger.base.transports.file.getFile().path);
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

  private startElevate(): void {
    // Print user runtime info in logs
    this.appService.printRuntimeInfo();

    // Create the browser window.
    this.createMainBrowserWindow();

    // Configure tunnel service to receive and send message from Renderer
    (this.ipcTunnelService as IpcMainTunnelService).configure(this.ipcMain, this.mainWindow);

    this.setupListeners();

    // Emit window events
    this.mainWindow.on("maximize", () => {
      this.ipcTunnelService.fwd(new IpcMessage(Channel.isMaximized, true));
    });

    this.mainWindow.on("unmaximize", () => {
      this.ipcTunnelService.fwd(new IpcMessage(Channel.isMaximized, false));
    });

    this.mainWindow.on("enter-full-screen", () => {
      this.ipcTunnelService.fwd(new IpcMessage(Channel.isFullscreen, true));
    });

    this.mainWindow.on("leave-full-screen", () => {
      this.ipcTunnelService.fwd(new IpcMessage(Channel.isFullscreen, false));
    });

    // Emitted when the window is closed.
    this.mainWindow.on("closed", () => {
      // Dereference the window object, usually you would store window
      // in an array if your app supports multi windows, this is the time
      // when you should delete the corresponding element.
      this.mainWindow = null;
    });

    // Load app
    const url = new URL(`file:${path.join(__dirname, "app", "index.html")}`);
    this.httpClient
      .configure(this.mainWindow) // Detect a proxy on the system at first
      .then(() => this.mainWindow.loadURL(url.href)) // Then load the page
      .then(() => {
        this.mainWindow.show();

        // Open dev tool by default if development
        if (IS_ELECTRON_DEV) {
          this.mainWindow.webContents.openDevTools();
        }

        this.logger.info("App is ready");
      });
  }

  private createMainBrowserWindow(): void {
    const workAreaSize: Electron.Size = Main.computeAppTargetSize();
    const windowOptions: Electron.BrowserWindowConstructorOptions = {
      title: "App",
      width: workAreaSize.width,
      height: workAreaSize.height,
      center: true,
      frame: platform() === Platform.MACOS,
      trafficLightPosition: { x: 15, y: 10 },
      titleBarStyle: "hidden",
      autoHideMenuBar: true,
      webPreferences: {
        webgl: true,
        contextIsolation: true,
        nodeIntegration: false,
        preload: path.join(__dirname, "pre-loader.js")
      }
    };

    this.mainWindow = new BrowserWindow(windowOptions);
  }

  private setupListeners(): void {
    // Listen for standard app messages (close, restart, ...)
    this.standardChannelsListening();

    // Listen for sync related messages
    this.ipcSyncMessageListener.startListening(this.ipcTunnelService);

    // Listen for activity compute request
    this.ipcComputeActivityListener.startListening(this.ipcTunnelService);

    // Listen for splits compute request
    this.ipcComputeSplitsListener.startListening(this.ipcTunnelService);

    // Listen for strava account linking
    this.ipcStravaLinkListener.startListening(this.ipcTunnelService);

    // Listen for backup profile requests
    this.ipcProfileBackupListener.startListening(this.ipcTunnelService);

    // Listen for shared storage requests
    this.ipcSharedStorageListener.startListening(this.ipcTunnelService);

    // Listen for check remote update requests
    this.updateHandler.startListening(this.ipcTunnelService);
  }
}

const loggerInstance = container.resolve(Logger);
loggerInstance.base.transports.file.level = IS_ELECTRON_DEV ? "debug" : "info";
loggerInstance.base.transports.console.level = IS_ELECTRON_DEV ? "debug" : "info";
loggerInstance.base.transports.file.maxSize = 1048576 * 2; // 2MB

try {
  if (IS_ELECTRON_DEV) {
    loggerInstance.debug("Electron is in DEV mode");
  }

  loggerInstance.info("Version: " + pkg.version);
  container.resolve(Main).run(app, ipcMain); // Run app
} catch (err) {
  loggerInstance.error(err);
}
