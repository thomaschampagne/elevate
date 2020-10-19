import { TestBed } from "@angular/core/testing";
import { CoreModule } from "../../../../core/core.module";
import { SharedModule } from "../../../shared.module";
import { DesktopSyncService } from "./desktop-sync.service";
import {
  ActivitySyncEvent,
  CompleteSyncEvent,
  ConnectorType,
  ErrorSyncEvent,
  FileSystemConnectorInfo,
  GenericSyncEvent,
  StartedSyncEvent,
  StoppedSyncEvent,
  StravaConnectorInfo,
  StravaCredentialsUpdateSyncEvent,
  SyncEvent
} from "@elevate/shared/sync";
import {
  AthleteModel,
  CompressedStreamModel,
  ConnectorSyncDateTime,
  SyncedActivityModel
} from "@elevate/shared/models";
import { FlaggedIpcMessage, MessageFlag } from "@elevate/shared/electron";
import { Subject } from "rxjs";
import { SyncException } from "@elevate/shared/exceptions";
import { TEST_SYNCED_ACTIVITIES } from "../../../../../shared-fixtures/activities-2015.fixture";
import { SyncState } from "../sync-state.enum";
import { DataStore } from "../../../data-store/data-store";
import { TestingDataStore } from "../../../data-store/testing-datastore.service";
import { TargetModule } from "../../../modules/target/desktop-target.module";

