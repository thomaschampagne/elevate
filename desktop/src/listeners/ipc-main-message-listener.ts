import { IpcRequest, PromiseTron } from "promise-tron";
import { BaseConnector, SyncEvent, SyncEventType, SyncMessage, SyncMessageResponse } from "@elevate/shared/sync";
import logger from "electron-log";

// TODO Unit tests
export class IpcMainMessageListener {

	public promiseTron: PromiseTron;

	constructor(public ipcMain: Electron.IpcMain,
				public webContents: Electron.WebContents) {
		this.promiseTron = new PromiseTron(ipcMain, webContents);
	}

	public listen(): void {

		this.promiseTron.on((ipcRequest: IpcRequest, replyWith: Function) => {

			logger.debug("[MAIN] Incoming ipcRequest", JSON.stringify(ipcRequest));

			const syncMessage = IpcRequest.extractData<SyncMessage>(ipcRequest);

			if (syncMessage) {
				this.forwardMessagesFromIpcRenderer(syncMessage, replyWith);
			} else {
				logger.error("[MAIN] No ipcRequest handler found for: ", ipcRequest);
			}
		});

	}

	public forwardMessagesFromIpcRenderer(message: SyncMessage, replyWith: Function): void {

		switch (message.flag) {

			case SyncMessage.START_SYNC:
				this.handleStartSyncAndFakeSync(message, replyWith);
				break;

			default:
				replyWith(new SyncMessageResponse<string>(message, "Unknown connector"));
				break;

		}
	}

	/**
	 * TODO To be removed method: just emulate sync events when sync start
	 * @param connector
	 */
	public syncingInterval = null;

	public handleStartSyncAndFakeSync(message: SyncMessage, replyWith: Function): void {

		const connector = <BaseConnector> message.payload[0];

		const response = "Started sync for connector: " + JSON.stringify(connector);
		replyWith(new SyncMessageResponse<string>(message, response));
		logger.info("[MAIN]", "Reply with", response);

		if (this.syncingInterval) { // FAKE "current sync" stop
			clearInterval(this.syncingInterval);
			logger.warn("[MAIN]", "stop current sync !!");
		}

		// Sending fake sync events to renderer
		this.syncingInterval = setInterval(() => {
			const syncMessage: SyncMessage = new SyncMessage(SyncMessage.SYNC_EVENT, new SyncEvent(SyncEventType.GENERIC, connector, (new Date()).toISOString()));
			this.promiseTron.send<SyncMessageResponse<string>>(syncMessage).then((response: SyncMessageResponse<string>) => {
				logger.info("[MAIN]", response.body);
			});
		}, 1000);


		/*
				// Sample: get synced activity from IpcMain

				const getActivityMessage: SyncMessage = new SyncMessage(SyncMessage.GET_ACTIVITY, "activityId");
				this.promiseTron.send<SyncMessageResponse<SyncedActivityModel>>(getActivityMessage).then((response: SyncMessageResponse<SyncedActivityModel>) => {
					logger.info("[MAIN]", response.body);
				});
				*/
	}
}
