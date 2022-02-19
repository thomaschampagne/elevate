import { Inject, Injectable } from "@angular/core";
import { DesktopSyncService } from "../../../shared/services/sync/impl/desktop-sync.service";
import { StravaConnectorInfoService } from "../../../shared/services/strava-connector-info/strava-connector-info.service";
import { SyncService } from "../../../shared/services/sync/sync.service";
import { ConnectorService } from "../connector.service";
import { IPC_TUNNEL_SERVICE } from "../../ipc/ipc-tunnel-service.token";
import { IpcTunnelService } from "@elevate/shared/electron/ipc-tunnel";
import { IpcMessage } from "@elevate/shared/electron/ipc-message";
import { ConnectorType } from "@elevate/shared/sync/connectors/connector-type.enum";
import { Gender } from "@elevate/shared/models/athlete/gender.enum";
import { StravaAccount } from "@elevate/shared/sync/strava/strava-account";
import { StravaConnectorInfo } from "@elevate/shared/sync/connectors/strava-connector-info.model";
import { Channel } from "@elevate/shared/electron/channels.enum";

@Injectable()
export class StravaConnectorService extends ConnectorService {
  constructor(
    @Inject(IPC_TUNNEL_SERVICE) public readonly ipcTunnelService: IpcTunnelService,
    @Inject(StravaConnectorInfoService) public readonly stravaConnectorInfoService: StravaConnectorInfoService,
    @Inject(SyncService) private readonly desktopSyncService: DesktopSyncService
  ) {
    super();
  }

  public fetch(): Promise<StravaConnectorInfo> {
    return this.stravaConnectorInfoService.fetch();
  }

  /**
   * Promise updated StravaConnectorInfo with proper access & refresh token
   */
  public authenticate(): Promise<StravaConnectorInfo> {
    let stravaConnectorInfo: StravaConnectorInfo = null;

    return this.fetch()
      .then((stravaConnectorInfoFetched: StravaConnectorInfo) => {
        stravaConnectorInfo = stravaConnectorInfoFetched;

        const ipcMessage = new IpcMessage(
          Channel.stravaLink,
          stravaConnectorInfo.clientId,
          stravaConnectorInfo.clientSecret,
          stravaConnectorInfo.refreshToken
        );

        return this.ipcTunnelService.send<
          IpcMessage,
          { accessToken: string; refreshToken: string; expiresAt: number; athlete: any }
        >(ipcMessage);
      })
      .then(result => {
        stravaConnectorInfo.accessToken = result.accessToken;
        stravaConnectorInfo.refreshToken = result.refreshToken;
        stravaConnectorInfo.expiresAt = result.expiresAt;
        stravaConnectorInfo.stravaAccount = new StravaAccount(
          result.athlete.id,
          result.athlete.username,
          result.athlete.firstname,
          result.athlete.lastname,
          result.athlete.city,
          result.athlete.state,
          result.athlete.country,
          result.athlete.sex === "M" ? Gender.MEN : Gender.WOMEN
        );
        return this.stravaConnectorInfoService.update(stravaConnectorInfo);
      })
      .catch(error => {
        return Promise.reject(error);
      });
  }

  /**
   *
   */
  public sync(fastSync: boolean = null, forceSync: boolean = null): Promise<void> {
    return this.desktopSyncService.sync(fastSync, forceSync, ConnectorType.STRAVA);
  }
}
