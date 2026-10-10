import { Inject, Injectable } from "@angular/core";
import { DesktopSyncService } from "../../../shared/services/sync/impl/desktop-sync.service";
import { GarminConnectorInfoService } from "../../../shared/services/garmin-connector-info/garmin-connector-info.service";
import { SyncService } from "../../../shared/services/sync/sync.service";
import { ConnectorService } from "../connector.service";
import { IPC_TUNNEL_SERVICE } from "../../ipc/ipc-tunnel-service.token";
import { IpcTunnelService } from "@elevate/shared/electron/ipc-tunnel";
import { IpcMessage } from "@elevate/shared/electron/ipc-message";
import { ConnectorType } from "@elevate/shared/sync/connectors/connector-type.enum";
import { GarminConnectorInfo } from "@elevate/shared/sync/connectors/garmin-connector-info.model";
import { Channel } from "@elevate/shared/electron/channels.enum";

@Injectable()
export class GarminConnectorService extends ConnectorService {
  constructor(
    @Inject(IPC_TUNNEL_SERVICE) public readonly ipcTunnelService: IpcTunnelService,
    @Inject(GarminConnectorInfoService) public readonly garminConnectorInfoService: GarminConnectorInfoService,
    @Inject(SyncService) private readonly desktopSyncService: DesktopSyncService
  ) {
    super();
  }

  public fetch(): GarminConnectorInfo {
    return this.garminConnectorInfoService.fetch();
  }

  /**
   * Link the Garmin account by sending the credentials to the electron main
   * process which performs the login and returns OAuth tokens (never the password).
   * Tokens are then persisted locally for future syncs.
   */
  public authenticate(username: string, password: string): Promise<GarminConnectorInfo> {
    const ipcMessage = new IpcMessage(Channel.garminLink, username, password);

    return this.ipcTunnelService
      .send<
        IpcMessage,
        { oauth1Token: unknown; oauth2Token: unknown; expiresAt: number | null; displayName: string | null }
      >(ipcMessage)
      .then(result => {
        const garminConnectorInfo = new GarminConnectorInfo(
          username,
          result.oauth1Token,
          result.oauth2Token,
          result.expiresAt,
          result.displayName
        );
        return this.garminConnectorInfoService.save(garminConnectorInfo);
      });
  }

  public unlink(): Promise<void> {
    return this.garminConnectorInfoService.clear();
  }

  public isLinked(): boolean {
    return this.garminConnectorInfoService.isLinked();
  }

  public sync(fastSync: boolean = null, forceSync: boolean = null): Promise<void> {
    return this.desktopSyncService.sync(fastSync, forceSync, ConnectorType.GARMIN);
  }
}
