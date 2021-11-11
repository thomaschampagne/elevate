import { ConnectorInfo } from "./connector-info.model";
import { StravaAccount } from "../strava/strava-account";

export class StravaConnectorInfo extends ConnectorInfo {
  public static readonly DEFAULT_MODEL: StravaConnectorInfo = new StravaConnectorInfo(null, null);

  constructor(
    public clientId: number,
    public clientSecret: string,
    public accessToken: string = null,
    public refreshToken: string = null,
    public expiresAt: number = null,
    public updateExistingNamesTypesCommutes: boolean = true,
    public stravaAccount: StravaAccount = null
  ) {
    super();
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    this.expiresAt = expiresAt;
    this.updateExistingNamesTypesCommutes = updateExistingNamesTypesCommutes;
    this.stravaAccount = stravaAccount;
  }
}
