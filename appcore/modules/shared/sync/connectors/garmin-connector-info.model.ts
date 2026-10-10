import { ConnectorInfo } from "./connector-info.model";

/**
 * Configuration persisted for the Garmin Connect connector.
 *
 * Garmin Connect has no public OAuth application flow. Authentication is done
 * by logging in with the user credentials (username/password) once, then by
 * re-using the OAuth1/OAuth2 tokens returned by the login for every sync.
 *
 * The password is intentionally NOT persisted: it is only used during the
 * linking step (in the electron main process) to obtain tokens. Only the
 * resulting tokens are stored here so that subsequent syncs never need the
 * password again.
 */
export class GarminConnectorInfo extends ConnectorInfo {
  public static readonly DEFAULT_MODEL: GarminConnectorInfo = new GarminConnectorInfo(null);

  public username: string | null;

  /**
   * OAuth1 token used to build OAuth2 tokens. Kept to be able to re-authenticate.
   */
  public oauth1Token: unknown | null;

  /**
   * OAuth2 (Bearer) token used for every Garmin Connect API call.
   */
  public oauth2Token: unknown | null;

  /**
   * Timestamp (ms) at which the oauth2 token expires. Used to re-link if needed.
   */
  public expiresAt: number | null;

  /**
   * Garmin display name of the linked account (for UI feedback).
   */
  public displayName: string | null;

  constructor(
    username: string | null = null,
    oauth1Token: unknown | null = null,
    oauth2Token: unknown | null = null,
    expiresAt: number | null = null,
    displayName: string | null = null
  ) {
    super();
    this.username = username;
    this.oauth1Token = oauth1Token;
    this.oauth2Token = oauth2Token;
    this.expiresAt = expiresAt;
    this.displayName = displayName;
  }
}
