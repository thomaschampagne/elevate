import { ConnectorType } from "@elevate/shared/sync/connectors/connector-type.enum";
import { StoppedSyncEvent } from "@elevate/shared/sync/events/stopped-sync.event";
import { ErrorSyncEvent } from "@elevate/shared/sync/events/error-sync.event";
import { fibonacci } from "@elevate/shared/tools/fibonacci";
import { sleep } from "@elevate/shared/tools/sleep";
import { AxiosError, AxiosRequestConfig, AxiosResponse } from "axios";
import _ from "lodash";
import { inject, singleton } from "tsyringe";
import { StatusCodes } from "../enum/status-codes.enum";
import { Logger } from "../logger";
import { HttpClient } from "./http.client";

export interface GarminAccessToken {
  accessToken: string;
  expiresAt: number; // Epoch millis
}

/**
 * Activity summary as returned by Garmin Personal API "activitylist-service".
 * Only fields used by Elevate are declared. Garmin returns many more.
 */
export interface GarminActivitySummary {
  activityId: number;
  activityName?: string;
  description?: string;
  startTimeGMT: string; // "YYYY-MM-DD HH:mm:ss" in UTC
  startTimeLocal?: string;
  activityType?: { typeKey: string; typeId?: number; parentTypeId?: number };
  duration?: number; // seconds
  elapsedDuration?: number; // seconds
  movingDuration?: number; // seconds
  distance?: number; // meters
  elevationGain?: number; // meters
  elevationLoss?: number; // meters
  averageSpeed?: number; // m/s
  maxSpeed?: number; // m/s
  averageHR?: number;
  maxHR?: number;
  calories?: number;
  manualActivity?: boolean;
}

export interface GarminRequestOptions {
  /** Notified when a rate limit wait starts */
  onQuotaReachedRetry?: (retryMillis: number) => void;
  /** Polled during rate limit waits: when true, the request rejects with a StoppedSyncEvent */
  shouldStop?: () => boolean;
}

/**
 * Client of the Garmin Connect "Personal API".
 * - Docs: https://developer.garmin.com/gc-developer-program/personal/personal-api/
 * - A personal API key is exchanged for a 24h bearer token (no refresh token exists, the key is re-exchanged).
 * - Read only GET endpoints served from personal.connectapi.garmin.com
 */
@singleton()
export class GarminApiClient {
  public static readonly API_BASE_URL: string = "https://personal.connectapi.garmin.com";
  public static readonly TOKEN_URL: string = `${GarminApiClient.API_BASE_URL}/personalapitoken-service/personal-api/personal-api-key/token`;
  public static readonly ACTIVITIES_SEARCH_PATH: string = "/activitylist-service/activities/search/activities";
  public static readonly ACTIVITY_DOWNLOAD_PATH: string = "/download-service/files/activity";

  public static readonly DEFAULT_TOKEN_LIFETIME_MILLIS: number = 24 * 60 * 60 * 1000;
  public static readonly TOKEN_EXPIRY_MARGIN_MILLIS: number = 5 * 60 * 1000;
  public static readonly QUOTA_REACHED_RETRY_COUNT: number = 5;
  public static readonly MAX_RETRY_AFTER_MILLIS: number = 15 * 60 * 1000;
  public static readonly CALLS_INTERVAL_MILLIS: number = 250; // Be gentle with Garmin servers (no documented rate limits)

  public static readonly TOKEN_LIKE_REGEX: RegExp = /^[A-Za-z0-9\-_.~+/=]+$/;
  public static readonly STOP_CHECK_INTERVAL_MILLIS: number = 1000;

  private cachedToken: { apiKey: string; token: GarminAccessToken } = null;

  constructor(
    @inject(HttpClient) public readonly httpClient: HttpClient,
    @inject(Logger) private readonly logger: Logger
  ) {}

