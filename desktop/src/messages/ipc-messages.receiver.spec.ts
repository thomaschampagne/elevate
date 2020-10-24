import { IpcMessagesReceiver } from "./ipc-messages.receiver";
import { FlaggedIpcMessage, MessageFlag, RuntimeInfo } from "@elevate/shared/electron";
import { ConnectorType } from "@elevate/shared/sync";
import { AppService } from "../app-service";
import { container } from "tsyringe";
import { IpcMessagesSender } from "./ipc-messages.sender";
import { ConnectorSyncService } from "../connectors/connector-sync.service";
import { StravaAuthenticator } from "../connectors/strava/strava-authenticator";

describe("IpcMessagesReceiver", () => {
  let ipcMessagesReceiver: IpcMessagesReceiver;
  let appService: AppService;
  let stravaAuthenticator: StravaAuthenticator;
  let ipcMessagesSender: IpcMessagesSender;
  let connectorSyncService: ConnectorSyncService;

  beforeEach(done => {
    ipcMessagesReceiver = container.resolve(IpcMessagesReceiver);
    appService = container.resolve(AppService);
    stravaAuthenticator = container.resolve(StravaAuthenticator);
    ipcMessagesSender = container.resolve(IpcMessagesSender);
    connectorSyncService = container.resolve(ConnectorSyncService);

    done();
  });

  describe("Forward received messages from IpcRenderer", () => {
    it("should start sync when a MessageFlag.START_SYNC is received", done => {
      // Given
      const flaggedIpcMessage = new FlaggedIpcMessage(MessageFlag.START_SYNC, ConnectorType.STRAVA); // No need to provide extra payload to test forwardMessagesFromIpcRenderer
      const replyWith = () => {};

      const startSyncSpy = spyOn(connectorSyncService, "sync").and.stub();

      // When
      ipcMessagesReceiver.forwardReceivedMessages(flaggedIpcMessage, replyWith);

      // Then
      expect(startSyncSpy).toHaveBeenCalledTimes(1);
      done();
    });

    it("should link strava account when a MessageFlag.LINK_STRAVA_CONNECTOR is received", done => {
      // Given
      const flaggedIpcMessage = new FlaggedIpcMessage(MessageFlag.LINK_STRAVA_CONNECTOR, ConnectorType.STRAVA); // No need to provide extra payload to test forwardMessagesFromIpcRenderer
      const replyWith = () => {};

      const authResponse = { accessToken: null, refreshToken: null, expiresAt: null, athlete: null };
      const handleLinkWithStravaSpy = spyOn(stravaAuthenticator, "authorize").and.returnValue(
        Promise.resolve(authResponse)
      );

      // When
      ipcMessagesReceiver.forwardReceivedMessages(flaggedIpcMessage, replyWith);

      // Then
      expect(handleLinkWithStravaSpy).toHaveBeenCalledTimes(1);
      done();
    });

    it("should stop sync when MessageFlag.CANCEL_SYNC is received", done => {
      // Given
      const flaggedIpcMessage = new FlaggedIpcMessage(MessageFlag.STOP_SYNC);
      const replyWith = () => {};

      const stopSyncSpy = spyOn(connectorSyncService, "stop").and.stub();

      // When
      ipcMessagesReceiver.forwardReceivedMessages(flaggedIpcMessage, replyWith);

      // Then
      expect(stopSyncSpy).toHaveBeenCalledTimes(1);
      done();
    });

    it("should provide when a MessageFlag.GET_RUNTIME_INFO is received", done => {
      // Given
      const runtimeInfo = new RuntimeInfo(null, null, null, null, null, null, null);
      const flaggedIpcMessage = new FlaggedIpcMessage(MessageFlag.GET_RUNTIME_INFO, runtimeInfo);
      const replyWith = () => {};

      const getRuntimeInfoSpy = spyOn(appService, "getRuntimeInfo").and.stub();

      // When
      ipcMessagesReceiver.forwardReceivedMessages(flaggedIpcMessage, replyWith);

      // Then
      expect(getRuntimeInfoSpy).toHaveBeenCalledTimes(1);
      done();
    });

    it("should compute activity when a MessageFlag.COMPUTE_ACTIVITY is received", done => {
      // Given
      const flaggedIpcMessage = new FlaggedIpcMessage(MessageFlag.COMPUTE_ACTIVITY, null, null, null, null);
      const replyWith = () => {};

      const computeActivitySpy = spyOn(connectorSyncService, "computeActivity").and.stub();

      // When
      ipcMessagesReceiver.forwardReceivedMessages(flaggedIpcMessage, replyWith);

      // Then
      expect(computeActivitySpy).toHaveBeenCalledTimes(1);
      done();
    });

    it("should handle unknown MessageFlag received", done => {
      // Given
      const fakeFlag = -1;
      const flaggedIpcMessage = new FlaggedIpcMessage(fakeFlag);
      const replyWith = {
        callback: () => {},
        args: {
          success: null,
          error: "Unknown message received by IpcMain. FlaggedIpcMessage: " + JSON.stringify(flaggedIpcMessage)
        }
      };
      const replyWithCallbackSpy = spyOn(replyWith, "callback").and.stub();

      // When
      ipcMessagesReceiver.forwardReceivedMessages(flaggedIpcMessage, replyWith.callback);

      // Then
      expect(replyWithCallbackSpy).toBeCalledWith(replyWith.args);
      done();
    });
  });

  describe("Handle get machine id", () => {
    it("should get runtime info", done => {
      // Given
      const replyWrapper = {
        replyWith: () => {}
      };
      const fakeRuntimeInfo = new RuntimeInfo(null, null, null, null, null, null, null);
      const flaggedIpcMessage = new FlaggedIpcMessage(MessageFlag.GET_RUNTIME_INFO, fakeRuntimeInfo);
      jest.spyOn(appService, "getRuntimeInfo").mockReturnValue(fakeRuntimeInfo);
      const replyWithSpy = jest.spyOn(replyWrapper, "replyWith");

      // When
      ipcMessagesReceiver.handleGetRuntimeInfo(flaggedIpcMessage, replyWrapper.replyWith);

      // Then
      expect(replyWithSpy).toBeCalledWith({ success: fakeRuntimeInfo, error: null });
      done();
    });
  });
});
