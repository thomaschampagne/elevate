import { ConnectorType, ErrorSyncEvent, StravaAccount, StravaConnectorInfo } from "@elevate/shared/sync";
import _ from "lodash";
import { fibonacci, sleep } from "@elevate/shared/tools";
import { IHttpClientResponse } from "typed-rest-client/Interfaces";
import { HttpCodes } from "typed-rest-client/HttpClient";
import http, { IncomingHttpHeaders } from "http";
import { Gender } from "@elevate/shared/models";
import { inject, singleton } from "tsyringe";
import { StravaAuthenticator } from "../connectors/strava/strava-authenticator";
import { HttpClient } from "./http.client";
import { Logger } from "../logger";

export interface RateLimit {
  usage: number;
  limit: number;
}

@singleton()
export class StravaApiClient {
  public static readonly STRAVA_RATELIMIT_LIMIT_HEADER: string = "x-ratelimit-limit";
  public static readonly STRAVA_RATELIMIT_USAGE_HEADER: string = "x-ratelimit-usage";
  public static readonly QUARTER_HOUR_TIME_INTERVAL: number = 15 * 60;
  public static readonly QUOTA_REACHED_RETRY_COUNT: number = 14;
  public static readonly TIMEOUT_RETRY_COUNT: number = 10;
  public nextCallWaitTime: number;

  constructor(
    @inject(StravaAuthenticator) public readonly stravaAuthenticator: StravaAuthenticator,
    @inject(HttpClient) public readonly httpClient: HttpClient,
    @inject(Logger) private readonly logger: Logger
  ) {
    this.nextCallWaitTime = 0;
  }

  public static parseRateLimits(
    headers: IncomingHttpHeaders
  ): {
    instant: RateLimit;
    daily: RateLimit;
  } {
    const rateLimits = {
      instant: {
        usage: null,
        limit: null
      },

      daily: {
        usage: null,
        limit: null
      }
    };

    const limits = (headers[StravaApiClient.STRAVA_RATELIMIT_LIMIT_HEADER] as string).split(",");
    const usages = (headers[StravaApiClient.STRAVA_RATELIMIT_USAGE_HEADER] as string).split(",");

    rateLimits.instant.limit = parseInt(limits[0].trim(), 10);
    rateLimits.instant.usage = parseInt(usages[0].trim(), 10);

    rateLimits.daily.limit = parseInt(limits[1].trim(), 10);
    rateLimits.daily.usage = parseInt(usages[1].trim(), 10);

    return rateLimits;
  }

  public updateNextCallWaitTime(instantRateLimit: RateLimit, timeIntervalSeconds: number): void {
    this.nextCallWaitTime = ((2 * timeIntervalSeconds) / instantRateLimit.limit ** 2) * instantRateLimit.usage;
  }

  public get<T>(
    stravaConnectorInfo: StravaConnectorInfo,
    url: string,
    onStravaConnectorInfoUpdate: (stravaConnectorInfo: StravaConnectorInfo) => void,
    onQuotaReachedRetry: (retryMillis: number) => void,
    quotaReachedTries: number = 1
  ): Promise<T> {
    if (!_.isNumber(stravaConnectorInfo.clientId) || _.isEmpty(stravaConnectorInfo.clientSecret)) {
      return Promise.reject(ErrorSyncEvent.STRAVA_API_UNAUTHORIZED.create());
    }

    return this.stravaTokensUpdater(stravaConnectorInfo, onStravaConnectorInfoUpdate)
      .then(() => {
        // Wait during next call wait time
        return sleep(this.nextCallWaitTime).then(() => {
          return this.httpClient.getRetryTimeout(
            url,
            {
              Authorization: `Bearer ${stravaConnectorInfo.accessToken}`,
              "Content-Type": "application/json"
            },
            StravaApiClient.TIMEOUT_RETRY_COUNT
          );
        });
      })
      .then((response: IHttpClientResponse) => {
        // Update time to wait for the next call to avoid the rate limit threshold
        const rateLimits = StravaApiClient.parseRateLimits(response.message.headers);
        this.updateNextCallWaitTime(rateLimits.instant, StravaApiClient.QUARTER_HOUR_TIME_INTERVAL);
        this.logger.debug(
          `Waiting ${this.nextCallWaitTime} for next strava api call. Current Rate limits:`,
          JSON.stringify(rateLimits)
        );

        return response.message.statusCode === HttpCodes.OK ? response.readBody() : Promise.reject(response.message);
      })
      .then((body: string) => {
        return Promise.resolve(JSON.parse(body));
      })
      .catch((error: http.IncomingMessage) => {
        this.logger.error(
          "strava api http.IncomingMessage",
          "statusCode: " + error.statusCode,
          "headers: " + JSON.stringify(error.headers)
        );

        switch (error.statusCode) {
          case HttpCodes.Unauthorized:
            return Promise.reject(ErrorSyncEvent.STRAVA_API_UNAUTHORIZED.create());

          case HttpCodes.Forbidden:
            return Promise.reject(ErrorSyncEvent.STRAVA_API_FORBIDDEN.create());

          case HttpCodes.TooManyRequests:
            const parseRateLimits = StravaApiClient.parseRateLimits(error.headers);
            const isInstantQuotaReached = parseRateLimits.instant.usage > parseRateLimits.instant.limit;
            const isDailyQuotaReached = parseRateLimits.daily.usage > parseRateLimits.daily.limit;

            const maxTriesQuotaReached = quotaReachedTries >= StravaApiClient.QUOTA_REACHED_RETRY_COUNT + 1;
            if (maxTriesQuotaReached) {
              if (isInstantQuotaReached) {
                return Promise.reject(
                  ErrorSyncEvent.STRAVA_INSTANT_QUOTA_REACHED.create(
                    parseRateLimits.instant.usage,
                    parseRateLimits.instant.limit
                  )
                );
              }
              if (isDailyQuotaReached) {
                return Promise.reject(
                  ErrorSyncEvent.STRAVA_DAILY_QUOTA_REACHED.create(
                    parseRateLimits.daily.usage,
                    parseRateLimits.daily.limit
                  )
                );
              }

              const errDesc = `Strava ${
                isInstantQuotaReached ? "instant quota reached" : isDailyQuotaReached ? "daily quota reached" : ""
              }, retry sync later.`;
              return ErrorSyncEvent.UNHANDLED_ERROR_SYNC.create(ConnectorType.STRAVA, errDesc);
            }

            // Retry call later
            const retryMillis = this.retryInMillis(quotaReachedTries);

            // Notify
            onQuotaReachedRetry(retryMillis);

            const logMessage = `${
              isInstantQuotaReached ? "Instant quota reached" : isDailyQuotaReached ? "Daily quota reached" : ""
            }. Waiting ${retryMillis} before continue.`;
            this.logger.info(logMessage, JSON.stringify(parseRateLimits));

            return sleep(retryMillis).then(() => {
              quotaReachedTries++;
              return this.get(
                stravaConnectorInfo,
                url,
                onStravaConnectorInfoUpdate,
                onQuotaReachedRetry,
                quotaReachedTries
              );
            });
          case HttpCodes.NotFound:
            return Promise.reject(ErrorSyncEvent.STRAVA_API_RESOURCE_NOT_FOUND.create(url));

          case HttpCodes.RequestTimeout:
            return Promise.reject(ErrorSyncEvent.STRAVA_API_TIMEOUT.create(url));

          default:
            return Promise.reject(
              ErrorSyncEvent.UNHANDLED_ERROR_SYNC.create(
                ConnectorType.STRAVA,
                `UNHANDLED HTTP GET ERROR on '${url}'. Error: ${JSON.stringify(error)}`
              )
            );
        }
      });
  }

