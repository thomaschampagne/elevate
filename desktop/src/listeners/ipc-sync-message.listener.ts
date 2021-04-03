import { Channel, IpcTunnelService } from "@elevate/shared/electron";
import { AppService } from "../app-service";
import { inject, singleton } from "tsyringe";
import { ConnectorSyncService } from "../connectors/connector-sync.service";
import { ConnectorInfo, ConnectorType } from "@elevate/shared/sync";
import { AthleteModel, UserSettings } from "@elevate/shared/models";
import { IpcListener } from "./ipc-listener.interface";
import { Logger } from "../logger";
import UserSettingsModel = UserSettings.UserSettingsModel;

@singleton()
export class IpcSyncMessageListener implements IpcListener {
  constructor(
    @inject(AppService) private readonly appService: AppService,
    @inject(ConnectorSyncService) private readonly connectorSyncService: ConnectorSyncService,
    @inject(Logger) private readonly logger: Logger
  ) {}

  public startListening(ipcTunnelService: IpcTunnelService): void {
    // Start sync
    ipcTunnelService.on<Array<[ConnectorType, ConnectorInfo, AthleteModel, UserSettingsModel, number]>, string>(
      Channel.startSync,
      payload => {
        const [connectorType, connectorInfo, athleteModel, userSettingsModel, syncFromDateTime] = payload[0];
        return this.handleStartSync(connectorType, connectorInfo, athleteModel, userSettingsModel, syncFromDateTime);
      }
    );

    // Stop sync
    ipcTunnelService.on<Array<[ConnectorType]>, string>(Channel.stopSync, payload => {
      const connectorType = payload[0][0];
      return this.handleStopSync(connectorType);
    });
  }

  public handleStartSync(
    connectorType: ConnectorType,
    connectorInfo: ConnectorInfo,
    athleteModel: AthleteModel,
    userSettingsModel: UserSettingsModel,
    syncFromDateTime: number
  ): Promise<string> {
    this.logger.debug("[Main] Received StartSync. Params:", connectorType);

    return this.connectorSyncService.sync(
      connectorType,
      connectorInfo,
      athleteModel,
      userSettingsModel,
      syncFromDateTime
    );
  }

  public handleStopSync(requestConnectorType: ConnectorType): Promise<string> {
    this.logger.debug("[Main] Received StartSync. Params:", requestConnectorType);
    return this.connectorSyncService.stop(requestConnectorType);
  }
}
