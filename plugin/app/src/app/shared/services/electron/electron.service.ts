import * as Electron from "electron";
import { Injectable } from "@angular/core";
import * as _ from "lodash";
import { ChildProcess } from "child_process";
import { Subject } from "rxjs";
import { IpcRequest, PromiseTron } from "promise-tron";
import { BaseConnector, SyncEvent, SyncRequest, SyncResponse } from "@elevate/shared/sync";

declare let window: ElectronWindow;

export interface ElectronWindow extends Window {
	require(module: string): Electron.RendererInterface;
}

@Injectable()
export class ElectronService {

	public instance: Electron.RendererInterface;
	public promiseTron: PromiseTron;
	public syncEvents: Subject<SyncEvent>;

	constructor() {
		this.listenSyncEvents();
	}

	public get electron(): Electron.RendererInterface {

		if (!this.instance) {
			this.instance = window.require("electron");
		}

		return this.instance;
	}

	public listenSyncEvents(): void {

		this.syncEvents = new Subject<SyncEvent>();

		this.promiseTron = new PromiseTron(this.electron.ipcRenderer);

		// Listen for sync events provided by main process
		this.promiseTron.on/*TODO<SyncEvent>*/((ipcRequest: IpcRequest/*TODO<SyncEvent>*/, replyWith: Function) => {

			if (ipcRequest.data) {
				const syncEvent: SyncEvent = <SyncEvent> ipcRequest.data;
				this.syncEvents.next(syncEvent);
				replyWith("syncEvent received by renderer!");
			}

		});
	}

	public sync(fastSync: boolean, forceSync: boolean, connector: BaseConnector): Subject<SyncEvent> {

		// Create request to start sync !
		const syncRequest: SyncRequest = new SyncRequest(SyncRequest.START_SYNC, connector);

		// Ask electron main to start sync for given connector
		this.promiseTron.send<SyncResponse<SyncEvent>>(syncRequest).then((response: SyncResponse<SyncEvent>) => {
			this.syncEvents.next(response.body);
		});

		return this.syncEvents;
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
