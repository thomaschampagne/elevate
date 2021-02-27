import { Inject, Injectable } from "@angular/core";
import { SyncEvent, SyncEventType } from "@elevate/shared/sync";
import { Channel, IpcTunnelService } from "@elevate/shared/electron";
import { Subject } from "rxjs";
import { LoggerService } from "../../shared/services/logging/logger.service";
import { ActivityService } from "../../shared/services/activity/activity.service";
import { StreamsService } from "../../shared/services/streams/streams.service";
import { DeflatedActivityStreams, SyncedActivityModel, UserSettings } from "@elevate/shared/models";
import { IPC_TUNNEL_SERVICE } from "./ipc-tunnel-service.token";

/**
 * Listen and send sync related messages
 */
@Injectable()
export class IpcSyncMessagesListener {
  public syncEvents$: Subject<SyncEvent>;

  constructor(
    @Inject(IPC_TUNNEL_SERVICE) public ipcTunnelService: IpcTunnelService,
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

    this.ipcTunnelService.on<[string, number], SyncedActivityModel[]>(Channel.findActivity, payload => {
      const [startTime, activityDurationSeconds] = payload;
      return this.handleFindActivity(startTime, activityDurationSeconds);
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

  public handleFindActivity(startTime: string, activityDurationSeconds: number): Promise<SyncedActivityModel[]> {
    this.logger.debug("[Renderer] Received FindActivity. Params:", startTime, activityDurationSeconds);
    return this.activityService.findByDatedSession(startTime, activityDurationSeconds);
  }

  public handleFindStreams(activityId: number | string): Promise<DeflatedActivityStreams> {
    this.logger.debug("[Renderer] Received FindStreams. Params:", activityId);
    return this.streamsService.getById(activityId);
  }
}