describe("DesktopSyncService", () => {
  let desktopSyncService: DesktopSyncService;

  beforeEach(done => {
    TestBed.configureTestingModule({
      imports: [CoreModule, SharedModule, TargetModule],
      providers: [DesktopSyncService, { provide: DataStore, useClass: TestingDataStore }]
    });
    desktopSyncService = TestBed.inject(DesktopSyncService);
    done();
  });

  it("should be created", done => {
    expect(desktopSyncService).toBeTruthy();
    done();
  });

  describe("Handle sync", () => {
    describe("Strava connector", () => {
      it("should start a full strava sync", done => {
        // Given
        const connectorType = ConnectorType.STRAVA;
        const connectorSyncDateTimes: ConnectorSyncDateTime[] = [
          new ConnectorSyncDateTime(ConnectorType.STRAVA, 11111),
          new ConnectorSyncDateTime(ConnectorType.FILE_SYSTEM, 22222)
        ];
        const listenSyncEventsSpy = spyOn(desktopSyncService.ipcMessagesReceiver, "listen").and.stub();
        const fetchAthleteModelSpy = spyOn(desktopSyncService.athleteService, "fetch").and.returnValue(
          Promise.resolve(AthleteModel.DEFAULT_MODEL)
        );
        const fetchUserSettingsSpy = spyOn(desktopSyncService.userSettingsService, "fetch").and.returnValue(null);
        const findConnectorSyncDateTimeSpy = spyOn(desktopSyncService.connectorSyncDateTimeDao, "find").and.returnValue(
          Promise.resolve(connectorSyncDateTimes)
        );

        const fetchStravaConnectorInfoSpy = spyOn(
          desktopSyncService.stravaConnectorInfoService,
          "fetch"
        ).and.returnValue(null);
        const sendStartSyncSpy = spyOn(desktopSyncService.ipcMessagesSender, "send").and.returnValue(
          Promise.resolve("Started")
        );

        // When
        const promiseStart = desktopSyncService.sync(false, false, connectorType);

        // Then
        promiseStart.then(
          () => {
            expect(desktopSyncService.currentConnectorType).toEqual(connectorType);
            expect(desktopSyncService.syncSubscription).toBeDefined();
            expect(listenSyncEventsSpy).toHaveBeenCalledTimes(1);
            expect(fetchAthleteModelSpy).toHaveBeenCalledTimes(1);
            expect(fetchUserSettingsSpy).toHaveBeenCalledTimes(1);
            expect(findConnectorSyncDateTimeSpy).not.toHaveBeenCalled();
            expect(fetchStravaConnectorInfoSpy).toHaveBeenCalledTimes(1);
            expect(sendStartSyncSpy).toHaveBeenCalledTimes(1);

            const flaggedStartSyncIpcMessage: FlaggedIpcMessage = sendStartSyncSpy.calls.mostRecent()
              .args[0] as FlaggedIpcMessage;
            const currentConnectorSyncDateTime = flaggedStartSyncIpcMessage.payload[1] as ConnectorSyncDateTime;
            expect(currentConnectorSyncDateTime).toBeNull();

            done();
          },
          error => {
            throw new Error("Should not be here!" + JSON.stringify(error));
          }
        );
      });

      it("should start a recent strava sync (from last sync date time)", done => {
        // Given
        const connectorType = ConnectorType.STRAVA;
        const expectedConnectorSyncDateTime = new ConnectorSyncDateTime(ConnectorType.STRAVA, 11111);
        const connectorSyncDateTimes: ConnectorSyncDateTime[] = [
          expectedConnectorSyncDateTime,
          new ConnectorSyncDateTime(ConnectorType.FILE_SYSTEM, 22222)
        ];
        const listenSyncEventsSpy = spyOn(desktopSyncService.ipcMessagesReceiver, "listen").and.stub();
        const fetchAthleteModelSpy = spyOn(desktopSyncService.athleteService, "fetch").and.returnValue(
          Promise.resolve(AthleteModel.DEFAULT_MODEL)
        );
        const fetchUserSettingsSpy = spyOn(desktopSyncService.userSettingsService, "fetch").and.returnValue(null);
        const findConnectorSyncDateTimeSpy = spyOn(desktopSyncService.connectorSyncDateTimeDao, "find").and.returnValue(
          Promise.resolve(connectorSyncDateTimes)
        );

        const fetchStravaConnectorInfoSpy = spyOn(
          desktopSyncService.stravaConnectorInfoService,
          "fetch"
        ).and.returnValue(null);
        const sendStartSyncSpy = spyOn(desktopSyncService.ipcMessagesSender, "send").and.returnValue(
          Promise.resolve("Started")
        );

        // When
        const promiseStart = desktopSyncService.sync(true, false, connectorType);

        // Then
        promiseStart.then(
          () => {
            expect(desktopSyncService.currentConnectorType).toEqual(connectorType);
            expect(desktopSyncService.syncSubscription).toBeDefined();
            expect(listenSyncEventsSpy).toHaveBeenCalledTimes(1);
            expect(fetchAthleteModelSpy).toHaveBeenCalledTimes(1);
            expect(fetchUserSettingsSpy).toHaveBeenCalledTimes(1);
            expect(findConnectorSyncDateTimeSpy).toHaveBeenCalledTimes(1);
            expect(fetchStravaConnectorInfoSpy).toHaveBeenCalledTimes(1);
            expect(sendStartSyncSpy).toHaveBeenCalledTimes(1);

            const flaggedStartSyncIpcMessage: FlaggedIpcMessage = sendStartSyncSpy.calls.mostRecent()
              .args[0] as FlaggedIpcMessage;
            const currentConnectorSyncDateTime = flaggedStartSyncIpcMessage.payload[1] as ConnectorSyncDateTime;
            expect(currentConnectorSyncDateTime).toBeDefined();
            expect(currentConnectorSyncDateTime).toEqual(expectedConnectorSyncDateTime);

            done();
          },
          error => {
            throw new Error("Should not be here!" + JSON.stringify(error));
          }
        );
      });

      it("should start a sync and handle sync events", done => {
        // Given
        const connectorType = ConnectorType.STRAVA;
        spyOn(desktopSyncService.ipcMessagesReceiver, "listen").and.stub();
        spyOn(desktopSyncService.athleteService, "fetch").and.returnValue(Promise.resolve(AthleteModel.DEFAULT_MODEL));
        spyOn(desktopSyncService.userSettingsService, "fetch").and.returnValue(null);
        spyOn(desktopSyncService.stravaConnectorInfoService, "fetch").and.returnValue(null);
        spyOn(desktopSyncService.ipcMessagesSender, "send").and.returnValue(Promise.resolve("Started"));
        const handleSyncEventsSpy = spyOn(desktopSyncService, "handleSyncEvents").and.stub();
        const genericSyncEvent = new GenericSyncEvent(desktopSyncService.currentConnectorType);

        const promiseStart = desktopSyncService.sync(false, false, connectorType);
        promiseStart.then(
          () => {
            // Then...
            desktopSyncService.ipcMessagesReceiver.syncEvents$.subscribe(
              syncEvent => {
                expect(syncEvent).toEqual(genericSyncEvent);
                expect(handleSyncEventsSpy).toHaveBeenCalledWith(desktopSyncService.syncEvents$, genericSyncEvent);
                done();
              },
              error => {
                throw new Error("Should not be here!" + JSON.stringify(error));
              }
            );

            // ...When sync started send a generic sync event
            desktopSyncService.ipcMessagesReceiver.syncEvents$.next(genericSyncEvent);
          },
          error => {
            throw new Error("Should not be here!" + JSON.stringify(error));
          }
        );
      });

      it("should not start a sync", done => {
        // Given
        const errorMessage = "Failed to start";
        const connectorType = ConnectorType.STRAVA;
        const listenSyncEventsSpy = spyOn(desktopSyncService.ipcMessagesReceiver, "listen").and.stub();
        const fetchAthleteModelSpy = spyOn(desktopSyncService.athleteService, "fetch").and.returnValue(
          Promise.resolve(AthleteModel.DEFAULT_MODEL)
        );
        const fetchUserSettingsSpy = spyOn(desktopSyncService.userSettingsService, "fetch").and.returnValue(null);
        const fetchStravaConnectorInfoSpy = spyOn(
          desktopSyncService.stravaConnectorInfoService,
          "fetch"
        ).and.returnValue(null);
        const sendStartSyncSpy = spyOn(desktopSyncService.ipcMessagesSender, "send").and.returnValue(
          Promise.reject(errorMessage)
        );

        // When
        const promiseStart = desktopSyncService.sync(false, false, connectorType);

        // Then
        promiseStart.then(
          () => {
            throw new Error("Should not be here!");
          },
          error => {
            expect(error).toEqual(errorMessage);
            expect(desktopSyncService.currentConnectorType).toEqual(connectorType);
            expect(desktopSyncService.syncSubscription).toBeDefined();
            expect(listenSyncEventsSpy).toHaveBeenCalledTimes(1);
            expect(fetchAthleteModelSpy).toHaveBeenCalledTimes(1);
            expect(fetchUserSettingsSpy).toHaveBeenCalledTimes(1);
            expect(fetchStravaConnectorInfoSpy).toHaveBeenCalledTimes(1);
            expect(sendStartSyncSpy).toHaveBeenCalledTimes(1);
            done();
          }
        );
      });
    });

    describe("File system connector", () => {
      it("should start a full file system sync", done => {
        // Given
        const connectorType = ConnectorType.FILE_SYSTEM;
        const connectorSyncDateTimes: ConnectorSyncDateTime[] = [
          new ConnectorSyncDateTime(ConnectorType.STRAVA, 11111),
          new ConnectorSyncDateTime(ConnectorType.FILE_SYSTEM, 22222)
        ];
        const listenSyncEventsSpy = spyOn(desktopSyncService.ipcMessagesReceiver, "listen").and.stub();
        const fetchAthleteModelSpy = spyOn(desktopSyncService.athleteService, "fetch").and.returnValue(
          Promise.resolve(AthleteModel.DEFAULT_MODEL)
        );
        const fetchUserSettingsSpy = spyOn(desktopSyncService.userSettingsService, "fetch").and.returnValue(null);
        const findConnectorSyncDateTimeSpy = spyOn(desktopSyncService.connectorSyncDateTimeDao, "find").and.returnValue(
          Promise.resolve(connectorSyncDateTimes)
        );

        const expectedFileSystemConnectorInfo = new FileSystemConnectorInfo("/path/to/dir/");
        const fileSystemConnectorInfoServiceSpy = spyOn(
          desktopSyncService.fsConnectorInfoService,
          "fetch"
        ).and.returnValue(expectedFileSystemConnectorInfo);
        const sendStartSyncSpy = spyOn(desktopSyncService.ipcMessagesSender, "send").and.returnValue(
          Promise.resolve("Started")
        );

        // When
        const promiseStart = desktopSyncService.sync(false, false, connectorType);

        // Then
        promiseStart.then(
          () => {
            expect(desktopSyncService.currentConnectorType).toEqual(connectorType);
            expect(desktopSyncService.syncSubscription).toBeDefined();
            expect(listenSyncEventsSpy).toHaveBeenCalledTimes(1);
            expect(fetchAthleteModelSpy).toHaveBeenCalledTimes(1);
            expect(fetchUserSettingsSpy).toHaveBeenCalledTimes(1);
            expect(fileSystemConnectorInfoServiceSpy).toHaveBeenCalledTimes(1);
            expect(findConnectorSyncDateTimeSpy).not.toHaveBeenCalled();
            expect(sendStartSyncSpy).toHaveBeenCalledTimes(1);

            const flaggedStartSyncIpcMessage: FlaggedIpcMessage = sendStartSyncSpy.calls.mostRecent()
              .args[0] as FlaggedIpcMessage;
            const currentConnectorSyncDateTime = flaggedStartSyncIpcMessage.payload[1] as ConnectorSyncDateTime;
            expect(currentConnectorSyncDateTime).toBeNull();
            const fileSystemConnectorInfo = flaggedStartSyncIpcMessage.payload[2] as FileSystemConnectorInfo;
            expect(fileSystemConnectorInfo).toEqual(expectedFileSystemConnectorInfo);

            done();
          },
          error => {
            throw new Error("Should not be here!" + JSON.stringify(error));
          }
        );
      });
    });
  });

  describe("Handle activity upsert", () => {
    beforeEach(done => {
      desktopSyncService.currentConnectorType = ConnectorType.FILE_SYSTEM;
      done();
    });

    it("should upsert an incoming activity", done => {
      // Given
      const syncEvent$ = new Subject<SyncEvent>();
      const isNew = true;
      const activity = new SyncedActivityModel();
      activity.id = "7dsa12ads8d";
      activity.name = "No pain no gain";
      activity.start_time = new Date().toISOString();
      const compressedStream = "fakeCompressedData";
      const expectedStreamModel = new CompressedStreamModel(activity.id, compressedStream);
      const activitySyncEvent = new ActivitySyncEvent(
        ConnectorType.FILE_SYSTEM,
        null,
        activity,
        isNew,
        compressedStream
      );
      const activityServicePutSpy = spyOn(desktopSyncService.activityService, "put").and.returnValue(
        Promise.resolve(activity)
      );
      const streamsServicePutSpy = spyOn(desktopSyncService.streamsService, "put").and.returnValue(
        Promise.resolve(expectedStreamModel)
      );
      const stopSpy = spyOn(desktopSyncService, "stop").and.returnValue(Promise.resolve());

      // When
      desktopSyncService.handleActivityUpsert(syncEvent$, activitySyncEvent);

      // Then
      syncEvent$.subscribe(
        () => {
          expect(activityServicePutSpy).toHaveBeenCalledWith(activity);
          expect(streamsServicePutSpy).toHaveBeenCalledWith(expectedStreamModel);
          expect(stopSpy).not.toHaveBeenCalled();
          done();
        },
        error => {
          throw new Error("Should not be here!" + JSON.stringify(error));
        }
      );
    });

    it("should not upsert an incoming activity, stop the sync properly and throw the upsert exception", done => {
      // Given
      const syncEvent$ = new Subject<SyncEvent>();
      const isNew = true;
      const activity = new SyncedActivityModel();
      activity.name = "No pain no gain";
      activity.start_time = new Date().toISOString();
      const expectedErrorSyncEvent = ErrorSyncEvent.SYNC_ERROR_UPSERT_ACTIVITY_DATABASE.create(
        ConnectorType.STRAVA,
        activity
      );
      const activitySyncEvent = new ActivitySyncEvent(ConnectorType.FILE_SYSTEM, null, activity, isNew);
      const expectedPutError = "Database put error";
      const activityServicePutSpy = spyOn(desktopSyncService.activityService, "put").and.returnValue(
        Promise.reject(expectedPutError)
      );
      const syncEventNextSpy = spyOn(syncEvent$, "next").and.callThrough();
      const stopSpy = spyOn(desktopSyncService, "stop").and.returnValue(Promise.resolve());
      const throwSyncErrorSpy = spyOn(desktopSyncService, "throwSyncError").and.stub();

      // When
      desktopSyncService.handleActivityUpsert(syncEvent$, activitySyncEvent);

      // Then
      syncEvent$.subscribe(
        (syncEvent: ErrorSyncEvent) => {
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
        },
        error => {
          throw new Error("Should not be here!" + JSON.stringify(error));
        }
      );
    });

    it("should not upsert an incoming activity, stop the sync with error and throw the upsert & stop exceptions", done => {
      // Given
      const syncEvent$ = new Subject<SyncEvent>();
      const isNew = true;
      const activity = new SyncedActivityModel();
      activity.name = "No pain no gain";
      activity.start_time = new Date().toISOString();
      const expectedErrorSyncEvent = ErrorSyncEvent.SYNC_ERROR_UPSERT_ACTIVITY_DATABASE.create(
        ConnectorType.STRAVA,
        activity
      );
      const activitySyncEvent = new ActivitySyncEvent(ConnectorType.FILE_SYSTEM, null, activity, isNew);
      const expectedPutError = "Database put error";
      const activityServicePutSpy = spyOn(desktopSyncService.activityService, "put").and.returnValue(
        Promise.reject(expectedPutError)
      );
      const syncEventNextSpy = spyOn(syncEvent$, "next").and.callThrough();
      const expectedStopError = "Unable to stop sync";
      const stopSpy = spyOn(desktopSyncService, "stop").and.returnValue(Promise.reject(expectedStopError));
      const throwSyncErrorSpy = spyOn(desktopSyncService, "throwSyncError").and.stub();

      // When
      desktopSyncService.handleActivityUpsert(syncEvent$, activitySyncEvent);

      // Then
      syncEvent$.subscribe(
        (syncEvent: ErrorSyncEvent) => {
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
        },
        error => {
          throw new Error("Should not be here!" + JSON.stringify(error));
        }
      );
    });
  });

  describe("Handle sync complete", () => {
    beforeEach(done => {
      desktopSyncService.currentConnectorType = ConnectorType.STRAVA;
      done();
    });

    it("should complete a first sync of a connector", done => {
      // Given
      const syncEvent$ = new Subject<SyncEvent>();
      const connectorType = ConnectorType.STRAVA;
      const completeSyncEvent = new CompleteSyncEvent(connectorType);
      const connectorSyncDateTime = new ConnectorSyncDateTime(connectorType, Date.now());
      const getSyncStateSpy = spyOn(desktopSyncService, "getSyncState").and.returnValue(
        Promise.resolve(SyncState.NOT_SYNCED)
      );
      const getConnectorSyncDateTimeByIdSpy = spyOn(
        desktopSyncService.connectorSyncDateTimeDao,
        "getById"
      ).and.returnValue(Promise.resolve(null));
      const upsertSyncDateTimesSpy = spyOn(desktopSyncService, "upsertConnectorsSyncDateTimes").and.returnValue(
        Promise.resolve([connectorSyncDateTime])
      );
      const syncEventDoneSpy = spyOn(desktopSyncService.appEventsService.syncDone$, "next").and.stub();

      // When
      desktopSyncService.handleSyncCompleteEvents(syncEvent$, completeSyncEvent);

      // Then
      syncEvent$.subscribe(
        () => {
          expect(getConnectorSyncDateTimeByIdSpy).toHaveBeenCalledWith(connectorType);
          const createdConnectorSyncDateTime: ConnectorSyncDateTime = upsertSyncDateTimesSpy.calls.mostRecent()
            .args[0][0];
          expect(createdConnectorSyncDateTime.connectorType).toEqual(connectorType);
          expect(getSyncStateSpy).toHaveBeenCalledTimes(1);
          expect(syncEventDoneSpy).toHaveBeenCalledTimes(1);
          done();
        },
        error => {
          throw new Error("Should not be here!" + JSON.stringify(error));
        }
      );
    });

    it("should complete sync of a already synced connector", done => {
      // Given
      const syncEvent$ = new Subject<SyncEvent>();
      const oldDateTime = 999;
      const connectorType = ConnectorType.STRAVA;
      const completeSyncEvent = new CompleteSyncEvent(connectorType);
      const connectorSyncDateTime = new ConnectorSyncDateTime(connectorType, oldDateTime);
      const getSyncStateSpy = spyOn(desktopSyncService, "getSyncState").and.returnValue(
        Promise.resolve(SyncState.SYNCED)
      );
      const getConnectorSyncDateTimeByIdSpy = spyOn(
        desktopSyncService.connectorSyncDateTimeDao,
        "getById"
      ).and.returnValue(Promise.resolve(connectorSyncDateTime));
      const upsertSyncDateTimesSpy = spyOn(desktopSyncService, "upsertConnectorsSyncDateTimes").and.returnValue(
        Promise.resolve([connectorSyncDateTime])
      );
      const syncEventDoneSpy = spyOn(desktopSyncService.appEventsService.syncDone$, "next").and.stub();

      // When
      desktopSyncService.handleSyncCompleteEvents(syncEvent$, completeSyncEvent);

      // Then
      syncEvent$.subscribe(
        () => {
          expect(connectorSyncDateTime.syncDateTime).toBeGreaterThan(oldDateTime);
          expect(getConnectorSyncDateTimeByIdSpy).toHaveBeenCalledWith(connectorType);
          expect(upsertSyncDateTimesSpy).toHaveBeenCalledWith([connectorSyncDateTime]);
          expect(getSyncStateSpy).toHaveBeenCalledTimes(1);
          expect(syncEventDoneSpy).toHaveBeenCalledTimes(1);
          done();
        },
        error => {
          throw new Error("Should not be here!" + JSON.stringify(error));
        }
      );
    });
  });

  describe("Handle sync stop", () => {
    it("should trigger sync stop", done => {
      // Given
      const sendSpy = spyOn(desktopSyncService.ipcMessagesSender, "send").and.returnValue(
        Promise.resolve("Stopped from main")
      );
      const connectorType = ConnectorType.FILE_SYSTEM;
      desktopSyncService.currentConnectorType = connectorType;
      const flaggedIpcMessage = new FlaggedIpcMessage(MessageFlag.STOP_SYNC, connectorType);

      // When
      const promise = desktopSyncService.stop();

      // Then
      promise.then(
        () => {
          expect(sendSpy).toHaveBeenCalledTimes(1);
          expect(sendSpy).toHaveBeenCalledWith(flaggedIpcMessage);
          done();
        },
        () => {
          throw new Error("Should not be here!");
        }
      );
    });

    it("should reject sync stop", done => {
      // Given
      const sendSpy = spyOn(desktopSyncService.ipcMessagesSender, "send").and.returnValue(
        Promise.reject("Unable to stop sync")
      );
      const connectorType = ConnectorType.FILE_SYSTEM;
      desktopSyncService.currentConnectorType = connectorType;
      const flaggedIpcMessage = new FlaggedIpcMessage(MessageFlag.STOP_SYNC, connectorType);

      // When
      const promise = desktopSyncService.stop();

      // Then
      promise.then(
        () => {
          throw new Error("Should not be here!");
        },
        () => {
          expect(sendSpy).toHaveBeenCalledTimes(1);
          expect(sendSpy).toHaveBeenCalledWith(flaggedIpcMessage);
          done();
        }
      );
    });
  });

  describe("Handle sync events", () => {
    it("should handle started sync events", done => {
      // Given
      const syncEvent$ = new Subject<SyncEvent>();
      desktopSyncService.activityUpsertDetected = true; // Emulate some activities have been upserted (even if value would be false)
      desktopSyncService.currentConnectorType = ConnectorType.STRAVA;
      const startedSyncEvent = new StartedSyncEvent(desktopSyncService.currentConnectorType);
      const resetTrackChangesSpy = spyOn(desktopSyncService, "resetActivityTrackingUpsert").and.callThrough();
      const syncEventNextSpy = spyOn(syncEvent$, "next").and.callThrough();

      // Then
      syncEvent$.subscribe(
        () => {
          expect(syncEventNextSpy).toHaveBeenCalledWith(startedSyncEvent);
          expect(resetTrackChangesSpy).toHaveBeenCalledTimes(1);
          expect(desktopSyncService.activityUpsertDetected).toBeFalsy();
          done();
        },
        error => {
          throw new Error("Should not be here!" + JSON.stringify(error));
        }
      );

      // When
      desktopSyncService.handleSyncEvents(syncEvent$, startedSyncEvent);
    });

    it("should handle activity sync events", done => {
      // Given
      const syncEvent$ = new Subject<SyncEvent>();
      desktopSyncService.activityUpsertDetected = false; // Emulate some activities have not been upserted before
      desktopSyncService.currentConnectorType = ConnectorType.STRAVA;
      const isNew = true;
      const activity = new SyncedActivityModel();
      activity.name = "No pain no gain";
      activity.start_time = new Date().toISOString();
      const activitySyncEvent = new ActivitySyncEvent(desktopSyncService.currentConnectorType, null, activity, isNew);
      const trackChangeSpy = spyOn(desktopSyncService, "trackActivityUpsert").and.callThrough();
      const activityServicePutSpy = spyOn(desktopSyncService.activityService, "put").and.returnValue(
        Promise.resolve(activity)
      );
      const syncEventNextSpy = spyOn(syncEvent$, "next").and.callThrough();

      // When
      desktopSyncService.handleSyncEvents(syncEvent$, activitySyncEvent);

      // Then
      syncEvent$.subscribe(
        () => {
          expect(activityServicePutSpy).toHaveBeenCalledWith(activity);
          expect(syncEventNextSpy).toHaveBeenCalledWith(activitySyncEvent);
          expect(trackChangeSpy).toHaveBeenCalledTimes(1);
          expect(desktopSyncService.activityUpsertDetected).toBeTruthy();
          done();
        },
        error => {
          throw new Error("Should not be here!" + JSON.stringify(error));
        }
      );
    });

    it("should handle stopped sync events", done => {
      // Given
      const syncEvent$ = new Subject<SyncEvent>();
      desktopSyncService.activityUpsertDetected = true; // Emulate some activities have been upserted
      desktopSyncService.currentConnectorType = ConnectorType.STRAVA;
      const stoppedSyncEvent = new StoppedSyncEvent(desktopSyncService.currentConnectorType);
      const resetTrackChangesSpy = spyOn(desktopSyncService, "resetActivityTrackingUpsert").and.callThrough();
      const syncEventNextSpy = spyOn(syncEvent$, "next").and.callThrough();

      // Then
      syncEvent$.subscribe(
        () => {
          expect(syncEventNextSpy).toHaveBeenCalledWith(stoppedSyncEvent);
          expect(resetTrackChangesSpy).toHaveBeenCalledTimes(1);
          expect(desktopSyncService.activityUpsertDetected).toBeFalsy();
          done();
        },
        error => {
          throw new Error("Should not be here!" + JSON.stringify(error));
        }
      );

      // When
      desktopSyncService.handleSyncEvents(syncEvent$, stoppedSyncEvent);
    });

    it("should handle strava credentials updates sync events", done => {
      // Given
      const syncEvent$ = new Subject<SyncEvent>();
      desktopSyncService.currentConnectorType = ConnectorType.STRAVA;
      const stravaCredentialsUpdateSyncEvent = new StravaCredentialsUpdateSyncEvent(
        new StravaConnectorInfo(null, null)
      );
      const syncEventNextSpy = spyOn(syncEvent$, "next").and.callThrough();

      // Then
      syncEvent$.subscribe(
        () => {
          expect(syncEventNextSpy).toHaveBeenCalledWith(stravaCredentialsUpdateSyncEvent);
          done();
        },
        error => {
          throw new Error("Should not be here!" + JSON.stringify(error));
        }
      );

      // When
      desktopSyncService.handleSyncEvents(syncEvent$, stravaCredentialsUpdateSyncEvent);
    });

    it("should handle complete sync events", done => {
      // Given
      const syncEvent$ = new Subject<SyncEvent>();
      const expectedDetected = true;
      const connectorType = ConnectorType.STRAVA;
      desktopSyncService.activityUpsertDetected = true; // Emulate some activities have been upserted
      desktopSyncService.currentConnectorType = connectorType;
      const connectorSyncDateTime = new ConnectorSyncDateTime(connectorType, Date.now());
      const completeSyncEvent = new CompleteSyncEvent(desktopSyncService.currentConnectorType);
      const handleSyncCompleteEventsSpy = spyOn(desktopSyncService, "handleSyncCompleteEvents").and.callThrough();
      spyOn(desktopSyncService, "getSyncState").and.returnValue(Promise.resolve(SyncState.SYNCED));
      spyOn(desktopSyncService.connectorSyncDateTimeDao, "getById").and.returnValue(Promise.resolve(null));
      spyOn(desktopSyncService, "upsertConnectorsSyncDateTimes").and.returnValue(
        Promise.resolve([connectorSyncDateTime])
      );
      const onSyncDoneSpy = spyOn(desktopSyncService.appEventsService.syncDone$, "next");
      const resetTrackChangesSpy = spyOn(desktopSyncService, "resetActivityTrackingUpsert").and.callThrough();
      const syncEventNextSpy = spyOn(syncEvent$, "next").and.callThrough();

      // When
      desktopSyncService.handleSyncEvents(syncEvent$, completeSyncEvent);

      // Then
      syncEvent$.subscribe(
        () => {
          expect(handleSyncCompleteEventsSpy).toHaveBeenCalledWith(syncEvent$, completeSyncEvent);
          expect(syncEventNextSpy).toHaveBeenCalledWith(completeSyncEvent);
          expect(onSyncDoneSpy).toHaveBeenCalledWith(expectedDetected);
          expect(resetTrackChangesSpy).toHaveBeenCalledTimes(1);
          done();
        },
        error => {
          throw new Error("Should not be here!" + JSON.stringify(error));
        }
      );
    });

    it("should forward error sync events", done => {
      // Given
      const syncEvent$ = new Subject<SyncEvent>();
      desktopSyncService.currentConnectorType = ConnectorType.STRAVA;
      const errorSyncEvent = ErrorSyncEvent.SYNC_ALREADY_STARTED.create(desktopSyncService.currentConnectorType);
      const resetTrackChangesSpy = spyOn(desktopSyncService, "resetActivityTrackingUpsert").and.callThrough();
      const handleErrorSyncEventsSpy = spyOn(desktopSyncService, "handleErrorSyncEvents").and.callThrough();

      // When
      desktopSyncService.handleSyncEvents(syncEvent$, errorSyncEvent);

      // Then
      expect(handleErrorSyncEventsSpy).toHaveBeenCalledTimes(1);
      expect(resetTrackChangesSpy).toHaveBeenCalledTimes(1);
      done();
    });

    it("should throw SyncException when SyncEventType is unknown", done => {
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
    it("should catch SyncException when triggering standard error", done => {
      // Given
      const message = "whoops";
      const sourceError = new Error(message);

      // When
      try {
        desktopSyncService.throwSyncError(sourceError);
      } catch (syncException) {
        // Then
        expect(syncException).toBeDefined();
        expect(syncException instanceof SyncException).toBeTruthy();
        expect(syncException.message).toEqual(message);
        expect(syncException.stack).toEqual(sourceError.stack);
        expect(syncException.message).toEqual(sourceError.message);

        done();
      }
    });

    it("should catch SyncException when triggering a SyncException", done => {
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
        expect(syncException instanceof SyncException).toBeTruthy();
        expect((syncException as SyncException).errorSyncEvent).toEqual(errorSyncEvent);

        done();
      }
    });

    it("should catch SyncException when triggering a error string only", done => {
      // Given
      const message = "whoops";

      // When
      try {
        desktopSyncService.throwSyncError(message);
      } catch (syncException) {
        // Then
        expect(syncException).toBeDefined();
        expect(syncException.message).toEqual(message);
        expect(syncException instanceof SyncException).toBeTruthy();
        expect(syncException.errorSyncEvent).toBeNull();

        done();
      }
    });

    it("should catch SyncException when triggering an unknown type", done => {
      // Given
      const message = {};
      const expectedMessage = "{}";

      // When
      try {
        desktopSyncService.throwSyncError(message as any);
      } catch (syncException) {
        // Then
        expect(syncException).toBeDefined();
        expect(syncException.message).toEqual(expectedMessage);
        expect(syncException instanceof SyncException).toBeTruthy();
        expect(syncException.errorSyncEvent).toBeNull();

        done();
      }
    });

    it("should catch multiple Error and throw them as SyncException array", done => {
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
        expect(syncExceptions[0] instanceof SyncException).toBeTruthy();
        expect(syncExceptions[1] instanceof SyncException).toBeTruthy();

        done();
      }
    });

    it("should catch (Error + SyncException) and throw them as SyncException array", done => {
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
        expect(syncExceptions[0] instanceof SyncException).toBeTruthy();
        expect(syncExceptions[1] instanceof SyncException).toBeTruthy();
        expect(syncExceptions[1].errorSyncEvent).toEqual(errorSyncEvent);

        done();
      }
    });

    it("should catch multiple String errors throw them as SyncException array", done => {
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
        expect(syncExceptions[0] instanceof SyncException).toBeTruthy();
        expect(syncExceptions[1] instanceof SyncException).toBeTruthy();
        expect(syncExceptions[0].errorSyncEvent).toBeNull();
        expect(syncExceptions[1].errorSyncEvent).toBeNull();

        done();
      }
    });
  });

  describe("Handle error sync events", () => {
    it("should handle SYNC_ERROR_COMPUTE events and stop sync", done => {
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
      expect(stopSpy).not.toHaveBeenCalled();
      done();
    });

    it("should handle UNHANDLED_ERROR_SYNC events and stop sync", done => {
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

    it("should handle SYNC_ERROR_UPSERT_ACTIVITY_DATABASE events and stop sync", done => {
      // Given
      const syncEvent$ = new Subject<SyncEvent>();
      desktopSyncService.currentConnectorType = ConnectorType.STRAVA;
      const activity = { name: "fakeActivity" } as SyncedActivityModel;
      const errorSyncEvent = ErrorSyncEvent.SYNC_ERROR_UPSERT_ACTIVITY_DATABASE.create(
        desktopSyncService.currentConnectorType,
        activity
      );
      const syncEventNextSpy = spyOn(syncEvent$, "next").and.callThrough();
      const stopSpy = spyOn(desktopSyncService, "stop").and.returnValue(Promise.resolve());

      // When
      desktopSyncService.handleErrorSyncEvents(syncEvent$, errorSyncEvent);

      // Then
      expect(syncEventNextSpy).toHaveBeenCalledTimes(1);
      expect(stopSpy).toHaveBeenCalledTimes(1);
      done();
    });

    it("should handle STRAVA_API_UNAUTHORIZED events and stop sync", done => {
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

    it("should handle STRAVA_API_FORBIDDEN events and stop sync", done => {
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

    it("should handle STRAVA_INSTANT_QUOTA_REACHED events and stop sync", done => {
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

    it("should handle STRAVA_DAILY_QUOTA_REACHED events and stop sync", done => {
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

    it("should handle MULTIPLE_ACTIVITIES_FOUND events and do nothing", done => {
      // Given
      const syncEvent$ = new Subject<SyncEvent>();
      desktopSyncService.currentConnectorType = ConnectorType.STRAVA;
      const errorSyncEvent = ErrorSyncEvent.MULTIPLE_ACTIVITIES_FOUND.create(
        desktopSyncService.currentConnectorType,
        "fakeActivity",
        new Date(),
        []
      );
      const syncEventNextSpy = spyOn(syncEvent$, "next").and.callThrough();
      const stopSpy = spyOn(desktopSyncService, "stop").and.returnValue(Promise.resolve());

      // When
      desktopSyncService.handleErrorSyncEvents(syncEvent$, errorSyncEvent);

      // Then
      expect(syncEventNextSpy).toHaveBeenCalledTimes(1);
      expect(stopSpy).not.toHaveBeenCalled();
      done();
    });

    it("should handle SYNC_ALREADY_STARTED events and do nothing", done => {
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

    it("should handle STRAVA_API_RESOURCE_NOT_FOUND events and do nothing", done => {
      // Given
      const syncEvent$ = new Subject<SyncEvent>();
      desktopSyncService.currentConnectorType = ConnectorType.STRAVA;
      const errorSyncEvent = ErrorSyncEvent.STRAVA_API_RESOURCE_NOT_FOUND.create(
        desktopSyncService.currentConnectorType
      );
      const syncEventNextSpy = spyOn(syncEvent$, "next").and.callThrough();
      const stopSpy = spyOn(desktopSyncService, "stop").and.returnValue(Promise.resolve());

      // When
      desktopSyncService.handleErrorSyncEvents(syncEvent$, errorSyncEvent);

      // Then
      expect(syncEventNextSpy).toHaveBeenCalledTimes(1);
      expect(stopSpy).not.toHaveBeenCalled();
      done();
    });

    it("should handle STRAVA_API_TIMEOUT events and do nothing", done => {
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

    it("should handle FS_SOURCE_DIRECTORY_DONT_EXISTS events and stop sync", done => {
      // Given
      const syncEvent$ = new Subject<SyncEvent>();
      desktopSyncService.currentConnectorType = ConnectorType.FILE_SYSTEM;
      const fakseSourceDirectory = "/fake/source/dir/path";
      const errorSyncEvent = ErrorSyncEvent.FS_SOURCE_DIRECTORY_DONT_EXISTS.create(fakseSourceDirectory, null);
      const syncEventNextSpy = spyOn(syncEvent$, "next").and.callThrough();
      const stopSpy = spyOn(desktopSyncService, "stop").and.returnValue(Promise.resolve());

      // When
      desktopSyncService.handleErrorSyncEvents(syncEvent$, errorSyncEvent);

      // Then
      expect(syncEventNextSpy).toHaveBeenCalledTimes(1);
      expect(stopSpy).toHaveBeenCalledTimes(1);
      done();
    });

    it("should throw when error is not ErrorSyncEvent instance", done => {
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

    it("should throw when ErrorSyncEvent code is unknown ", done => {
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

    it("should handle STRAVA_API_UNAUTHORIZED events, try to stop sync with failure", done => {
      // Given
      const syncEvent$ = new Subject<SyncEvent>();
      desktopSyncService.currentConnectorType = ConnectorType.STRAVA;
      const errorSyncEvent = ErrorSyncEvent.STRAVA_API_UNAUTHORIZED.create();
      const syncEventNextSpy = spyOn(syncEvent$, "next").and.callThrough();
      const expectedStopError = "Unable to stop sync";
      const stopSpy = spyOn(desktopSyncService, "stop").and.returnValue(Promise.reject(expectedStopError));
      const throwSyncErrorSpy = spyOn(desktopSyncService, "throwSyncError").and.stub();

      // Then
      syncEvent$.subscribe(
        () => {
          setTimeout(() => {
            expect(syncEventNextSpy).toHaveBeenCalledTimes(1);
            expect(stopSpy).toHaveBeenCalledTimes(1);
            expect(throwSyncErrorSpy).toHaveBeenCalledTimes(1);
            expect(throwSyncErrorSpy).toHaveBeenCalledWith(expectedStopError);
            done();
          });
        },
        error => {
          throw new Error("Should not be here!" + JSON.stringify(error));
        }
      );

      // When
      desktopSyncService.handleErrorSyncEvents(syncEvent$, errorSyncEvent);
    });
  });

  describe("Provide sync state", () => {
    it("should provide NOT_SYNCED state", done => {
      // Given
      const expectedState = SyncState.NOT_SYNCED;
      const findSpy = spyOn(desktopSyncService.connectorSyncDateTimeDao, "find").and.returnValue(Promise.resolve([]));

      const activityServiceSpy = spyOn(desktopSyncService.activityService, "count").and.returnValue(Promise.resolve(0));

      // When
      const promise = desktopSyncService.getSyncState();

      // Then
      promise.then(
        syncState => {
          expect(syncState).toEqual(expectedState);
          expect(findSpy).toHaveBeenCalledTimes(1);
          expect(activityServiceSpy).toHaveBeenCalledTimes(1);
          done();
        },
        () => {
          throw new Error("Should not be here!");
        }
      );
    });

    it("should provide SYNCED state (2/2 connectors synced)", done => {
      // Given
      const expectedState = SyncState.SYNCED;
      const connectorSyncDateTimes: ConnectorSyncDateTime[] = [
        new ConnectorSyncDateTime(ConnectorType.STRAVA, 11111),
        new ConnectorSyncDateTime(ConnectorType.FILE_SYSTEM, 22222)
      ];

      const findSpy = spyOn(desktopSyncService.connectorSyncDateTimeDao, "find").and.returnValue(
        Promise.resolve(connectorSyncDateTimes)
      );

      const activityServiceSpy = spyOn(desktopSyncService.activityService, "count").and.returnValue(
        Promise.resolve(TEST_SYNCED_ACTIVITIES.length)
      );

      // When
      const promise = desktopSyncService.getSyncState();

      // Then
      promise.then(
        syncState => {
          expect(syncState).toEqual(expectedState);
          expect(findSpy).toHaveBeenCalledTimes(1);
          expect(activityServiceSpy).toHaveBeenCalledTimes(1);
          done();
        },
        () => {
          throw new Error("Should not be here!");
        }
      );
    });

    it("should provide SYNCED state (1/2 connector synced)", done => {
      // Given
      const expectedState = SyncState.SYNCED;
      const connectorSyncDateTimes: ConnectorSyncDateTime[] = [
        new ConnectorSyncDateTime(ConnectorType.STRAVA, 11111) // Only one !
      ];

      const findSpy = spyOn(desktopSyncService.connectorSyncDateTimeDao, "find").and.returnValue(
        Promise.resolve(connectorSyncDateTimes)
      );

      const activityServiceSpy = spyOn(desktopSyncService.activityService, "count").and.returnValue(
        Promise.resolve(TEST_SYNCED_ACTIVITIES.length)
      );

      // When
      const promise = desktopSyncService.getSyncState();

      // Then
      promise.then(
        syncState => {
          expect(syncState).toEqual(expectedState);
          expect(findSpy).toHaveBeenCalledTimes(1);
          expect(activityServiceSpy).toHaveBeenCalledTimes(1);
          done();
        },
        () => {
          throw new Error("Should not be here!");
        }
      );
    });

    it("should provide SYNCED state (2/2 connector synced and no activities)", done => {
      // Given
      const expectedState = SyncState.SYNCED;
      const connectorSyncDateTimes: ConnectorSyncDateTime[] = [
        new ConnectorSyncDateTime(ConnectorType.STRAVA, 11111),
        new ConnectorSyncDateTime(ConnectorType.FILE_SYSTEM, 22222)
      ];

      const findSpy = spyOn(desktopSyncService.connectorSyncDateTimeDao, "find").and.returnValue(
        Promise.resolve(connectorSyncDateTimes)
      );

      const activityServiceSpy = spyOn(desktopSyncService.activityService, "count").and.returnValue(Promise.resolve(0));

      // When
      const promise = desktopSyncService.getSyncState();

      // Then
      promise.then(
        syncState => {
          expect(syncState).toEqual(expectedState);
          expect(findSpy).toHaveBeenCalledTimes(1);
          expect(activityServiceSpy).toHaveBeenCalledTimes(1);
          done();
        },
        () => {
          throw new Error("Should not be here!");
        }
      );
    });

    it("should provide SYNCED state (1/2 connector synced and no activities)", done => {
      // Given
      const expectedState = SyncState.SYNCED;
      const connectorSyncDateTimes: ConnectorSyncDateTime[] = [new ConnectorSyncDateTime(ConnectorType.STRAVA, 11111)];

      const findSpy = spyOn(desktopSyncService.connectorSyncDateTimeDao, "find").and.returnValue(
        Promise.resolve(connectorSyncDateTimes)
      );

      const activityServiceSpy = spyOn(desktopSyncService.activityService, "count").and.returnValue(Promise.resolve(0));

      // When
      const promise = desktopSyncService.getSyncState();

      // Then
      promise.then(
        syncState => {
          expect(syncState).toEqual(expectedState);
          expect(findSpy).toHaveBeenCalledTimes(1);
          expect(activityServiceSpy).toHaveBeenCalledTimes(1);
          done();
        },
        () => {
          throw new Error("Should not be here!");
        }
      );
    });

    it("should provide PARTIALLY_SYNCED state (0/2 connector synced and some activities stored)", done => {
      // Given
      const expectedState = SyncState.PARTIALLY_SYNCED;
      const connectorSyncDateTimes: ConnectorSyncDateTime[] = [];

      const findSpy = spyOn(desktopSyncService.connectorSyncDateTimeDao, "find").and.returnValue(
        Promise.resolve(connectorSyncDateTimes)
      );

      const activityServiceSpy = spyOn(desktopSyncService.activityService, "count").and.returnValue(
        Promise.resolve(TEST_SYNCED_ACTIVITIES.length)
      );

      // When
      const promise = desktopSyncService.getSyncState();

      // Then
      promise.then(
        syncState => {
          expect(syncState).toEqual(expectedState);
          expect(findSpy).toHaveBeenCalledTimes(1);
          expect(activityServiceSpy).toHaveBeenCalledTimes(1);
          done();
        },
        () => {
          throw new Error("Should not be here!");
        }
      );
    });
  });

  describe("Provide access and modify sync date time", () => {
    it("should get sync date times from synced connectors", done => {
      // Given
      const connectorSyncDateTimes: ConnectorSyncDateTime[] = [
        new ConnectorSyncDateTime(ConnectorType.STRAVA, 11111),
        new ConnectorSyncDateTime(ConnectorType.FILE_SYSTEM, 22222)
      ];

      const findSpy = spyOn(desktopSyncService.connectorSyncDateTimeDao, "find").and.returnValue(
        Promise.resolve(connectorSyncDateTimes)
      );

      // When
      const promise = desktopSyncService.getConnectorSyncDateTime();

      // Then
      promise.then(
        () => {
          expect(findSpy).toHaveBeenCalledTimes(1);
          done();
        },
        () => {
          throw new Error("Should not be here!");
        }
      );
    });

    it("should get the most recent connector synced", done => {
      // Given
      const expectedConnector = new ConnectorSyncDateTime(ConnectorType.FILE_SYSTEM, 22222);
      const connectorSyncDateTimes: ConnectorSyncDateTime[] = [
        new ConnectorSyncDateTime(ConnectorType.STRAVA, 11111),
        expectedConnector
      ];

      const findSpy = spyOn(desktopSyncService.connectorSyncDateTimeDao, "find").and.returnValue(
        Promise.resolve(connectorSyncDateTimes)
      );

      // When
      const promise = desktopSyncService.getMostRecentSyncedConnector();

      // Then
      promise.then(
        (mostRecentConnectorSynced: ConnectorSyncDateTime) => {
          expect(findSpy).toHaveBeenCalledTimes(1);
          expect(mostRecentConnectorSynced).toEqual(expectedConnector);
          done();
        },
        () => {
          throw new Error("Should not be here!");
        }
      );
    });

    it("should upsert sync date times of synced connectors", done => {
      // Given
      const connectorSyncDateTimesToSave: ConnectorSyncDateTime[] = [
        new ConnectorSyncDateTime(ConnectorType.STRAVA, 11111),
        new ConnectorSyncDateTime(ConnectorType.FILE_SYSTEM, 22222)
      ];

      spyOn(desktopSyncService.connectorSyncDateTimeDao, "find").and.returnValue(
        Promise.resolve(connectorSyncDateTimesToSave)
      );

      const putSpy = spyOn(desktopSyncService.connectorSyncDateTimeDao, "put").and.returnValues(
        Promise.resolve(connectorSyncDateTimesToSave[0]),
        Promise.resolve(connectorSyncDateTimesToSave[1])
      );

      // When
      const promise = desktopSyncService.upsertConnectorsSyncDateTimes(connectorSyncDateTimesToSave);

      // Then
      promise.then(
        () => {
          expect(putSpy).toHaveBeenCalledTimes(2);
          expect(putSpy).toHaveBeenCalledWith(connectorSyncDateTimesToSave[0]);
          expect(putSpy).toHaveBeenCalledWith(connectorSyncDateTimesToSave[1]);
          done();
        },
        () => {
          throw new Error("Should not be here!");
        }
      );
    });

    it("should reject upsert if connectors sync date times param is not an array", done => {
      // Given
      const expectedErrorMesage = "connectorSyncDateTimes param must be an array";
      const connectorSyncDateTime = new ConnectorSyncDateTime(ConnectorType.STRAVA, 11111); // No array

      // When
      const call = () => {
        desktopSyncService.upsertConnectorsSyncDateTimes(connectorSyncDateTime as any);
      };

      // Then
      expect(call).toThrow(new Error(expectedErrorMesage));
      done();
    });

    it("should clear sync date times of synced connectors", done => {
      // Given
      const clearSpy = spyOn(desktopSyncService.connectorSyncDateTimeDao, "clear").and.returnValue(Promise.resolve());

      // When
      const promise = desktopSyncService.clearSyncTime();

      // Then
      promise.then(
        () => {
          expect(clearSpy).toHaveBeenCalledTimes(1);
          done();
        },
        () => {
          throw new Error("Should not be here!");
        }
      );
    });
  });
});
