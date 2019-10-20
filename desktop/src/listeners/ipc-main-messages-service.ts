import { IpcRequest, PromiseTron, PromiseTronReply } from "promise-tron";
import logger from "electron-log";
import { StravaAuthenticator } from "../connectors/strava/strava-authenticator";
import { FlaggedIpcMessage, MessageFlag } from "@elevate/shared/electron";
import {
	ActivitySyncEvent,
	CompleteSyncEvent,
	ConnectorType,
	ErrorSyncEvent,
	StravaApiCredentials,
	SyncEvent,
	SyncEventType
} from "@elevate/shared/sync";
import { StravaConnector } from "../connectors/strava/strava.connector";
import { AthleteModel, ConnectorSyncDateTime, UserSettings } from "@elevate/shared/models";
import { Service } from "../service";
import * as _ from "lodash";
import UserSettingsModel = UserSettings.UserSettingsModel;

export class IpcMainMessagesService {

	public promiseTron: PromiseTron;
	public service: Service;

	constructor(public ipcMain: Electron.IpcMain,
				public webContents: Electron.WebContents) {
		this.promiseTron = new PromiseTron(ipcMain, webContents);
		this.service = Service.instance();
	}

	public listen(): void {

		this.promiseTron.on((ipcRequest: IpcRequest, replyWith: (promiseTronReply: PromiseTronReply) => void) => {

			const flaggedIpcMessage = IpcRequest.extractData<FlaggedIpcMessage>(ipcRequest);

			if (flaggedIpcMessage) {
				this.forwardReceivedMessagesFromIpcRenderer(flaggedIpcMessage, replyWith);
			} else {
				logger.error("[MAIN] No ipcRequest handler found for: ", ipcRequest);
			}
		});

	}

	public forwardReceivedMessagesFromIpcRenderer(message: FlaggedIpcMessage, replyWith: (promiseTronReply: PromiseTronReply) => void): void {

		switch (message.flag) {

			case MessageFlag.START_SYNC:
				this.handleStartSync(message, replyWith);
				break;

			case MessageFlag.STOP_SYNC:
				this.handleStopSync(message, replyWith);
				break;

			case MessageFlag.LINK_STRAVA_CONNECTOR:
				this.handleLinkWithStrava(message, replyWith);
				break;

			default:
				this.handleUnknownMessage(message, replyWith);
				break;

		}
	}

	public handleStartSync(message: FlaggedIpcMessage, replyWith: (promiseTronReply: PromiseTronReply) => void): void {

		if (this.service.currentConnector && this.service.currentConnector.isSyncing) {
			replyWith({
				success: null,
				error: `Impossible to start a new sync. Another sync is already running on connector ${this.service.currentConnector.type}`
			});
			return;
		}

		const connectorType: ConnectorType = <ConnectorType> message.payload[0];

		if (connectorType === ConnectorType.STRAVA) {

			const stravaConnectorSyncDateTime: ConnectorSyncDateTime = <ConnectorSyncDateTime> message.payload[1];
			const stravaApiCredentials: StravaApiCredentials = <StravaApiCredentials> message.payload[2];
			const athleteModel: AthleteModel = <AthleteModel> message.payload[3];
			const updateSyncedActivitiesNameAndType: boolean = <boolean> message.payload[4];
			const userSettingsModel: UserSettingsModel = <UserSettingsModel> message.payload[5];

			this.service.currentConnector = StravaConnector.create(athleteModel, userSettingsModel, stravaConnectorSyncDateTime, stravaApiCredentials,
				updateSyncedActivitiesNameAndType);

		} else if (connectorType === ConnectorType.FILE_SYSTEM) {

			throw new Error("To be done");

		} else {

			const errorMessage = `Unknown connector ${connectorType}. Can't start sync`;
			logger.error(errorMessage);
			replyWith({
				success: null,
				error: errorMessage
			});
			return;
		}

		this.service.currentConnector.sync().subscribe((syncEvent: SyncEvent) => {
			const syncEventMessage: FlaggedIpcMessage = new FlaggedIpcMessage(MessageFlag.SYNC_EVENT, syncEvent);
			this.send(syncEventMessage).then((renderedResponse: string) => {
				logger.debug(renderedResponse);
			});

			if (syncEvent.type === SyncEventType.ACTIVITY) {
				const activitySyncEvent = <ActivitySyncEvent> syncEvent;
				logger.info("[Connector (" + connectorType + ")]", `Notify to insert or update activity name: "${activitySyncEvent.activity.name}", started on "${activitySyncEvent.activity.start_time}", isNew: "${activitySyncEvent.isNew}"`);
			} else {
				logger.debug("[Connector (" + connectorType + ")]", syncEvent);
			}

		}, (errorSyncEvent: ErrorSyncEvent) => {

			logger.error("[Connector (" + connectorType + ")]", errorSyncEvent);

			this.service.currentConnector = null;

			const errorSyncEventMessage: FlaggedIpcMessage = new FlaggedIpcMessage(MessageFlag.SYNC_EVENT, errorSyncEvent);
			this.send(errorSyncEventMessage).then((renderedResponse: string) => {
				logger.debug(renderedResponse);
			});

		}, () => {

			logger.info("[Connector (" + connectorType + ")]", "Sync done");

			this.service.currentConnector = null;

			const completeSyncEventMessage: FlaggedIpcMessage = new FlaggedIpcMessage(MessageFlag.SYNC_EVENT,
				new CompleteSyncEvent(ConnectorType.STRAVA, "Sync done"));
			this.send(completeSyncEventMessage).then((renderedResponse: string) => {
				logger.debug(renderedResponse);
			});
		});

		replyWith({
			success: "Started sync of connector " + connectorType,
			error: null
		});

	}

