import { FileConnector } from "./file/file.connector";
import { container } from "tsyringe";
import { ConnectorSyncService } from "./connector-sync.service";
import { StravaConnector } from "./strava/strava.connector";
import { Subject } from "rxjs";
import { IpcMainTunnelService } from "../ipc-main-tunnel.service";
import { StravaConnectorConfig } from "./connector-config.model";
import { IpcTunnelService } from "@elevate/shared/electron/ipc-tunnel";
import { SyncEvent } from "@elevate/shared/sync/events/sync.event";
import { IpcMessage } from "@elevate/shared/electron/ipc-message";
import { ConnectorType } from "@elevate/shared/sync/connectors/connector-type.enum";
import { FileConnectorInfo } from "@elevate/shared/sync/connectors/file-connector-info.model";
import { CompleteSyncEvent } from "@elevate/shared/sync/events/complete-sync.event";
import { GenericSyncEvent } from "@elevate/shared/sync/events/generic-sync.event";
import { ErrorSyncEvent } from "@elevate/shared/sync/events/error-sync.event";
import { Channel } from "@elevate/shared/electron/channels.enum";

describe("ConnectorSyncService", () => {
  const syncFromDateTime = null;
  const athleteModel = null;
  const connectorInfo = null;
  const userSettings = null;

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
      syncFromDateTime: syncFromDateTime,
      athleteModel: athleteModel,
      userSettings: userSettings,
      info: connectorInfo
    };
    stravaConnector = stravaConnector.configure(stravaConnectorConfig);

    const fileConnectorConfig = {
      syncFromDateTime: syncFromDateTime,
      athleteModel: athleteModel,
      userSettings: userSettings,
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
        syncFromDateTime,
        connectorInfo,
        athleteModel,
        userSettings
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
        fileConnectorInfo,
        athleteModel,
        userSettings,
        syncFromDateTime
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
        userSettings,
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
        sourceError: new Error("fake_err")
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
        userSettings,
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
        userSettings,
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
      promise.then(() => {
        expect(stopConnectorSyncSpy).toBeCalledTimes(1);
        done();
      });
    });

    it("should do nothing when stop sync with no connector mapped to service", done => {
      // Given
      connectorSyncService.currentConnector = null;
      const stopConnectorSyncSpy = spyOn(stravaConnector, "stop").and.stub();

      // When
      const promise = connectorSyncService.stop(ConnectorType.STRAVA);

      // Then
      promise
        .then(() => {
          expect(stopConnectorSyncSpy).not.toBeCalled();
          done();
        })
        .catch(err => {
          throw err;
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
});
