import { AppService } from "../app-service";
import { inject, singleton } from "tsyringe";
import { ConnectorSyncService } from "../connectors/connector-sync.service";
import { IpcListener } from "./ipc-listener.interface";
import { Logger } from "../logger";
import { UserSettings } from "@elevate/shared/models/user-settings/user-settings.namespace";
import { ConnectorType } from "@elevate/shared/sync/connectors/connector-type.enum";
import { ConnectorInfo } from "@elevate/shared/sync/connectors/connector-info.model";
import { IpcTunnelService } from "@elevate/shared/electron/ipc-tunnel";
import { AthleteModel } from "@elevate/shared/models/athlete/athlete.model";
import { Channel } from "@elevate/shared/electron/channels.enum";
import BaseUserSettings = UserSettings.BaseUserSettings;

@singleton()
export class IpcSyncMessageListener implements IpcListener {
  constructor(
    @inject(AppService) private readonly appService: AppService,
    @inject(ConnectorSyncService) private readonly connectorSyncService: ConnectorSyncService,
    @inject(Logger) private readonly logger: Logger
  ) {}

  public startListening(ipcTunnelService: IpcTunnelService): void {
    // Start sync
    ipcTunnelService.on<Array<[ConnectorType, ConnectorInfo, AthleteModel, BaseUserSettings, number]>, string>(
      Channel.startSync,
      payload => {
        const [connectorType, connectorInfo, athleteModel, userSettings, syncFromDateTime] = payload[0];
        return this.handleStartSync(connectorType, connectorInfo, athleteModel, userSettings, syncFromDateTime);
      }
    );

    // Stop sync
    ipcTunnelService.on<Array<[ConnectorType]>, void>(Channel.stopSync, payload => {
      const connectorType = payload[0][0];
      return this.handleStopSync(connectorType);
    });
  }

  public handleStartSync(
    connectorType: ConnectorType,
    connectorInfo: ConnectorInfo,
    athleteModel: AthleteModel,
    userSettings: BaseUserSettings,
    syncFromDateTime: number
  ): Promise<string> {
    this.logger.debug("[Main] Received StartSync. Params:", connectorType);

    return this.connectorSyncService.sync(connectorType, connectorInfo, athleteModel, userSettings, syncFromDateTime);
  }

  public handleStopSync(requestConnectorType: ConnectorType): Promise<void> {
    this.logger.debug("[Main] Received StartSync. Params:", requestConnectorType);
    return this.connectorSyncService.stop(requestConnectorType);
  }
}