  public retryInMillis(tryCount: number): number {
    return fibonacci(tryCount) * 60 * 1000; // Minutes => seconds => Millis
  }

  /**
   * Ensure proper connection to Strava API:
   * - Authenticate to Strava API if no "access token" is stored
   * - Authenticate to Strava API if no "refresh token" is stored
   * - Notify new StravaConnectorInfo updated with proper accessToken & refreshToken
   */
  public stravaTokensUpdater(
    stravaConnectorInfo: StravaConnectorInfo,
    onStravaConnectorInfoUpdate: (stravaConnectorInfo: StravaConnectorInfo) => void
  ): Promise<void> {
    let authPromise: Promise<{ accessToken: string; refreshToken: string; expiresAt: number }> = null;

    const isAccessTokenValid = stravaConnectorInfo.accessToken && stravaConnectorInfo.expiresAt > this.getCurrentTime();

    if (!stravaConnectorInfo.accessToken || !stravaConnectorInfo.refreshToken) {
      authPromise = this.stravaAuthenticator.authorize(stravaConnectorInfo.clientId, stravaConnectorInfo.clientSecret);
      this.logger.info("No accessToken or refreshToken found. Now authenticating to strava");
    } else if (!isAccessTokenValid && stravaConnectorInfo.refreshToken) {
      authPromise = this.stravaAuthenticator.refresh(
        stravaConnectorInfo.clientId,
        stravaConnectorInfo.clientSecret,
        stravaConnectorInfo.refreshToken
      );
      this.logger.info("Access token is expired, Refreshing token");
    } else if (isAccessTokenValid) {
      this.logger.debug("Access token is still valid, we keep current access token, no authorize and no refresh token");
      return Promise.resolve();
    } else {
      return Promise.reject(
        "Case not supported in StravaConnector::stravaTokensUpdater(). stravaConnectorInfo: " +
          JSON.stringify(stravaConnectorInfo)
      );
    }

    return authPromise.then(
      (result: { accessToken: string; refreshToken: string; expiresAt: number; athlete: any }) => {
        let stravaAccount: StravaAccount;

        if (result.athlete) {
          // First or reset authentication, use stravaAccount given by strava
          stravaAccount = new StravaAccount(
            result.athlete.id,
            result.athlete.username,
            result.athlete.firstname,
            result.athlete.lastname,
            result.athlete.city,
            result.athlete.state,
            result.athlete.country,
            result.athlete.sex === "M" ? Gender.MEN : Gender.WOMEN
          );
        } else if (stravaConnectorInfo.stravaAccount) {
          // Case of refresh token, re-use stored stravaAccount
          stravaAccount = stravaConnectorInfo.stravaAccount;
        } else {
          stravaAccount = null;
        }

        // Update credentials
        stravaConnectorInfo.accessToken = result.accessToken;
        stravaConnectorInfo.refreshToken = result.refreshToken;
        stravaConnectorInfo.expiresAt = result.expiresAt;
        stravaConnectorInfo.stravaAccount = stravaAccount;

        // Notify strava info update
        onStravaConnectorInfoUpdate(stravaConnectorInfo);

        return Promise.resolve();
      },
      error => {
        return Promise.reject(error);
      }
    );
  }

  public getCurrentTime(): number {
    return new Date().getTime();
  }
}
