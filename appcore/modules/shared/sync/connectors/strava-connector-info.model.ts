import { ConnectorInfo } from "./connector-info.model";
import { StravaAccount } from "../strava/strava-account";

export class StravaConnectorInfo extends ConnectorInfo {
  public static readonly DEFAULT_MODEL: StravaConnectorInfo = new StravaConnectorInfo(null, null);

  constructor(
    public clientId: number | null,
    public clientSecret: string | null,
    public accessToken: string | null = null,
    public refreshToken: string | null = null,
    public expiresAt: number | null = null,
    public updateExistingNamesTypesCommutes: boolean = true,
    public stravaAccount: StravaAccount | null = null
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
