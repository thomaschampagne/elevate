import "reflect-metadata";
import Electron, { app, BrowserWindow, globalShortcut, ipcMain } from "electron";
import path from "path";
import url from "url";
import logger from "electron-log";
import { AppService } from "./app-service";
import pkg from "../package.json";
import { Updater } from "./updater/updater";
import { UpdateInfo } from "electron-updater";
import { Platform } from "@elevate/shared/enums";
import { container, inject, singleton } from "tsyringe";
import { IpcMessagesReceiver } from "./messages/ipc-messages.receiver";
import { HttpClient } from "./clients/http.client";
import { IpcMessagesSender } from "./messages/ipc-messages.sender";
import _ from "lodash";

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
    @inject(IpcMessagesSender) private readonly ipcMessagesSender: IpcMessagesSender,
    @inject(IpcMessagesReceiver) private readonly messagesService: IpcMessagesReceiver,
    @inject(HttpClient) private readonly httpClient: HttpClient
  ) {}
  private static readonly DEFAULT_SCREEN_RATIO: number = 0.95;
  private static readonly LARGE_SCREEN_RATIO: number = 0.85;

  private app: Electron.App;
  private appWindow: BrowserWindow;

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
        if (this.appWindow) {
          if (this.appWindow.isMinimized()) {
            this.appWindow.restore();
          }
          this.appWindow.focus();
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

  public run(electronApp: Electron.App): void {
    this.app = electronApp;

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
      // On OS X it is common for this.applications and their menu bar
      // to stay active until the user quits explicitly with Cmd + Q
      if (process.platform !== Platform.MACOS) {
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

  private startElevate(onReady: () => void = null): void {
    // Create the browser window.
    const workAreaSize: Electron.Size = Main.getWorkingAreaSize(Electron.screen.getPrimaryDisplay());
    const windowOptions: Electron.BrowserWindowConstructorOptions = {
      title: "App",
      width: workAreaSize.width,
      height: workAreaSize.height,
      // center: true,
      frame: false,

      // show: false,
      autoHideMenuBar: true,
      webPreferences: {
        nodeIntegration: true,
        enableRemoteModule: true
      }
    };

    console.log(windowOptions);

    this.appWindow = new BrowserWindow(windowOptions);

    // Create the request listener to listen renderer request events
    this.ipcMessagesSender.configure(ipcMain, this.appWindow.webContents);
    this.messagesService.listen();

    this.appWindow.loadURL(
      url.format({
        pathname: path.join(__dirname, "app", "index.html"),
        protocol: "file:",
        slashes: true
      })
    );

    this.appWindow.once("ready-to-show", () => {
      this.appWindow.show();
      if (onReady) {
        onReady();
      }
    });

    // Detect a proxy on the system before listening for message from renderer
    this.httpClient.detectProxy(this.appWindow);

    // Emitted when the window is closed.
    this.appWindow.on("closed", () => {
      // Dereference the window object, usually you would store window
      // in an array if your app supports multi windows, this is the time
      // when you should delete the corresponding element.
      this.appWindow = null;
    });

    // Define "development" and "in prod" behavior
    if (IS_ELECTRON_DEV) {
      // Development...
      // Open dev tool by default
      this.appWindow.webContents.openDevTools();
    } else {
      // Production...
      // Disable dev tool shortcut
      globalShortcut.register("CommandOrControl+Shift+I" as Electron.Accelerator, _.noop);

      // Disable app window reload shortcuts
      globalShortcut.register("CommandOrControl+R" as Electron.Accelerator, _.noop);
      globalShortcut.register("CommandOrControl+Shift+R" as Electron.Accelerator, _.noop);
    }
  }
}

try {
  if (IS_ELECTRON_DEV) {
    logger.debug("Electron is in DEV mode");
  }

  logger.info("Version: " + pkg.version);
  container.resolve(Main).run(app); // Run app
} catch (err) {
  logger.error(err);
}
