import { inject, singleton } from "tsyringe";
import { GarminConnect } from "garmin-connect";
import { Logger } from "../../logger";

/**
 * Result of a successful Garmin Connect authentication.
 * Tokens are persisted (see GarminConnectorInfo) so the password is never stored.
 */
export interface GarminTokens {
  oauth1Token: unknown;
  oauth2Token: unknown;
  expiresAt: number | null;
  displayName: string | null;
}

/**
 * Lightweight view of a Garmin activity returned by the "list activities" API.
 * The garmin-connect library types are not exported from its root entry, so we
 * declare only the fields we rely upon.
 */
export interface GarminActivitySummary {
  activityId: number;
  activityName: string;
  startTimeGMT: string;
  startTimeLocal: string;
  beginTimestamp: number;
  distance: number;
  duration: number;
  activityType: { typeId: number; typeKey: string };
  locationName: string;
}

/**
 * Thin wrapper around the "garmin-connect" npm library.
 *
 * It isolates the connector from the library API and centralizes:
 *  - authentication (username/password => tokens)
 *  - session restore from previously persisted tokens
 *  - activities listing (paged)
 *  - original activity file download (FIT inside a zip)
 */
@singleton()
export class GarminConnectClient {
  public static readonly ACTIVITIES_PER_PAGE: number = 20;

  private client: GarminConnect | null = null;

  constructor(@inject(Logger) private readonly logger: Logger) {}

  public isAuthenticated(): boolean {
    return !!this.client;
  }

  /**
   * Login with user credentials and return the tokens to persist.
   */
  public async login(username: string, password: string): Promise<GarminTokens> {
    this.client = new GarminConnect({ username, password });
    await this.client.login();

    const tokens = this.client.exportToken();

    let displayName: string | null = null;
    try {
      const profile = await this.client.getUserProfile();
      displayName = (profile as { displayName?: string })?.displayName ?? null;
    } catch (err) {
      this.logger.warn("Unable to fetch Garmin user profile display name", err);
    }

    return {
      oauth1Token: (tokens as { oauth1: unknown }).oauth1,
      oauth2Token: (tokens as { oauth2: unknown }).oauth2,
      expiresAt: this.readExpiresAt((tokens as { oauth2: unknown }).oauth2),
      displayName: displayName
    };
  }

  /**
   * Restore a session from previously persisted tokens (no password needed).
   */
  public restore(oauth1Token: unknown, oauth2Token: unknown): void {
    this.client = new GarminConnect({ username: "__restored__", password: "__restored__" });
    this.client.loadToken(oauth1Token as never, oauth2Token as never);
  }

  /**
   * List a single page of activities, most recent first.
   */
  public async listActivities(start: number, limit: number): Promise<GarminActivitySummary[]> {
    this.assertAuthenticated();
    const activities = await this.client.getActivities(start, limit);
    return (activities as unknown as GarminActivitySummary[]) ?? [];
  }

  /**
   * Total count of activities on the account.
   */
  public async countActivities(): Promise<number> {
    this.assertAuthenticated();
    const count = await this.client.countActivities();
    return (count as { totalCount?: number })?.totalCount ?? 0;
  }

  /**
   * Download the original activity file (a zip wrapping the .fit) into `dir`.
   * Returns the absolute path of the downloaded zip.
   */
  public async downloadOriginalActivityData(activityId: number, dir: string): Promise<string> {
    this.assertAuthenticated();
    await this.client.downloadOriginalActivityData({ activityId }, dir, "zip");
    return `${dir}/${activityId}.zip`;
  }

  private readExpiresAt(oauth2Token: unknown): number | null {
    const expiresAt = (oauth2Token as { expires_at?: number })?.expires_at;
    return typeof expiresAt === "number" ? expiresAt * 1000 : null;
  }

  private assertAuthenticated(): void {
    if (!this.client) {
      throw new Error("GarminConnectClient is not authenticated. Call login() or restore() first.");
    }
  }
}
