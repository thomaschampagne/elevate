import { Inject, Injectable } from "@angular/core";
import { Subject } from "rxjs";
import { LoggerService } from "../../shared/services/logging/logger.service";
import { ActivityService } from "../../shared/services/activity/activity.service";
import { StreamsService } from "../../shared/services/streams/streams.service";
import { IPC_TUNNEL_SERVICE } from "./ipc-tunnel-service.token";
import { SyncEvent } from "@elevate/shared/sync/events/sync.event";
import { DeflatedActivityStreams } from "@elevate/shared/models/sync/deflated-activity.streams";
import { SyncEventType } from "@elevate/shared/sync/events/sync-event-type";
import { IpcTunnelService } from "@elevate/shared/electron/ipc-tunnel";
import { Activity } from "@elevate/shared/models/sync/activity.model";
import { Channel } from "@elevate/shared/electron/channels.enum";

/**
 * Listen and send sync related messages
 */
@Injectable()
export class IpcSyncMessagesListener {
  public syncEvents$: Subject<SyncEvent>;

  constructor(
    @Inject(IPC_TUNNEL_SERVICE) public readonly ipcTunnelService: IpcTunnelService,
    @Inject(ActivityService) private readonly activityService: ActivityService,
    @Inject(StreamsService) private readonly streamsService: StreamsService,
    @Inject(LoggerService) private readonly logger: LoggerService
  ) {
    this.syncEvents$ = new Subject<SyncEvent>();

    // Listen
    this.ipcTunnelService.on<[SyncEvent], SyncEventType>(Channel.syncEvent, payload => {
      const [syncEvent] = payload;
      this.handleSyncEvents(syncEvent);
      return Promise.resolve(syncEvent.type);
    });

    this.ipcTunnelService.on<[string, string], Activity[]>(Channel.findActivity, payload => {
      const [startTime, endTime] = payload;
      return this.handleFindActivity(startTime, endTime);
    });

    this.ipcTunnelService.on<[number | string], DeflatedActivityStreams>(Channel.findStreams, payload => {
      const [activityId] = payload;
      return this.handleFindStreams(activityId);
    });
  }

  public handleSyncEvents(syncEvent: SyncEvent): void {
    this.logger.debug("[Renderer] Received SyncEvent. Params:", syncEvent);
    this.syncEvents$.next(syncEvent); // forward sync event
  }

  public handleFindActivity(startTime: string, endTime: string): Promise<Activity[]> {
    this.logger.debug("[Renderer] Received FindActivity. Params:", startTime, endTime);
    return this.activityService.findByDatedSession(startTime, endTime);
  }

  public handleFindStreams(activityId: number | string): Promise<DeflatedActivityStreams> {
    this.logger.debug("[Renderer] Received FindStreams. Params:", activityId);
    return this.streamsService.getById(activityId);
  }
}