	public handleStopSync(message: FlaggedIpcMessage, replyWith: (promiseTronReply: PromiseTronReply) => void): void {

		const requestConnectorType = <ConnectorType> message.payload[0];

		const currentConnector = this.service.currentConnector;

		if (_.isEmpty(currentConnector)) {

			const errorMessage = "No existing connector found to stop sync";

			replyWith({
				success: null,
				error: errorMessage
			});

			logger.error(errorMessage);

		} else {

			if (currentConnector.type === requestConnectorType) {

				currentConnector.stop().then(() => {

					const successMessage = "Sync of connector '" + requestConnectorType + "' has been cancelled";
					replyWith({
						success: successMessage,
						error: null
					});

					logger.info(successMessage);

				}, error => {

					replyWith({
						success: null,
						error: error
					});

					logger.error(error);
				});

			} else {
				replyWith({
					success: null,
					error: `Trying to stop a sync on ${requestConnectorType} connector but current connector synced type is: ${currentConnector.type}`
				});
			}

		}
	}

	public handleLinkWithStrava(message: FlaggedIpcMessage, replyWith: (promiseTronReply: PromiseTronReply) => void): void {

		const clientId = <number> message.payload[0];
		const clientSecret = <string> message.payload[1];
		const refreshToken = <string> ((message.payload[2]) ? message.payload[2] : null);

		const stravaAuth = new StravaAuthenticator();

		let promise: Promise<{ accessToken: string, refreshToken: string, expiresAt: number }>;

		if (refreshToken) {
			promise = stravaAuth.refresh(clientId, clientSecret, refreshToken);
		} else {
			promise = stravaAuth.authorize(clientId, clientSecret);
		}

		promise.then((result: { accessToken: string, refreshToken: string, expiresAt: number, athlete: object }) => {

			replyWith({
				success: {
					accessToken: result.accessToken,
					refreshToken: result.refreshToken,
					expiresAt: result.expiresAt,
					athlete: result.athlete
				},
				error: null
			});

		}, error => {
			replyWith({
				success: null,
				error: error
			});
			logger.error(error);
		});

	}

	public handleUnknownMessage(message: FlaggedIpcMessage, replyWith: (promiseTronReply: PromiseTronReply) => void): void {
		const errorMessage = "Unknown message received by IpcMain. FlaggedIpcMessage: " + JSON.stringify(message);
		logger.error(errorMessage);
		replyWith({
			success: null,
			error: errorMessage
		});
	}

	public send<T>(flaggedIpcMessage: FlaggedIpcMessage): Promise<T> {
		return <Promise<T>> this.promiseTron.send(flaggedIpcMessage);
	}
}
