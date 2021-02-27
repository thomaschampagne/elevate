import { Channel, IpcTunnelService } from "@elevate/shared/electron";
import { AppService } from "../app-service";
import { inject, singleton } from "tsyringe";
import { ConnectorSyncService } from "../connectors/connector-sync.service";
import { ConnectorInfo, ConnectorType } from "@elevate/shared/sync";
import { AthleteModel, ConnectorSyncDateTime, UserSettings } from "@elevate/shared/models";
import logger from "electron-log";
import { IpcListener } from "./ipc-listener.interface";
import UserSettingsModel = UserSettings.UserSettingsModel;

@singleton()
export class IpcSyncMessageListener implements IpcListener {
  constructor(
    @inject(AppService) private readonly appService: AppService,
    @inject(ConnectorSyncService) private readonly connectorSyncService: ConnectorSyncService
  ) {}

  public startListening(ipcTunnelService: IpcTunnelService): void {
    // Start sync
    ipcTunnelService.on<
      Array<[ConnectorType, ConnectorSyncDateTime, ConnectorInfo, AthleteModel, UserSettingsModel]>,
      string
    >(Channel.startSync, payload => {
      const [connectorType, connectorSyncDateTime, connectorInfo, athleteModel, userSettingsModel] = payload[0];
      return this.handleStartSync(connectorType, connectorSyncDateTime, connectorInfo, athleteModel, userSettingsModel);
    });

    // Stop sync
    ipcTunnelService.on<Array<[ConnectorType]>, string>(Channel.stopSync, payload => {
      const connectorType = payload[0][0];
      return this.handleStopSync(connectorType);
    });
  }

  public handleStartSync(
    connectorType: ConnectorType,
    connectorSyncDateTime: ConnectorSyncDateTime,
    connectorInfo: ConnectorInfo,
    athleteModel: AthleteModel,
    userSettingsModel: UserSettingsModel
  ): Promise<string> {
    logger.debug("[Main] Received StartSync. Params:", connectorType);

    return this.connectorSyncService.sync(
      connectorType,
      connectorSyncDateTime,
      connectorInfo,
      athleteModel,
      userSettingsModel
    );
  }

  public handleStopSync(requestConnectorType: ConnectorType): Promise<string> {
    logger.debug("[Main] Received StartSync. Params:", requestConnectorType);
    return this.connectorSyncService.stop(requestConnectorType);
  }
}