  /**
   * Garmin token endpoint answers the bearer token as a raw JWT in a plain text body (as Garmin's own client
   * "connect-personal-api-python" reads it). JSON shapes are also accepted in case Garmin changes the format:
   * { access_token | accessToken | token, expires_at | expiresAt | expires_in | expiresIn }.
   * Expiry falls back on JWT "exp" claim, then on the documented 24h lifetime.
   */
  public static parseTokenResponse(data: any, now: number): GarminAccessToken {
    let accessToken: string = null;
    let expiresAt: number = null;

    if (_.isString(data)) {
      // Raw body: accept only token like strings (e.g. not an html error page)
      const raw = data.trim();
      accessToken = GarminApiClient.TOKEN_LIKE_REGEX.test(raw) ? raw : null;
    } else if (_.isObject(data)) {
      const body = data as any;
      accessToken = [body.access_token, body.accessToken, body.token].find(v => _.isString(v) && v.trim()) || null;

      const absoluteExpiry = body.expires_at ?? body.expiresAt ?? null;
      const relativeExpiry = body.expires_in ?? body.expiresIn ?? null;

      if (Number.isFinite(absoluteExpiry)) {
        expiresAt = absoluteExpiry < 1e12 ? absoluteExpiry * 1000 : absoluteExpiry; // Seconds or millis
      } else if (_.isString(absoluteExpiry) && Number.isFinite(Date.parse(absoluteExpiry))) {
        expiresAt = Date.parse(absoluteExpiry);
      } else if (Number.isFinite(relativeExpiry)) {
        expiresAt = now + relativeExpiry * 1000;
      }
    }

    if (!accessToken) {
      return null;
    }

    if (!expiresAt) {
      const jwtExp = GarminApiClient.readJwtExpiry(accessToken);
      expiresAt = jwtExp ? jwtExp : now + GarminApiClient.DEFAULT_TOKEN_LIFETIME_MILLIS;
    }

    return { accessToken: accessToken, expiresAt: expiresAt };
  }

