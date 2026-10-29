import { container } from "tsyringe";
import { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from "axios";
import { GarminApiClient } from "./garmin-api.client";
import { HttpClient } from "./http.client";
import { StatusCodes } from "../enum/status-codes.enum";
import { ErrorSyncEvent } from "@elevate/shared/sync/events/error-sync.event";
import { SyncEventType } from "@elevate/shared/sync/events/sync-event-type";

const createResponse = (data: any, status: number = StatusCodes.OK, headers: any = {}): AxiosResponse => {
  return { data: data, status: status, statusText: null, headers: headers, config: {} as InternalAxiosRequestConfig };
};

const createErrorResponse = (status: number, headers: any = {}): AxiosError => {
  return { response: createResponse(null, status, headers), isAxiosError: true } as AxiosError;
};

const toBase64Url = (obj: object) =>
  Buffer.from(JSON.stringify(obj)).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

const fakeJwt = (expSeconds: number) => `${toBase64Url({ alg: "HS256" })}.${toBase64Url({ exp: expSeconds })}.sig`;

describe("GarminApiClient", () => {
  const apiKey = "my-personal-api-key";
  const now = new Date("2026-10-27T12:00:00Z").getTime();

  let garminApiClient: GarminApiClient;
  let httpClient: HttpClient;

  beforeEach(done => {
    garminApiClient = container.resolve(GarminApiClient);
    httpClient = container.resolve(HttpClient);
    garminApiClient.clearCachedToken();
    spyOn(garminApiClient, "getCurrentTime").and.returnValue(now);
    spyOn(garminApiClient, "sleep").and.returnValue(Promise.resolve());
    done();
  });

  describe("Parse token response", () => {
    it("should parse a raw JWT and read its expiry", done => {
      const expSeconds = Math.floor(now / 1000) + 3600;
      const token = GarminApiClient.parseTokenResponse(fakeJwt(expSeconds), now);
      expect(token.accessToken).toEqual(fakeJwt(expSeconds));
      expect(token.expiresAt).toEqual(expSeconds * 1000);
      done();
    });

    it("should parse snake case token with relative expiry", done => {
      const token = GarminApiClient.parseTokenResponse({ access_token: "abc", expires_in: 600 }, now);
      expect(token).toEqual({ accessToken: "abc", expiresAt: now + 600 * 1000 });
      done();
    });

    it("should parse camel case token with absolute expiry in seconds or millis", done => {
      const inSeconds = GarminApiClient.parseTokenResponse({ accessToken: "abc", expiresAt: 1800000000 }, now);
      expect(inSeconds.expiresAt).toEqual(1800000000 * 1000);

      const inMillis = GarminApiClient.parseTokenResponse({ token: "abc", expires_at: 1800000000000 }, now);
      expect(inMillis.expiresAt).toEqual(1800000000000);
      done();
    });

    it("should default to 24h lifetime when no expiry is given", done => {
      const token = GarminApiClient.parseTokenResponse({ access_token: "not-a-jwt" }, now);
      expect(token.expiresAt).toEqual(now + GarminApiClient.DEFAULT_TOKEN_LIFETIME_MILLIS);
      done();
    });

    it("should reject non token like bodies", done => {
      expect(GarminApiClient.parseTokenResponse("<html><body>Error</body></html>", now)).toBeNull();
      expect(GarminApiClient.parseTokenResponse({ token: { nested: "object" } }, now)).toBeNull();
      done();
    });

    it("should return null when no token found", done => {
      expect(GarminApiClient.parseTokenResponse({ foo: "bar" }, now)).toBeNull();
      expect(GarminApiClient.parseTokenResponse(null, now)).toBeNull();
      done();
    });
  });

  describe("Access token", () => {
    it("should read the raw JWT text body returned by Garmin", done => {
      const expSeconds = Math.floor(now / 1000) + 24 * 3600;
      const jwt = fakeJwt(expSeconds);
      spyOn(httpClient, "post").and.returnValue(Promise.resolve(createResponse(`${jwt}\n`)));

      garminApiClient.exchangeApiKey(apiKey).then(token => {
        expect(token.accessToken).toEqual(jwt);
        expect(token.expiresAt).toEqual(expSeconds * 1000);
        done();
      });
    });

    it("should exchange api key with ApiKey authorization header", done => {
      const postSpy = spyOn(httpClient, "post").and.returnValue(
        Promise.resolve(createResponse({ access_token: "token-1", expires_in: 86400 }))
      );

      garminApiClient.getAccessToken(apiKey).then(accessToken => {
        expect(accessToken).toEqual("token-1");
        expect(postSpy).toHaveBeenCalledTimes(1);
        const [url, body, config] = postSpy.calls.mostRecent().args;
        expect(url).toEqual(GarminApiClient.TOKEN_URL);
        expect(body).toBeNull();
        expect(config.headers.Authorization).toEqual(`ApiKey ${apiKey}`);
        expect(config.headers.Accept).toEqual("*/*"); // Garmin answers 406 to "application/json"
        expect(config.responseType).toEqual("text");
        done();
      });
    });

    it("should reuse a valid cached token", done => {
      const postSpy = spyOn(httpClient, "post").and.returnValue(
        Promise.resolve(createResponse({ access_token: "token-1", expires_in: 86400 }))
      );

      garminApiClient
        .getAccessToken(apiKey)
        .then(() => garminApiClient.getAccessToken(apiKey))
        .then(accessToken => {
          expect(accessToken).toEqual("token-1");
          expect(postSpy).toHaveBeenCalledTimes(1);
          done();
        });
    });

    it("should renew token when close to expiry or when api key changed", done => {
      const postSpy = spyOn(httpClient, "post").and.returnValues(
        Promise.resolve(createResponse({ access_token: "token-1", expires_in: 60 })), // Within expiry margin
        Promise.resolve(createResponse({ access_token: "token-2", expires_in: 86400 })),
        Promise.resolve(createResponse({ access_token: "token-3", expires_in: 86400 }))
      );

      garminApiClient
        .getAccessToken(apiKey)
        .then(() => garminApiClient.getAccessToken(apiKey))
        .then(accessToken => {
          expect(accessToken).toEqual("token-2");
          return garminApiClient.getAccessToken("another-key");
        })
        .then(accessToken => {
          expect(accessToken).toEqual("token-3");
          expect(postSpy).toHaveBeenCalledTimes(3);
          done();
        });
    });

    it("should reject unauthorized when api key is empty or refused", done => {
      spyOn(httpClient, "post").and.returnValue(Promise.reject(createErrorResponse(StatusCodes.UNAUTHORIZED)));

      garminApiClient
        .getAccessToken("  ")
        .catch((error: ErrorSyncEvent) => {
          expect(error.code).toEqual(ErrorSyncEvent.GARMIN_API_UNAUTHORIZED.code);
          return garminApiClient.getAccessToken(apiKey);
        })
        .then(
          () => {
            throw new Error("Should not be here");
          },
          (error: ErrorSyncEvent) => {
            expect(error.code).toEqual(ErrorSyncEvent.GARMIN_API_UNAUTHORIZED.code);
            done();
          }
        );
    });
  });

  describe("Get resources", () => {
    beforeEach(done => {
      spyOn(httpClient, "post").and.returnValue(
        Promise.resolve(createResponse({ access_token: "token-1", expires_in: 86400 }))
      );
      done();
    });

    it("should search activities with paging and start date", done => {
      const getSpy = spyOn(httpClient, "get").and.returnValue(Promise.resolve(createResponse([{ activityId: 1 }])));

      garminApiClient.searchActivities(apiKey, 20, 10, new Date("2026-10-01T23:00:00Z")).then(activities => {
        expect(activities).toEqual([{ activityId: 1 } as any]);
        const [url, config] = getSpy.calls.mostRecent().args;
        expect(url).toEqual(GarminApiClient.API_BASE_URL + GarminApiClient.ACTIVITIES_SEARCH_PATH);
        expect(config.params).toEqual({ start: 20, limit: 10, startDate: "2026-10-01" });
        expect(config.headers.Authorization).toEqual("Bearer token-1");
        done();
      });
    });

    it("should download activity archive as binary", done => {
      const bytes = Uint8Array.from([80, 75, 3, 4]).buffer;
      const getSpy = spyOn(httpClient, "get").and.returnValue(Promise.resolve(createResponse(bytes)));

      garminApiClient.downloadActivityArchive(apiKey, 123).then(buffer => {
        expect(buffer.length).toEqual(4);
        const [url, config] = getSpy.calls.mostRecent().args;
        expect(url).toEqual(GarminApiClient.API_BASE_URL + GarminApiClient.ACTIVITY_DOWNLOAD_PATH + "/123");
        expect(config.responseType).toEqual("arraybuffer");
        done();
      });
    });

    it("should renew token once on 401 then succeed", done => {
      const getSpy = spyOn(httpClient, "get").and.returnValues(
        Promise.reject(createErrorResponse(StatusCodes.UNAUTHORIZED)),
        Promise.resolve(createResponse([]))
      );

      garminApiClient.searchActivities(apiKey, 0, 20).then(activities => {
        expect(activities).toEqual([]);
        expect(getSpy).toHaveBeenCalledTimes(2);
        expect(httpClient.post).toHaveBeenCalledTimes(2); // Initial + renew
        done();
      });
    });

    it("should reject unauthorized when 401 persists after renewal", done => {
      spyOn(httpClient, "get").and.returnValue(Promise.reject(createErrorResponse(StatusCodes.UNAUTHORIZED)));

      garminApiClient.searchActivities(apiKey, 0, 20).then(
        () => {
          throw new Error("Should not be here");
        },
        (error: ErrorSyncEvent) => {
          expect(error.code).toEqual(ErrorSyncEvent.GARMIN_API_UNAUTHORIZED.code);
          expect(httpClient.get).toHaveBeenCalledTimes(2);
          done();
        }
      );
    });

    it("should reject resource not found on 404", done => {
      spyOn(httpClient, "get").and.returnValue(Promise.reject(createErrorResponse(StatusCodes.NOT_FOUND)));

      garminApiClient.downloadActivityArchive(apiKey, 42).then(
        () => {
          throw new Error("Should not be here");
        },
        (error: ErrorSyncEvent) => {
          expect(error.code).toEqual(ErrorSyncEvent.GARMIN_API_RESOURCE_NOT_FOUND.code);
          done();
        }
      );
    });

    it("should wait and retry on 429 using retry-after header", done => {
      const onQuotaReachedRetry = jasmine.createSpy("onQuotaReachedRetry");
      spyOn(httpClient, "get").and.returnValues(
        Promise.reject(createErrorResponse(StatusCodes.TOO_MANY_REQUESTS, { "retry-after": "30" })),
        Promise.resolve(createResponse([{ activityId: 7 }]))
      );

      garminApiClient
        .searchActivities(apiKey, 0, 20, null, { onQuotaReachedRetry: onQuotaReachedRetry })
        .then(activities => {
          expect(activities.length).toEqual(1);
          expect(onQuotaReachedRetry).toHaveBeenCalledWith(30 * 1000);
          expect(garminApiClient.sleep).toHaveBeenCalledWith(30 * 1000);
          done();
        });
    });

    it("should reject quota reached after max retries", done => {
      spyOn(httpClient, "get").and.returnValue(Promise.reject(createErrorResponse(StatusCodes.TOO_MANY_REQUESTS)));

      garminApiClient.searchActivities(apiKey, 0, 20).then(
        () => {
          throw new Error("Should not be here");
        },
        (error: ErrorSyncEvent) => {
          expect(error.code).toEqual(ErrorSyncEvent.GARMIN_API_QUOTA_REACHED.code);
          expect(httpClient.get).toHaveBeenCalledTimes(GarminApiClient.QUOTA_REACHED_RETRY_COUNT + 1);
          done();
        }
      );
    });

    it("should reject a non fatal http error on unexpected status", done => {
      spyOn(httpClient, "get").and.returnValue(Promise.reject(createErrorResponse(500)));

      garminApiClient.downloadActivityArchive(apiKey, 42).then(
        () => {
          throw new Error("Should not be here");
        },
        (error: ErrorSyncEvent) => {
          expect(error.code).toEqual(ErrorSyncEvent.GARMIN_API_HTTP_ERROR.code);
          done();
        }
      );
    });

    it("should stop waiting on 429 when stop is requested", done => {
      let stopRequested = false;
      spyOn(httpClient, "get").and.returnValue(
        Promise.reject(createErrorResponse(StatusCodes.TOO_MANY_REQUESTS, { "retry-after": "600" }))
      );
      (garminApiClient.sleep as jasmine.Spy).and.callFake(() => {
        stopRequested = true; // User stops during first wait chunk
        return Promise.resolve();
      });

      garminApiClient.searchActivities(apiKey, 0, 20, null, { shouldStop: () => stopRequested }).then(
        () => {
          throw new Error("Should not be here");
        },
        (error: any) => {
          expect(error.type).toEqual(SyncEventType.STOPPED);
          expect(httpClient.get).toHaveBeenCalledTimes(1);
          done();
        }
      );
    });

    it("should never log credentials", done => {
      const logger = (garminApiClient as any).logger;
      const errorLogSpy = spyOn(logger, "error").and.stub();
      const axiosError = createErrorResponse(StatusCodes.INTERNAL_SERVER_ERROR) as any;
      axiosError.response = undefined; // Connection error
      axiosError.config = { headers: { Authorization: "Bearer secret-token" } };
      axiosError.message = "socket hang up";
      spyOn(httpClient, "get").and.returnValue(Promise.reject(axiosError));

      garminApiClient.searchActivities(apiKey, 0, 20).catch(() => {
        const logged = JSON.stringify(errorLogSpy.calls.allArgs());
        expect(logged).toContain("socket hang up");
        expect(logged).not.toContain("secret-token");
        expect(logged).not.toContain(apiKey);
        done();
      });
    });

    it("should reject unhandled error when Garmin is unreachable", done => {
      spyOn(httpClient, "get").and.returnValue(Promise.reject({ message: "ENOTFOUND" }));

      garminApiClient.searchActivities(apiKey, 0, 20).then(
        () => {
          throw new Error("Should not be here");
        },
        (error: ErrorSyncEvent) => {
          expect(error.code).toEqual(ErrorSyncEvent.UNHANDLED_ERROR_SYNC.code);
          done();
        }
      );
    });
  });
});
