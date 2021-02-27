import { Channel, IpcMessage, IpcTunnelService } from "@elevate/shared/electron";
import {
  ActivityComputer,
  CompleteSyncEvent,
  ConnectorType,
  ErrorSyncEvent,
  FileConnectorInfo,
  GenericSyncEvent,
  SyncEvent
} from "@elevate/shared/sync";
import { Subject } from "rxjs";
import { IpcMainTunnelService } from "../ipc-main-tunnel.service";
import { container } from "tsyringe";
import { ConnectorSyncService } from "./connector-sync.service";
import { FileConnector } from "./file/file.connector";
import { StravaConnector } from "./strava/strava.connector";
import { StravaConnectorConfig } from "./connector-config.model";
import {
  AnalysisDataModel,
  AthleteSettingsModel,
  AthleteSnapshotModel,
  Gender,
  Streams,
  SyncedActivityModel
} from "@elevate/shared/models";
import { ElevateException } from "@elevate/shared/exceptions";
import _ from "lodash";

describe("ConnectorSyncService", () => {
  const currentConnectorSyncDateTime = null;
  const athleteModel = null;
  const connectorInfo = null;
  const userSettingsModel = null;

  let connectorSyncService: ConnectorSyncService;
  let ipcTunnelService: IpcTunnelService;
  let stravaConnector: StravaConnector;
  let fileConnector: FileConnector;

  beforeEach(done => {
    connectorSyncService = container.resolve(ConnectorSyncService);
    ipcTunnelService = container.resolve(IpcMainTunnelService);
    stravaConnector = container.resolve(StravaConnector);
    fileConnector = container.resolve(FileConnector);

    const stravaConnectorConfig: StravaConnectorConfig = {
      connectorSyncDateTime: currentConnectorSyncDateTime,
      athleteModel: athleteModel,
      userSettingsModel: userSettingsModel,
      info: connectorInfo
    };
    stravaConnector = stravaConnector.configure(stravaConnectorConfig);

    const fileConnectorConfig = {
      connectorSyncDateTime: currentConnectorSyncDateTime,
      athleteModel: athleteModel,
      userSettingsModel: userSettingsModel,
      athleteMachineId: null,
      info: connectorInfo
    };

    fileConnector = fileConnector.configure(fileConnectorConfig);

    done();
  });

  describe("Handle start sync", () => {
    it("should start strava connector sync", done => {
      // Given
      const connectorType = ConnectorType.STRAVA;
      const expected = "Started sync of connector " + connectorType;
      const stravaConnectorSyncCalls = 1;
      const configureStravaConnectorSpy = spyOn(stravaConnector, "configure").and.callThrough();
      const stravaConnectorSyncSpy = spyOn(stravaConnector, "sync").and.returnValue(new Subject<SyncEvent>());

      // When
      const promise = connectorSyncService.sync(
        connectorType,
        currentConnectorSyncDateTime,
        connectorInfo,
        athleteModel,
        userSettingsModel
      );

      // Then
      promise.then(result => {
        expect(configureStravaConnectorSpy).toBeCalledTimes(1);
        expect(connectorSyncService.currentConnector).not.toBeNull();
        expect(stravaConnectorSyncSpy).toBeCalledTimes(stravaConnectorSyncCalls);
        expect(result).toEqual(expected);
        done();
      });
    });

    it("should start file connector sync", done => {
      // Given
      const fileConnectorInfo = new FileConnectorInfo("/path/to/dir/");
      const connectorType = ConnectorType.FILE;
      const expected = "Started sync of connector " + connectorType;
      const fsConnectorSyncCalls = 1;
      const configureFileConnectorSpy = spyOn(fileConnector, "configure").and.callThrough();
      const fileConnectorSyncSpy = spyOn(fileConnector, "sync").and.returnValue(new Subject<SyncEvent>());

      // When
      const promise = connectorSyncService.sync(
        connectorType,
        currentConnectorSyncDateTime,
        fileConnectorInfo,
        athleteModel,
        userSettingsModel
      );

      // Then
      promise.then(result => {
        expect(configureFileConnectorSpy).toBeCalled();
        expect(connectorSyncService.currentConnector).not.toBeNull();
        expect(fileConnectorSyncSpy).toBeCalledTimes(fsConnectorSyncCalls);
        expect(result).toEqual(expected);
        done();
      });
    });

    it("should not start a sync already running", done => {
      // Given
      connectorSyncService.currentConnector = fileConnector;
      connectorSyncService.currentConnector.isSyncing = true;
      const syncSpy = spyOn(connectorSyncService.currentConnector, "sync").and.stub();

      const expected =
        "Impossible to start a new sync. Another sync is already running on connector " + ConnectorType.FILE;

      // When
      const promise = connectorSyncService.sync(ConnectorType.STRAVA, null, null, null, null);

      // Then
      promise
        .then(() => {
          throw new Error("Should not be here");
        })
        .catch(err => {
          expect(connectorSyncService.currentConnector).not.toBeNull();
          expect(err).toEqual(expected);
          expect(syncSpy).not.toBeCalled();
          done();
        });
    });

    it("should send sync events (inc sync 'non-stop' errors) to IpcRenderer", done => {
      // Given
      const syncEvent$ = new Subject<SyncEvent>();
      const fakeGenericSyncEvent = new GenericSyncEvent(ConnectorType.STRAVA, "Fake event");
      const expectedMessageSent = new IpcMessage(Channel.syncEvent, fakeGenericSyncEvent);
      const expected = "Started sync of connector " + ConnectorType.STRAVA;
      const stravaConnectorSyncCalls = 1;
      const configureStravaConnectorSpy = spyOn(stravaConnector, "configure").and.returnValue(stravaConnector);
      const stravaConnectorSyncSpy = spyOn(stravaConnector, "sync").and.returnValue(syncEvent$);
      const sendMessageSpy = spyOn(ipcTunnelService, "send").and.returnValue(
        Promise.resolve("Message received by IpcMain")
      );

      // When
      const promise = connectorSyncService.sync(
        ConnectorType.STRAVA,
        athleteModel,
        connectorInfo,
        userSettingsModel,
        connectorInfo
      );

      syncEvent$.next(fakeGenericSyncEvent);

      // Then
      promise.then(result => {
        expect(configureStravaConnectorSpy).toBeCalled();
        expect(connectorSyncService.currentConnector).not.toBeNull();
        expect(stravaConnectorSyncSpy).toBeCalledTimes(stravaConnectorSyncCalls);
        expect(result).toEqual(expected);
        expect(sendMessageSpy).toBeCalledWith(expectedMessageSent);
        done();
      });
    });

    it("should send error sync events raised (sync 'stop' errors) to IpcRenderer", done => {
      // Given
      const syncEvent$ = new Subject<SyncEvent>();
      const fakeErrorSyncEvent = new ErrorSyncEvent(ConnectorType.STRAVA, {
        code: "fake_code",
        description: "fake_desc",
        stacktrace: "fake_stack"
      });
      const expectedMessageSent = new IpcMessage(Channel.syncEvent, fakeErrorSyncEvent);
      const expected = "Started sync of connector " + ConnectorType.STRAVA;
      const stravaConnectorSyncCalls = 1;
      const configureStravaConnectorSpy = spyOn(stravaConnector, "configure").and.callThrough();
      const stravaConnectorSyncSpy = spyOn(stravaConnector, "sync").and.returnValue(syncEvent$);
      const sendMessageSpy = spyOn(ipcTunnelService, "send").and.returnValue(
        Promise.resolve("Message received by IpcMain")
      );

      // When
      const promise = connectorSyncService.sync(
        ConnectorType.STRAVA,
        athleteModel,
        connectorInfo,
        userSettingsModel,
        connectorInfo
      );
      syncEvent$.error(fakeErrorSyncEvent);

      // Then
      promise.then(result => {
        expect(configureStravaConnectorSpy).toBeCalled();
        expect(stravaConnectorSyncSpy).toBeCalledTimes(stravaConnectorSyncCalls);
        expect(result).toEqual(expected);
        expect(sendMessageSpy).toBeCalledWith(expectedMessageSent);
      });

      syncEvent$.subscribe(
        () => {
          throw new Error("Test fail!");
        },
        error => {
          expect(error).toEqual(fakeErrorSyncEvent);
          expect(connectorSyncService.currentConnector).toBeNull();
          done();
        },
        () => {
          throw new Error("Test fail!");
        }
      );
    });

    it("should send complete sync events to IpcRenderer", done => {
      // Given
      const syncEvent$ = new Subject<SyncEvent>();
      const fakeCompleteSyncEvent = new CompleteSyncEvent(ConnectorType.STRAVA, "Sync done");
      const expectedFlaggedMessageSent = new IpcMessage(Channel.syncEvent, fakeCompleteSyncEvent);
      const expected = "Started sync of connector " + ConnectorType.STRAVA;
      const stravaConnectorSyncCalls = 1;
      const configureStravaConnectorSpy = spyOn(stravaConnector, "configure").and.callThrough();
      const stravaConnectorSyncSpy = spyOn(stravaConnector, "sync").and.returnValue(syncEvent$);
      const sendMessageSpy = spyOn(ipcTunnelService, "send").and.returnValue(
        Promise.resolve("Message received by IpcMain")
      );

      // When
      const promise = connectorSyncService.sync(
        ConnectorType.STRAVA,
        athleteModel,
        connectorInfo,
        userSettingsModel,
        connectorInfo
      );
      syncEvent$.complete();

      // Then
      promise.then(result => {
        expect(configureStravaConnectorSpy).toBeCalled();
        expect(stravaConnectorSyncSpy).toBeCalledTimes(stravaConnectorSyncCalls);
        expect(result).toEqual(expected);
        expect(sendMessageSpy).toBeCalledWith(expectedFlaggedMessageSent);
      });

      syncEvent$.subscribe(
        () => {
          throw new Error("Test fail!");
        },
        () => {
          throw new Error("Test fail!");
        },
        () => {
          expect(connectorSyncService.currentConnector).toBeNull();
          done();
        }
      );
    });
  });

  describe("Handle sync stop", () => {
    it("should stop current sync", done => {
      // Given
      connectorSyncService.currentConnector = stravaConnector;

      const stopConnectorSyncSpy = spyOn(stravaConnector, "stop").and.returnValue(Promise.resolve());

      // When
      const promise = connectorSyncService.stop(connectorSyncService.currentConnector.type);

      // Then
      promise.then(result => {
        expect(result).toBeDefined();
        expect(stopConnectorSyncSpy).toBeCalledTimes(1);
        done();
      });
    });

    it("should not stop sync if no connector is mapped to service", done => {
      // Given
      const expected = "No existing connector found to stop sync";
      connectorSyncService.currentConnector = null;
      const stopConnectorSyncSpy = spyOn(stravaConnector, "stop").and.stub();

      // When
      const promise = connectorSyncService.stop(ConnectorType.STRAVA);

      // Then
      promise
        .then(() => {
          throw new Error("Should not be here");
        })
        .catch(err => {
          expect(stopConnectorSyncSpy).not.toBeCalled();
          expect(err).toEqual(expected);
          done();
        });
    });

    it("should not stop sync of a given connector if current connector syncing has different type", done => {
      // Given
      const connectorType = ConnectorType.STRAVA;
      const expected = `Trying to stop a sync on ${connectorType} connector but current connector synced type is: ${ConnectorType.FILE}`;

      connectorSyncService.currentConnector = fileConnector;
      const stopConnectorSyncSpy = spyOn(fileConnector, "stop").and.callThrough();

      // When
      const promise = connectorSyncService.stop(connectorType);

      // Then
      promise
        .then(() => {
          throw new Error("Should not be here");
        })
        .catch(err => {
          expect(stopConnectorSyncSpy).not.toBeCalled();
          expect(err).toEqual(expected);
          done();
        });
    });
  });

  describe("Handle compute activity (case: fix activities, recompute single activity)", () => {
    it("should compute activity", done => {
      // Given
      const syncedActivityModel = new SyncedActivityModel();
      syncedActivityModel.name = "My activity";
      syncedActivityModel.start_time = new Date().toISOString();
      const athleteSnapshotModel = new AthleteSnapshotModel(Gender.MEN, AthleteSettingsModel.DEFAULT_MODEL);
      const streams = new Streams();
      const analysisDataModel = new AnalysisDataModel();

      const calculateSpy = spyOn(ActivityComputer, "calculate").and.returnValue(analysisDataModel);

      // When
      const promise = connectorSyncService.computeActivity(
        syncedActivityModel,
        userSettingsModel,
        athleteSnapshotModel,
        streams
      );

      // Then
      promise.then(activity => {
        expect(calculateSpy).toBeCalledTimes(1);
        expect(activity).toBeInstanceOf(SyncedActivityModel);
        expect(activity.athleteSnapshot).toEqual(athleteSnapshotModel);
        done();
      });
    });

    it("should compute activity without streams", done => {
      // Given
      const syncedActivityModel = new SyncedActivityModel();
      syncedActivityModel.name = "My activity";
      syncedActivityModel.start_time = new Date().toISOString();
      const athleteSnapshotModel = new AthleteSnapshotModel(Gender.MEN, AthleteSettingsModel.DEFAULT_MODEL);
      const streams = null;
      const analysisDataModel = new AnalysisDataModel();

      const calculateSpy = spyOn(ActivityComputer, "calculate").and.returnValue(analysisDataModel);

      // When
      const promise = connectorSyncService.computeActivity(
        syncedActivityModel,
        userSettingsModel,
        athleteSnapshotModel,
        streams
      );

      // Then
      promise.then(activity => {
        expect(calculateSpy).toBeCalledTimes(1);
        expect(activity).toBeInstanceOf(SyncedActivityModel);
        expect(activity.athleteSnapshot).toEqual(athleteSnapshotModel);
        done();
      });
    });

    it("should reject compute activity", done => {
      // Given
      const syncedActivityModel = new SyncedActivityModel();
      syncedActivityModel.name = "My activity";
      syncedActivityModel.start_time = new Date().toISOString();
      const athleteSnapshotModel = new AthleteSnapshotModel(Gender.MEN, AthleteSettingsModel.DEFAULT_MODEL);
      const streams = new Streams();
      const analysisDataModel = new AnalysisDataModel();
      const expectedSyncedActivityModel = _.cloneDeep(syncedActivityModel);
      expectedSyncedActivityModel.extendedStats = analysisDataModel;
      expectedSyncedActivityModel.athleteSnapshot = athleteSnapshotModel;
      const expectedErrorMessage = `unable to calculate activity ${syncedActivityModel.name} started at ${syncedActivityModel.start_timestamp}: Whoops.`;
      const expectedElevateException = new ElevateException(expectedErrorMessage);

      const calculateSpy = spyOn(ActivityComputer, "calculate").and.callFake(() => {
        throw expectedElevateException;
      });

      // When
      const promise = connectorSyncService.computeActivity(
        syncedActivityModel,
        userSettingsModel,
        athleteSnapshotModel,
        streams
      );

      // Then
      promise
        .then(() => {
          throw new Error("Should not be here");
        })
        .catch(err => {
          expect(calculateSpy).toBeCalledTimes(1);
          expect(err).toEqual(expectedElevateException);
          done();
        });
    });
  });
});