  public static readJwtExpiry(jwt: string): number {
    const parts = jwt.split(".");
    if (parts.length !== 3) {
      return null;
    }
    try {
      const payload = JSON.parse(
        Buffer.from(parts[1].replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8")
      );
      return Number.isFinite(payload?.exp) ? payload.exp * 1000 : null;
    } catch (err) {
      return null;
    }
  }

  /**
   * Describe an http error without its request config (which holds the api key or bearer token)
   */
  public static describeError(error: any): string {
    const status = error?.response?.status ? ` status=${error.response.status}` : "";
    const code = error?.code ? ` code=${error.code}` : "";
    return `${error?.message || "Unknown error"}${code}${status}`;
  }

  public static toSearchDate(date: Date): string {
    return date.toISOString().slice(0, 10); // YYYY-MM-DD
  }

  /**
   * Exchange personal api key for a bearer access token
   */
  public exchangeApiKey(apiKey: string): Promise<GarminAccessToken> {
    if (_.isEmpty(apiKey?.trim())) {
      return Promise.reject(ErrorSyncEvent.GARMIN_API_UNAUTHORIZED.create("No Garmin personal API key configured."));
    }

    return this.httpClient
      .post(GarminApiClient.TOKEN_URL, null, {
        // Token endpoint produces plain text: requesting JSON only is refused with HTTP 406
        headers: { Authorization: `ApiKey ${apiKey.trim()}`, Accept: "*/*" },
        responseType: "text"
      })
      .then((response: AxiosResponse) => {
        const token = GarminApiClient.parseTokenResponse(response.data, this.getCurrentTime());
        if (!token) {
          return Promise.reject(
            ErrorSyncEvent.UNHANDLED_ERROR_SYNC.create(
              ConnectorType.GARMIN,
              "Unexpected response from Garmin while exchanging the personal API key for an access token."
            )
          );
        }
        this.cachedToken = { apiKey: apiKey, token: token };
        this.logger.info(`Garmin access token obtained. Valid until ${new Date(token.expiresAt).toISOString()}`);
        return Promise.resolve(token);
      })
      .catch((error: AxiosError | ErrorSyncEvent) => {
        if (error instanceof ErrorSyncEvent) {
          return Promise.reject(error);
        }

        const status = (error as AxiosError).response?.status;
        if (status === StatusCodes.UNAUTHORIZED || status === StatusCodes.FORBIDDEN || status === 400) {
          return Promise.reject(ErrorSyncEvent.GARMIN_API_UNAUTHORIZED.create());
        }

        if (status === StatusCodes.TOO_MANY_REQUESTS) {
          return Promise.reject(ErrorSyncEvent.GARMIN_API_QUOTA_REACHED.create());
        }

        this.logger.error(`Garmin token exchange error: ${GarminApiClient.describeError(error)}`);
        return Promise.reject(
          ErrorSyncEvent.UNHANDLED_ERROR_SYNC.create(
            ConnectorType.GARMIN,
            status ? `Garmin token exchange failed with HTTP status ${status}.` : "Unable to connect to Garmin servers."
          )
        );
      });
  }

  /**
   * Get a valid access token for the api key, re-using the in-memory one when still valid.
   * Tokens are intentionally not persisted: the key is the only credential stored by Elevate.
   */
  public getAccessToken(apiKey: string, forceRenew = false): Promise<string> {
    const isCachedTokenValid =
      !forceRenew &&
      this.cachedToken?.apiKey === apiKey &&
      this.cachedToken.token.expiresAt - GarminApiClient.TOKEN_EXPIRY_MARGIN_MILLIS > this.getCurrentTime();

    if (isCachedTokenValid) {
      return Promise.resolve(this.cachedToken.token.accessToken);
    }

    return this.exchangeApiKey(apiKey).then(token => token.accessToken);
  }

  public clearCachedToken(): void {
    this.cachedToken = null;
  }

  public get<T>(
    apiKey: string,
    path: string,
    params: Record<string, string | number> = null,
    requestConfig: AxiosRequestConfig = {},
    options: GarminRequestOptions = {},
    tryCount = 1,
    tokenRenewed = false
  ): Promise<T> {
    const url = `${GarminApiClient.API_BASE_URL}${path}`;

    return this.getAccessToken(apiKey, false)
      .then(accessToken => {
        return this.sleep(GarminApiClient.CALLS_INTERVAL_MILLIS).then(() =>
          this.httpClient.get(url, {
            ...requestConfig,
            params: params || undefined,
            headers: { Authorization: `Bearer ${accessToken}`, Accept: "application/json", ...requestConfig.headers }
          })
        );
      })
      .then((response: AxiosResponse) => Promise.resolve(response.data as T))
      .catch((error: AxiosError | ErrorSyncEvent) => {
        if (error instanceof ErrorSyncEvent) {
          return Promise.reject(error);
        }

        const axiosError = error as AxiosError;

        if (!axiosError.response?.status) {
          this.logger.error(`Garmin api connection error: ${GarminApiClient.describeError(axiosError)}`);
          return Promise.reject(
            ErrorSyncEvent.UNHANDLED_ERROR_SYNC.create(ConnectorType.GARMIN, "Unable to connect to Garmin servers.")
          );
        }

        const status = axiosError.response.status;
        this.logger.error(`Garmin api error on ${path}. Status: ${status}, Message: ${axiosError.response.statusText}`);

        switch (status) {
          case StatusCodes.UNAUTHORIZED:
            // Token may have been revoked or expired earlier than announced: renew once from the api key
            if (!tokenRenewed) {
              this.clearCachedToken();
              return this.get<T>(apiKey, path, params, requestConfig, options, tryCount, true);
            }
            return Promise.reject(ErrorSyncEvent.GARMIN_API_UNAUTHORIZED.create());

          case StatusCodes.FORBIDDEN:
            return Promise.reject(ErrorSyncEvent.GARMIN_API_FORBIDDEN.create(url));

          case StatusCodes.NOT_FOUND:
            return Promise.reject(ErrorSyncEvent.GARMIN_API_RESOURCE_NOT_FOUND.create(url));

          case StatusCodes.REQUEST_TIMEOUT:
            return Promise.reject(ErrorSyncEvent.GARMIN_API_TIMEOUT.create(url));

          case StatusCodes.TOO_MANY_REQUESTS: {
            if (tryCount > GarminApiClient.QUOTA_REACHED_RETRY_COUNT) {
              return Promise.reject(ErrorSyncEvent.GARMIN_API_QUOTA_REACHED.create());
            }

            const retryMillis = this.retryInMillis(tryCount, axiosError.response.headers?.["retry-after"]);
            this.logger.info(`Garmin api quota reached. Waiting ${retryMillis}ms before retry #${tryCount}`);

            if (options.onQuotaReachedRetry) {
              options.onQuotaReachedRetry(retryMillis);
            }

            return this.waitUnlessStopped(retryMillis, options.shouldStop).then(() =>
              this.get<T>(apiKey, path, params, requestConfig, options, tryCount + 1, tokenRenewed)
            );
          }

          default:
            return Promise.reject(
              ErrorSyncEvent.GARMIN_API_HTTP_ERROR.create(url, status, axiosError.response.statusText)
            );
        }
      });
  }

  /**
   * Search activities, newest first.
   * @param start offset of the first activity to return
   * @param limit max number of activities to return
   * @param startDate optional lower bound date (activities performed on or after this day)
   */
  public searchActivities(
    apiKey: string,
    start: number,
    limit: number,
    startDate: Date = null,
    options: GarminRequestOptions = {}
  ): Promise<GarminActivitySummary[]> {
    const params: Record<string, string | number> = { start: start, limit: limit };
    if (startDate) {
      params.startDate = GarminApiClient.toSearchDate(startDate);
    }
    return this.get<GarminActivitySummary[]>(apiKey, GarminApiClient.ACTIVITIES_SEARCH_PATH, params, {}, options).then(
      activities => Promise.resolve(_.isArray(activities) ? activities : [])
    );
  }

  /**
   * Download the original activity file(s) as a zip archive
   */
  public downloadActivityArchive(
    apiKey: string,
    activityId: number,
    options: GarminRequestOptions = {}
  ): Promise<Buffer> {
    return this.get<ArrayBuffer>(
      apiKey,
      `${GarminApiClient.ACTIVITY_DOWNLOAD_PATH}/${activityId}`,
      null,
      {
        responseType: "arraybuffer",
        headers: { Accept: "application/zip, application/x-zip-compressed, application/octet-stream" }
      },
      options
    ).then(data => Promise.resolve(Buffer.from(data)));
  }

  /**
   * Check a personal api key: exchange it then perform a minimal read
   */
  public testApiKey(apiKey: string): Promise<void> {
    return this.getAccessToken(apiKey, true)
      .then(() => this.searchActivities(apiKey, 0, 1))
      .then(() => Promise.resolve());
  }

  public retryInMillis(tryCount: number, retryAfterHeader: unknown = null): number {
    const retryAfterSeconds = Number(retryAfterHeader);
    if (Number.isFinite(retryAfterSeconds) && retryAfterSeconds > 0) {
      return Math.min(retryAfterSeconds * 1000, GarminApiClient.MAX_RETRY_AFTER_MILLIS);
    }
    return Math.min(fibonacci(tryCount) * 60 * 1000, GarminApiClient.MAX_RETRY_AFTER_MILLIS);
  }

  /**
   * Wait for the given time, checking for a stop request every second
   */
  public waitUnlessStopped(milliseconds: number, shouldStop: () => boolean = null): Promise<void> {
    if (shouldStop && shouldStop()) {
      return Promise.reject(new StoppedSyncEvent(ConnectorType.GARMIN));
    }
    if (milliseconds <= 0) {
      return Promise.resolve();
    }
    const chunk = shouldStop ? Math.min(GarminApiClient.STOP_CHECK_INTERVAL_MILLIS, milliseconds) : milliseconds;
    return this.sleep(chunk).then(() => this.waitUnlessStopped(milliseconds - chunk, shouldStop));
  }

  public getCurrentTime(): number {
    return Date.now();
  }

  public sleep(milliseconds: number): Promise<void> {
    return sleep(milliseconds);
  }
}
