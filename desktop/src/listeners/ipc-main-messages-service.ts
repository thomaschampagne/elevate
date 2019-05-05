import { IpcRequest, PromiseTron, PromiseTronReply } from "promise-tron";
import logger from "electron-log";
import { StravaAuthentication } from "../strava-authentication";
import { FlaggedIpcMessage, MessageFlag } from "@elevate/shared/electron";
import { ConnectorType, SyncEvent, SyncEventType } from "@elevate/shared/sync";

export class IpcMainMessagesService {

	public promiseTron: PromiseTron;

	constructor(public ipcMain: Electron.IpcMain,
				public webContents: Electron.WebContents) {
		this.promiseTron = new PromiseTron(ipcMain, webContents);
	}

	public listen(): void {

		this.promiseTron.on((ipcRequest: IpcRequest, replyWith: (promiseTronReply: PromiseTronReply) => void) => {

			logger.debug("[MAIN] Incoming ipcRequest", JSON.stringify(ipcRequest));

			const flaggedIpcMessage = IpcRequest.extractData<FlaggedIpcMessage>(ipcRequest);

			if (flaggedIpcMessage) {
				this.forwardMessagesFromIpcRenderer(flaggedIpcMessage, replyWith);
			} else {
				logger.error("[MAIN] No ipcRequest handler found for: ", ipcRequest);
			}
		});

	}

	public forwardMessagesFromIpcRenderer(message: FlaggedIpcMessage, replyWith: (promiseTronReply: PromiseTronReply) => void): void {

		switch (message.flag) {

			case MessageFlag.START_SYNC:
				this.handleStartSyncAndFakeSync(message, replyWith);
				break;

			case MessageFlag.LINK_STRAVA_CONNECTOR:
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

	public handleStartSyncAndFakeSync(message: FlaggedIpcMessage, replyWith: (promiseTronReply: PromiseTronReply) => void): void {

		const connectorType = <ConnectorType> message.payload[0];

		replyWith({
			success: "Started sync for connectorType: " + connectorType,
			error: null
		});

		if (this.syncingInterval) { // FAKE "current sync" stop
			clearInterval(this.syncingInterval);
			logger.warn("[MAIN]", "stop current sync !!");
		}

		// Sending fake sync events to renderer
		this.syncingInterval = setInterval(() => {
			const flaggedIpcMessage: FlaggedIpcMessage = new FlaggedIpcMessage(MessageFlag.SYNC_EVENT, new SyncEvent(SyncEventType.GENERIC, connectorType, (new Date()).toISOString()));
			this.promiseTron.send(flaggedIpcMessage).then((response: string) => {
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

	public handleLinkWithStrava(message: FlaggedIpcMessage, replyWith: (promiseTronReply: PromiseTronReply) => void): void {

		const clientId = <number> message.payload[0];
		const clientSecret = <string> message.payload[1];

		const stravaAuth = new StravaAuthentication();
		stravaAuth.authorize(clientId, clientSecret, (error, accessToken) => {
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
