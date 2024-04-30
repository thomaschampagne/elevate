import { Gender } from "@elevate/shared/models/athlete/gender.enum";
import { StravaConnectorInfo } from "@elevate/shared/sync/connectors/strava-connector-info.model";
import { ErrorSyncEvent } from "@elevate/shared/sync/events/error-sync.event";
import { StravaAccount } from "@elevate/shared/sync/strava/strava-account";
import { AxiosError, AxiosResponse, AxiosResponseHeaders, InternalAxiosRequestConfig } from "axios";
import _ from "lodash";
import { container } from "tsyringe";
import { StatusCodes } from "../enum/status-codes.enum";
import { RateLimit, StravaApiClient } from "./strava-api.client";

describe("StravaApiClient", () => {
  let stravaApiClient: StravaApiClient;

  beforeEach(done => {
    stravaApiClient = container.resolve(StravaApiClient);
    done();
  });

  describe("Ensure strava authentication", () => {
    const stravaAthlete = {
      id: 99999,
      username: "johndoo",
      firstname: "John",
      lastname: "Doo",
      city: "Grenoble",
      state: "Isere",
      country: "France",
      sex: "M"
    };

    const expectedStravaAccount: StravaAccount = {
      id: stravaAthlete.id,
      username: stravaAthlete.username,
      firstname: stravaAthlete.firstname,
      lastname: stravaAthlete.lastname,
      city: stravaAthlete.city,
      state: stravaAthlete.state,
      country: stravaAthlete.country,
      gender: stravaAthlete.sex === "M" ? Gender.MEN : Gender.WOMEN
    };

    it("should successfully authenticate to strava when no access token exists", done => {
      // Given
      const stravaConnectorInfo = new StravaConnectorInfo(666, "secret");
      const authorizeResponse = {
        accessToken: "fakeAccessToken",
        refreshToken: "fakeRefreshToken",
        expiresAt: 11111,
        athlete: stravaAthlete
      };
      const authorizeSpy = spyOn(stravaApiClient.stravaAuthenticator, "authorize").and.returnValue(
        Promise.resolve(authorizeResponse)
      );

      const expectedUpdatedStravaConnectorInfo = _.cloneDeep(stravaConnectorInfo);
      expectedUpdatedStravaConnectorInfo.accessToken = authorizeResponse.accessToken;
      expectedUpdatedStravaConnectorInfo.refreshToken = authorizeResponse.refreshToken;
      expectedUpdatedStravaConnectorInfo.expiresAt = authorizeResponse.expiresAt;
      expectedUpdatedStravaConnectorInfo.stravaAccount = expectedStravaAccount;

      let updatedStravaConnectorInfo;

      const onStravaConnectorInfoUpdate = (connectorInfo: StravaConnectorInfo) => {
        updatedStravaConnectorInfo = connectorInfo;
      };

      // When
      const promise = stravaApiClient.stravaTokensUpdater(stravaConnectorInfo, onStravaConnectorInfoUpdate);

      // Then
      promise.then(
        () => {
          expect(authorizeSpy).toBeCalledWith(stravaConnectorInfo.clientId, stravaConnectorInfo.clientSecret);
          expect(updatedStravaConnectorInfo).toEqual(expectedUpdatedStravaConnectorInfo);
          done();
        },
        () => {
          throw new Error("Whoops! I should not be here!");
        }
      );
    });

    it("should successfully authenticate to strava when no refresh token exists", done => {
      // Given
      const stravaConnectorInfo = new StravaConnectorInfo(666, "secret", "oldAccessToken");
      const authorizeResponse = {
        accessToken: "fakeAccessToken",
        refreshToken: "fakeRefreshToken",
        expiresAt: 11111,
        athlete: stravaAthlete
      };
      const authorizeSpy = spyOn(stravaApiClient.stravaAuthenticator, "authorize").and.returnValue(
        Promise.resolve(authorizeResponse)
      );

      const expectedUpdatedStravaConnectorInfo = _.cloneDeep(stravaConnectorInfo);
      expectedUpdatedStravaConnectorInfo.accessToken = authorizeResponse.accessToken;
      expectedUpdatedStravaConnectorInfo.refreshToken = authorizeResponse.refreshToken;
      expectedUpdatedStravaConnectorInfo.expiresAt = authorizeResponse.expiresAt;
      expectedUpdatedStravaConnectorInfo.stravaAccount = expectedStravaAccount;

      let updatedStravaConnectorInfo;

      const onStravaConnectorInfoUpdate = (connectorInfo: StravaConnectorInfo) => {
        updatedStravaConnectorInfo = connectorInfo;
      };

      // When
      const promise = stravaApiClient.stravaTokensUpdater(stravaConnectorInfo, onStravaConnectorInfoUpdate);

      // Then
      promise.then(
        () => {
          expect(authorizeSpy).toBeCalledWith(stravaConnectorInfo.clientId, stravaConnectorInfo.clientSecret);
          expect(updatedStravaConnectorInfo).toEqual(expectedUpdatedStravaConnectorInfo);
          done();
        },
        () => {
          throw new Error("Whoops! I should not be here!");
        }
      );
    });

    it("should successfully authenticate to strava when the access token is expired & a refresh token exists", done => {
      // Given
      const stravaConnectorInfo = new StravaConnectorInfo(666, "secret", "oldAccessToken", "oldRefreshToken");
      stravaConnectorInfo.expiresAt = 0; // Access token expired
      const refreshResponse = {
        accessToken: "fakeAccessToken",
        refreshToken: "fakeRefreshToken",
        expiresAt: 11111,
        athlete: stravaAthlete
      };
      const refreshSpy = spyOn(stravaApiClient.stravaAuthenticator, "refresh").and.returnValue(
        Promise.resolve(refreshResponse)
      );

      const expectedUpdatedStravaConnectorInfo = _.cloneDeep(stravaConnectorInfo);
      expectedUpdatedStravaConnectorInfo.accessToken = refreshResponse.accessToken;
      expectedUpdatedStravaConnectorInfo.refreshToken = refreshResponse.refreshToken;
      expectedUpdatedStravaConnectorInfo.expiresAt = refreshResponse.expiresAt;
      expectedUpdatedStravaConnectorInfo.stravaAccount = expectedStravaAccount;

      let updatedStravaConnectorInfo;

      const onStravaConnectorInfoUpdate = (connectorInfo: StravaConnectorInfo) => {
        updatedStravaConnectorInfo = connectorInfo;
      };

      // When
      const promise = stravaApiClient.stravaTokensUpdater(
        _.cloneDeep(stravaConnectorInfo),
        onStravaConnectorInfoUpdate
      );

      // Then
      promise.then(
        () => {
          expect(refreshSpy).toBeCalledWith(
            stravaConnectorInfo.clientId,
            stravaConnectorInfo.clientSecret,
            stravaConnectorInfo.refreshToken
          );
          expect(updatedStravaConnectorInfo).toEqual(expectedUpdatedStravaConnectorInfo);
          done();
        },
        () => {
          throw new Error("Whoops! I should not be here!");
        }
      );
    });

    it("should successfully authenticate to strava when the access token is expired & no refresh token exists", done => {
      // Given
      const stravaConnectorInfo = new StravaConnectorInfo(666, "secret", "oldAccessToken");
      stravaConnectorInfo.expiresAt = 0; // Access token expired
      const authorizeResponse = {
        accessToken: "fakeAccessToken",
        refreshToken: "fakeRefreshToken",
        expiresAt: 11111,
        athlete: stravaAthlete
      };
      const authorizeSpy = spyOn(stravaApiClient.stravaAuthenticator, "authorize").and.returnValue(
        Promise.resolve(authorizeResponse)
      );

      const expectedUpdatedStravaConnectorInfo = _.cloneDeep(stravaConnectorInfo);
      expectedUpdatedStravaConnectorInfo.accessToken = authorizeResponse.accessToken;
      expectedUpdatedStravaConnectorInfo.refreshToken = authorizeResponse.refreshToken;
      expectedUpdatedStravaConnectorInfo.expiresAt = authorizeResponse.expiresAt;
      expectedUpdatedStravaConnectorInfo.stravaAccount = expectedStravaAccount;

      let updatedStravaConnectorInfo;

      const onStravaConnectorInfoUpdate = (connectorInfo: StravaConnectorInfo) => {
        updatedStravaConnectorInfo = connectorInfo;
      };

      // When
      const promise = stravaApiClient.stravaTokensUpdater(
        _.cloneDeep(stravaConnectorInfo),
        onStravaConnectorInfoUpdate
      );

      // Then
      promise.then(
        () => {
          expect(authorizeSpy).toBeCalledWith(stravaConnectorInfo.clientId, stravaConnectorInfo.clientSecret);
          expect(updatedStravaConnectorInfo).toEqual(expectedUpdatedStravaConnectorInfo);
          done();
        },
        () => {
          throw new Error("Whoops! I should not be here!");
        }
      );
    });

    it("should not authenticate to strava when access token is valid (not expired)", done => {
      // Given
      const stravaConnectorInfo = new StravaConnectorInfo(666, "secret", "oldAccessToken", "oldRefreshToken");
      stravaConnectorInfo.expiresAt = new Date().getTime();
      const authorizeResponse = {
        accessToken: "fakeAccessToken",
        refreshToken: "fakeRefreshToken",
        expiresAt: 11111,
        athlete: stravaAthlete
      };
      const refreshSpy = spyOn(stravaApiClient.stravaAuthenticator, "refresh").and.returnValue(
        Promise.resolve(authorizeResponse)
      );
      const authorizeSpy = spyOn(stravaApiClient.stravaAuthenticator, "authorize").and.returnValue(
        Promise.resolve(authorizeResponse)
      );

      let updatedStravaConnectorInfo;

      const onStravaConnectorInfoUpdate = (connectorInfo: StravaConnectorInfo) => {
        updatedStravaConnectorInfo = connectorInfo;
      };

      spyOn(stravaApiClient, "getCurrentTime").and.returnValue(stravaConnectorInfo.expiresAt - 10000); // Access token not expired

      // When
      const promise = stravaApiClient.stravaTokensUpdater(stravaConnectorInfo, onStravaConnectorInfoUpdate);

      // Then
      promise.then(
        () => {
          expect(authorizeSpy).not.toBeCalled();
          expect(refreshSpy).not.toBeCalled();
          expect(updatedStravaConnectorInfo).toBeUndefined();
          done();
        },
        () => {
          throw new Error("Whoops! I should not be here!");
        }
      );
    });

    it("should reject when authentication to strava fails", done => {
      // Given
      const stravaConnectorInfo = new StravaConnectorInfo(666, "secret");
      const authorizeSpy = spyOn(stravaApiClient.stravaAuthenticator, "authorize").and.returnValue(Promise.reject());

      let updatedStravaConnectorInfo;

      const onStravaConnectorInfoUpdate = (connectorInfo: StravaConnectorInfo) => {
        updatedStravaConnectorInfo = connectorInfo;
      };

      // When
      const promise = stravaApiClient.stravaTokensUpdater(
        _.cloneDeep(stravaConnectorInfo),
        onStravaConnectorInfoUpdate
      );

      // Then
      promise.then(
        () => {
          throw new Error("Whoops! I should not be here!");
        },
        () => {
          expect(authorizeSpy).toBeCalledWith(stravaConnectorInfo.clientId, stravaConnectorInfo.clientSecret);
          expect(updatedStravaConnectorInfo).toBeUndefined();

          done();
        }
      );
    });
  });

  describe("Perform strava api calls", () => {
    const createResponse = (
      dataResponse: object,
      statusCode: number = StatusCodes.OK,
      statusMessage: string = null,
      headers: AxiosResponseHeaders = {} as AxiosResponseHeaders
    ): AxiosResponse => {
      headers[StravaApiClient.STRAVA_RATELIMIT_LIMIT_HEADER] = "600,30000";
      headers[StravaApiClient.STRAVA_RATELIMIT_USAGE_HEADER] = "0,0";

      return {
        data: dataResponse,
        status: statusCode,
        statusText: statusMessage,
        headers: headers,
        config: {} as InternalAxiosRequestConfig
      };
    };

    const createErrorResponse = (
      statusCode: number,
      statusMessage: string = null,
      headers: AxiosResponseHeaders = {} as AxiosResponseHeaders
    ): AxiosError => {
      const response = createResponse(null, statusCode, statusMessage, headers);

      return {
        response: response,
        isAxiosError: true
      } as AxiosError;
    };

    let stravaConnectorInfo;
    const onStravaConnectorInfoUpdate = _.noop;
    const onQuotaReachedRetry = _.noop;

    let httpGetSpy: jasmine.Spy;

    beforeEach(done => {
      stravaConnectorInfo = new StravaConnectorInfo(666, "secret", "oldAccessToken", "oldRefreshToken");
      httpGetSpy = spyOn(stravaApiClient.httpClient, "get");
      spyOn(stravaApiClient, "sleep").and.returnValue(Promise.resolve());
      done();
    });

    it("should perform a successful strava api request", done => {
      // Given
      const url = "http://api.strava.com/v3/fake";
      const expectedResult = [];
      httpGetSpy.and.returnValue(Promise.resolve(createResponse(expectedResult)));
      const stravaTokensUpdaterSpy = spyOn(stravaApiClient, "stravaTokensUpdater").and.returnValue(Promise.resolve());
      const computeNextCallWaitTimeSpy = spyOn(stravaApiClient, "updateNextCallWaitTime").and.stub();

      // When
      const promise = stravaApiClient.get(stravaConnectorInfo, url, onStravaConnectorInfoUpdate, onQuotaReachedRetry);

      // Then
      promise.then(
        result => {
          expect(stravaTokensUpdaterSpy).toHaveBeenCalledTimes(1);
          expect(stravaTokensUpdaterSpy).toHaveBeenCalledWith(stravaConnectorInfo, onStravaConnectorInfoUpdate);
          expect(computeNextCallWaitTimeSpy).toHaveBeenCalledTimes(1);
          expect(result).toEqual(expectedResult);
          done();
        },
        error => {
          expect(error).toBeNull();
          done();
        }
      );
    });

    it("should perform a successful strava api request and compute next call wait time properly", done => {
      // Given
      const url = "http://api.strava.com/v3/fake";
      const expectedResult = [];

      const httpClientResponse = createResponse(expectedResult);
      httpClientResponse.headers[StravaApiClient.STRAVA_RATELIMIT_LIMIT_HEADER] = "600,30000";
      httpClientResponse.headers[StravaApiClient.STRAVA_RATELIMIT_USAGE_HEADER] = "300,300"; // Override Ratelimit usage (50% of limit reached on time interval

      httpGetSpy.and.returnValue(Promise.resolve(httpClientResponse));
      const stravaTokensUpdaterSpy = spyOn(stravaApiClient, "stravaTokensUpdater").and.returnValue(Promise.resolve());
      const computeNextCallWaitTimeSpy = spyOn(stravaApiClient, "updateNextCallWaitTime").and.callThrough();
      const expectedNextCallWaitTime = 1.5;

      // When
      const promise = stravaApiClient.get(stravaConnectorInfo, url, onStravaConnectorInfoUpdate, onQuotaReachedRetry);

      // Then
      promise.then(
        result => {
          expect(stravaTokensUpdaterSpy).toHaveBeenCalledTimes(1);
          expect(stravaTokensUpdaterSpy).toHaveBeenCalledWith(stravaConnectorInfo, onStravaConnectorInfoUpdate);
          expect(computeNextCallWaitTimeSpy).toHaveBeenCalledTimes(1);
          expect(stravaApiClient.nextCallWaitTime).toEqual(expectedNextCallWaitTime);
          expect(result).toEqual(expectedResult);
          done();
        },
        error => {
          expect(error).toBeNull();
          done();
        }
      );
    });

    it("should reject with STRAVA_API_UNAUTHORIZED if clientId or clientSecret do not exist.", done => {
      // Given
      const url = "http://api.strava.com/v3/fake";
      stravaConnectorInfo.clientId = null;
      stravaConnectorInfo.clientSecret = null;
      const expectedErrorDetails = ErrorSyncEvent.STRAVA_API_UNAUTHORIZED.create();

      // When
      const promise = stravaApiClient.get(stravaConnectorInfo, url, onStravaConnectorInfoUpdate, onQuotaReachedRetry);

      // Then
      promise.then(
        () => {
          throw new Error("Should not be here!");
        },
        error => {
          expect(error).not.toBeNull();
          expect(error).toEqual(expectedErrorDetails);
          done();
        }
      );
    });

    it("should reject if strava api replied with HTTP error (401 unauthorized)", done => {
      // Given
      const url = "http://api.strava.com/v3/fake";
      httpGetSpy.and.returnValue(Promise.reject(createErrorResponse(StatusCodes.UNAUTHORIZED)));
      const expectedErrorDetails = ErrorSyncEvent.STRAVA_API_UNAUTHORIZED.create();
      spyOn(stravaApiClient, "stravaTokensUpdater").and.returnValue(Promise.resolve());

      // When
      const promise = stravaApiClient.get(stravaConnectorInfo, url, onStravaConnectorInfoUpdate, onQuotaReachedRetry);

      // Then
      promise.then(
        () => {
          throw new Error("Should not be here!");
        },
        error => {
          expect(error).not.toBeNull();
          expect(error).toEqual(expectedErrorDetails);
          done();
        }
      );
    });

    it("should reject if strava api replied with HTTP error (403 Forbidden)", done => {
      // Given
      const url = "http://api.strava.com/v3/fake";
      const httpClientResponse = createErrorResponse(StatusCodes.FORBIDDEN);
      httpGetSpy.and.returnValue(Promise.reject(httpClientResponse));
      spyOn(stravaApiClient, "stravaTokensUpdater").and.returnValue(Promise.resolve());
      const expectedErrorDetails = ErrorSyncEvent.STRAVA_API_FORBIDDEN.create();

      // When
      const promise = stravaApiClient.get(stravaConnectorInfo, url, onStravaConnectorInfoUpdate, onQuotaReachedRetry);

      // Then
      promise.then(
        () => {
          throw new Error("Should not be here!");
        },
        error => {
          expect(error).not.toBeNull();

          expect(error).toEqual(expectedErrorDetails);
          done();
        }
      );
    });

    it("should retry later & 15 times in total before failing when instant quota reached", done => {
      // Given
      const url = "http://api.strava.com/v3/fake";
      const httpClientResponse = createErrorResponse(StatusCodes.TOO_MANY_REQUESTS);
      httpClientResponse.response.headers[StravaApiClient.STRAVA_RATELIMIT_LIMIT_HEADER] = "600,30000";
      httpClientResponse.response.headers[StravaApiClient.STRAVA_RATELIMIT_USAGE_HEADER] = "666,3000"; // Quarter hour usage reached !
      httpGetSpy.and.returnValue(Promise.reject(httpClientResponse));
      spyOn(stravaApiClient, "stravaTokensUpdater").and.returnValue(Promise.resolve());
      const stravaApiCallSpy = spyOn(stravaApiClient, "get").and.callThrough();
      spyOn(stravaApiClient, "retryInMillis").and.returnValue(10);
      const expectedErrorDetails = ErrorSyncEvent.STRAVA_INSTANT_QUOTA_REACHED.create(666, 600);

      // When
      const promise = stravaApiClient.get(stravaConnectorInfo, url, onStravaConnectorInfoUpdate, onQuotaReachedRetry);

      // Then
      promise.then(
        () => {
          throw new Error("Should not be here!");
        },
        error => {
          expect(stravaApiCallSpy).toHaveBeenCalledTimes(15);
          expect(error).toEqual(expectedErrorDetails);
          done();
        }
      );
    });

    it("should retry later & 15 times in total before failing when daily quota reached", done => {
      // Given
      const url = "http://api.strava.com/v3/fake";
      const httpClientResponse = createErrorResponse(StatusCodes.TOO_MANY_REQUESTS);
      httpClientResponse.response.headers[StravaApiClient.STRAVA_RATELIMIT_LIMIT_HEADER] = "600,30000";
      httpClientResponse.response.headers[StravaApiClient.STRAVA_RATELIMIT_USAGE_HEADER] = "30,31000"; // Daily usage reached !
      httpGetSpy.and.returnValue(Promise.reject(httpClientResponse));
      spyOn(stravaApiClient, "stravaTokensUpdater").and.returnValue(Promise.resolve());
      const stravaApiCallSpy = spyOn(stravaApiClient, "get").and.callThrough();
      spyOn(stravaApiClient, "retryInMillis").and.returnValue(10);
      const expectedErrorDetails = ErrorSyncEvent.STRAVA_DAILY_QUOTA_REACHED.create(31000, 30000);

      // When
      const promise = stravaApiClient.get(stravaConnectorInfo, url, onStravaConnectorInfoUpdate, onQuotaReachedRetry);

      // Then
      promise.then(
        () => {
          throw new Error("Should not be here!");
        },
        error => {
          expect(stravaApiCallSpy).toHaveBeenCalledTimes(15);
          expect(error).toEqual(expectedErrorDetails);
          done();
        }
      );
    });

    it("should reject if strava api replied with HTTP error (timeout)", done => {
      // Given
      const url = "http://api.strava.com/v3/fake";
      httpGetSpy.and.returnValue(Promise.reject(createErrorResponse(StatusCodes.REQUEST_TIMEOUT)));
      const expectedErrorDetails = ErrorSyncEvent.STRAVA_API_TIMEOUT.create(url);
      spyOn(stravaApiClient, "stravaTokensUpdater").and.returnValue(Promise.resolve());

      // When
      const promise = stravaApiClient.get(stravaConnectorInfo, url, onStravaConnectorInfoUpdate, onQuotaReachedRetry);

      // Then
      promise.then(
        () => {
          throw new Error("Should not be here!");
        },
        error => {
          expect(error).not.toBeNull();
          expect(error).toEqual(expectedErrorDetails);
          done();
        }
      );
    });

    it("should reject if strava api replied with HTTP error (resource not found)", done => {
      // Given
      const url = "http://api.strava.com/v3/fake";
      httpGetSpy.and.returnValue(Promise.reject(createErrorResponse(StatusCodes.NOT_FOUND)));
      const expectedErrorDetails = ErrorSyncEvent.STRAVA_API_RESOURCE_NOT_FOUND.create(url);
      spyOn(stravaApiClient, "stravaTokensUpdater").and.returnValue(Promise.resolve());

      // When
      const promise = stravaApiClient.get(stravaConnectorInfo, url, onStravaConnectorInfoUpdate, onQuotaReachedRetry);

      // Then
      promise.then(
        () => {
          throw new Error("Should not be here!");
        },
        error => {
          expect(error).not.toBeNull();
          expect(error).toEqual(expectedErrorDetails);
          done();
        }
      );
    });
  });

  describe("Postpone next strava api calls depending on rate limits", () => {
    it("should compute next call wait time (0% of available calls under 15min)", done => {
      // Given
      const rateLimit: RateLimit = { usage: 0, limit: 600 };
      const timeIntervalSeconds = 15 * 60; // 15 minutes
      const expectedTimeResult = 0;

      // When
      stravaApiClient.updateNextCallWaitTime(rateLimit, timeIntervalSeconds);

      // Then
      expect(stravaApiClient.nextCallWaitTime).toEqual(expectedTimeResult);
      done();
    });

    it("should compute next call wait time (50% of available calls under 15min)", done => {
      // Given
      const rateLimit: RateLimit = { usage: 300, limit: 600 };
      const timeIntervalSeconds = 15 * 60; // 15 minutes
      const expectedTimeResult = 1.5;

      // When
      stravaApiClient.updateNextCallWaitTime(rateLimit, timeIntervalSeconds);

      // Then
      expect(stravaApiClient.nextCallWaitTime).toEqual(expectedTimeResult);
      done();
    });

    it("should compute next call wait time (100% of available calls under 15min)", done => {
      // Given
      const rateLimit: RateLimit = { usage: 600, limit: 600 };
      const timeIntervalSeconds = 15 * 60; // 15 minutes
      const expectedTimeResult = 3;

      // When
      stravaApiClient.updateNextCallWaitTime(rateLimit, timeIntervalSeconds);

      // Then
      expect(stravaApiClient.nextCallWaitTime).toEqual(expectedTimeResult);
      done();
    });
  });
});
