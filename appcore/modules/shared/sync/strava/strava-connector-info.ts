import { StravaAccount } from "./strava-account";

export class StravaConnectorInfo {
  public static readonly DEFAULT_MODEL: StravaConnectorInfo = new StravaConnectorInfo(null, null);

  public clientId: number;
  public clientSecret: string;
  public accessToken: string;
  public refreshToken: string;
  public expiresAt: number;
  public updateSyncedActivitiesNameAndType: boolean;
  public stravaAccount: StravaAccount;

  constructor(
    clientId: number,
    clientSecret: string,
    accessToken: string = null,
    refreshToken: string = null,
    expiresAt: number = null,
    updateSyncedActivitiesNameAndType: boolean = false,
    stravaAccount: StravaAccount = null
  ) {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    this.expiresAt = expiresAt;
    this.updateSyncedActivitiesNameAndType = updateSyncedActivitiesNameAndType;
    this.stravaAccount = stravaAccount;
  }
}
