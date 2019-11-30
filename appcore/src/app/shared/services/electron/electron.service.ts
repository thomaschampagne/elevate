import * as Electron from "electron";
import { Injectable } from "@angular/core";
import * as _ from "lodash";
import { ChildProcess } from "child_process";

declare let window: ElectronWindow;

export interface ElectronWindow extends Window {
	require(module: string): Electron.RendererInterface;
}

@Injectable()
export class ElectronService {

	public instance: Electron.RendererInterface;

	constructor() {
		this.forwardHtmlLinkClicksToDefaultBrowser();
	}

	public forwardHtmlLinkClicksToDefaultBrowser(): void {
		document.querySelector("body").addEventListener("click", (event: any) => {
			if (event.target.tagName.toLowerCase() === "a") {
				event.preventDefault();
				this.electron.shell.openExternal(event.target.href);
			}
		});
	}

	public get electron(): Electron.RendererInterface {

		if (!this.instance) {
			this.instance = window.require("electron");
		}

		return this.instance;
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

	public get remote(): Electron.Remote {
		return this.instance ? this.instance.remote : null;
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
