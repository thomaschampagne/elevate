import * as Electron from "electron";
import { Injectable } from "@angular/core";
import * as _ from "lodash";
import { ChildProcess } from "child_process";
import { LoggerService } from "../logging/logger.service";

declare let window: ElectronWindow;

export interface ElectronWindow extends Window {
    require(module: string): Electron.RendererInterface;
}

@Injectable()
export class ElectronService {

    public instance: Electron.RendererInterface;

    constructor(public logger: LoggerService) {
        this.forwardHtmlLinkClicksToDefaultBrowser();
    }

    public get electron(): Electron.RendererInterface {
        if (!this.instance) {
            this.instance = window.require("electron");
        }
        return this.instance;
    }

    public get remote(): Electron.Remote {
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

    public getMainBrowserWindow(): Electron.BrowserWindow {
        return this.electron.remote.getCurrentWindow();
    }

    public openExternalUrl(url: string): void {
        this.electron.shell.openExternal(url);
    }

    public openItem(path: string): void {
        this.electron.shell.openItem(path);
    }

    public openLogsFolder(): void {
        const logPath = this.getAppDataPath() + "/logs/";
        this.openItem(logPath);
    }

    public openAppDataFolder(): void {
        this.openItem(this.getAppDataPath());
    }

    public openAppExecFolder(): void {
        const appPath = this.electron.remote.app.getAppPath();
        this.openItem(appPath.substring(0, Math.max(appPath.lastIndexOf("/"), appPath.lastIndexOf("\\"))));
    }

    public clearAppDataAndRestart(): void {
        const session = this.electron.remote.getCurrentWindow().webContents.session;
        session.clearStorageData().then(() => {
            return session.clearCache();
        }).then(() => {
            return session.clearAuthCache(null);
        }).then(() => {
            return session.clearHostResolverCache();
        }).then(() => {
            this.restart();
        });
    }

    public rmDirSync(path: string): void {
        const fs = this.getNodeFsModule();
        if (fs.existsSync(path)) {
            fs.readdirSync(path).forEach(file => {
                const curPath = path + "/" + file;
                if (fs.lstatSync(curPath).isDirectory()) { // recurse
                    this.rmDirSync(curPath);
                } else { // delete file
                    fs.unlinkSync(curPath);
                }
            });
            fs.rmdirSync(path);
        }
    }

    public restart(): void {
        this.electron.remote.app.relaunch();
        this.electron.remote.app.exit(0);
    }

    /**
     *
     * @param folderPath
     * @param ext
     */
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

    /**
     *
     */
    public getAppDataPath(): string {
        return this.electron.remote.app.getPath("appData") + "/" + this.electron.remote.app.name + "/";
    }

    /**
     *
     * @param folderPath
     */
    public readDirSync(folderPath): string[] {
        return this.getNodeFsModule().readdirSync(folderPath);
    }

    /**
     *
     * @param filePath
     */
    public readFileSync(filePath: string): string {
        return this.getNodeFsModule().readFileSync(filePath);
    }

    /**
     *
     * @param filePath
     */
    public existsSync(filePath: string): boolean {
        return this.getNodeFsModule().existsSync(filePath);
    }

    /**
     *
     * @param path
     */
    public statSync(path: string): any {
        return this.getNodeFsModule().statSync(path);
    }

    /**
     *
     * @param path
     */
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

    public require(module: string): any {
        return this.remote.require(module);
    }

    public isPackaged(): boolean {
        return this.electron.remote.app.isPackaged;
    }

    public isWindows(): boolean {
        return this.instance.remote.process.platform === "win32";
    }

    public isLinux(): boolean {
        return this.instance.remote.process.platform === "linux";
    }

    public isMacOS(): boolean {
        return this.instance.remote.process.platform === "darwin";
    }
}
