import { PromiseTron } from "promise-tron";

// TODO Unit tests
export class RequestListener {

	public promiseTron: PromiseTron;

	constructor(public ipcMain: Electron.IpcMain,
				public webContents: Electron.WebContents) {
		this.promiseTron = new PromiseTron(ipcMain, webContents);
	}

	public init(): void {
	}
}
