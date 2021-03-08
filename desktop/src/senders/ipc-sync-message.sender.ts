import { inject, singleton } from "tsyringe";
import { IpcMainTunnelService } from "../ipc-main-tunnel.service";
import { Streams, SyncedActivityModel } from "@elevate/shared/models";
import { SyncEvent, SyncEventType } from "@elevate/shared/sync";
import { Channel, IpcMessage, IpcTunnelService } from "@elevate/shared/electron";
import { Logger } from "../logger";

@singleton()
export class IpcSyncMessageSender {
  constructor(
    @inject(IpcMainTunnelService) protected readonly ipcTunnelService: IpcTunnelService,
    @inject(Logger) private readonly logger: Logger
  ) {}

  public findSyncedActivityModels(
    activityStartDate: string,
    activityDurationSeconds: number
  ): Promise<SyncedActivityModel[]> {
    const ipcMessage = new IpcMessage(Channel.findActivity, activityStartDate, activityDurationSeconds);
    return this.ipcTunnelService.send<IpcMessage, SyncedActivityModel[]>(ipcMessage);
  }

  public findStreams(activityId: number | string): Promise<Streams> {
    const ipcMessage = new IpcMessage(Channel.findStreams, activityId);
    return this.ipcTunnelService.send<IpcMessage, Streams>(ipcMessage);
  }

  public forwardSyncEvent(syncEvent: SyncEvent): void {
    const syncEventMessage: IpcMessage = new IpcMessage(Channel.syncEvent, syncEvent);
    this.ipcTunnelService.send<IpcMessage, SyncEventType>(syncEventMessage).then(syncEventType => {
      this.logger.debug(`Rendered received: ${SyncEventType[syncEventType]}`);
    });
  }
}
