import { IpcRequest, PromiseTron } from "promise-tron";
import { BaseConnector, SyncEvent, SyncEventType, SyncRequest, SyncResponse } from "@elevate/shared/sync";
import logger from "electron-log";

// TODO Unit tests
export class RequestListener {

	public promiseTron: PromiseTron;

	constructor(public ipcMain: Electron.IpcMain,
				public webContents: Electron.WebContents) {
		this.promiseTron = new PromiseTron(ipcMain, webContents);
	}

	public listen(): void {

		this.promiseTron.on((ipcRequest: IpcRequest /* TODO IpcRequest<SyncRequest>*/, replyWith: Function) => {

			logger.debug("[MAIN] Incoming ipcRequest", JSON.stringify(ipcRequest));

			// Is SyncRequest?!
			if (ipcRequest.data && ipcRequest.data.request) {
				this.handleSyncRequests(ipcRequest.data, replyWith);
			} else {
				logger.error("[MAIN] No ipcRequest handler found for: ", ipcRequest);
			}
		});

	}

	public handleSyncRequests(syncRequest: SyncRequest, replyWith: Function): void {

		switch (syncRequest.request) {

			case SyncRequest.START_SYNC:
				const connector = <BaseConnector> syncRequest.params[0];
				replyWith(new SyncResponse<string>(syncRequest, "Started sync for connector: " + connector.name));
				this.handleStartSync(connector);
				break;

			default:
				replyWith(new SyncResponse<string>(syncRequest, "Unknown connector"));
				break;

		}
	}

	public syncingInterval = null; // FAKE
	public handleStartSync(connector: BaseConnector): void {

		// TODO Manage "isSyncing" toggle to support start/cancel/stop/restart sync...

		if (this.syncingInterval) { // FAKE "current sync" stop
			clearInterval(this.syncingInterval);
			logger.warn("[MAIN]", "stop current sync !!");
		}

		// [Fake] Sending fake sync events to renderer
		this.syncingInterval = setInterval(() => {
			this.promiseTron.send(new SyncEvent(SyncEventType.GENERIC, connector, (new Date()).toISOString())).then(response => {
				logger.info("[MAIN]", response);
			});
		}, 1000);

	}
}
