import { Inject, Injectable } from "@angular/core";
import { LoggerService } from "../../shared/services/logging/logger.service";
import { OpenDialogSyncOptions } from "electron";
import { BridgeApi } from "@elevate/shared/electron/bridge.api";
import { Platform } from "@elevate/shared/enums/platform.enum";

@Injectable()
export class ElectronService {
  public readonly api: BridgeApi;

  constructor(@Inject(LoggerService) private readonly logger: LoggerService) {
    this.forwardHtmlLinkClicksToDefaultBrowser();
    this.api = (window as any).api as BridgeApi;
  }

  public forwardHtmlLinkClicksToDefaultBrowser(): void {
    document.querySelector("body").addEventListener("click", (event: any) => {
      if (
        event.target.tagName.toLowerCase() === "a" &&
        event.target.href.startsWith("http") &&
        !event.target.attributes.download
      ) {
        event.preventDefault();
        this.openExternalUrl(event.target.href);
      }
    });
  }

  public userFileSelection(extension: string, name: string): Promise<string> {
    const options: OpenDialogSyncOptions = {
      properties: ["openFile", "showHiddenFiles"],
      filters: [{ extensions: [extension], name: name }]
    };
    return this.api.showOpenDialogSync(options).then(paths => {
      return paths && paths.length > 0 ? paths[0] : null;
    });
  }

  public userDirectorySelection(): Promise<string> {
    const options: OpenDialogSyncOptions = {
      properties: ["openDirectory", "showHiddenFiles"]
    };
    return this.api.showOpenDialogSync(options).then(paths => {
      return paths && paths.length > 0 ? paths[0] : null;
    });
  }

  public openExternalUrl(url: string): Promise<void> {
    return this.api.openExternal(url);
  }

  public openItem(path: string): Promise<string> {
    return this.api.openPath(path);
  }

  public showItemInFolder(itemPath: string): Promise<void> {
    return this.existsSync(itemPath).then(exists => {
      if (!exists) {
        return Promise.reject("Item path do not exists");
      }

      return this.api.showItemInFolder(itemPath);
    });
  }

  public showLogFile(): Promise<void> {
    return this.getLogFilePath().then(path => {
      return this.showItemInFolder(path);
    });
  }

  public openUserDataFolder(): Promise<string> {
    return this.getUserDataPath().then(path => {
      return this.openItem(path);
    });
  }

  public minimizeApp(): void {
    this.api.minimizeApp().then(() => this.logger.debug("Minimize handled"));
  }

  public maximizeApp(): void {
    this.api.maximizeApp().then(() => this.logger.debug("Maximize handled"));
  }

  public restoreApp(): void {
    this.api.restoreApp().then(() => this.logger.debug("Restore handled"));
  }

  public enableFullscreen(): Promise<void> {
    return this.api.enableFullscreen().then(() => this.logger.debug("Fullscreen enabled"));
  }

  public disableFullscreen(): Promise<void> {
    return this.api.disableFullscreen().then(() => this.logger.debug("Fullscreen disabled"));
  }

  public closeApp(force: boolean = false): void {
    this.api.closeApp(force).then(() => this.logger.debug("Close handled"));
  }

  public restartApp(): void {
    this.api.restartApp().then(() => this.logger.debug("Restart handled"));
  }

  public resetApp(): void {
    this.api.resetApp().then(() => this.logger.debug("Reset handled"));
  }

  public getPath(
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
  ): Promise<string> {
    return this.api.getPath(name);
  }

  public getUserDataPath(): Promise<string> {
    return this.getPath("userData");
  }

  public getLogFilePath(): Promise<string> {
    return this.api.getLogFilePath();
  }

  public existsSync(path: string): Promise<boolean> {
    return this.api.existsSync(path);
  }

  public isDirectory(path: string): Promise<boolean> {
    return this.existsSync(path).then(exists => {
      if (!exists) {
        return Promise.resolve(false);
      } else {
        return this.api.isDirectory(path);
      }
    });
  }

  public isFile(path: string): Promise<boolean> {
    return this.existsSync(path).then(exists => {
      if (!exists) {
        return Promise.resolve(false);
      } else {
        return this.api.isFile(path);
      }
    });
  }

  public getPlatform(): Platform {
    return this.api.nodePlatform as Platform;
  }

  public isWindows(): boolean {
    return this.api.nodePlatform === Platform.WINDOWS;
  }

  public isLinux(): boolean {
    return this.api.nodePlatform === Platform.LINUX;
  }

  public isMacOS(): boolean {
    return this.api.nodePlatform === Platform.MACOS;
  }
}
