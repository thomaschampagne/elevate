import { IpcMainMessagesService } from "./ipc-main-messages-service";
import { FlaggedIpcMessage, MessageFlag } from "@elevate/shared/electron";
import { CompleteSyncEvent, ConnectorType, ErrorSyncEvent, GenericSyncEvent, SyncEvent } from "@elevate/shared/sync";
import { StravaConnector } from "../connectors/strava/strava.connector";
import { Subject } from "rxjs";
import { FileSystemConnector } from "../connectors/filesystem/file-system.connector";
import { Service } from "../service";

describe("IpcMainMessagesService", () => {

	let ipcMainMessagesService: IpcMainMessagesService;

	beforeEach((done: Function) => {

		const ipcMain = <Electron.IpcMain> {};
		const webContents = <Electron.WebContents> {};
		ipcMainMessagesService = new IpcMainMessagesService(ipcMain, webContents);
		ipcMainMessagesService.service = new Service(); // Ensure Service instance is new between tests

		done();
	});

	describe("Forward received messages from IpcRenderer", () => {

		it("should start sync when a MessageFlag.START_SYNC is received", (done: Function) => {

			// Given
			const flaggedIpcMessage = new FlaggedIpcMessage(MessageFlag.START_SYNC, ConnectorType.STRAVA); // No need to provide extra payload to test forwardMessagesFromIpcRenderer
			const replyWith = () => {
			};

			const handleStartSyncSpy = spyOn(ipcMainMessagesService, "handleStartSync").and.stub();

			// When
			ipcMainMessagesService.forwardReceivedMessagesFromIpcRenderer(flaggedIpcMessage, replyWith);

			// Then
			expect(handleStartSyncSpy).toHaveBeenCalledTimes(1);
			done();
		});

		it("should link strava account when a MessageFlag.LINK_STRAVA_CONNECTOR is received", (done: Function) => {

			// Given
			const flaggedIpcMessage = new FlaggedIpcMessage(MessageFlag.LINK_STRAVA_CONNECTOR, ConnectorType.STRAVA); // No need to provide extra payload to test forwardMessagesFromIpcRenderer
			const replyWith = () => {
			};

			const handleLinkWithStravaSpy = spyOn(ipcMainMessagesService, "handleLinkWithStrava").and.stub();

			// When
			ipcMainMessagesService.forwardReceivedMessagesFromIpcRenderer(flaggedIpcMessage, replyWith);

			// Then
			expect(handleLinkWithStravaSpy).toHaveBeenCalledTimes(1);
			done();
		});

		it("should stop sync when MessageFlag.CANCEL_SYNC is received", (done: Function) => {

			// Given
			const flaggedIpcMessage = new FlaggedIpcMessage(MessageFlag.STOP_SYNC); // No need to provide extra payload to test forwardMessagesFromIpcRenderer
			const replyWith = () => {
			};

			const handleLinkWithStravaSpy = spyOn(ipcMainMessagesService, "handleStopSync").and.stub();

			// When
			ipcMainMessagesService.forwardReceivedMessagesFromIpcRenderer(flaggedIpcMessage, replyWith);

			// Then
			expect(handleLinkWithStravaSpy).toHaveBeenCalledTimes(1);
			done();
		});

		it("should handle unknown MessageFlag received", (done: Function) => {

			// Given
			const fakeFlag = -1;
			const flaggedIpcMessage = new FlaggedIpcMessage(fakeFlag);
			const replyWith = {
				callback: () => {
				},
				args: {
					success: null,
					error: "Unknown message received by IpcMain. FlaggedIpcMessage: " + JSON.stringify(flaggedIpcMessage)
				}
			};
			const replyWithCallbackSpy = spyOn(replyWith, "callback").and.stub();

			// When
			ipcMainMessagesService.forwardReceivedMessagesFromIpcRenderer(flaggedIpcMessage, replyWith.callback);

			// Then
			expect(replyWithCallbackSpy).toBeCalledWith(replyWith.args);
			done();
		});

	});

	describe("Handle start sync", () => {

		it("should start strava sync", (done: Function) => {

			// Given
			const athleteModel = null;
			const updateSyncedActivitiesNameAndType = true;
			const stravaApiCredentials = null;
			const userSettingsModel = null;
			const flaggedIpcMessage = new FlaggedIpcMessage(MessageFlag.START_SYNC, ConnectorType.STRAVA, athleteModel, userSettingsModel,
				stravaApiCredentials, updateSyncedActivitiesNameAndType);
			const replyWith = {
				callback: () => {
				},
				args: {
					success: "Started sync of connector " + ConnectorType.STRAVA,
					error: null
				}
			};
			const stravaConnectorSyncCalls = 1;

			const stravaConnectorMock = StravaConnector.create(athleteModel, userSettingsModel, stravaApiCredentials, updateSyncedActivitiesNameAndType);
			const createStravaConnectorSpy = spyOn(StravaConnector, "create").and.returnValue(stravaConnectorMock);
			const stravaConnectorSyncSpy = spyOn(stravaConnectorMock, "sync").and.returnValue(new Subject<SyncEvent>());
			const replyWithCallbackSpy = spyOn(replyWith, "callback").and.stub();


			// When
			ipcMainMessagesService.handleStartSync(flaggedIpcMessage, replyWith.callback);

			// Then
			expect(createStravaConnectorSpy).toBeCalled();
			expect(ipcMainMessagesService.service.currentConnector).not.toBeNull();
			expect(stravaConnectorSyncSpy).toBeCalledTimes(stravaConnectorSyncCalls);
			expect(replyWithCallbackSpy).toBeCalledWith(replyWith.args);

			done();
		});

		it("should not start a sync already running", (done: Function) => {

			// Given
			ipcMainMessagesService.service.currentConnector = FileSystemConnector.create(null, null, null, null, null);
			ipcMainMessagesService.service.currentConnector.isSyncing = true;
			const syncSpy = spyOn(ipcMainMessagesService.service.currentConnector, "sync").and.stub();

			const replyWith = {
				callback: () => {
				},
				args: {
					success: null,
					error: "Impossible to start a new sync. Another sync is already running on connector " + ConnectorType.FILE_SYSTEM
				}
			};
			const replyWithCallbackSpy = spyOn(replyWith, "callback").and.stub();

			const flaggedIpcMessage = new FlaggedIpcMessage(MessageFlag.START_SYNC, ConnectorType.STRAVA, null, null, null, null);

			// When
			ipcMainMessagesService.handleStartSync(flaggedIpcMessage, replyWith.callback);

			// Then
			expect(ipcMainMessagesService.service.currentConnector).not.toBeNull();
			expect(replyWithCallbackSpy).toBeCalledWith(replyWith.args);
			expect(syncSpy).not.toBeCalled();

			done();
		});

		it("should send sync events (inc sync 'non-stop' errors) to IpcRenderer", (done: Function) => {

			// Given
			const athleteModel = null;
			const updateSyncedActivitiesNameAndType = true;
			const stravaApiCredentials = null;
			const userSettingsModel = null;
			const flaggedIpcMessage = new FlaggedIpcMessage(MessageFlag.START_SYNC, ConnectorType.STRAVA, athleteModel, userSettingsModel,
				stravaApiCredentials, updateSyncedActivitiesNameAndType);

			const syncEvent$ = new Subject<SyncEvent>();
			const fakeGenericSyncEvent = new GenericSyncEvent(ConnectorType.STRAVA, "Fake event");
			const expectedFlaggedMessageSent = new FlaggedIpcMessage(MessageFlag.SYNC_EVENT, fakeGenericSyncEvent);
			const replyWith = {
				callback: () => {
				},
				args: {
					success: "Started sync of connector " + ConnectorType.STRAVA,
					error: null
				}
			};
			const stravaConnectorSyncCalls = 1;
			const stravaConnectorMock = StravaConnector.create(athleteModel, userSettingsModel, stravaApiCredentials, updateSyncedActivitiesNameAndType);
			const createStravaConnectorSpy = spyOn(StravaConnector, "create").and.returnValue(stravaConnectorMock);
			const stravaConnectorSyncSpy = spyOn(stravaConnectorMock, "sync").and.returnValue(syncEvent$);
			const sendMessageSpy = spyOn(ipcMainMessagesService, "send").and.returnValue(Promise.resolve("Message received by IpcMain"));
			const replyWithCallbackSpy = spyOn(replyWith, "callback").and.stub();

			// When
			ipcMainMessagesService.handleStartSync(flaggedIpcMessage, replyWith.callback);
			syncEvent$.next(fakeGenericSyncEvent);

			// Then
			expect(createStravaConnectorSpy).toBeCalled();
			expect(ipcMainMessagesService.service.currentConnector).not.toBeNull();
			expect(stravaConnectorSyncSpy).toBeCalledTimes(stravaConnectorSyncCalls);
			expect(replyWithCallbackSpy).toBeCalledWith(replyWith.args);
			expect(sendMessageSpy).toBeCalledWith(expectedFlaggedMessageSent);
			done();

		});

		it("should send error sync events raised (sync 'stop' errors) to IpcRenderer", (done: Function) => {

			// Given
			const athleteModel = null;
			const updateSyncedActivitiesNameAndType = true;
			const stravaApiCredentials = null;
			const userSettingsModel = null;
			const flaggedIpcMessage = new FlaggedIpcMessage(MessageFlag.START_SYNC, ConnectorType.STRAVA, athleteModel, userSettingsModel,
				stravaApiCredentials, updateSyncedActivitiesNameAndType);

			const syncEvent$ = new Subject<SyncEvent>();
			const fakeErrorSyncEvent = new ErrorSyncEvent(ConnectorType.STRAVA, {
				code: "fake_code",
				description: "fake_desc",
				stacktrace: "fake_stack"
			});
			const expectedFlaggedMessageSent = new FlaggedIpcMessage(MessageFlag.SYNC_EVENT, fakeErrorSyncEvent);
			const replyWith = {
				callback: () => {
				},
				args: {
					success: "Started sync of connector " + ConnectorType.STRAVA,
					error: null
				}
			};
			const stravaConnectorSyncCalls = 1;
			const stravaConnectorMock = StravaConnector.create(athleteModel, userSettingsModel, stravaApiCredentials, updateSyncedActivitiesNameAndType);
			const createStravaConnectorSpy = spyOn(StravaConnector, "create").and.returnValue(stravaConnectorMock);
			const stravaConnectorSyncSpy = spyOn(stravaConnectorMock, "sync").and.returnValue(syncEvent$);
			const sendMessageSpy = spyOn(ipcMainMessagesService, "send").and.returnValue(Promise.resolve("Message received by IpcMain"));
			const replyWithCallbackSpy = spyOn(replyWith, "callback").and.stub();

			// When
			ipcMainMessagesService.handleStartSync(flaggedIpcMessage, replyWith.callback);
			syncEvent$.error(fakeErrorSyncEvent);

			// Then
			expect(createStravaConnectorSpy).toBeCalled();
			expect(stravaConnectorSyncSpy).toBeCalledTimes(stravaConnectorSyncCalls);
			expect(replyWithCallbackSpy).toBeCalledWith(replyWith.args);
			expect(sendMessageSpy).toBeCalledWith(expectedFlaggedMessageSent);

			syncEvent$.subscribe(() => {
				throw new Error("Test fail!");
			}, error => {
				expect(error).toEqual(fakeErrorSyncEvent);
				expect(ipcMainMessagesService.service.currentConnector).toBeNull();
				done();
			}, () => {
				throw new Error("Test fail!");
			});

		});

		it("should send complete sync events to IpcRenderer", (done: Function) => {

			// Given
			const athleteModel = null;
			const updateSyncedActivitiesNameAndType = true;
			const stravaApiCredentials = null;
			const userSettingsModel = null;
			const flaggedIpcMessage = new FlaggedIpcMessage(MessageFlag.START_SYNC, ConnectorType.STRAVA, athleteModel, userSettingsModel,
				stravaApiCredentials, updateSyncedActivitiesNameAndType);

			const syncEvent$ = new Subject<SyncEvent>();
			const fakeCompleteSyncEvent = new CompleteSyncEvent(ConnectorType.STRAVA, "Sync done");
			const expectedFlaggedMessageSent = new FlaggedIpcMessage(MessageFlag.SYNC_EVENT, fakeCompleteSyncEvent);
			const replyWith = {
				callback: () => {
				},
				args: {
					success: "Started sync of connector " + ConnectorType.STRAVA,
					error: null
				}
			};
			const stravaConnectorSyncCalls = 1;
			const stravaConnectorMock = StravaConnector.create(athleteModel, userSettingsModel, stravaApiCredentials, updateSyncedActivitiesNameAndType);
			const createStravaConnectorSpy = spyOn(StravaConnector, "create").and.returnValue(stravaConnectorMock);
			const stravaConnectorSyncSpy = spyOn(stravaConnectorMock, "sync").and.returnValue(syncEvent$);
			const sendMessageSpy = spyOn(ipcMainMessagesService, "send").and.returnValue(Promise.resolve("Message received by IpcMain"));
			const replyWithCallbackSpy = spyOn(replyWith, "callback").and.stub();

			// When
			ipcMainMessagesService.handleStartSync(flaggedIpcMessage, replyWith.callback);
			syncEvent$.complete();

			// Then
			expect(createStravaConnectorSpy).toBeCalled();
			expect(stravaConnectorSyncSpy).toBeCalledTimes(stravaConnectorSyncCalls);
			expect(replyWithCallbackSpy).toBeCalledWith(replyWith.args);
			expect(sendMessageSpy).toBeCalledWith(expectedFlaggedMessageSent);

			syncEvent$.subscribe(() => {
				throw new Error("Test fail!");
			}, () => {
				throw new Error("Test fail!");
			}, () => {
				expect(ipcMainMessagesService.service.currentConnector).toBeNull();
				done();
			});

		});

	});

	describe("Handle sync stop", () => {

		it("should stop current sync", (done: Function) => {

			// Given
			const flaggedIpcMessage = new FlaggedIpcMessage(MessageFlag.STOP_SYNC, ConnectorType.STRAVA);
			const replyWith = () => {
			};
			const connector = StravaConnector.create(null, null, null, null);
			jest.spyOn(ipcMainMessagesService.service, "currentConnector", "get").mockReturnValue(connector);
			const stopConnectorSyncSpy = spyOn(connector, "stop").and.returnValue(Promise.resolve());

			// When
			ipcMainMessagesService.handleStopSync(flaggedIpcMessage, replyWith);

			// Then
			expect(stopConnectorSyncSpy).toBeCalledTimes(1);
			done();
		});

		it("should not stop sync if no connector is mapped to service", (done: Function) => {

			// Given
			const flaggedIpcMessage = new FlaggedIpcMessage(MessageFlag.STOP_SYNC, ConnectorType.STRAVA);
			const replyWith = {
				callback: () => {
				},
				args: {
					success: null,
					error: "No existing connector found to stop sync"
				}
			};

			const connector = StravaConnector.create(null, null, null, null);
			jest.spyOn(ipcMainMessagesService.service, "currentConnector", "get").mockReturnValue(null);
			const stopConnectorSyncSpy = spyOn(connector, "stop").and.stub();
			const replyWithCallbackSpy = spyOn(replyWith, "callback").and.stub();

			// When
			ipcMainMessagesService.handleStopSync(flaggedIpcMessage, replyWith.callback);

			// Then
			expect(stopConnectorSyncSpy).not.toBeCalled();
			expect(replyWithCallbackSpy).toBeCalledWith(replyWith.args);

			done();
		});

		it("should not stop sync of a given connector if current connector syncing has different type", (done: Function) => {

			// Given
			const requestConnectorType = ConnectorType.STRAVA;
			const flaggedIpcMessage = new FlaggedIpcMessage(MessageFlag.STOP_SYNC, requestConnectorType);
			const replyWith = {
				callback: () => {
				},
				args: {
					success: null,
					error: `Trying to stop a sync on ${requestConnectorType} connector but current connector synced type is: ${ConnectorType.FILE_SYSTEM}`
				}
			};

			const connector = FileSystemConnector.create(null, null, null, null, null);
			jest.spyOn(ipcMainMessagesService.service, "currentConnector", "get").mockReturnValue(connector);
			const stopConnectorSyncSpy = spyOn(connector, "stop").and.stub();
			const replyWithCallbackSpy = spyOn(replyWith, "callback").and.stub();

			// When
			ipcMainMessagesService.handleStopSync(flaggedIpcMessage, replyWith.callback);

			// Then
			expect(stopConnectorSyncSpy).not.toBeCalled();
			expect(replyWithCallbackSpy).toBeCalledWith(replyWith.args);

			done();
		});

	});
});
