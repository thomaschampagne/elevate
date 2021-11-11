import { inject, singleton } from "tsyringe";
import { IpcMainTunnelService } from "../ipc-main-tunnel.service";
import { Logger } from "../logger";
import { SyncEvent } from "@elevate/shared/sync/events/sync.event";
import { IpcMessage } from "@elevate/shared/electron/ipc-message";
import { DeflatedActivityStreams } from "@elevate/shared/models/sync/deflated-activity.streams";
import { SyncEventType } from "@elevate/shared/sync/events/sync-event-type";
import { IpcTunnelService } from "@elevate/shared/electron/ipc-tunnel";
import { Activity } from "@elevate/shared/models/sync/activity.model";
import { Channel } from "@elevate/shared/electron/channels.enum";

@singleton()
export class IpcSyncMessageSender {
  constructor(
    @inject(IpcMainTunnelService) protected readonly ipcTunnelService: IpcTunnelService,
    @inject(Logger) private readonly logger: Logger
  ) {}

  public findLocalActivities(activityStartDate: string, activityEndDate: string): Promise<Activity[]> {
    const ipcMessage = new IpcMessage(Channel.findActivity, activityStartDate, activityEndDate);
    return this.ipcTunnelService.send<IpcMessage, Activity[]>(ipcMessage);
  }

  public findDeflatedActivityStreams(activityId: number | string): Promise<DeflatedActivityStreams> {
    const ipcMessage = new IpcMessage(Channel.findStreams, activityId);
    return this.ipcTunnelService.send<IpcMessage, DeflatedActivityStreams>(ipcMessage);
  }

  public forwardSyncEvent(syncEvent: SyncEvent): void {
    const syncEventMessage: IpcMessage = new IpcMessage(Channel.syncEvent, syncEvent);
    this.ipcTunnelService.send<IpcMessage, SyncEventType>(syncEventMessage).then(syncEventType => {
      this.logger.debug(`Rendered received: ${SyncEventType[syncEventType]}`);
    });
  }
}
