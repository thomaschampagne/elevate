import { FlaggedIpcMessage, MessageFlag } from "@elevate/shared/electron";
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
import { IpcMessagesSender } from "../messages/ipc-messages.sender";
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
  let ipcMessagesSender: IpcMessagesSender;
  let stravaConnector: StravaConnector;
  let fileConnector: FileConnector;

  beforeEach(done => {
    connectorSyncService = container.resolve(ConnectorSyncService);
    ipcMessagesSender = container.resolve(IpcMessagesSender);
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
      const flaggedIpcMessage = new FlaggedIpcMessage(
        MessageFlag.START_SYNC,
        ConnectorType.STRAVA,
        currentConnectorSyncDateTime,
        connectorInfo,
        athleteModel,
        userSettingsModel
      );
      const replyWith = {
        callback: () => {},
        args: {
          success: "Started sync of connector " + ConnectorType.STRAVA,
          error: null
        }
      };
      const stravaConnectorSyncCalls = 1;

      const configureStravaConnectorSpy = spyOn(stravaConnector, "configure").and.callThrough();
      const stravaConnectorSyncSpy = spyOn(stravaConnector, "sync").and.returnValue(new Subject<SyncEvent>());
      const replyWithCallbackSpy = spyOn(replyWith, "callback").and.stub();

      // When
      connectorSyncService.sync(flaggedIpcMessage, replyWith.callback);

      // Then
      expect(configureStravaConnectorSpy).toBeCalledTimes(1);
      expect(connectorSyncService.currentConnector).not.toBeNull();
      expect(stravaConnectorSyncSpy).toBeCalledTimes(stravaConnectorSyncCalls);
      expect(replyWithCallbackSpy).toBeCalledWith(replyWith.args);

      done();
    });

    it("should start file connector sync", done => {
      // Given
      const expectedFileConnectorInfo = new FileConnectorInfo("/path/to/dir/");
      const flaggedIpcMessage = new FlaggedIpcMessage(
        MessageFlag.START_SYNC,
        ConnectorType.FILE,
        currentConnectorSyncDateTime,
        expectedFileConnectorInfo,
        athleteModel,
        userSettingsModel
      );
      const replyWith = {
        callback: () => {},
        args: {
          success: "Started sync of connector " + ConnectorType.FILE,
          error: null
        }
      };
      const fsConnectorSyncCalls = 1;

      const configureFileConnectorSpy = spyOn(fileConnector, "configure").and.callThrough();
      const fileConnectorSyncSpy = spyOn(fileConnector, "sync").and.returnValue(new Subject<SyncEvent>());
      const replyWithCallbackSpy = spyOn(replyWith, "callback").and.stub();

      // When
      connectorSyncService.sync(flaggedIpcMessage, replyWith.callback);

      // Then
      expect(configureFileConnectorSpy).toBeCalled();
      expect(connectorSyncService.currentConnector).not.toBeNull();
      expect(fileConnectorSyncSpy).toBeCalledTimes(fsConnectorSyncCalls);
      expect(replyWithCallbackSpy).toBeCalledWith(replyWith.args);

      done();
    });

    it("should not start a sync already running", done => {
      // Given
      connectorSyncService.currentConnector = fileConnector;
      connectorSyncService.currentConnector.isSyncing = true;
      const syncSpy = spyOn(connectorSyncService.currentConnector, "sync").and.stub();

      const replyWith = {
        callback: () => {},
        args: {
          success: null,
          error: "Impossible to start a new sync. Another sync is already running on connector " + ConnectorType.FILE
        }
      };
      const replyWithCallbackSpy = spyOn(replyWith, "callback").and.stub();

      const flaggedIpcMessage = new FlaggedIpcMessage(
        MessageFlag.START_SYNC,
        ConnectorType.STRAVA,
        null,
        null,
        null,
        null
      );

      // When
      connectorSyncService.sync(flaggedIpcMessage, replyWith.callback);

      // Then
      expect(connectorSyncService.currentConnector).not.toBeNull();
      expect(replyWithCallbackSpy).toBeCalledWith(replyWith.args);
      expect(syncSpy).not.toBeCalled();

      done();
    });

    it("should send sync events (inc sync 'non-stop' errors) to IpcRenderer", done => {
      // Given
      const flaggedIpcMessage = new FlaggedIpcMessage(
        MessageFlag.START_SYNC,
        ConnectorType.STRAVA,
        athleteModel,
        userSettingsModel,
        connectorInfo
      );

      const syncEvent$ = new Subject<SyncEvent>();
      const fakeGenericSyncEvent = new GenericSyncEvent(ConnectorType.STRAVA, "Fake event");
      const expectedFlaggedMessageSent = new FlaggedIpcMessage(MessageFlag.SYNC_EVENT, fakeGenericSyncEvent);
      const replyWith = {
        callback: () => {},
        args: {
          success: "Started sync of connector " + ConnectorType.STRAVA,
          error: null
        }
      };
      const stravaConnectorSyncCalls = 1;
      const configureStravaConnectorSpy = spyOn(stravaConnector, "configure").and.returnValue(stravaConnector);
      const stravaConnectorSyncSpy = spyOn(stravaConnector, "sync").and.returnValue(syncEvent$);
      const sendMessageSpy = spyOn(ipcMessagesSender, "send").and.returnValue(
        Promise.resolve("Message received by IpcMain")
      );
      const replyWithCallbackSpy = spyOn(replyWith, "callback").and.stub();

      // When
      connectorSyncService.sync(flaggedIpcMessage, replyWith.callback);
      syncEvent$.next(fakeGenericSyncEvent);

      // Then
      expect(configureStravaConnectorSpy).toBeCalled();
      expect(connectorSyncService.currentConnector).not.toBeNull();
      expect(stravaConnectorSyncSpy).toBeCalledTimes(stravaConnectorSyncCalls);
      expect(replyWithCallbackSpy).toBeCalledWith(replyWith.args);
      expect(sendMessageSpy).toBeCalledWith(expectedFlaggedMessageSent);
      done();
    });

    it("should send error sync events raised (sync 'stop' errors) to IpcRenderer", done => {
      // Given
      const flaggedIpcMessage = new FlaggedIpcMessage(
        MessageFlag.START_SYNC,
        ConnectorType.STRAVA,
        athleteModel,
        userSettingsModel,
        connectorInfo
      );

      const syncEvent$ = new Subject<SyncEvent>();
      const fakeErrorSyncEvent = new ErrorSyncEvent(ConnectorType.STRAVA, {
        code: "fake_code",
        description: "fake_desc",
        stacktrace: "fake_stack"
      });
      const expectedFlaggedMessageSent = new FlaggedIpcMessage(MessageFlag.SYNC_EVENT, fakeErrorSyncEvent);
      const replyWith = {
        callback: () => {},
        args: {
          success: "Started sync of connector " + ConnectorType.STRAVA,
          error: null
        }
      };
      const stravaConnectorSyncCalls = 1;
      const configureStravaConnectorSpy = spyOn(stravaConnector, "configure").and.callThrough();
      const stravaConnectorSyncSpy = spyOn(stravaConnector, "sync").and.returnValue(syncEvent$);
      const sendMessageSpy = spyOn(ipcMessagesSender, "send").and.returnValue(
        Promise.resolve("Message received by IpcMain")
      );
      const replyWithCallbackSpy = spyOn(replyWith, "callback").and.stub();

      // When
      connectorSyncService.sync(flaggedIpcMessage, replyWith.callback);
      syncEvent$.error(fakeErrorSyncEvent);

      // Then
      expect(configureStravaConnectorSpy).toBeCalled();
      expect(stravaConnectorSyncSpy).toBeCalledTimes(stravaConnectorSyncCalls);
      expect(replyWithCallbackSpy).toBeCalledWith(replyWith.args);
      expect(sendMessageSpy).toBeCalledWith(expectedFlaggedMessageSent);

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
      const updateSyncedActivitiesNameAndType = true;
      const flaggedIpcMessage = new FlaggedIpcMessage(
        MessageFlag.START_SYNC,
        ConnectorType.STRAVA,
        athleteModel,
        userSettingsModel,
        connectorInfo,
        updateSyncedActivitiesNameAndType
      );

      const syncEvent$ = new Subject<SyncEvent>();
      const fakeCompleteSyncEvent = new CompleteSyncEvent(ConnectorType.STRAVA, "Sync done");
      const expectedFlaggedMessageSent = new FlaggedIpcMessage(MessageFlag.SYNC_EVENT, fakeCompleteSyncEvent);
      const replyWith = {
        callback: () => {},
        args: {
          success: "Started sync of connector " + ConnectorType.STRAVA,
          error: null
        }
      };
      const stravaConnectorSyncCalls = 1;
      const configureStravaConnectorSpy = spyOn(stravaConnector, "configure").and.callThrough();
      const stravaConnectorSyncSpy = spyOn(stravaConnector, "sync").and.returnValue(syncEvent$);
      const sendMessageSpy = spyOn(ipcMessagesSender, "send").and.returnValue(
        Promise.resolve("Message received by IpcMain")
      );
      const replyWithCallbackSpy = spyOn(replyWith, "callback").and.stub();

      // When
      connectorSyncService.sync(flaggedIpcMessage, replyWith.callback);
      syncEvent$.complete();

      // Then
      expect(configureStravaConnectorSpy).toBeCalled();
      expect(stravaConnectorSyncSpy).toBeCalledTimes(stravaConnectorSyncCalls);
      expect(replyWithCallbackSpy).toBeCalledWith(replyWith.args);
      expect(sendMessageSpy).toBeCalledWith(expectedFlaggedMessageSent);

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
      const flaggedIpcMessage = new FlaggedIpcMessage(MessageFlag.STOP_SYNC, ConnectorType.STRAVA);
      const replyWith = () => {};
      connectorSyncService.currentConnector = stravaConnector;

      const stopConnectorSyncSpy = spyOn(stravaConnector, "stop").and.returnValue(Promise.resolve());

      // When
      connectorSyncService.stop(flaggedIpcMessage, replyWith);

      // Then
      expect(stopConnectorSyncSpy).toBeCalledTimes(1);
      done();
    });

    it("should not stop sync if no connector is mapped to service", done => {
      // Given
      const flaggedIpcMessage = new FlaggedIpcMessage(MessageFlag.STOP_SYNC, ConnectorType.STRAVA);
      const replyWith = {
        callback: () => {},
        args: {
          success: null,
          error: "No existing connector found to stop sync"
        }
      };

      connectorSyncService.currentConnector = null;

      const stopConnectorSyncSpy = spyOn(stravaConnector, "stop").and.stub();
      const replyWithCallbackSpy = spyOn(replyWith, "callback").and.stub();

      // When
      connectorSyncService.stop(flaggedIpcMessage, replyWith.callback);

      // Then
      expect(stopConnectorSyncSpy).not.toBeCalled();
      expect(replyWithCallbackSpy).toBeCalledWith(replyWith.args);

      done();
    });

    it("should not stop sync of a given connector if current connector syncing has different type", done => {
      // Given
      const requestConnectorType = ConnectorType.STRAVA;
      const flaggedIpcMessage = new FlaggedIpcMessage(MessageFlag.STOP_SYNC, requestConnectorType);
      const replyWith = {
        callback: () => {},
        args: {
          success: null,
          error: `Trying to stop a sync on ${requestConnectorType} connector but current connector synced type is: ${ConnectorType.FILE}`
        }
      };

      connectorSyncService.currentConnector = fileConnector;
      const stopConnectorSyncSpy = spyOn(fileConnector, "stop").and.callThrough();
      const replyWithCallbackSpy = spyOn(replyWith, "callback").and.stub();

      // When
      connectorSyncService.stop(flaggedIpcMessage, replyWith.callback);

      // Then
      expect(stopConnectorSyncSpy).not.toBeCalled();
      expect(replyWithCallbackSpy).toBeCalledWith(replyWith.args);

      done();
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
      const flaggedIpcMessage = new FlaggedIpcMessage(
        MessageFlag.COMPUTE_ACTIVITY,
        syncedActivityModel,
        athleteSnapshotModel,
        streams
      );
      const analysisDataModel = new AnalysisDataModel();
      const replyWrapper = {
        replyWith: () => {}
      };

      const calculateSpy = spyOn(ActivityComputer, "calculate").and.returnValue(analysisDataModel);
      const replyWithSpy = spyOn(replyWrapper, "replyWith");

      // When
      connectorSyncService.computeActivity(flaggedIpcMessage, replyWrapper.replyWith);

      // Then
      expect(calculateSpy).toBeCalledTimes(1);
      expect(replyWithSpy).toBeCalledWith({ success: jasmine.any(SyncedActivityModel), error: null });
      const syncedActivityModelArg = replyWithSpy.calls.mostRecent().args[0].success;
      expect(syncedActivityModelArg.athleteSnapshot).toEqual(athleteSnapshotModel);
      done();
    });

    it("should compute activity without streams", done => {
      // Given
      const syncedActivityModel = new SyncedActivityModel();
      syncedActivityModel.name = "My activity";
      syncedActivityModel.start_time = new Date().toISOString();
      const athleteSnapshotModel = new AthleteSnapshotModel(Gender.MEN, AthleteSettingsModel.DEFAULT_MODEL);
      const streams = null;
      const flaggedIpcMessage = new FlaggedIpcMessage(
        MessageFlag.COMPUTE_ACTIVITY,
        syncedActivityModel,
        athleteSnapshotModel,
        streams
      );
      const analysisDataModel = new AnalysisDataModel();
      const replyWrapper = {
        replyWith: () => {}
      };

      const calculateSpy = spyOn(ActivityComputer, "calculate").and.returnValue(analysisDataModel);
      const replyWithSpy = spyOn(replyWrapper, "replyWith");

      // When
      connectorSyncService.computeActivity(flaggedIpcMessage, replyWrapper.replyWith);

      // Then
      expect(calculateSpy).toBeCalledTimes(1);
      const syncedActivityModelArg = replyWithSpy.calls.mostRecent().args[0].success;
      expect(syncedActivityModelArg.athleteSnapshot).toEqual(athleteSnapshotModel);
      done();
    });

    it("should reject compute activity", done => {
      // Given
      const syncedActivityModel = new SyncedActivityModel();
      syncedActivityModel.name = "My activity";
      syncedActivityModel.start_time = new Date().toISOString();
      const athleteSnapshotModel = new AthleteSnapshotModel(Gender.MEN, AthleteSettingsModel.DEFAULT_MODEL);
      const streams = new Streams();
      const flaggedIpcMessage = new FlaggedIpcMessage(
        MessageFlag.COMPUTE_ACTIVITY,
        syncedActivityModel,
        athleteSnapshotModel,
        streams
      );
      const analysisDataModel = new AnalysisDataModel();
      const expectedSyncedActivityModel = _.cloneDeep(syncedActivityModel);
      expectedSyncedActivityModel.extendedStats = analysisDataModel;
      expectedSyncedActivityModel.athleteSnapshot = athleteSnapshotModel;
      const expectedErrorMessage = `unable to calculate activity ${syncedActivityModel.name} started at ${syncedActivityModel.start_timestamp}: Whoops.`;
      const expectedElevateException = new ElevateException(expectedErrorMessage);
      const replyWrapper = {
        replyWith: () => {}
      };

      const calculateSpy = spyOn(ActivityComputer, "calculate").and.callFake(() => {
        throw expectedElevateException;
      });
      const replyWithSpy = spyOn(replyWrapper, "replyWith");

      // When
      connectorSyncService.computeActivity(flaggedIpcMessage, replyWrapper.replyWith);

      // Then
      expect(calculateSpy).toBeCalledTimes(1);
      expect(replyWithSpy).toBeCalledWith({ success: null, error: expectedElevateException });
      done();
    });
  });
});
