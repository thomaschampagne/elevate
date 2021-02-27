import { Inject, Injectable } from "@angular/core";
import { IPC_TUNNEL_SERVICE } from "./ipc-tunnel-service.token";
import { Channel, IpcMessage, IpcTunnelService } from "@elevate/shared/electron";
import { ConnectorInfo, ConnectorType } from "@elevate/shared/sync";
import { AthleteModel, ConnectorSyncDateTime, UserSettings } from "@elevate/shared/models";
import UserSettingsModel = UserSettings.UserSettingsModel;

@Injectable()
export class IpcSyncMessageSender {
  constructor(@Inject(IPC_TUNNEL_SERVICE) public ipcTunnelService: IpcTunnelService) {}

  public startSync(
    connectorType: ConnectorType,
    connectorSyncDateTime: ConnectorSyncDateTime,
    connectorInfo: ConnectorInfo,
    athleteModel: AthleteModel,
    userSettingsModel: UserSettingsModel
  ): Promise<string> {
    const startSyncMessage = new IpcMessage(
      Channel.startSync,
      connectorType,
      connectorSyncDateTime,
      connectorInfo,
      athleteModel,
      userSettingsModel
    );

    return this.ipcTunnelService.send<IpcMessage, string>(startSyncMessage);
  }

  public stopSync(connectorType: ConnectorType): Promise<string> {
    const stopSyncMessage = new IpcMessage(Channel.stopSync, connectorType);
    return this.ipcTunnelService.send<IpcMessage, string>(stopSyncMessage);
  }
}
