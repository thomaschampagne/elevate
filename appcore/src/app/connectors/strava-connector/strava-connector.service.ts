import { Inject, Injectable } from "@angular/core";
import { ConnectorType, StravaAccount, StravaConnectorInfo } from "@elevate/shared/sync";
import { FlaggedIpcMessage, MessageFlag } from "@elevate/shared/electron";
import { DesktopSyncService } from "../../shared/services/sync/impl/desktop-sync.service";
import { StravaConnectorInfoService } from "../../shared/services/strava-connector-info/strava-connector-info.service";
import { Gender } from "@elevate/shared/models";
import { IpcMessagesSender } from "../../desktop/ipc-messages/ipc-messages-sender.service";
import { SyncService } from "../../shared/services/sync/sync.service";
import { ConnectorService } from "../connector.service";

@Injectable()
export class StravaConnectorService extends ConnectorService {
  constructor(
    @Inject(StravaConnectorInfoService) public readonly stravaConnectorInfoService: StravaConnectorInfoService,
    @Inject(IpcMessagesSender) private readonly ipcMessagesSender: IpcMessagesSender,
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

        const flaggedIpcMessage = new FlaggedIpcMessage(
          MessageFlag.LINK_STRAVA_CONNECTOR,
          stravaConnectorInfo.clientId,
          stravaConnectorInfo.clientSecret,
          stravaConnectorInfo.refreshToken
        );

        return this.ipcMessagesSender.send<{
          accessToken: string;
          refreshToken: string;
          expiresAt: number;
          athlete: any;
        }>(flaggedIpcMessage);
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
