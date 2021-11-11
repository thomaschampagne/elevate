import { Inject, Injectable } from "@angular/core";
import { IPC_TUNNEL_SERVICE } from "./ipc-tunnel-service.token";
import { IpcTunnelService } from "@elevate/shared/electron/ipc-tunnel";
import { IpcMessage } from "@elevate/shared/electron/ipc-message";
import { ConnectorType } from "@elevate/shared/sync/connectors/connector-type.enum";
import { ConnectorInfo } from "@elevate/shared/sync/connectors/connector-info.model";
import { AthleteModel } from "@elevate/shared/models/athlete/athlete.model";
import { UserSettings } from "@elevate/shared/models/user-settings/user-settings.namespace";
import { Channel } from "@elevate/shared/electron/channels.enum";
import BaseUserSettings = UserSettings.BaseUserSettings;

@Injectable()
export class IpcSyncMessageSender {
  constructor(@Inject(IPC_TUNNEL_SERVICE) public readonly ipcTunnelService: IpcTunnelService) {}

  public startSync(
    connectorType: ConnectorType,
    connectorInfo: ConnectorInfo,
    athleteModel: AthleteModel,
    userSettings: BaseUserSettings,
    syncFromDateTime: number
  ): Promise<string> {
    const startSyncMessage = new IpcMessage(
      Channel.startSync,
      connectorType,
      connectorInfo,
      athleteModel,
      userSettings,
      syncFromDateTime
    );

    return this.ipcTunnelService.send<IpcMessage, string>(startSyncMessage);
  }

  public stopSync(connectorType: ConnectorType): Promise<string> {
    const stopSyncMessage = new IpcMessage(Channel.stopSync, connectorType);
    return this.ipcTunnelService.send<IpcMessage, string>(stopSyncMessage);
  }
}
