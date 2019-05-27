import { IpcRequest, PromiseTron, PromiseTronReply } from "promise-tron";
import logger from "electron-log";
import { StravaAuthentication } from "../strava-authentication";
import { FlaggedIpcMessage, MessageFlag } from "@elevate/shared/electron";
import { ConnectorType, ErrorSyncEvent, StravaApiCredentials, SyncEvent } from "@elevate/shared/sync";
import { StravaConnector } from "../connectors/strava/strava.connector";
import { AthleteModel, UserSettings } from "@elevate/shared/models";
import UserSettingsModel = UserSettings.UserSettingsModel;

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
				this.handleStartSync(message, replyWith);
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

	public handleStartSync(message: FlaggedIpcMessage, replyWith: (promiseTronReply: PromiseTronReply) => void): void {

		const connectorType: ConnectorType = <ConnectorType.STRAVA> message.payload[0];

		if (connectorType === ConnectorType.STRAVA) {

			const stravaApiCredentials: StravaApiCredentials = <StravaApiCredentials> message.payload[1];
			const athleteModel: AthleteModel = <AthleteModel> message.payload[2];
			const updateSyncedActivitiesNameAndType: boolean = <boolean> message.payload[3];
			const userSettingsModel: UserSettingsModel = <UserSettingsModel> message.payload[4];

			const stravaConnector = new StravaConnector(null /*TODO*/, athleteModel, userSettingsModel, stravaApiCredentials, updateSyncedActivitiesNameAndType);
			stravaConnector.sync().subscribe((syncEvent: SyncEvent) => {
				const syncEventMessage: FlaggedIpcMessage = new FlaggedIpcMessage(MessageFlag.SYNC_EVENT, syncEvent);
				this.send(syncEventMessage).then((renderedResponse: string) => {
					logger.debug(renderedResponse);
				});

			}, (errorSyncEvent: ErrorSyncEvent) => {

				logger.error("stravaConnector -> errorSyncEvent", errorSyncEvent);

				/*
				// TODO

				const errorSyncEventMessage: FlaggedIpcMessage = new FlaggedIpcMessage(MessageFlag.SYNC_EVENT, errorSyncEvent);
				this.send(errorSyncEventMessage).then((renderedResponse: string) => {
					logger.debug(renderedResponse);
				});*/

			}, () => {

				logger.info("stravaConnector -> complete()");

				/*
				TODO
				const completeSyncEventMessage: FlaggedIpcMessage = new FlaggedIpcMessage(MessageFlag.SYNC_EVENT, new CompleteSyncEvent());
				this.send(completeSyncEventMessage).then((renderedResponse: string) => {
					logger.debug(renderedResponse);
				});*/
			});

			replyWith({
				success: "Started sync for connector type: " + connectorType,
				error: null
			});

		} else {
			throw new Error("Unknown connector. Can't start sync");
		}

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

	public send<T>(flaggedIpcMessage: FlaggedIpcMessage): Promise<T> {
		return <Promise<T>> this.promiseTron.send(flaggedIpcMessage);
	}
}
