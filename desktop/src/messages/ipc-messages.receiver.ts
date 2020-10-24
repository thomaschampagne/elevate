import { IpcRequest, PromiseTronReply } from "promise-tron";
import logger from "electron-log";
import { StravaAuthenticator } from "../connectors/strava/strava-authenticator";
import { FlaggedIpcMessage, MessageFlag } from "@elevate/shared/electron";
import { AppService } from "../app-service";
import { inject, singleton } from "tsyringe";
import { IpcMessagesSender } from "./ipc-messages.sender";
import { ConnectorSyncService } from "../connectors/connector-sync.service";

@singleton()
export class IpcMessagesReceiver {
  constructor(
    @inject(AppService) private readonly appService: AppService,
    @inject(IpcMessagesSender) private readonly ipcMessagesSender: IpcMessagesSender,
    @inject(StravaAuthenticator) private readonly stravaAuthenticator: StravaAuthenticator,
    @inject(ConnectorSyncService) private readonly connectorSyncService: ConnectorSyncService
  ) {}

  public listen(): void {
    this.ipcMessagesSender.on((ipcRequest: IpcRequest, replyWith: (promiseTronReply: PromiseTronReply) => void) => {
      const flaggedIpcMessage = IpcRequest.extractData<FlaggedIpcMessage>(ipcRequest);

      if (flaggedIpcMessage) {
        this.forwardReceivedMessages(flaggedIpcMessage, replyWith);
      } else {
        logger.error("[MAIN] No ipcRequest handler found for: ", ipcRequest);
      }
    });
  }

  public forwardReceivedMessages(
    message: FlaggedIpcMessage,
    replyWith: (promiseTronReply: PromiseTronReply) => void
  ): void {
    switch (message.flag) {
      case MessageFlag.START_SYNC:
        this.handleStartSync(message, replyWith);
        break;

      case MessageFlag.STOP_SYNC:
        this.handleStopSync(message, replyWith);
        break;

      case MessageFlag.COMPUTE_ACTIVITY:
        this.handleComputeActivity(message, replyWith);
        break;

      case MessageFlag.LINK_STRAVA_CONNECTOR:
        this.handleLinkWithStrava(message, replyWith);
        break;

      case MessageFlag.GET_RUNTIME_INFO:
        this.handleGetRuntimeInfo(message, replyWith);
        break;

      default:
        this.handleUnknownMessage(message, replyWith);
        break;
    }
  }

  public handleStartSync(
    startSyncMessage: FlaggedIpcMessage,
    replyWith: (promiseTronReply: PromiseTronReply) => void
  ): void {
    this.connectorSyncService.sync(startSyncMessage, replyWith);
  }

  public handleStopSync(
    stopSyncMessage: FlaggedIpcMessage,
    replyWith: (promiseTronReply: PromiseTronReply) => void
  ): void {
    this.connectorSyncService.stop(stopSyncMessage, replyWith);
  }

  public handleLinkWithStrava(
    message: FlaggedIpcMessage,
    replyWith: (promiseTronReply: PromiseTronReply) => void
  ): void {
    const clientId = message.payload[0] as number;
    const clientSecret = message.payload[1] as string;
    const refreshToken = (message.payload[2] ? message.payload[2] : null) as string;

    let promise: Promise<{ accessToken: string; refreshToken: string; expiresAt: number }>;

    if (refreshToken) {
      promise = this.stravaAuthenticator.refresh(clientId, clientSecret, refreshToken);
    } else {
      promise = this.stravaAuthenticator.authorize(clientId, clientSecret);
    }

    promise.then(
      (result: { accessToken: string; refreshToken: string; expiresAt: number; athlete: object }) => {
        replyWith({
          success: {
            accessToken: result.accessToken,
            refreshToken: result.refreshToken,
            expiresAt: result.expiresAt,
            athlete: result.athlete
          },
          error: null
        });
      },
      error => {
        replyWith({
          success: null,
          error: error
        });
        logger.error(error);
      }
    );
  }

  public handleComputeActivity(
    computeActivityMessage: FlaggedIpcMessage,
    replyWith: (promiseTronReply: PromiseTronReply) => void
  ): void {
    this.connectorSyncService.computeActivity(computeActivityMessage, replyWith);
  }

  public handleGetRuntimeInfo(
    message: FlaggedIpcMessage,
    replyWith: (promiseTronReply: PromiseTronReply) => void
  ): void {
    replyWith({
      success: this.appService.getRuntimeInfo(),
      error: null
    });
  }

  public handleUnknownMessage(
    message: FlaggedIpcMessage,
    replyWith: (promiseTronReply: PromiseTronReply) => void
  ): void {
    const errorMessage = "Unknown message received by IpcMain. FlaggedIpcMessage: " + JSON.stringify(message);
    logger.error(errorMessage);
    replyWith({
      success: null,
      error: errorMessage
    });
  }

  public send<T>(flaggedIpcMessage: FlaggedIpcMessage): Promise<T> {
    return this.ipcMessagesSender.send(flaggedIpcMessage) as Promise<T>;
  }
}
