import { Inject, Injectable } from "@angular/core";
import { DesktopSyncService } from "../../../shared/services/sync/impl/desktop-sync.service";
import { SyncService } from "../../../shared/services/sync/sync.service";
import { ConnectorService } from "../connector.service";
import { IPC_TUNNEL_SERVICE } from "../../ipc/ipc-tunnel-service.token";
import { IpcTunnelService } from "@elevate/shared/electron/ipc-tunnel";
import { IpcMessage } from "@elevate/shared/electron/ipc-message";
import { Channel } from "@elevate/shared/electron/channels.enum";
import { ConnectorType } from "@elevate/shared/sync/connectors/connector-type.enum";
import { GarminConnectorInfo } from "@elevate/shared/sync/connectors/garmin-connector-info.model";
import { GarminConnectorInfoService } from "../../../shared/services/garmin-connector-info/garmin-connector-info.service";

@Injectable()
export class GarminConnectorService extends ConnectorService {
  constructor(
    @Inject(IPC_TUNNEL_SERVICE) public readonly ipcTunnelService: IpcTunnelService,
    @Inject(GarminConnectorInfoService) public readonly garminConnectorInfoService: GarminConnectorInfoService,
    @Inject(SyncService) private readonly desktopSyncService: DesktopSyncService
  ) {
    super();
  }

  public fetch(): Promise<GarminConnectorInfo> {
    return this.garminConnectorInfoService.fetch();
  }

  public update(garminConnectorInfo: GarminConnectorInfo): Promise<GarminConnectorInfo> {
    return this.garminConnectorInfoService.update(garminConnectorInfo);
  }

  /**
   * Ask the desktop main process to exchange the key for a token and perform a minimal read
   */
  public testApiKey(apiKey: string): Promise<{ valid: boolean; message: string }> {
    return this.ipcTunnelService.send<IpcMessage, { valid: boolean; message: string }>(
      new IpcMessage(Channel.garminTestApiKey, apiKey)
    );
  }

  public sync(fastSync: boolean = null, forceSync: boolean = null): Promise<void> {
    return this.desktopSyncService.sync(fastSync, forceSync, ConnectorType.GARMIN);
  }
}
