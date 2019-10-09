import { TestBed } from "@angular/core/testing";
import { CoreModule } from "../../../../core/core.module";
import { SharedModule } from "../../../shared.module";
import { DesktopModule } from "../../../modules/desktop.module";
import { DesktopSyncService } from "./desktop-sync.service";
import {
	ActivitySyncEvent,
	CompleteSyncEvent,
	ConnectorType,
	ErrorSyncEvent,
	GenericSyncEvent,
	StartedSyncEvent,
	StoppedSyncEvent,
	SyncEvent
} from "@elevate/shared/sync";
import { AthleteModel, SyncedActivityModel } from "@elevate/shared/models";
import { ElectronService, ElectronWindow } from "../../electron/electron.service";
import { FlaggedIpcMessage, MessageFlag } from "@elevate/shared/electron";
import { Subject } from "rxjs";
import { SyncException } from "@elevate/shared/exceptions";
import { Gzip } from "@elevate/shared/tools/gzip";
import * as moment from "moment";
import { TEST_SYNCED_ACTIVITIES } from "../../../../../shared-fixtures/activities-2015.fixture";
import { SyncState } from "../sync-state.enum";
import { ConnectorSyncDateTime } from "../../../../../../modules/shared/models/sync/connector-sync-date-time.model";
import { DesktopDumpModel } from "../../../models/dumps/desktop-dump.model";
import { StravaCredentialsUpdateSyncEvent } from "../../../../../../modules/shared/sync/events";
import { StravaApiCredentials } from "../../../../../../modules/shared/sync/strava";

