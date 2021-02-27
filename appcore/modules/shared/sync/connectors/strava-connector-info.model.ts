import { StravaAccount } from "../strava";
import { ConnectorInfo } from "./connector-info.model";

export class StravaConnectorInfo extends ConnectorInfo {
  public static readonly DEFAULT_MODEL: StravaConnectorInfo = new StravaConnectorInfo(null, null);

  constructor(
    public clientId: number,
    public clientSecret: string,
    public accessToken: string = null,
    public refreshToken: string = null,
    public expiresAt: number = null,
    public updateSyncedActivitiesNameAndType: boolean = true,
    public stravaAccount: StravaAccount = null
  ) {
    super();
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    this.expiresAt = expiresAt;
    this.updateSyncedActivitiesNameAndType = updateSyncedActivitiesNameAndType;
    this.stravaAccount = stravaAccount;
  }
}
