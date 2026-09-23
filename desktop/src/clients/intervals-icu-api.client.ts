import { ConnectorType } from "@elevate/shared/sync/connectors/connector-type.enum";
import { IntervalsIcuConnectorInfo } from "@elevate/shared/sync/connectors/intervals-icu-connector-info.model";
import { ErrorSyncEvent } from "@elevate/shared/sync/events/error-sync.event";
import { sleep } from "@elevate/shared/tools/sleep";
import { AxiosError, AxiosResponse } from "axios";
import _ from "lodash";
import { inject, singleton } from "tsyringe";
import { StatusCodes } from "../enum/status-codes.enum";
import { Logger } from "../logger";
import { HttpClient } from "./http.client";

/**
 * Client of the intervals.icu api (https://intervals.icu/api/v1/docs)
 * Authentication uses basic auth with username "API_KEY" and the athlete personal api key as password.
 */
@singleton()
export class IntervalsIcuApiClient {
  public static readonly API_BASE_URL: string = "https://intervals.icu/api/v1";
  public static readonly BASIC_AUTH_USERNAME: string = "API_KEY";
  public static readonly TOO_MANY_REQUESTS_RETRY_COUNT: number = 5;
  public static readonly TOO_MANY_REQUESTS_BASE_WAIT_MILLIS: number = 2000;

  constructor(
    @inject(HttpClient) public readonly httpClient: HttpClient,
    @inject(Logger) private readonly logger: Logger
  ) {}

  public static authHeader(apiKey: string): string {
    return "Basic " + Buffer.from(`${IntervalsIcuApiClient.BASIC_AUTH_USERNAME}:${apiKey}`, "utf8").toString("base64");
  }

  public get<T>(
    connectorInfo: IntervalsIcuConnectorInfo,
    url: string,
    onTooManyRequestsRetry: (retryMillis: number) => void = null,
    tries = 1
  ): Promise<T> {
    if (_.isEmpty(connectorInfo?.apiKey) || _.isEmpty(connectorInfo?.athleteId)) {
      return Promise.reject(ErrorSyncEvent.INTERVALS_ICU_API_UNAUTHORIZED.create());
    }

    return this.httpClient
      .get(url, {
        headers: {
          Authorization: IntervalsIcuApiClient.authHeader(connectorInfo.apiKey),
          Accept: "application/json"
        }
      })
      .then((response: AxiosResponse) => Promise.resolve(response.data))
      .catch((error: AxiosError) => {
        if (!error.response?.status) {
          this.logger.error("Intervals.icu api connection error", error);
          return Promise.reject(
            ErrorSyncEvent.UNHANDLED_ERROR_SYNC.create(
              ConnectorType.INTERVALS_ICU,
              "Unable to connect to intervals.icu servers"
            )
          );
        }

        this.logger.error(
          `Intervals.icu api Error. Status: ${error.response.status}, Message: ${error.response.statusText}`
        );

        switch (error.response.status) {
          case StatusCodes.UNAUTHORIZED:
          case StatusCodes.FORBIDDEN:
            return Promise.reject(ErrorSyncEvent.INTERVALS_ICU_API_UNAUTHORIZED.create());

          case StatusCodes.NOT_FOUND:
            return Promise.reject(ErrorSyncEvent.INTERVALS_ICU_API_RESOURCE_NOT_FOUND.create(url));

          case StatusCodes.TOO_MANY_REQUESTS:
            if (tries > IntervalsIcuApiClient.TOO_MANY_REQUESTS_RETRY_COUNT) {
              return Promise.reject(
                ErrorSyncEvent.UNHANDLED_ERROR_SYNC.create(
                  ConnectorType.INTERVALS_ICU,
                  "Intervals.icu api rate limit reached, retry sync later."
                )
              );
            }

            const retryMillis = this.retryInMillis(tries, error.response.headers?.["retry-after"]);
            if (onTooManyRequestsRetry) {
              onTooManyRequestsRetry(retryMillis);
            }
            this.logger.info(`Intervals.icu rate limit reached. Waiting ${retryMillis}ms before continue.`);

            return this.sleep(retryMillis).then(() =>
              this.get<T>(connectorInfo, url, onTooManyRequestsRetry, tries + 1)
            );

          default:
            return Promise.reject(
              ErrorSyncEvent.UNHANDLED_ERROR_SYNC.create(
                ConnectorType.INTERVALS_ICU,
                `UNHANDLED HTTP GET ERROR on '${url}'. Error code: ${error.response.status}; Error message: ${error.response.statusText}`
              )
            );
        }
      });
  }

  /**
   * Use server "Retry-After" header (in seconds) when given, otherwise exponential backoff
   */
  public retryInMillis(tryCount: number, retryAfterHeader?: string): number {
    const retryAfterSeconds = parseInt(retryAfterHeader, 10);
    if (Number.isFinite(retryAfterSeconds) && retryAfterSeconds > 0) {
      return retryAfterSeconds * 1000;
    }
    return IntervalsIcuApiClient.TOO_MANY_REQUESTS_BASE_WAIT_MILLIS * 2 ** (tryCount - 1);
  }

  public sleep(milliseconds: number): Promise<void> {
    return sleep(milliseconds);
  }
}