describe("DesktopSyncService", () => {

	let desktopSyncService: DesktopSyncService;

	beforeEach((done: Function) => {

		TestBed.configureTestingModule({
			imports: [
				CoreModule,
				SharedModule,
				DesktopModule
			],
			providers: [
				DesktopSyncService,
			]
		});

		const electronService: ElectronService = TestBed.get(ElectronService);
		electronService.instance = <Electron.RendererInterface> {
			ipcRenderer: {}
		};

		const electronWindow = (window as ElectronWindow);
		const electronRequire = (module: string) => {
			console.log("Loading module: " + module);
			return {} as Electron.RendererInterface;
		};
		electronWindow.require = electronRequire;
		spyOn(electronWindow, "require").and.callFake(electronRequire);


		desktopSyncService = TestBed.get(DesktopSyncService);
		done();

	});

	it("should be created", (done: Function) => {
		expect(desktopSyncService).toBeTruthy();
		done();
	});

	describe("Handle sync", () => {

		it("should start strava sync", (done: Function) => {

			// Given
			const connectorType = ConnectorType.STRAVA;
			const listenSyncEventsSpy = spyOn(desktopSyncService.messageListenerService, "listen").and.stub();
			const fetchAthleteModelSpy = spyOn(desktopSyncService.athleteService, "fetch")
				.and.returnValue(Promise.resolve(AthleteModel.DEFAULT_MODEL));
			const fetchUserSettingsSpy = spyOn(desktopSyncService.userSettingsService, "fetch").and.returnValue(null);
			const fetchStravaApiCredentialsSpy = spyOn(desktopSyncService.stravaApiCredentialsService, "fetch").and.returnValue(null);
			const sendStartSyncSpy = spyOn(desktopSyncService.messageListenerService, "send").and.returnValue(Promise.resolve("Started"));

			// When
			const promiseStart = desktopSyncService.sync(false, false, connectorType);

			// Then
			promiseStart.then(() => {

				expect(desktopSyncService.currentConnectorType).toEqual(connectorType);
				expect(desktopSyncService.syncSubscription).toBeDefined();
				expect(listenSyncEventsSpy).toHaveBeenCalledTimes(1);
				expect(fetchAthleteModelSpy).toHaveBeenCalledTimes(1);
				expect(fetchUserSettingsSpy).toHaveBeenCalledTimes(1);
				expect(fetchStravaApiCredentialsSpy).toHaveBeenCalledTimes(1);
				expect(sendStartSyncSpy).toHaveBeenCalledTimes(1);
				done();

			}, error => {

				throw new Error("Should not be here!" + JSON.stringify(error));

			});
		});

		it("should start a sync and handle sync events", (done: Function) => {

			// Given
			const connectorType = ConnectorType.STRAVA;
			spyOn(desktopSyncService.messageListenerService, "listen").and.stub();
			spyOn(desktopSyncService.athleteService, "fetch").and.returnValue(Promise.resolve(AthleteModel.DEFAULT_MODEL));
			spyOn(desktopSyncService.userSettingsService, "fetch").and.returnValue(null);
			spyOn(desktopSyncService.stravaApiCredentialsService, "fetch").and.returnValue(null);
			spyOn(desktopSyncService.messageListenerService, "send").and.returnValue(Promise.resolve("Started"));
			const handleSyncEventsSpy = spyOn(desktopSyncService, "handleSyncEvents").and.stub();
			const genericSyncEvent = new GenericSyncEvent(desktopSyncService.currentConnectorType);

			// When sync started send a generic sync event
			const promiseStart = desktopSyncService.sync(false, false, connectorType);
			promiseStart.then(() => {

				setTimeout(() => desktopSyncService.messageListenerService.syncEvents$.next(genericSyncEvent));

				// Then
				desktopSyncService.messageListenerService.syncEvents$.subscribe(syncEvent => {
					expect(syncEvent).toEqual(genericSyncEvent);
					expect(handleSyncEventsSpy).toHaveBeenCalledWith(desktopSyncService.syncEvents$, genericSyncEvent);
					done();
				}, error => {
					throw new Error("Should not be here!" + JSON.stringify(error));
				});

			}, error => {
				throw new Error("Should not be here!" + JSON.stringify(error));
			});
		});

		it("should not start a sync", (done: Function) => {

			// Given
			const errorMessage = "Failed to start";
			const connectorType = ConnectorType.STRAVA;
			const listenSyncEventsSpy = spyOn(desktopSyncService.messageListenerService, "listen").and.stub();
			const fetchAthleteModelSpy = spyOn(desktopSyncService.athleteService, "fetch")
				.and.returnValue(Promise.resolve(AthleteModel.DEFAULT_MODEL));
			const fetchUserSettingsSpy = spyOn(desktopSyncService.userSettingsService, "fetch").and.returnValue(null);
			const fetchStravaApiCredentialsSpy = spyOn(desktopSyncService.stravaApiCredentialsService, "fetch").and.returnValue(null);
			const sendStartSyncSpy = spyOn(desktopSyncService.messageListenerService, "send").and.returnValue(Promise.reject(errorMessage));

			// When
			const promiseStart = desktopSyncService.sync(false, false, connectorType);

			// Then
			promiseStart.then(() => {

				throw new Error("Should not be here!");

			}, error => {

				expect(error).toEqual(errorMessage);
				expect(desktopSyncService.currentConnectorType).toEqual(connectorType);
				expect(desktopSyncService.syncSubscription).toBeDefined();
				expect(listenSyncEventsSpy).toHaveBeenCalledTimes(1);
				expect(fetchAthleteModelSpy).toHaveBeenCalledTimes(1);
				expect(fetchUserSettingsSpy).toHaveBeenCalledTimes(1);
				expect(fetchStravaApiCredentialsSpy).toHaveBeenCalledTimes(1);
				expect(sendStartSyncSpy).toHaveBeenCalledTimes(1);
				done();
			});
		});

	});

	describe("Handle activity upsert", () => {

		beforeEach((done: Function) => {
			desktopSyncService.currentConnectorType = ConnectorType.FILE_SYSTEM;
			done();
		});

		it("should upsert an incoming activity", (done: Function) => {

			// Given
			const syncEvent$ = new Subject<SyncEvent>();
			const isNew = true;
			const activity = new SyncedActivityModel();
			activity.name = "No pain no gain";
			activity.start_time = (new Date()).toISOString();
			const activitySyncEvent = new ActivitySyncEvent(ConnectorType.FILE_SYSTEM, null, activity, isNew);
			const activityServicePutSpy = spyOn(desktopSyncService.activityService, "put").and.returnValue(Promise.resolve(activity));
			const stopSpy = spyOn(desktopSyncService, "stop").and.returnValue(Promise.resolve());

			// When
			setTimeout(() => desktopSyncService.handleActivityUpsert(syncEvent$, activitySyncEvent));

			// Then
			syncEvent$.subscribe(() => {
				expect(activityServicePutSpy).toHaveBeenCalledWith(activity);
				expect(stopSpy).not.toHaveBeenCalled();
				done();

			}, error => {
				throw new Error("Should not be here!" + JSON.stringify(error));
			});
		});

		it("should not upsert an incoming activity, stop the sync properly and throw the upsert exception", (done: Function) => {

			// Given
			const syncEvent$ = new Subject<SyncEvent>();
			const isNew = true;
			const activity = new SyncedActivityModel();
			activity.name = "No pain no gain";
			activity.start_time = (new Date()).toISOString();
			const expectedErrorSyncEvent = ErrorSyncEvent.SYNC_ERROR_UPSERT_ACTIVITY_DATABASE.create(ConnectorType.STRAVA, activity);
			const activitySyncEvent = new ActivitySyncEvent(ConnectorType.FILE_SYSTEM, null, activity, isNew);
			const expectedPutError = "Database put error";
			const activityServicePutSpy = spyOn(desktopSyncService.activityService, "put").and.returnValue(Promise.reject(expectedPutError));
			const syncEventNextSpy = spyOn(syncEvent$, "next").and.callThrough();
			const stopSpy = spyOn(desktopSyncService, "stop").and.returnValue(Promise.resolve());
			const throwSyncErrorSpy = spyOn(desktopSyncService, "throwSyncError").and.stub();

			// When
			setTimeout(() => desktopSyncService.handleActivityUpsert(syncEvent$, activitySyncEvent));

			// Then
			syncEvent$.subscribe((syncEvent: ErrorSyncEvent) => {
				expect(activityServicePutSpy).toHaveBeenCalledWith(activity);
				expect(syncEventNextSpy).toHaveBeenCalledTimes(1);
				expect(syncEvent.type).toEqual(expectedErrorSyncEvent.type);
				expect(syncEvent.code).toEqual(expectedErrorSyncEvent.code);
				expect(syncEvent.activity.name).toEqual(expectedErrorSyncEvent.activity.name);
				expect(syncEvent.activity.start_time).toEqual(expectedErrorSyncEvent.activity.start_time);
				expect(stopSpy).toHaveBeenCalledTimes(1);

				setTimeout(() => {
					expect(throwSyncErrorSpy).toHaveBeenCalledTimes(1);
					expect(throwSyncErrorSpy).toHaveBeenCalledWith([expectedPutError]);
					done();
				});

			}, error => {
				throw new Error("Should not be here!" + JSON.stringify(error));
			});

		});

		it("should not upsert an incoming activity, stop the sync with error and throw the upsert & stop exceptions", (done: Function) => {

			// Given
			const syncEvent$ = new Subject<SyncEvent>();
			const isNew = true;
			const activity = new SyncedActivityModel();
			activity.name = "No pain no gain";
			activity.start_time = (new Date()).toISOString();
			const expectedErrorSyncEvent = ErrorSyncEvent.SYNC_ERROR_UPSERT_ACTIVITY_DATABASE.create(ConnectorType.STRAVA, activity);
			const activitySyncEvent = new ActivitySyncEvent(ConnectorType.FILE_SYSTEM, null, activity, isNew);
			const expectedPutError = "Database put error";
			const activityServicePutSpy = spyOn(desktopSyncService.activityService, "put").and.returnValue(Promise.reject(expectedPutError));
			const syncEventNextSpy = spyOn(syncEvent$, "next").and.callThrough();
			const expectedStopError = "Unable to stop sync";
			const stopSpy = spyOn(desktopSyncService, "stop").and.returnValue(Promise.reject(expectedStopError));
			const throwSyncErrorSpy = spyOn(desktopSyncService, "throwSyncError").and.stub();

			// When
			setTimeout(() => desktopSyncService.handleActivityUpsert(syncEvent$, activitySyncEvent));

			// Then
			syncEvent$.subscribe((syncEvent: ErrorSyncEvent) => {
				expect(activityServicePutSpy).toHaveBeenCalledWith(activity);
				expect(syncEventNextSpy).toHaveBeenCalledTimes(1);
				expect(syncEvent.type).toEqual(expectedErrorSyncEvent.type);
				expect(syncEvent.code).toEqual(expectedErrorSyncEvent.code);
				expect(syncEvent.activity.name).toEqual(expectedErrorSyncEvent.activity.name);
				expect(syncEvent.activity.start_time).toEqual(expectedErrorSyncEvent.activity.start_time);
				expect(stopSpy).toHaveBeenCalledTimes(1);

				setTimeout(() => {
					expect(throwSyncErrorSpy).toHaveBeenCalledTimes(1);
					expect(throwSyncErrorSpy).toHaveBeenCalledWith([expectedPutError, expectedStopError]);
					done();
				});

			}, error => {
				throw new Error("Should not be here!" + JSON.stringify(error));
			});

		});

	});

	describe("Handle sync complete", () => {

		beforeEach((done: Function) => {
			desktopSyncService.currentConnectorType = ConnectorType.STRAVA;
			done();
		});

		it("should complete a first sync of a connector", (done: Function) => {

			// Given
			const syncEvent$ = new Subject<SyncEvent>();
			const connectorType = ConnectorType.STRAVA;
			const completeSyncEvent = new CompleteSyncEvent(connectorType);
			// const connectorSyncDateTime = new ConnectorSyncDateTime(connectorType, oldDateTime);
			const getConnectorSyncDateTimeByIdSpy = spyOn(desktopSyncService.connectorSyncDateTimeDao, "getById")
				.and.returnValue(Promise.resolve(null));
			// const updateToNowSpy = spyOn(connectorSyncDateTime, "updateToNow").and.callThrough();
			const upsertSyncDateTimesSpy = spyOn(desktopSyncService, "upsertConnectorsSyncDateTimes").and.returnValue(Promise.resolve());

			// When
			setTimeout(() => desktopSyncService.handleSyncCompleteEvents(syncEvent$, completeSyncEvent));

			// Then
			syncEvent$.subscribe(() => {
				expect(getConnectorSyncDateTimeByIdSpy).toHaveBeenCalledWith(connectorType);
				const createdConnectorSyncDateTime: ConnectorSyncDateTime = upsertSyncDateTimesSpy.calls.mostRecent().args[0][0];
				expect(createdConnectorSyncDateTime.connectorType).toEqual(connectorType);
				done();

			}, error => {
				throw new Error("Should not be here!" + JSON.stringify(error));
			});
		});

		it("should complete sync of a already synced connector", (done: Function) => {

			// Given
			const syncEvent$ = new Subject<SyncEvent>();
			const oldDateTime = 999;
			const connectorType = ConnectorType.STRAVA;
			const completeSyncEvent = new CompleteSyncEvent(connectorType);
			const connectorSyncDateTime = new ConnectorSyncDateTime(connectorType, oldDateTime);
			const getConnectorSyncDateTimeByIdSpy = spyOn(desktopSyncService.connectorSyncDateTimeDao, "getById")
				.and.returnValue(Promise.resolve(connectorSyncDateTime));
			const updateToNowSpy = spyOn(connectorSyncDateTime, "updateToNow").and.callThrough();
			const upsertSyncDateTimesSpy = spyOn(desktopSyncService, "upsertConnectorsSyncDateTimes").and.returnValue(Promise.resolve());

			// When
			setTimeout(() => desktopSyncService.handleSyncCompleteEvents(syncEvent$, completeSyncEvent));

			// Then
			syncEvent$.subscribe(() => {
				expect(connectorSyncDateTime.dateTime).toBeGreaterThan(oldDateTime);
				expect(getConnectorSyncDateTimeByIdSpy).toHaveBeenCalledWith(connectorType);
				expect(updateToNowSpy).toHaveBeenCalledTimes(1);
				expect(upsertSyncDateTimesSpy).toHaveBeenCalledWith([connectorSyncDateTime]);
				done();

			}, error => {
				throw new Error("Should not be here!" + JSON.stringify(error));
			});
		});

	});

	describe("Handle sync stop", () => {

		it("should trigger sync stop", (done: Function) => {

			// Given
			const sendSpy = spyOn(desktopSyncService.messageListenerService, "send")
				.and.returnValue(Promise.resolve("Stopped from main"));
			const connectorType = ConnectorType.FILE_SYSTEM;
			desktopSyncService.currentConnectorType = connectorType;
			const flaggedIpcMessage = new FlaggedIpcMessage(MessageFlag.STOP_SYNC, connectorType);

			// When
			const promise = desktopSyncService.stop();

			// Then
			promise.then(() => {
				expect(sendSpy).toHaveBeenCalledTimes(1);
				expect(sendSpy).toHaveBeenCalledWith(flaggedIpcMessage);
				done();

			}, () => {
				throw new Error("Should not be here!");
			});
		});

		it("should reject sync stop", (done: Function) => {

			// Given
			const sendSpy = spyOn(desktopSyncService.messageListenerService, "send")
				.and.returnValue(Promise.reject("Unable to stop sync"));
			const connectorType = ConnectorType.FILE_SYSTEM;
			desktopSyncService.currentConnectorType = connectorType;
			const flaggedIpcMessage = new FlaggedIpcMessage(MessageFlag.STOP_SYNC, connectorType);

			// When
			const promise = desktopSyncService.stop();

			// Then
			promise.then(() => {

				throw new Error("Should not be here!");

			}, () => {
				expect(sendSpy).toHaveBeenCalledTimes(1);
				expect(sendSpy).toHaveBeenCalledWith(flaggedIpcMessage);
				done();
			});
		});

	});

	describe("Handle sync events", () => {

		it("should handle started sync events", (done: Function) => {

			// Given
			const syncEvent$ = new Subject<SyncEvent>();
			desktopSyncService.currentConnectorType = ConnectorType.STRAVA;
			const startedSyncEvent = new StartedSyncEvent(desktopSyncService.currentConnectorType);
			const syncEventNextSpy = spyOn(syncEvent$, "next").and.callThrough();

			// When
			setTimeout(() => desktopSyncService.handleSyncEvents(syncEvent$, startedSyncEvent));

			// Then
			syncEvent$.subscribe(() => {
				expect(syncEventNextSpy).toHaveBeenCalledWith(startedSyncEvent);
				done();

			}, error => {
				throw new Error("Should not be here!" + JSON.stringify(error));
			});
		});

		it("should handle activity sync events", (done: Function) => {

			// Given
			const syncEvent$ = new Subject<SyncEvent>();
			desktopSyncService.currentConnectorType = ConnectorType.STRAVA;

			const isNew = true;
			const activity = new SyncedActivityModel();
			activity.name = "No pain no gain";
			activity.start_time = (new Date()).toISOString();
			const activitySyncEvent = new ActivitySyncEvent(desktopSyncService.currentConnectorType, null, activity, isNew);
			const activityServicePutSpy = spyOn(desktopSyncService.activityService, "put").and.returnValue(Promise.resolve(activity));
			const syncEventNextSpy = spyOn(syncEvent$, "next").and.callThrough();

			// When
			setTimeout(() => desktopSyncService.handleSyncEvents(syncEvent$, activitySyncEvent));

			// Then
			syncEvent$.subscribe(() => {

				expect(activityServicePutSpy).toHaveBeenCalledWith(activity);
				expect(syncEventNextSpy).toHaveBeenCalledWith(activitySyncEvent);
				done();

			}, error => {
				throw new Error("Should not be here!" + JSON.stringify(error));
			});
		});

		it("should handle stopped sync events", (done: Function) => {

			// Given
			const syncEvent$ = new Subject<SyncEvent>();
			desktopSyncService.currentConnectorType = ConnectorType.STRAVA;
			const stoppedSyncEvent = new StoppedSyncEvent(desktopSyncService.currentConnectorType);
			const syncEventNextSpy = spyOn(syncEvent$, "next").and.callThrough();

			// When
			setTimeout(() => desktopSyncService.handleSyncEvents(syncEvent$, stoppedSyncEvent));

			// Then
			syncEvent$.subscribe(() => {
				expect(syncEventNextSpy).toHaveBeenCalledWith(stoppedSyncEvent);
				done();

			}, error => {
				throw new Error("Should not be here!" + JSON.stringify(error));
			});
		});

		it("should handle strava credentials updates sync events", (done: Function) => {

			// Given
			const syncEvent$ = new Subject<SyncEvent>();
			desktopSyncService.currentConnectorType = ConnectorType.STRAVA;
			const stravaCredentialsUpdateSyncEvent = new StravaCredentialsUpdateSyncEvent(new StravaApiCredentials(null, null));
			const syncEventNextSpy = spyOn(syncEvent$, "next").and.callThrough();

			// When
			setTimeout(() => desktopSyncService.handleSyncEvents(syncEvent$, stravaCredentialsUpdateSyncEvent));

			// Then
			syncEvent$.subscribe(() => {
				expect(syncEventNextSpy).toHaveBeenCalledWith(stravaCredentialsUpdateSyncEvent);
				done();

			}, error => {
				throw new Error("Should not be here!" + JSON.stringify(error));
			});
		});

		it("should handle stopped sync events", (done: Function) => {

			// Given
			const syncEvent$ = new Subject<SyncEvent>();
			desktopSyncService.currentConnectorType = ConnectorType.STRAVA;
			const genericSyncEvent = new GenericSyncEvent(desktopSyncService.currentConnectorType);
			const syncEventNextSpy = spyOn(syncEvent$, "next").and.callThrough();

			// When
			setTimeout(() => desktopSyncService.handleSyncEvents(syncEvent$, genericSyncEvent));

			// Then
			syncEvent$.subscribe(() => {
				expect(syncEventNextSpy).toHaveBeenCalledWith(genericSyncEvent);
				done();

			}, error => {
				throw new Error("Should not be here!" + JSON.stringify(error));
			});
		});

		it("should handle complete sync events", (done: Function) => {

			// Given
			const syncEvent$ = new Subject<SyncEvent>();
			desktopSyncService.currentConnectorType = ConnectorType.STRAVA;
			const completeSyncEvent = new CompleteSyncEvent(desktopSyncService.currentConnectorType);
			const handleSyncCompleteEventsSpy = spyOn(desktopSyncService, "handleSyncCompleteEvents").and.callThrough();
			spyOn(desktopSyncService.connectorSyncDateTimeDao, "getById")
				.and.returnValue(Promise.resolve(null));
			spyOn(desktopSyncService, "upsertConnectorsSyncDateTimes")
				.and.returnValue(Promise.resolve());
			const syncEventNextSpy = spyOn(syncEvent$, "next").and.callThrough();

			// When
			setTimeout(() => desktopSyncService.handleSyncEvents(syncEvent$, completeSyncEvent));

			// Then
			syncEvent$.subscribe(() => {
				expect(handleSyncCompleteEventsSpy).toHaveBeenCalledWith(syncEvent$, completeSyncEvent);
				expect(syncEventNextSpy).toHaveBeenCalledWith(completeSyncEvent);
				done();

			}, error => {
				throw new Error("Should not be here!" + JSON.stringify(error));
			});
		});

		it("should forward error sync events", (done: Function) => {

			// Given
			const syncEvent$ = new Subject<SyncEvent>();
			desktopSyncService.currentConnectorType = ConnectorType.STRAVA;
			const errorSyncEvent = ErrorSyncEvent.SYNC_ALREADY_STARTED.create(desktopSyncService.currentConnectorType);
			const handleErrorSyncEventsSpy = spyOn(desktopSyncService, "handleErrorSyncEvents").and.stub();

			// When
			desktopSyncService.handleSyncEvents(syncEvent$, errorSyncEvent);

			// Then
			expect(handleErrorSyncEventsSpy).toHaveBeenCalledTimes(1);
			done();
		});

		it("should throw SyncException when SyncEventType is unknown", (done: Function) => {

			// Given
			const syncEvent$ = new Subject<SyncEvent>();
			desktopSyncService.currentConnectorType = ConnectorType.STRAVA;
			const syncEvent = new GenericSyncEvent(ConnectorType.STRAVA);
			syncEvent.type = -1; // Make type unknown
			const expectedSyncException = new SyncException("Unknown sync event type: " + JSON.stringify(syncEvent));
			const throwSyncErrorSpy = spyOn(desktopSyncService, "throwSyncError").and.stub();

			// When
			desktopSyncService.handleSyncEvents(syncEvent$, syncEvent);

			// Then
			expect(throwSyncErrorSpy).toHaveBeenCalledWith(expectedSyncException);
			done();
		});

	});

	describe("Throw errors", () => {

		it("should catch SyncException when triggering standard error", (done: Function) => {

			// Given
			const message = "whoops";
			const sourceError = new Error(message);

			// When
			try {
				desktopSyncService.throwSyncError(sourceError);
			} catch (syncException) {

				// Then
				expect(syncException).toBeDefined();
				expect(syncException.name === SyncException.name).toBeTruthy();
				expect(syncException.message).toEqual(message);
				expect(syncException.stack).toEqual(sourceError.stack);
				expect(syncException.message).toEqual(sourceError.message);

				done();
			}

		});

		it("should catch SyncException when triggering a SyncException", (done: Function) => {

			// Given
			const message = "whoops";
			const errorSyncEvent = ErrorSyncEvent.SYNC_ALREADY_STARTED.create(ConnectorType.STRAVA);
			const error = new SyncException(message, errorSyncEvent);

			// When
			try {
				desktopSyncService.throwSyncError(error);
			} catch (syncException) {

				// Then
				expect(syncException).toBeDefined();
				expect(syncException.message).toEqual(message);
				expect(syncException.name === SyncException.name).toBeTruthy();
				expect((<SyncException> syncException).errorSyncEvent).toEqual(errorSyncEvent);

				done();
			}

		});

		it("should catch SyncException when triggering a error string only", (done: Function) => {

			// Given
			const message = "whoops";

			// When
			try {
				desktopSyncService.throwSyncError(message);
			} catch (syncException) {

				// Then
				expect(syncException).toBeDefined();
				expect(syncException.message).toEqual(message);
				expect(syncException.name === SyncException.name).toBeTruthy();
				expect(syncException.errorSyncEvent).toBeNull();

				done();
			}

		});

		it("should catch SyncException when triggering an unknown type", (done: Function) => {

			// Given
			const message = {};
			const expectedMessage = "{}";

			// When
			try {
				desktopSyncService.throwSyncError(<any> message);
			} catch (syncException) {

				// Then
				expect(syncException).toBeDefined();
				expect(syncException.message).toEqual(expectedMessage);
				expect(syncException.name === SyncException.name).toBeTruthy();
				expect(syncException.errorSyncEvent).toBeNull();

				done();
			}

		});

		it("should catch multiple Error and throw them as SyncException array", (done: Function) => {

			// Given
			const message01 = "1st error";
			const message02 = "2nd error";
			const error01 = new Error(message01);
			const error02 = new Error(message02);

			// When
			try {

				desktopSyncService.throwSyncError([error01, error02]);

			} catch (syncExceptions) {

				// Then
				expect(syncExceptions.length).toEqual(2);
				expect(syncExceptions[0].message).toEqual(message01);
				expect(syncExceptions[1].message).toEqual(message02);
				expect(syncExceptions[0].name === SyncException.name).toBeTruthy();
				expect(syncExceptions[1].name === SyncException.name).toBeTruthy();

				done();
			}

		});

		it("should catch (Error + SyncException) and throw them as SyncException array", (done: Function) => {

			// Given
			const errorSyncEvent = ErrorSyncEvent.SYNC_ALREADY_STARTED.create(ConnectorType.STRAVA);
			const message01 = "1st error";
			const message02 = "2nd error";
			const error01 = new Error(message01);
			const error02 = new SyncException(message02, errorSyncEvent);

			// When
			try {

				desktopSyncService.throwSyncError([error01, error02]);

			} catch (syncExceptions) {

				// Then
				expect(syncExceptions.length).toEqual(2);
				expect(syncExceptions[0].message).toEqual(message01);
				expect(syncExceptions[1].message).toEqual(message02);
				expect(syncExceptions[0].name === SyncException.name).toBeTruthy();
				expect(syncExceptions[1].name === SyncException.name).toBeTruthy();
				expect(syncExceptions[1].errorSyncEvent).toEqual(errorSyncEvent);

				done();
			}

		});

		it("should catch multiple String errors throw them as SyncException array", (done: Function) => {

			// Given
			const message01 = "1st error";
			const message02 = "2nd error";

			// When
			try {
				desktopSyncService.throwSyncError([message01, message02]);
			} catch (syncExceptions) {

				// Then
				expect(syncExceptions.length).toEqual(2);
				expect(syncExceptions[0].message).toEqual(message01);
				expect(syncExceptions[1].message).toEqual(message02);
				expect(syncExceptions[0].name === SyncException.name).toBeTruthy();
				expect(syncExceptions[1].name === SyncException.name).toBeTruthy();
				expect(syncExceptions[0].errorSyncEvent).toBeNull();
				expect(syncExceptions[1].errorSyncEvent).toBeNull();

				done();
			}

		});

	});

	describe("Handle error sync events", () => {

		it("should handle SYNC_ERROR_COMPUTE events and stop sync", (done: Function) => {

			// Given
			const syncEvent$ = new Subject<SyncEvent>();
			desktopSyncService.currentConnectorType = ConnectorType.STRAVA;
			const errorSyncEvent = ErrorSyncEvent.SYNC_ERROR_COMPUTE.create(desktopSyncService.currentConnectorType, null);
			const syncEventNextSpy = spyOn(syncEvent$, "next").and.callThrough();
			const stopSpy = spyOn(desktopSyncService, "stop").and.returnValue(Promise.resolve());

			// When
			desktopSyncService.handleErrorSyncEvents(syncEvent$, errorSyncEvent);

			// Then
			expect(syncEventNextSpy).toHaveBeenCalledTimes(1);
			expect(stopSpy).toHaveBeenCalledTimes(1);
			done();
		});

		it("should handle UNHANDLED_ERROR_SYNC events and stop sync", (done: Function) => {

			// Given
			const syncEvent$ = new Subject<SyncEvent>();
			desktopSyncService.currentConnectorType = ConnectorType.STRAVA;
			const errorSyncEvent = ErrorSyncEvent.UNHANDLED_ERROR_SYNC.create(desktopSyncService.currentConnectorType, null);
			const syncEventNextSpy = spyOn(syncEvent$, "next").and.callThrough();
			const stopSpy = spyOn(desktopSyncService, "stop").and.returnValue(Promise.resolve());

			// When
			desktopSyncService.handleErrorSyncEvents(syncEvent$, errorSyncEvent);

			// Then
			expect(syncEventNextSpy).toHaveBeenCalledTimes(1);
			expect(stopSpy).toHaveBeenCalledTimes(1);
			done();
		});

		it("should handle SYNC_ERROR_UPSERT_ACTIVITY_DATABASE events and stop sync", (done: Function) => {

			// Given
			const syncEvent$ = new Subject<SyncEvent>();
			desktopSyncService.currentConnectorType = ConnectorType.STRAVA;
			const activity = <SyncedActivityModel> {name: "fakeActivity"};
			const errorSyncEvent = ErrorSyncEvent.SYNC_ERROR_UPSERT_ACTIVITY_DATABASE.create(desktopSyncService.currentConnectorType, activity);
			const syncEventNextSpy = spyOn(syncEvent$, "next").and.callThrough();
			const stopSpy = spyOn(desktopSyncService, "stop").and.returnValue(Promise.resolve());

			// When
			desktopSyncService.handleErrorSyncEvents(syncEvent$, errorSyncEvent);

			// Then
			expect(syncEventNextSpy).toHaveBeenCalledTimes(1);
			expect(stopSpy).toHaveBeenCalledTimes(1);
			done();
		});

		it("should handle STRAVA_API_UNAUTHORIZED events and stop sync", (done: Function) => {

			// Given
			const syncEvent$ = new Subject<SyncEvent>();
			desktopSyncService.currentConnectorType = ConnectorType.STRAVA;
			const errorSyncEvent = ErrorSyncEvent.STRAVA_API_UNAUTHORIZED.create();
			const syncEventNextSpy = spyOn(syncEvent$, "next").and.callThrough();
			const stopSpy = spyOn(desktopSyncService, "stop").and.returnValue(Promise.resolve());

			// When
			desktopSyncService.handleErrorSyncEvents(syncEvent$, errorSyncEvent);

			// Then
			expect(syncEventNextSpy).toHaveBeenCalledTimes(1);
			expect(stopSpy).toHaveBeenCalledTimes(1);
			done();
		});

		it("should handle STRAVA_API_FORBIDDEN events and stop sync", (done: Function) => {

			// Given
			const syncEvent$ = new Subject<SyncEvent>();
			desktopSyncService.currentConnectorType = ConnectorType.STRAVA;
			const errorSyncEvent = ErrorSyncEvent.STRAVA_API_FORBIDDEN.create();
			const syncEventNextSpy = spyOn(syncEvent$, "next").and.callThrough();
			const stopSpy = spyOn(desktopSyncService, "stop").and.returnValue(Promise.resolve());

			// When
			desktopSyncService.handleErrorSyncEvents(syncEvent$, errorSyncEvent);

			// Then
			expect(syncEventNextSpy).toHaveBeenCalledTimes(1);
			expect(stopSpy).toHaveBeenCalledTimes(1);
			done();
		});

		it("should handle STRAVA_INSTANT_QUOTA_REACHED events and stop sync", (done: Function) => {

			// Given
			const syncEvent$ = new Subject<SyncEvent>();
			desktopSyncService.currentConnectorType = ConnectorType.STRAVA;
			const errorSyncEvent = ErrorSyncEvent.STRAVA_INSTANT_QUOTA_REACHED.create(101, 100);
			const syncEventNextSpy = spyOn(syncEvent$, "next").and.callThrough();
			const stopSpy = spyOn(desktopSyncService, "stop").and.returnValue(Promise.resolve());

			// When
			desktopSyncService.handleErrorSyncEvents(syncEvent$, errorSyncEvent);

			// Then
			expect(syncEventNextSpy).toHaveBeenCalledTimes(1);
			expect(stopSpy).toHaveBeenCalledTimes(1);
			done();
		});

		it("should handle STRAVA_DAILY_QUOTA_REACHED events and stop sync", (done: Function) => {

			// Given
			const syncEvent$ = new Subject<SyncEvent>();
			desktopSyncService.currentConnectorType = ConnectorType.STRAVA;
			const errorSyncEvent = ErrorSyncEvent.STRAVA_DAILY_QUOTA_REACHED.create(101, 100);
			const syncEventNextSpy = spyOn(syncEvent$, "next").and.callThrough();
			const stopSpy = spyOn(desktopSyncService, "stop").and.returnValue(Promise.resolve());

			// When
			desktopSyncService.handleErrorSyncEvents(syncEvent$, errorSyncEvent);

			// Then
			expect(syncEventNextSpy).toHaveBeenCalledTimes(1);
			expect(stopSpy).toHaveBeenCalledTimes(1);
			done();
		});

		it("should handle MULTIPLE_ACTIVITIES_FOUND events and do nothing", (done: Function) => {

			// Given
			const syncEvent$ = new Subject<SyncEvent>();
			desktopSyncService.currentConnectorType = ConnectorType.STRAVA;
			const errorSyncEvent = ErrorSyncEvent.MULTIPLE_ACTIVITIES_FOUND.create(desktopSyncService.currentConnectorType,
				"fakeActivity", new Date(), []);
			const syncEventNextSpy = spyOn(syncEvent$, "next").and.callThrough();
			const stopSpy = spyOn(desktopSyncService, "stop").and.returnValue(Promise.resolve());

			// When
			desktopSyncService.handleErrorSyncEvents(syncEvent$, errorSyncEvent);

			// Then
			expect(syncEventNextSpy).toHaveBeenCalledTimes(1);
			expect(stopSpy).not.toHaveBeenCalled();
			done();
		});

		it("should handle SYNC_ALREADY_STARTED events and do nothing", (done: Function) => {

			// Given
			const syncEvent$ = new Subject<SyncEvent>();
			desktopSyncService.currentConnectorType = ConnectorType.STRAVA;
			const errorSyncEvent = ErrorSyncEvent.SYNC_ALREADY_STARTED.create(desktopSyncService.currentConnectorType);
			const syncEventNextSpy = spyOn(syncEvent$, "next").and.callThrough();
			const stopSpy = spyOn(desktopSyncService, "stop").and.returnValue(Promise.resolve());

			// When
			desktopSyncService.handleErrorSyncEvents(syncEvent$, errorSyncEvent);

			// Then
			expect(syncEventNextSpy).toHaveBeenCalledTimes(1);
			expect(stopSpy).not.toHaveBeenCalled();
			done();
		});

		it("should handle STRAVA_API_RESOURCE_NOT_FOUND events and do nothing", (done: Function) => {

			// Given
			const syncEvent$ = new Subject<SyncEvent>();
			desktopSyncService.currentConnectorType = ConnectorType.STRAVA;
			const errorSyncEvent = ErrorSyncEvent.STRAVA_API_RESOURCE_NOT_FOUND.create(desktopSyncService.currentConnectorType);
			const syncEventNextSpy = spyOn(syncEvent$, "next").and.callThrough();
			const stopSpy = spyOn(desktopSyncService, "stop").and.returnValue(Promise.resolve());

			// When
			desktopSyncService.handleErrorSyncEvents(syncEvent$, errorSyncEvent);

			// Then
			expect(syncEventNextSpy).toHaveBeenCalledTimes(1);
			expect(stopSpy).not.toHaveBeenCalled();
			done();
		});

		it("should handle STRAVA_API_TIMEOUT events and do nothing", (done: Function) => {

			// Given
			const syncEvent$ = new Subject<SyncEvent>();
			desktopSyncService.currentConnectorType = ConnectorType.STRAVA;
			const errorSyncEvent = ErrorSyncEvent.STRAVA_API_TIMEOUT.create(desktopSyncService.currentConnectorType);
			const syncEventNextSpy = spyOn(syncEvent$, "next").and.callThrough();
			const stopSpy = spyOn(desktopSyncService, "stop").and.returnValue(Promise.resolve());

			// When
			desktopSyncService.handleErrorSyncEvents(syncEvent$, errorSyncEvent);

			// Then
			expect(syncEventNextSpy).toHaveBeenCalledTimes(1);
			expect(stopSpy).not.toHaveBeenCalled();
			done();
		});

		it("should throw when error is not ErrorSyncEvent instance", (done: Function) => {

			// Given
			const syncEvent$ = new Subject<SyncEvent>();
			desktopSyncService.currentConnectorType = ConnectorType.STRAVA;
			const errorSyncEvent = ErrorSyncEvent.STRAVA_API_UNAUTHORIZED.create();
			delete errorSyncEvent.code; // Fake remove code to simulate this case
			const syncEventNextSpy = spyOn(syncEvent$, "next").and.callThrough();
			const throwSyncErrorSpy = spyOn(desktopSyncService, "throwSyncError").and.stub();
			const stopSpy = spyOn(desktopSyncService, "stop").and.returnValue(Promise.resolve());

			// When
			desktopSyncService.handleErrorSyncEvents(syncEvent$, errorSyncEvent);

			// Then
			expect(throwSyncErrorSpy).toHaveBeenCalledTimes(1);
			expect(syncEventNextSpy).not.toHaveBeenCalledTimes(1);
			expect(stopSpy).not.toHaveBeenCalled();
			done();
		});

		it("should throw when ErrorSyncEvent code is unknown ", (done: Function) => {

			// Given
			const syncEvent$ = new Subject<SyncEvent>();
			desktopSyncService.currentConnectorType = ConnectorType.STRAVA;
			const errorSyncEvent = ErrorSyncEvent.STRAVA_API_UNAUTHORIZED.create();
			errorSyncEvent.code = "FAKE_CODE"; // Fake code to simulate this case
			const syncEventNextSpy = spyOn(syncEvent$, "next").and.callThrough();
			const throwSyncErrorSpy = spyOn(desktopSyncService, "throwSyncError").and.stub();
			const stopSpy = spyOn(desktopSyncService, "stop").and.returnValue(Promise.resolve());

			// When
			desktopSyncService.handleErrorSyncEvents(syncEvent$, errorSyncEvent);

			// Then
			expect(throwSyncErrorSpy).toHaveBeenCalledTimes(1);
			expect(syncEventNextSpy).not.toHaveBeenCalledTimes(1);
			expect(stopSpy).not.toHaveBeenCalled();
			done();
		});

		it("should handle STRAVA_API_UNAUTHORIZED events, try to stop sync with failure", (done: Function) => {

			// Given
			const syncEvent$ = new Subject<SyncEvent>();
			desktopSyncService.currentConnectorType = ConnectorType.STRAVA;
			const errorSyncEvent = ErrorSyncEvent.STRAVA_API_UNAUTHORIZED.create();
			const syncEventNextSpy = spyOn(syncEvent$, "next").and.callThrough();
			const expectedStopError = "Unable to stop sync";
			const stopSpy = spyOn(desktopSyncService, "stop").and.returnValue(Promise.reject(expectedStopError));
			const throwSyncErrorSpy = spyOn(desktopSyncService, "throwSyncError").and.stub();

			// When
			setTimeout(() => desktopSyncService.handleErrorSyncEvents(syncEvent$, errorSyncEvent));

			// Then
			syncEvent$.subscribe(() => {

				setTimeout(() => {
					expect(syncEventNextSpy).toHaveBeenCalledTimes(1);
					expect(stopSpy).toHaveBeenCalledTimes(1);
					expect(throwSyncErrorSpy).toHaveBeenCalledTimes(1);
					expect(throwSyncErrorSpy).toHaveBeenCalledWith(expectedStopError);
					done();
				});

			}, error => {
				throw new Error("Should not be here!" + JSON.stringify(error));
			});

		});

	});

	describe("Export", () => {

		it("should export a compressed gzip dump", (done: Function) => {

			// Given
			const expectedData = {foo: "bar"};
			const blob = new Blob([Gzip.toBinaryString(JSON.stringify(expectedData))], {type: "application/gzip"});
			const dumpSpy = spyOn(desktopSyncService.desktopDataStore, "createDump").and.returnValue(Promise.resolve(blob));
			const appVersion = "1.0.0";
			const getInstalledAppVersionSpy = spyOn(desktopSyncService.versionsProvider, "getInstalledAppVersion")
				.and.returnValue(Promise.resolve(appVersion));
			const saveAsSpy = spyOn(desktopSyncService, "saveAs").and.stub();
			const expectedFilename = moment().format("Y.MM.DD-H.mm") + "_v" + appVersion + ".elevate";

			// When
			const promise = desktopSyncService.export();

			// Then
			promise.then((result: { filename: string; size: number }) => {

				expect(getInstalledAppVersionSpy).toHaveBeenCalledTimes(1);
				expect(dumpSpy).toHaveBeenCalledTimes(1);

				expect(result.filename).toEqual(expectedFilename);
				expect(result.size).toEqual(blob.size);

				expect(saveAsSpy).toHaveBeenCalledWith(blob, expectedFilename);

				done();

			}, () => {
				throw new Error("Should not be here!");
			});
		});


	});

	describe("Import", () => {

		it("should import a compressed gzip dump", (done: Function) => {

			// Given
			const isDumpCompatibleSpy = spyOn(desktopSyncService, "isDumpCompatible").and.callThrough();
			const loadDumpSpy = spyOn(desktopSyncService.desktopDataStore, "loadDump").and.returnValue(Promise.resolve());
			const expectedData = {foo: "bar"};
			const desktopDumpModel: DesktopDumpModel = new DesktopDumpModel("1.0.0", Gzip.toBinaryString(JSON.stringify(expectedData)));

			// When
			const promise = desktopSyncService.import(desktopDumpModel);

			// Then
			promise.then(() => {
				expect(isDumpCompatibleSpy).toHaveBeenCalledTimes(1);
				expect(loadDumpSpy).toHaveBeenCalledTimes(1);
				done();

			}, () => {
				throw new Error("Should not be here!");
			});
		});

	});

	describe("Provide sync state", () => {

		it("should provide NOT_SYNCED state", (done: Function) => {

			// Given
			const expectedState = SyncState.NOT_SYNCED;
			const fetchSpy = spyOn(desktopSyncService.connectorSyncDateTimeDao, "fetch")
				.and.returnValue(Promise.resolve([]));

			const activityServiceSpy = spyOn(desktopSyncService.activityService, "fetch")
				.and.returnValue(Promise.resolve([]));

			// When
			const promise = desktopSyncService.getSyncState();

			// Then
			promise.then(syncState => {
				expect(syncState).toEqual(expectedState);
				expect(fetchSpy).toHaveBeenCalledTimes(1);
				expect(activityServiceSpy).toHaveBeenCalledTimes(1);
				done();

			}, () => {
				throw new Error("Should not be here!");
			});

		});

		it("should provide SYNCED state (2/2 connectors synced)", (done: Function) => {

			// Given
			const expectedState = SyncState.SYNCED;
			const connectorSyncDateTimes: ConnectorSyncDateTime[] = [
				new ConnectorSyncDateTime(ConnectorType.STRAVA, 11111),
				new ConnectorSyncDateTime(ConnectorType.FILE_SYSTEM, 22222)
			];

			const fetchSpy = spyOn(desktopSyncService.connectorSyncDateTimeDao, "fetch")
				.and.returnValue(Promise.resolve(connectorSyncDateTimes));

			const activityServiceSpy = spyOn(desktopSyncService.activityService, "fetch")
				.and.returnValue(Promise.resolve(TEST_SYNCED_ACTIVITIES));

			// When
			const promise = desktopSyncService.getSyncState();

			// Then
			promise.then(syncState => {
				expect(syncState).toEqual(expectedState);
				expect(fetchSpy).toHaveBeenCalledTimes(1);
				expect(activityServiceSpy).toHaveBeenCalledTimes(1);
				done();

			}, () => {
				throw new Error("Should not be here!");
			});

		});

		it("should provide SYNCED state (1/2 connector synced)", (done: Function) => {

			// Given
			const expectedState = SyncState.SYNCED;
			const connectorSyncDateTimes: ConnectorSyncDateTime[] = [
				new ConnectorSyncDateTime(ConnectorType.STRAVA, 11111), // Only one !
			];

			const fetchSpy = spyOn(desktopSyncService.connectorSyncDateTimeDao, "fetch")
				.and.returnValue(Promise.resolve(connectorSyncDateTimes));

			const activityServiceSpy = spyOn(desktopSyncService.activityService, "fetch")
				.and.returnValue(Promise.resolve(TEST_SYNCED_ACTIVITIES));

			// When
			const promise = desktopSyncService.getSyncState();

			// Then
			promise.then(syncState => {
				expect(syncState).toEqual(expectedState);
				expect(fetchSpy).toHaveBeenCalledTimes(1);
				expect(activityServiceSpy).toHaveBeenCalledTimes(1);
				done();

			}, () => {
				throw new Error("Should not be here!");
			});

		});

		it("should provide SYNCED state (2/2 connector synced and no activities)", (done: Function) => {

			// Given
			const expectedState = SyncState.SYNCED;
			const connectorSyncDateTimes: ConnectorSyncDateTime[] = [
				new ConnectorSyncDateTime(ConnectorType.STRAVA, 11111),
				new ConnectorSyncDateTime(ConnectorType.FILE_SYSTEM, 22222)
			];

			const fetchSpy = spyOn(desktopSyncService.connectorSyncDateTimeDao, "fetch")
				.and.returnValue(Promise.resolve(connectorSyncDateTimes));

			const activityServiceSpy = spyOn(desktopSyncService.activityService, "fetch")
				.and.returnValue(Promise.resolve([]));

			// When
			const promise = desktopSyncService.getSyncState();

			// Then
			promise.then(syncState => {
				expect(syncState).toEqual(expectedState);
				expect(fetchSpy).toHaveBeenCalledTimes(1);
				expect(activityServiceSpy).toHaveBeenCalledTimes(1);
				done();

			}, () => {
				throw new Error("Should not be here!");
			});

		});

		it("should provide SYNCED state (1/2 connector synced and no activities)", (done: Function) => {

			// Given
			const expectedState = SyncState.SYNCED;
			const connectorSyncDateTimes: ConnectorSyncDateTime[] = [
				new ConnectorSyncDateTime(ConnectorType.STRAVA, 11111),
			];

			const fetchSpy = spyOn(desktopSyncService.connectorSyncDateTimeDao, "fetch")
				.and.returnValue(Promise.resolve(connectorSyncDateTimes));

			const activityServiceSpy = spyOn(desktopSyncService.activityService, "fetch")
				.and.returnValue(Promise.resolve([]));

			// When
			const promise = desktopSyncService.getSyncState();

			// Then
			promise.then(syncState => {
				expect(syncState).toEqual(expectedState);
				expect(fetchSpy).toHaveBeenCalledTimes(1);
				expect(activityServiceSpy).toHaveBeenCalledTimes(1);
				done();

			}, () => {
				throw new Error("Should not be here!");
			});

		});


		it("should provide PARTIALLY_SYNCED state (0/2 connector synced and some activities stored)", (done: Function) => {

			// Given
			const expectedState = SyncState.PARTIALLY_SYNCED;
			const connectorSyncDateTimes: ConnectorSyncDateTime[] = [];

			const fetchSpy = spyOn(desktopSyncService.connectorSyncDateTimeDao, "fetch")
				.and.returnValue(Promise.resolve(connectorSyncDateTimes));

			const activityServiceSpy = spyOn(desktopSyncService.activityService, "fetch")
				.and.returnValue(Promise.resolve(TEST_SYNCED_ACTIVITIES));

			// When
			const promise = desktopSyncService.getSyncState();

			// Then
			promise.then(syncState => {
				expect(syncState).toEqual(expectedState);
				expect(fetchSpy).toHaveBeenCalledTimes(1);
				expect(activityServiceSpy).toHaveBeenCalledTimes(1);
				done();

			}, () => {
				throw new Error("Should not be here!");
			});

		});

	});

	describe("Provide access and modify sync date time", () => {

		it("should get sync date times from synced connectors", (done: Function) => {

			// Given
			const connectorSyncDateTimes: ConnectorSyncDateTime[] = [
				new ConnectorSyncDateTime(ConnectorType.STRAVA, 11111),
				new ConnectorSyncDateTime(ConnectorType.FILE_SYSTEM, 22222)
			];

			const fetchSpy = spyOn(desktopSyncService.connectorSyncDateTimeDao, "fetch")
				.and.returnValue(Promise.resolve(connectorSyncDateTimes));

			// When
			const promise = desktopSyncService.getConnectorSyncDateTime();

			// Then
			promise.then(() => {

				expect(fetchSpy).toHaveBeenCalledTimes(1);
				done();

			}, () => {
				throw new Error("Should not be here!");
			});
		});

		it("should get the most recent connector synced", (done: Function) => {

			// Given
			const expectedConnector = new ConnectorSyncDateTime(ConnectorType.FILE_SYSTEM, 22222);
			const connectorSyncDateTimes: ConnectorSyncDateTime[] = [
				new ConnectorSyncDateTime(ConnectorType.STRAVA, 11111),
				expectedConnector
			];

			const fetchSpy = spyOn(desktopSyncService.connectorSyncDateTimeDao, "fetch")
				.and.returnValue(Promise.resolve(connectorSyncDateTimes));

			// When
			const promise = desktopSyncService.getMostRecentSyncedConnector();

			// Then
			promise.then((mostRecentConnectorSynced: ConnectorSyncDateTime) => {

				expect(fetchSpy).toHaveBeenCalledTimes(1);
				expect(mostRecentConnectorSynced).toEqual(expectedConnector);
				done();

			}, () => {
				throw new Error("Should not be here!");
			});
		});

		it("should upsert sync date times of synced connectors", (done: Function) => {

			// Given
			const connectorSyncDateTimesToSave: ConnectorSyncDateTime[] = [
				new ConnectorSyncDateTime(ConnectorType.STRAVA, 11111),
				new ConnectorSyncDateTime(ConnectorType.FILE_SYSTEM, 22222)
			];

			spyOn(desktopSyncService.connectorSyncDateTimeDao, "fetch")
				.and.returnValue(Promise.resolve(connectorSyncDateTimesToSave));

			const putSpy = spyOn(desktopSyncService.connectorSyncDateTimeDao, "put")
				.and.returnValue(Promise.resolve(connectorSyncDateTimesToSave));

			// When
			const promise = desktopSyncService.upsertConnectorsSyncDateTimes(connectorSyncDateTimesToSave);

			// Then
			promise.then(() => {

				expect(putSpy).toHaveBeenCalledTimes(2);
				expect(putSpy).toHaveBeenCalledWith(connectorSyncDateTimesToSave[0]);
				expect(putSpy).toHaveBeenCalledWith(connectorSyncDateTimesToSave[1]);
				done();

			}, () => {
				throw new Error("Should not be here!");
			});
		});

		it("should reject upsert if connectors sync date times param is not an array", (done: Function) => {

			// Given
			const expectedErrorMesage = "connectorSyncDateTimes param must be an array";
			const connectorSyncDateTime = new ConnectorSyncDateTime(ConnectorType.STRAVA, 11111); // No array

			// When
			const call = () => {
				desktopSyncService.upsertConnectorsSyncDateTimes(<any> connectorSyncDateTime);
			};

			// Then
			expect(call).toThrow(new Error(expectedErrorMesage));
			done();
		});

		it("should clear sync date times of synced connectors", (done: Function) => {

			// Given
			const clearSpy = spyOn(desktopSyncService.connectorSyncDateTimeDao, "clear")
				.and.returnValue(Promise.resolve());

			// When
			const promise = desktopSyncService.clearSyncTime();

			// Then
			promise.then(() => {

				expect(clearSpy).toHaveBeenCalledTimes(1);
				done();

			}, () => {
				throw new Error("Should not be here!");
			});
		});

	});

});
