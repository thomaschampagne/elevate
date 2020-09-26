import { Inject, Injectable } from "@angular/core";
import _ from "lodash";
import { ChildProcess } from "child_process";
import { LoggerService } from "../../shared/services/logging/logger.service";
import { Platform } from "@elevate/shared/enums";
import { BrowserWindow, Remote, Session } from "electron";
import { ElevateException } from "@elevate/shared/exceptions";

@Injectable()
export class ElectronService {
  public instance: any;

  constructor(@Inject(LoggerService) private readonly logger: LoggerService) {
    this.forwardHtmlLinkClicksToDefaultBrowser();
  }

  public get electron(): any {
    if (!this.instance) {
      this.instance = (window as any).require("electron");
    }
    return this.instance;
  }

  public get remote(): Remote {
    return this.instance ? this.instance.remote : null;
  }

  public forwardHtmlLinkClicksToDefaultBrowser(): void {
    document.querySelector("body").addEventListener("click", (event: any) => {
      if (event.target.tagName.toLowerCase() === "a" && !event.target.attributes.download) {
        event.preventDefault();
        this.openExternalUrl(event.target.href);
      }
    });
  }

  public userDirectorySelection(): string {
    const paths = this.electron.remote.dialog.showOpenDialogSync(this.getMainBrowserWindow(), {
      properties: ["openDirectory", "showHiddenFiles"]
    });
    return paths && paths.length > 0 ? paths[0] : null;
  }

  public getMainBrowserWindow(): BrowserWindow {
    return this.electron.remote.getCurrentWindow();
  }

  public openExternalUrl(url: string): void {
    this.electron.shell.openExternal(url);
  }

  public openItem(path: string): void {
    this.electron.shell.openPath(path);
  }

  public showItemInFolder(itemPath: string): void {
    if (!this.existsSync(itemPath)) {
      throw new ElevateException("Item path do not exists");
    }
    this.electron.shell.showItemInFolder(itemPath);
  }

  public openLogsFolder(): void {
    this.openItem(this.getLogsPath());
  }

  public openAppDataFolder(): void {
    this.openItem(this.getAppDataPath());
  }

  public openAppExecFolder(): void {
    const appPath = this.electron.remote.app.getAppPath();
    this.openItem(appPath.substring(0, Math.max(appPath.lastIndexOf("/"), appPath.lastIndexOf("\\"))));
  }

  public clearAppData(): Promise<void> {
    const session = this.getSession();
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
      });
  }

  public clearAppDataAndRestart(): void {
    this.clearAppData().then(() => {
      this.restartApp();
    });
  }

  public rmDirSync(path: string): void {
    const fs = this.getNodeFsModule();
    if (fs.existsSync(path)) {
      fs.readdirSync(path).forEach(file => {
        const curPath = path + "/" + file;
        if (fs.lstatSync(curPath).isDirectory()) {
          // recurse
          this.rmDirSync(curPath);
        } else {
          // delete file
          fs.unlinkSync(curPath);
        }
      });
      fs.rmdirSync(path);
    }
  }

  public restartApp(): void {
    this.electron.remote.app.relaunch();
    this.electron.remote.app.exit(0);
  }

  public filesIn(folderPath: string, ext: string | RegExp): string[] {
    let files: string[] = this.readDirSync(folderPath);

    files = _.remove(files, file => {
      if (_.isRegExp(ext)) {
        return file.match(ext);
      }
      return file.endsWith(ext);
    });

    return files;
  }

  public exec(command: string, callback: (err: string, stdout: string, stderr: string) => void): ChildProcess {
    return this.require("child_process").exec(command, callback);
  }

  /**
   * @return fs node module
   */
  public getNodeFsModule(): any {
    return this.require("fs");
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
      | "pepperFlashSystemPlugin"
      | "crashDumps"
  ): string {
    return this.electron.remote.app.getPath(name);
  }

  public getAppDataPath(): string {
    return `${this.getPath("appData")}/${this.electron.remote.app.name}`;
  }

  public getLogsPath(): string {
    return `${this.getAppDataPath()}/logs`;
  }

  public readDirSync(folderPath): string[] {
    return this.getNodeFsModule().readdirSync(folderPath);
  }

  public readFileSync(filePath: string): string {
    return this.getNodeFsModule().readFileSync(filePath);
  }

  public existsSync(filePath: string): boolean {
    return this.getNodeFsModule().existsSync(filePath);
  }

  public statSync(path: string): any {
    return this.getNodeFsModule().statSync(path);
  }

  public isDirectory(path: string): boolean {
    if (!this.existsSync(path)) {
      return false;
    }

    try {
      return this.statSync(path).isDirectory();
    } catch (e) {
      return false;
    }
  }

  public isFile(path: string): boolean {
    if (!this.existsSync(path)) {
      return false;
    }

    try {
      return this.statSync(path).isFile();
    } catch (e) {
      return false;
    }
  }

  public openDevTools(): void {
    this.electron.remote.getCurrentWindow().webContents.openDevTools();
  }

  public require(module: string): any {
    return this.remote.require(module);
  }

  public isPackaged(): boolean {
    return this.electron.remote.app.isPackaged;
  }

  public getPlatform(): Platform {
    return this.instance.remote.process.platform as Platform;
  }

  public isWindows(): boolean {
    return this.instance.remote.process.platform === Platform.WINDOWS;
  }

  public isLinux(): boolean {
    return this.instance.remote.process.platform === Platform.LINUX;
  }

  public isMacOS(): boolean {
    return this.instance.remote.process.platform === Platform.MACOS;
  }

  private getSession(): Session {
    return this.electron.remote.getCurrentWindow().webContents.session;
  }
}
