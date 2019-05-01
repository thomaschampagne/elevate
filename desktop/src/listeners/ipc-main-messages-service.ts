import { IpcRequest, PromiseTron, PromiseTronReply } from "promise-tron";
import { BaseConnector, SyncEvent, SyncEventType, SyncMessage } from "@elevate/shared/sync";
import logger from "electron-log";
import { StravaAuthentication } from "../strava-authentication";

export class IpcMainMessagesService {

	public promiseTron: PromiseTron;

	constructor(public ipcMain: Electron.IpcMain,
				public webContents: Electron.WebContents) {
		this.promiseTron = new PromiseTron(ipcMain, webContents);
	}

	public listen(): void {

		this.promiseTron.on((ipcRequest: IpcRequest, replyWith: (promiseTronReply: PromiseTronReply) => void) => {

			logger.debug("[MAIN] Incoming ipcRequest", JSON.stringify(ipcRequest));

			const syncMessage = IpcRequest.extractData<SyncMessage>(ipcRequest);

			if (syncMessage) {
				this.forwardMessagesFromIpcRenderer(syncMessage, replyWith);
			} else {
				logger.error("[MAIN] No ipcRequest handler found for: ", ipcRequest);
			}
		});

	}

	public forwardMessagesFromIpcRenderer(message: SyncMessage, replyWith: (promiseTronReply: PromiseTronReply) => void): void {

		switch (message.flag) {

			case SyncMessage.FLAG_START_SYNC:
				this.handleStartSyncAndFakeSync(message, replyWith);
				break;

			case SyncMessage.FLAG_LINK_STRAVA_CONNECTOR:
				this.handleLinkWithStrava(message, replyWith);
				break;

			default:
				replyWith({
					success: null,
					error: "Unknown connector"
				});
				break;

		}
	}

	/**
	 * TODO To be removed method: just emulate sync events when sync start
	 * @param connector
	 */
	public syncingInterval = null;

	public handleStartSyncAndFakeSync(message: SyncMessage, replyWith: (promiseTronReply: PromiseTronReply) => void): void {

		const connector = <BaseConnector> message.payload[0];

		replyWith({
			success: "Started sync for connector: " + JSON.stringify(connector),
			error: null
		});

		if (this.syncingInterval) { // FAKE "current sync" stop
			clearInterval(this.syncingInterval);
			logger.warn("[MAIN]", "stop current sync !!");
		}

		// Sending fake sync events to renderer
		this.syncingInterval = setInterval(() => {
			const syncMessage: SyncMessage = new SyncMessage(SyncMessage.FLAG_SYNC_EVENT, new SyncEvent(SyncEventType.GENERIC, connector, (new Date()).toISOString()));
			this.promiseTron.send(syncMessage).then((response: string) => {
				logger.info("[MAIN]", response);
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

	public handleLinkWithStrava(message: SyncMessage, replyWith: (promiseTronReply: PromiseTronReply) => void): void {

		const clientId = <number> message.payload[0];
		const clientSecret = <string> message.payload[1];
		const scope = <string> message.payload[2];

		const stravaAuth = new StravaAuthentication();
		stravaAuth.authorize(scope, clientId, clientSecret, (error, accessToken) => {
			if (error) {
				replyWith({
					success: null,
					error: error
				});
				logger.error(error);
			} else {
				replyWith({
					success: accessToken,
					error: null
				});
			}
		});

	}
}
