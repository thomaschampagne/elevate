import { Inject, Injectable } from "@angular/core";
import { SyncEvent } from "@elevate/shared/sync";
import { FlaggedIpcMessage } from "@elevate/shared/electron";
import { IpcRequest, PromiseTronReply } from "promise-tron";
import { Subject } from "rxjs";
import _ from "lodash";
import { LoggerService } from "../../shared/services/logging/logger.service";
import { MessageFlag } from "@elevate/shared/electron/message-flag.enum";
import { ActivityService } from "../../shared/services/activity/activity.service";
import { IPromiseTron, PROMISE_TRON } from "./promise-tron.interface";
import { StreamsService } from "../../shared/services/streams/streams.service";

@Injectable()
export class IpcMessagesReceiver {
  public syncEvents$: Subject<SyncEvent>;
  public isListening: boolean;

  constructor(
    @Inject(PROMISE_TRON) public promiseTron: IPromiseTron,
    @Inject(ActivityService) private readonly activityService: ActivityService,
    @Inject(StreamsService) private readonly streamsService: StreamsService,
    @Inject(LoggerService) private readonly logger: LoggerService
  ) {
    this.syncEvents$ = new Subject<SyncEvent>();
    this.isListening = false;
  }

  public listen(): void {
    if (this.isListening) {
      return;
    }

    // Listen for sync events provided by main process
    this.promiseTron.on((ipcRequest: IpcRequest, replyWith: (promiseTronReply: PromiseTronReply) => void) => {
      this.onIpcRequest(ipcRequest, replyWith);
    });

    this.isListening = true;
  }

  public onIpcRequest(ipcRequest: IpcRequest, replyWith: (promiseTronReply: PromiseTronReply) => void): void {
    const flaggedIpcMessage = IpcRequest.extractData<FlaggedIpcMessage>(ipcRequest);

    if (!flaggedIpcMessage) {
      const message = "Unknown IpcRequest received from IpcMain: " + JSON.stringify(ipcRequest);
      this.logger.error(message);
      throw new Error(message);
    }

    this.forwardMessagesFromIpcMain(flaggedIpcMessage, replyWith);
  }

  public forwardMessagesFromIpcMain(
    message: FlaggedIpcMessage,
    replyWith: (promiseTronReply: PromiseTronReply) => void
  ): void {
    switch (message.flag) {
      case MessageFlag.SYNC_EVENT:
        this.handleSyncEventsMessages(message);
        break;

      case MessageFlag.FIND_ACTIVITY:
        this.handleFindActivityMessages(message, replyWith);
        break;

      case MessageFlag.FIND_ACTIVITY_STREAMS:
        this.handleFindStreamsMessages(message, replyWith);
        break;

      default:
        this.handleUnknownMessage(message, replyWith);
        break;
    }
  }

  public handleSyncEventsMessages(flaggedIpcMessage: FlaggedIpcMessage): void {
    const syncEvent = _.first(flaggedIpcMessage.payload) as SyncEvent;
    this.syncEvents$.next(syncEvent); // forward sync event
  }

  public handleFindActivityMessages(
    flaggedIpcMessage: FlaggedIpcMessage,
    replyWith: (promiseTronReply: PromiseTronReply) => void
  ): void {
    const startTime = flaggedIpcMessage.payload[0] as string;
    const activityDurationSeconds = flaggedIpcMessage.payload[1] as number;

    this.activityService.findByDatedSession(startTime, activityDurationSeconds).then(
      activities => {
        replyWith({
          success: activities,
          error: null
        });
      },
      error => {
        replyWith({
          success: null,
          error: error
        });
      }
    );
  }

  public handleFindStreamsMessages(
    flaggedIpcMessage: FlaggedIpcMessage,
    replyWith: (promiseTronReply: PromiseTronReply) => void
  ): void {
    const activityId = flaggedIpcMessage.payload[0] as number | string;

    this.streamsService.getById(activityId).then(
      streams => {
        replyWith({
          success: streams,
          error: null
        });
      },
      error => {
        replyWith({
          success: null,
          error: error
        });
      }
    );
  }

  public handleUnknownMessage(
    message: FlaggedIpcMessage,
    replyWith: (promiseTronReply: PromiseTronReply) => void
  ): void {
    const errorMessage = "Unknown message received by IpcRenderer. FlaggedIpcMessage: " + JSON.stringify(message);
    replyWith({
      success: null,
      error: errorMessage
    });
  }
}
