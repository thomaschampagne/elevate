import { StravaApiStreamType, StravaConnector } from "./strava.connector";
import {
	ActivitySyncEvent,
	ConnectorType,
	ErrorSyncEvent,
	StartedSyncEvent,
	StoppedSyncEvent,
	StravaApiCredentials,
	StravaCredentialsUpdateSyncEvent,
	SyncEvent,
	SyncEventType
} from "@elevate/shared/sync";
import * as jsonFakeActivitiesFixture from "./fixtures/sample_activities.fixture.json";
import * as jsonFakeStreamsFixture from "./fixtures/sample_streams.fixture.json";
import {
	ActivityStreamsModel,
	AthleteModel,
	BareActivityModel,
	ConnectorSyncDateTime,
	EnvTarget,
	SyncedActivityModel,
	UserSettings
} from "@elevate/shared/models";
import * as _ from "lodash";
import { Subject } from "rxjs";
import { filter } from "rxjs/operators";
import { IHttpClientResponse } from "typed-rest-client/Interfaces";
import { Partial } from "rollup-plugin-typescript2/dist/partial";
import * as http from "http";
import { IncomingHttpHeaders } from "http";
import { HttpClient, HttpCodes } from "typed-rest-client/HttpClient";
import { Service } from "../../service";

const getActivitiesFixture = (page: number, perPage: number, activities: Array<BareActivityModel[]>) => {
	const from = (page > 1) ? ((page - 1) * perPage) : 0;
	const to = from + perPage;
	return _.cloneDeep(activities[0].slice(from, to));
};

describe("StravaConnector", () => {

	const createSuccessResponse = (dataResponse: object, statusCode: number = HttpCodes.OK, statusMessage: string = null, headers: IncomingHttpHeaders = {}): IHttpClientResponse => {

		headers[StravaConnector.STRAVA_RATELIMIT_LIMIT_HEADER] = "600,30000";
		headers[StravaConnector.STRAVA_RATELIMIT_USAGE_HEADER] = "0,0";

		const message: Partial<http.IncomingMessage> = {
			statusCode: statusCode,
			statusMessage: statusMessage,
			headers: headers
		};

		return {
			message: <http.IncomingMessage> message,
			readBody: () => {
				return Promise.resolve(dataResponse ? JSON.stringify(dataResponse) : null);
			}
		};
	};

	const createErrorResponse = (statusCode: number, statusMessage: string = null, headers: IncomingHttpHeaders = {}) => {
		return createSuccessResponse(null, statusCode, statusMessage, headers);
	};

	const priority = 1;
	const clientId = 9999;
	const clientSecret = "9999";
	const accessToken = "fakeToken";
	const updateSyncedActivitiesNameAndType = false;

	let stravaConnector: StravaConnector;
	let fetchRemoteStravaBareActivityModelsSpy: jasmine.Spy;
	let processBareActivitiesSpy: jasmine.Spy;
	let findSyncedActivityModelsSpy: jasmine.Spy;
	let getStravaActivityStreamsSpy: jasmine.Spy;
	let fetchRemoteStravaActivityStreamsSpy: jasmine.Spy;

	let fakeActivitiesFixture: Array<BareActivityModel[]>;
	let fakeStreamsFixture: StravaApiStreamType[];

	beforeEach((done: Function) => {

		fakeActivitiesFixture = <Array<BareActivityModel[]>> jsonFakeActivitiesFixture;
		fakeStreamsFixture = <StravaApiStreamType[]> jsonFakeStreamsFixture;

		const connectorSyncDateTime = null;
		stravaConnector = new StravaConnector(priority, AthleteModel.DEFAULT_MODEL, UserSettings.getDefaultsByEnvTarget(EnvTarget.DESKTOP),
			connectorSyncDateTime, new StravaApiCredentials(clientId, clientSecret, accessToken), updateSyncedActivitiesNameAndType);

		// Simulate strava pages
		fetchRemoteStravaBareActivityModelsSpy = spyOn(stravaConnector, "fetchRemoteStravaBareActivityModels");
		fetchRemoteStravaBareActivityModelsSpy.and.callFake((page: number, perPage: number) => {
			return Promise.resolve(getActivitiesFixture(page, perPage, fakeActivitiesFixture));
		});

		processBareActivitiesSpy = spyOn(stravaConnector, "processBareActivities").and.callThrough();

		// By default there's no existing activities
		findSyncedActivityModelsSpy = spyOn(stravaConnector, "findSyncedActivityModels");
		findSyncedActivityModelsSpy.and.returnValue(Promise.resolve(null));

		// Return a fake stream
		fetchRemoteStravaActivityStreamsSpy = spyOn(stravaConnector, "fetchRemoteStravaActivityStreams");
		fetchRemoteStravaActivityStreamsSpy.and.returnValue(Promise.resolve(_.cloneDeep(fakeStreamsFixture)));

		getStravaActivityStreamsSpy = spyOn(stravaConnector, "getStravaActivityStreams");
		getStravaActivityStreamsSpy.and.callThrough();

		Service.instance().httpClient = new HttpClient("vsts-node-api");

		done();
	});

	describe("Create connector", () => {

		it("should create strava connector without sync date time", (done: Function) => {

			// Given
			const athleteModel = null;
			const updateSyncedActivitiesNameAndType = true;
			const stravaApiCredentials = null;
			const userSettingsModel = null;
			const currentConnectorSyncDateTime = null;

			// When
			const connector = StravaConnector.create(athleteModel, userSettingsModel, currentConnectorSyncDateTime,
				stravaApiCredentials, updateSyncedActivitiesNameAndType);

			// Then
			expect(connector.syncDateTime).toBeNull();
			done();

		});

		it("should create strava connector with sync date time", (done: Function) => {

			// Given
			const athleteModel = null;
			const updateSyncedActivitiesNameAndType = true;
			const stravaApiCredentials = null;
			const userSettingsModel = null;
			const syncDateTime = Date.now();
			const expectedSyncDateTime = Math.floor(syncDateTime / 1000);
			const currentConnectorSyncDateTime = new ConnectorSyncDateTime(ConnectorType.STRAVA, syncDateTime);

			// When
			const connector = StravaConnector.create(athleteModel, userSettingsModel, currentConnectorSyncDateTime,
				stravaApiCredentials, updateSyncedActivitiesNameAndType);

			// Then
			expect(connector.syncDateTime).toEqual(expectedSyncDateTime);
			done();
		});

	});

	describe("Root sync", () => {

		it("should complete the sync", (done: Function) => {

			// Given
			const syncPagesSpy = spyOn(stravaConnector, "syncPages").and.callThrough();
			const expectedStartedSyncEvent = new StartedSyncEvent(ConnectorType.STRAVA);
			const expectedSyncPagesCalls = 4;
			const expectedCompleteCalls = 1;
			let startedSyncEventToBeCaught = null;

			// When
			const syncEvent$ = stravaConnector.sync();
			const syncEvents$CompleteSpy = spyOn(syncEvent$, "complete").and.callThrough();

			// Then
			syncEvent$.subscribe((syncEvent: SyncEvent) => {

				if (syncEvent.type === SyncEventType.STARTED) {
					startedSyncEventToBeCaught = syncEvent;
				} else {
					expect(syncEvent.type).toEqual(SyncEventType.ACTIVITY);
					expect((<ActivitySyncEvent> syncEvent).activity).toBeDefined();
				}

				expect(stravaConnector.isSyncing).toBeTruthy();

			}, error => {

				expect(error).not.toBeDefined();
				throw new Error(error);

			}, () => {

				expect(startedSyncEventToBeCaught).toEqual(expectedStartedSyncEvent);
				expect(stravaConnector.isSyncing).toBeFalsy();
				expect(syncPagesSpy).toBeCalledTimes(expectedSyncPagesCalls);
				expect(syncEvents$CompleteSpy).toBeCalledTimes(expectedCompleteCalls);
				done();

			});

		});

		it("should stop sync and notify error when syncPages() reject an 'Unhandled error'", (done: Function) => {

			// Given
			const syncPagesSpy = spyOn(stravaConnector, "syncPages").and.callThrough();
			const expectedSyncPagesCalls = 3;
			const expectedSyncEventErrorCalls = 1;
			const expectedErrorSync = ErrorSyncEvent.UNHANDLED_ERROR_SYNC.create(ConnectorType.STRAVA, "Unhandled error");
			const errorAtPage = 3;

			fetchRemoteStravaBareActivityModelsSpy.and.callFake((page: number, perPage: number) => {
				if (page === errorAtPage) {
					return Promise.reject(expectedErrorSync);
				}
				return Promise.resolve(getActivitiesFixture(page, perPage, fakeActivitiesFixture));
			});

			// When
			const syncEvent$ = stravaConnector.sync();
			const syncEvents$ErrorsSpy = spyOn(syncEvent$, "error").and.callThrough();
			const syncEvents$CompleteSpy = spyOn(syncEvent$, "complete").and.callThrough();

			// Then
			syncEvent$.subscribe((syncEvent: SyncEvent) => {

				if (syncEvent.type !== SyncEventType.STARTED) {
					expect(syncEvent.type).toEqual(SyncEventType.ACTIVITY);
					expect((<ActivitySyncEvent> syncEvent).activity).toBeDefined();
				}

				expect(stravaConnector.isSyncing).toBeTruthy();

			}, error => {
				expect(error).toBeDefined();
				expect(syncPagesSpy).toBeCalledTimes(expectedSyncPagesCalls);
				expect(syncEvents$CompleteSpy).not.toBeCalled();
				expect(syncEvents$ErrorsSpy).toBeCalledTimes(expectedSyncEventErrorCalls);
				expect(stravaConnector.isSyncing).toBeFalsy();

				done();

			}, () => {
				throw new Error("Test failed!");
			});

		});

		it("should not stop sync and notify errors when multiple errors are provided by syncPages()", (done: Function) => {

			// Given
			const syncPagesSpy = spyOn(stravaConnector, "syncPages").and.callThrough();
			const expectedNextCalls = fakeActivitiesFixture[0].length;
			const expectedSyncPagesCalls = 4;
			const computationError = new Error("Computation error!");
			spyOn(stravaConnector, "computeExtendedStats").and.callFake(() => {
				throw computationError;
			});
			const expectedErrorSyncEvent = ErrorSyncEvent.SYNC_ERROR_COMPUTE.create(ConnectorType.STRAVA, computationError.message, computationError.stack);

			// When
			const syncEvent$ = stravaConnector.sync();
			const syncEvents$NextSpy = spyOn(syncEvent$, "next").and.callThrough();
			const syncEvents$ErrorsSpy = spyOn(syncEvent$, "error").and.callThrough();
			const syncEvents$CompleteSpy = spyOn(syncEvent$, "complete").and.callThrough();

			// Then
			syncEvent$.subscribe((syncEvent: SyncEvent) => {

				if (syncEvent.type !== SyncEventType.STARTED) {
					expect(syncEvent.type).toEqual(SyncEventType.ERROR);
					expect(syncEvent).toEqual(expectedErrorSyncEvent);
				}

				expect(stravaConnector.isSyncing).toBeTruthy();

			}, () => {
				throw new Error("Test failed!");
			}, () => {
				expect(syncPagesSpy).toBeCalledTimes(expectedSyncPagesCalls);
				expect(syncEvents$NextSpy).toBeCalledTimes(expectedNextCalls);
				expect(syncEvents$CompleteSpy).toBeCalledTimes(1);
				expect(syncEvents$ErrorsSpy).not.toBeCalled();
				expect(stravaConnector.isSyncing).toBeFalsy();
				done();
			});

		});

		it("should reject recursive sync if connector is already syncing", (done: Function) => {

			// Given
			const expectedErrorSyncEvent = ErrorSyncEvent.SYNC_ALREADY_STARTED.create(ConnectorType.STRAVA);
			const syncEvent$01 = stravaConnector.sync(); // Start a first sync

			// When
			const syncEvents$NextSpy = spyOn(syncEvent$01, "next").and.callThrough();
			const syncEvent$02 = stravaConnector.sync(); // Start a 2nd one.

			// Then
			syncEvent$01.subscribe(() => {

				expect(syncEvents$NextSpy).toHaveBeenCalledWith(expectedErrorSyncEvent);

			}, () => {

				throw new Error("Test failed!");

			}, () => {

				expect(syncEvent$01).toEqual(syncEvent$02);
				expect(syncEvent$01.isStopped).toBeTruthy();
				expect(syncEvent$02.isStopped).toBeTruthy();
				expect(syncEvents$NextSpy).toHaveBeenCalledWith(expectedErrorSyncEvent);
				done();
			});

		});

	});

	describe("Sync pages", () => {

		it("should recursive sync strava activities pages", (done: Function) => {

			// Given
			const syncEvents$ = new Subject<SyncEvent>();
			const syncPagesSpy = spyOn(stravaConnector, "syncPages").and.callThrough();
			const expectedSyncPagesCalls = 4;
			const expectedProcessCalls = 3;

			// When
			const promise = stravaConnector.syncPages(syncEvents$);

			// Then
			promise.then(() => {

				expect(syncPagesSpy).toBeCalledTimes(expectedSyncPagesCalls);
				expect(fetchRemoteStravaBareActivityModelsSpy).toBeCalledTimes(expectedSyncPagesCalls);
				expect(processBareActivitiesSpy).toBeCalledTimes(expectedProcessCalls);
				done();

			}, error => {
				expect(error).toBeNull();
				done();
			});

		});

		it("should reject recursive sync strava activities pages when a remote page unreachable", (done: Function) => {

			// Given
			const syncEvents = new Subject<SyncEvent>();
			const syncPagesSpy = spyOn(stravaConnector, "syncPages").and.callThrough();
			const expectedSyncPagesCalls = 3;
			const expectedProcessCalls = 2;
			const errorAtPage = 3;
			const expectedErrorSync = ErrorSyncEvent.UNHANDLED_ERROR_SYNC.create(ConnectorType.STRAVA, "Unhandled error");

			fetchRemoteStravaBareActivityModelsSpy.and.callFake((page: number, perPage: number) => {

				if (page === errorAtPage) {
					return Promise.reject(expectedErrorSync);
				}

				return Promise.resolve(getActivitiesFixture(page, perPage, fakeActivitiesFixture));

			});

			// When
			const promise = stravaConnector.syncPages(syncEvents);

			// Then
			promise.then(() => {

				throw new Error("Whoops! I should not be here!");

			}, error => {
				expect(error).not.toBeNull();
				expect(error).toEqual(expectedErrorSync);
				expect(syncPagesSpy).toBeCalledTimes(expectedSyncPagesCalls);
				expect(fetchRemoteStravaBareActivityModelsSpy).toBeCalledTimes(expectedSyncPagesCalls);
				expect(processBareActivitiesSpy).toBeCalledTimes(expectedProcessCalls);
				done();
			});

		});

		it("should reject recursive sync when an error occurs while processing an activity", (done: Function) => {

			// Given
			const syncEvents = new Subject<SyncEvent>();
			const errorMessage = "An error has been raised :/";

			// Track processBareActivities() calls and throw error on the 3rd call
			let processBareActivitiesCalls = 0;
			processBareActivitiesSpy.and.callFake(() => {
				processBareActivitiesCalls++;
				if (processBareActivitiesCalls === 3) {
					return Promise.reject(errorMessage);
				}
				return Promise.resolve();
			});

			// When
			const promise = stravaConnector.syncPages(syncEvents);

			// Then
			promise.then(() => {

				throw new Error("Whoops! I should not be here!");

			}, error => {
				expect(error).not.toBeNull();
				expect(error).toEqual(errorMessage);
				done();
			});

		});

	});

	describe("Ensure strava authentication", () => {

		it("should successfully authenticate to strava when no access token exists", (done: Function) => {

			// Given
			const syncEvents$ = new Subject<SyncEvent>();
			const stravaApiCredentials = new StravaApiCredentials(666, "secret");
			const authorizeResponse = {accessToken: "fakeAccessToken", refreshToken: "fakeRefreshToken", expiresAt: 11111};
			const authorizeSpy = spyOn(stravaConnector.stravaAuthenticator, "authorize")
				.and.returnValue(Promise.resolve(authorizeResponse));

			const syncEventNextSpy = spyOn(syncEvents$, "next").and.callThrough();
			const expectedStravaCredentialsUpdateSyncEvent = new StravaCredentialsUpdateSyncEvent(_.cloneDeep(stravaApiCredentials));
			expectedStravaCredentialsUpdateSyncEvent.stravaApiCredentials.accessToken = authorizeResponse.accessToken;
			expectedStravaCredentialsUpdateSyncEvent.stravaApiCredentials.refreshToken = authorizeResponse.refreshToken;
			expectedStravaCredentialsUpdateSyncEvent.stravaApiCredentials.expiresAt = authorizeResponse.expiresAt;

			// When
			const promise = stravaConnector.stravaTokensUpdater(syncEvents$, _.cloneDeep(stravaApiCredentials));

			// Then
			promise.then(() => {

				expect(authorizeSpy).toBeCalledWith(stravaApiCredentials.clientId, stravaApiCredentials.clientSecret);
				expect(syncEventNextSpy).toBeCalledWith(expectedStravaCredentialsUpdateSyncEvent);
				done();

			}, () => {
				throw new Error("Whoops! I should not be here!");
			});
		});

		it("should successfully authenticate to strava when no refresh token exists", (done: Function) => {

			// Given
			const syncEvents$ = new Subject<SyncEvent>();
			const stravaApiCredentials = new StravaApiCredentials(666, "secret", "oldAccessToken");
			const authorizeResponse = {accessToken: "fakeAccessToken", refreshToken: "fakeRefreshToken", expiresAt: 11111};
			const authorizeSpy = spyOn(stravaConnector.stravaAuthenticator, "authorize")
				.and.returnValue(Promise.resolve(authorizeResponse));

			const syncEventNextSpy = spyOn(syncEvents$, "next").and.callThrough();
			const expectedStravaCredentialsUpdateSyncEvent = new StravaCredentialsUpdateSyncEvent(_.cloneDeep(stravaApiCredentials));
			expectedStravaCredentialsUpdateSyncEvent.stravaApiCredentials.accessToken = authorizeResponse.accessToken;
			expectedStravaCredentialsUpdateSyncEvent.stravaApiCredentials.refreshToken = authorizeResponse.refreshToken;
			expectedStravaCredentialsUpdateSyncEvent.stravaApiCredentials.expiresAt = authorizeResponse.expiresAt;

			// When
			const promise = stravaConnector.stravaTokensUpdater(syncEvents$, _.cloneDeep(stravaApiCredentials));

			// Then
			promise.then(() => {

				expect(authorizeSpy).toBeCalledWith(stravaApiCredentials.clientId, stravaApiCredentials.clientSecret);
				expect(syncEventNextSpy).toBeCalledWith(expectedStravaCredentialsUpdateSyncEvent);
				done();

			}, () => {
				throw new Error("Whoops! I should not be here!");
			});
		});

		it("should successfully authenticate to strava when the access token is expired & a refresh token exists", (done: Function) => {

			// Given
			const syncEvents$ = new Subject<SyncEvent>();
			const stravaApiCredentials = new StravaApiCredentials(666, "secret", "oldAccessToken", "oldRefreshToken");
			stravaApiCredentials.expiresAt = 0; // Access token expired
			const refreshResponse = {accessToken: "fakeAccessToken", refreshToken: "fakeRefreshToken", expiresAt: 11111};
			const refreshSpy = spyOn(stravaConnector.stravaAuthenticator, "refresh")
				.and.returnValue(Promise.resolve(refreshResponse));

			const syncEventNextSpy = spyOn(syncEvents$, "next").and.callThrough();
			const expectedStravaCredentialsUpdateSyncEvent = new StravaCredentialsUpdateSyncEvent(_.cloneDeep(stravaApiCredentials));
			expectedStravaCredentialsUpdateSyncEvent.stravaApiCredentials.accessToken = refreshResponse.accessToken;
			expectedStravaCredentialsUpdateSyncEvent.stravaApiCredentials.refreshToken = refreshResponse.refreshToken;
			expectedStravaCredentialsUpdateSyncEvent.stravaApiCredentials.expiresAt = refreshResponse.expiresAt;

			// When
			const promise = stravaConnector.stravaTokensUpdater(syncEvents$, _.cloneDeep(stravaApiCredentials));

			// Then
			promise.then(() => {

				expect(refreshSpy).toBeCalledWith(stravaApiCredentials.clientId, stravaApiCredentials.clientSecret, stravaApiCredentials.refreshToken);
				expect(syncEventNextSpy).toBeCalledWith(expectedStravaCredentialsUpdateSyncEvent);
				done();

			}, () => {
				throw new Error("Whoops! I should not be here!");
			});
		});

		it("should successfully authenticate to strava when the access token is expired & no refresh token exists", (done: Function) => {

			// Given
			const syncEvents$ = new Subject<SyncEvent>();
			const stravaApiCredentials = new StravaApiCredentials(666, "secret", "oldAccessToken");
			stravaApiCredentials.expiresAt = 0; // Access token expired
			const authorizeResponse = {accessToken: "fakeAccessToken", refreshToken: "fakeRefreshToken", expiresAt: 11111};
			const authorizeSpy = spyOn(stravaConnector.stravaAuthenticator, "authorize")
				.and.returnValue(Promise.resolve(authorizeResponse));

			const syncEventNextSpy = spyOn(syncEvents$, "next").and.callThrough();
			const expectedStravaCredentialsUpdateSyncEvent = new StravaCredentialsUpdateSyncEvent(_.cloneDeep(stravaApiCredentials));
			expectedStravaCredentialsUpdateSyncEvent.stravaApiCredentials.accessToken = authorizeResponse.accessToken;
			expectedStravaCredentialsUpdateSyncEvent.stravaApiCredentials.refreshToken = authorizeResponse.refreshToken;
			expectedStravaCredentialsUpdateSyncEvent.stravaApiCredentials.expiresAt = authorizeResponse.expiresAt;

			// When
			const promise = stravaConnector.stravaTokensUpdater(syncEvents$, _.cloneDeep(stravaApiCredentials));

			// Then
			promise.then(() => {

				expect(authorizeSpy).toBeCalledWith(stravaApiCredentials.clientId, stravaApiCredentials.clientSecret);
				expect(syncEventNextSpy).toBeCalledWith(expectedStravaCredentialsUpdateSyncEvent);
				done();

			}, () => {
				throw new Error("Whoops! I should not be here!");
			});
		});

		it("should not authenticate to strava when access token is valid (not expired)", (done: Function) => {

			// Given
			const syncEvents$ = new Subject<SyncEvent>();
			const stravaApiCredentials = new StravaApiCredentials(666, "secret", "oldAccessToken", "oldRefreshToken");
			stravaApiCredentials.expiresAt = (new Date()).getTime();
			const authorizeResponse = {accessToken: "fakeAccessToken", refreshToken: "fakeRefreshToken", expiresAt: 11111};
			const refreshSpy = spyOn(stravaConnector.stravaAuthenticator, "refresh")
				.and.returnValue(Promise.resolve(authorizeResponse));
			const authorizeSpy = spyOn(stravaConnector.stravaAuthenticator, "authorize")
				.and.returnValue(Promise.resolve(authorizeResponse));
			const syncEventNextSpy = spyOn(syncEvents$, "next").and.callThrough();

			spyOn(stravaConnector, "getCurrentTime").and.returnValue(stravaApiCredentials.expiresAt - 10000); // Access token not expired

			// When
			const promise = stravaConnector.stravaTokensUpdater(syncEvents$, stravaApiCredentials);

			// Then
			promise.then(() => {
				expect(authorizeSpy).not.toBeCalled();
				expect(refreshSpy).not.toBeCalled();
				expect(syncEventNextSpy).not.toBeCalled();
				done();

			}, () => {
				throw new Error("Whoops! I should not be here!");
			});
		});

		it("should reject when authentication to strava fails", (done: Function) => {

			// Given
			const syncEvents$ = new Subject<SyncEvent>();
			const stravaApiCredentials = new StravaApiCredentials(666, "secret");
			const authorizeSpy = spyOn(stravaConnector.stravaAuthenticator, "authorize")
				.and.returnValue(Promise.reject());

			const syncEventNextSpy = spyOn(syncEvents$, "next").and.callThrough();

			// When
			const promise = stravaConnector.stravaTokensUpdater(syncEvents$, _.cloneDeep(stravaApiCredentials));

			// Then
			promise.then(() => {

				throw new Error("Whoops! I should not be here!");

			}, () => {

				expect(authorizeSpy).toBeCalledWith(stravaApiCredentials.clientId, stravaApiCredentials.clientSecret);
				expect(syncEventNextSpy).not.toBeCalled();

				done();
			});
		});

	});

	describe("Stop sync", () => {

		it("should stop a processing sync", (done: Function) => {

			// Given
			const stopSyncEventReceived = [];
			const expectedStoppedSyncEvent = new StoppedSyncEvent(ConnectorType.STRAVA);
			const expectedStoppedSyncEventReceived = 1;

			const syncEvent$ = stravaConnector.sync();
			syncEvent$.pipe(
				filter(syncEvent => syncEvent.type === SyncEventType.STOPPED)
			).subscribe((syncEvent: StoppedSyncEvent) => {
				stopSyncEventReceived.push(syncEvent);
			});

			// When
			const promise = stravaConnector.stop();

			// Then
			expect(stravaConnector.stopRequested).toBeTruthy();
			expect(stravaConnector.isSyncing).toBeTruthy();
			promise.then(() => {
				expect(stopSyncEventReceived.length).toEqual(expectedStoppedSyncEventReceived);
				expect(stopSyncEventReceived[0]).toEqual(expectedStoppedSyncEvent);
				expect(stravaConnector.stopRequested).toBeFalsy();
				expect(stravaConnector.isSyncing).toBeFalsy();
				done();

			}, () => {
				throw new Error("Whoops! I should not be here!");
			});

		});

		it("should reject a stop request when no sync is processed", (done: Function) => {

			// Given
			stravaConnector.isSyncing = false;

			// When
			const promise = stravaConnector.stop();

			// Then
			expect(stravaConnector.stopRequested).toBeTruthy();
			expect(stravaConnector.isSyncing).toBeFalsy();
			promise.then(() => {
				throw new Error("Whoops! I should not be here!");
			}, () => {
				expect(stravaConnector.isSyncing).toBeFalsy();
				expect(stravaConnector.stopRequested).toBeFalsy();
				done();
			});
		});

	});

	describe("Perform strava api calls", () => {

		it("should perform a successful strava api request", (done: Function) => {

			// Given
			const syncEvents$ = new Subject<SyncEvent>();
			const url = "http://api.strava.com/v3/fake";
			const expectedResult = [];
			spyOn(Service.instance().httpClient, "get").and.returnValue(Promise.resolve(createSuccessResponse(expectedResult)));
			const stravaTokensUpdaterSpy = spyOn(stravaConnector, "stravaTokensUpdater").and.returnValue(Promise.resolve());
			const computeNextCallWaitTimeSpy = spyOn(StravaConnector, "computeNextCallWaitTime").and.callThrough();

			// When
			const promise = stravaConnector.stravaApiCall(syncEvents$, url);

			// Then
			promise.then(result => {
				expect(stravaTokensUpdaterSpy).toHaveBeenCalledTimes(1);
				expect(stravaTokensUpdaterSpy).toHaveBeenCalledWith(syncEvents$, stravaConnector.stravaApiCredentials);
				expect(computeNextCallWaitTimeSpy).toHaveBeenCalledTimes(1);
				expect(result).toEqual(expectedResult);
				done();

			}, error => {
				expect(error).toBeNull();
				done();
			});

		});

		it("should reject with STRAVA_API_UNAUTHORIZED if clientId or clientSecret do not exist.", (done: Function) => {

			// Given
			const syncEvents$ = new Subject<SyncEvent>();
			const url = "http://api.strava.com/v3/fake";
			stravaConnector.stravaApiCredentials.clientId = null;
			stravaConnector.stravaApiCredentials.clientSecret = null;
			const expectedErrorDetails = ErrorSyncEvent.STRAVA_API_UNAUTHORIZED.create();

			// When
			const promise = stravaConnector.stravaApiCall(syncEvents$, url);

			// Then
			promise.then(() => {
				throw new Error("Should not be here!");

			}, error => {
				expect(error).not.toBeNull();
				expect(error).toEqual(new ErrorSyncEvent(ConnectorType.STRAVA, expectedErrorDetails));
				done();
			});

		});

		it("should reject if strava api replied with HTTP error (unauthorized)", (done: Function) => {

			// Given
			const syncEvents$ = new Subject<SyncEvent>();
			const url = "http://api.strava.com/v3/fake";
			spyOn(Service.instance().httpClient, "get").and.returnValue(Promise.resolve(createErrorResponse(HttpCodes.Unauthorized)));
			const expectedErrorDetails = ErrorSyncEvent.STRAVA_API_UNAUTHORIZED.create();
			spyOn(stravaConnector, "stravaTokensUpdater").and.returnValue(Promise.resolve());

			// When
			const promise = stravaConnector.stravaApiCall(syncEvents$, url);

			// Then
			promise.then(() => {
				throw new Error("Should not be here!");

			}, error => {
				expect(error).not.toBeNull();

				expect(error).toEqual(new ErrorSyncEvent(ConnectorType.STRAVA, expectedErrorDetails));
				done();
			});

		});

		it("should reject if strava api replied with instant quota reached (403 Forbidden)", (done: Function) => {

			// Given
			const syncEvents$ = new Subject<SyncEvent>();
			const url = "http://api.strava.com/v3/fake";
			const httpClientResponse = createErrorResponse(HttpCodes.Forbidden);
			httpClientResponse.message.headers[StravaConnector.STRAVA_RATELIMIT_LIMIT_HEADER] = "600,30000";
			httpClientResponse.message.headers[StravaConnector.STRAVA_RATELIMIT_USAGE_HEADER] = "666,3000"; // Quarter hour usage reached !
			spyOn(Service.instance().httpClient, "get").and.returnValue(Promise.resolve(httpClientResponse));
			spyOn(stravaConnector, "stravaTokensUpdater").and.returnValue(Promise.resolve());
			const expectedErrorDetails = ErrorSyncEvent.STRAVA_INSTANT_QUOTA_REACHED.create(666, 600);

			// When
			const promise = stravaConnector.stravaApiCall(syncEvents$, url);

			// Then
			promise.then(() => {
				throw new Error("Should not be here!");

			}, error => {
				expect(error).not.toBeNull();

				expect(error).toEqual(new ErrorSyncEvent(ConnectorType.STRAVA, expectedErrorDetails));
				done();
			});

		});

		it("should reject if strava api replied with daily quota reached (403 Forbidden)", (done: Function) => {

			// Given
			const syncEvents$ = new Subject<SyncEvent>();
			const url = "http://api.strava.com/v3/fake";
			const httpClientResponse = createErrorResponse(HttpCodes.Forbidden);
			httpClientResponse.message.headers[StravaConnector.STRAVA_RATELIMIT_LIMIT_HEADER] = "600,30000";
			httpClientResponse.message.headers[StravaConnector.STRAVA_RATELIMIT_USAGE_HEADER] = "30,31000"; // Daily usage reached !
			spyOn(Service.instance().httpClient, "get").and.returnValue(Promise.resolve(httpClientResponse));
			spyOn(stravaConnector, "stravaTokensUpdater").and.returnValue(Promise.resolve());
			const expectedErrorDetails = ErrorSyncEvent.STRAVA_DAILY_QUOTA_REACHED.create(31000, 30000);

			// When
			const promise = stravaConnector.stravaApiCall(syncEvents$, url);

			// Then
			promise.then(() => {
				throw new Error("Should not be here!");

			}, error => {
				expect(error).not.toBeNull();

				expect(error).toEqual(new ErrorSyncEvent(ConnectorType.STRAVA, expectedErrorDetails));
				done();
			});

		});

		it("should reject if strava api replied with a 'classic' 403 Forbidden", (done: Function) => {

			// Given
			const syncEvents$ = new Subject<SyncEvent>();
			const url = "http://api.strava.com/v3/fake";
			const httpClientResponse = createErrorResponse(HttpCodes.Forbidden);
			spyOn(Service.instance().httpClient, "get").and.returnValue(Promise.resolve(httpClientResponse));
			spyOn(stravaConnector, "stravaTokensUpdater").and.returnValue(Promise.resolve());
			const expectedErrorDetails = ErrorSyncEvent.STRAVA_API_FORBIDDEN.create();

			// When
			const promise = stravaConnector.stravaApiCall(syncEvents$, url);

			// Then
			promise.then(() => {
				throw new Error("Should not be here!");

			}, error => {
				expect(error).not.toBeNull();

				expect(error).toEqual(new ErrorSyncEvent(ConnectorType.STRAVA, expectedErrorDetails));
				done();
			});

		});

		it("should reject if strava api replied with HTTP error (timeout)", (done: Function) => {

			// Given
			const syncEvents$ = new Subject<SyncEvent>();
			const url = "http://api.strava.com/v3/fake";
			spyOn(Service.instance().httpClient, "get").and.returnValue(Promise.resolve(createErrorResponse(HttpCodes.RequestTimeout)));
			const expectedErrorDetails = ErrorSyncEvent.STRAVA_API_TIMEOUT.create(url);
			spyOn(stravaConnector, "stravaTokensUpdater").and.returnValue(Promise.resolve());

			// When
			const promise = stravaConnector.stravaApiCall(syncEvents$, url);

			// Then
			promise.then(() => {
				throw new Error("Should not be here!");

			}, error => {
				expect(error).not.toBeNull();

				expect(error).toEqual(new ErrorSyncEvent(ConnectorType.STRAVA, expectedErrorDetails));
				done();
			});

		});

		it("should reject if strava api replied with HTTP error (resource not found)", (done: Function) => {

			// Given
			const syncEvents$ = new Subject<SyncEvent>();
			const url = "http://api.strava.com/v3/fake";
			spyOn(Service.instance().httpClient, "get").and.returnValue(Promise.resolve(createErrorResponse(HttpCodes.NotFound)));
			const expectedErrorDetails = ErrorSyncEvent.STRAVA_API_RESOURCE_NOT_FOUND.create(url);
			spyOn(stravaConnector, "stravaTokensUpdater").and.returnValue(Promise.resolve());

			// When
			const promise = stravaConnector.stravaApiCall(syncEvents$, url);

			// Then
			promise.then(() => {
				throw new Error("Should not be here!");

			}, error => {
				expect(error).not.toBeNull();
				expect(error).toEqual(new ErrorSyncEvent(ConnectorType.STRAVA, expectedErrorDetails));
				done();
			});

		});

		it("should fetch a remote activities page from strava api", (done: Function) => {

			// Given
			const page = 1;
			const perPage = 20;
			const expectedResult = [];
			const afterTimestamp = null;
			const stravaApiCallSpy = spyOn(stravaConnector, "stravaApiCall").and.callThrough();
			spyOn(stravaConnector, "stravaTokensUpdater").and.returnValue(Promise.resolve());
			const httpGetSpy = spyOn(Service.instance().httpClient, "get").and.returnValue(Promise.resolve(createSuccessResponse(expectedResult)));
			fetchRemoteStravaBareActivityModelsSpy.and.callThrough();
			const expectedCallsTimes = 1;

			// When
			const promise = stravaConnector.fetchRemoteStravaBareActivityModels(page, perPage, afterTimestamp);

			// Then
			promise.then(result => {

				expect(result).toEqual(expectedResult);
				expect(stravaApiCallSpy).toHaveBeenCalledTimes(expectedCallsTimes);
				expect(httpGetSpy).toHaveBeenCalledTimes(expectedCallsTimes);
				done();

			}, () => {
				throw new Error("Should not be here!");
			});

		});

		it("should reject a fetch of a remote activities page from strava api (Unauthorized)", (done: Function) => {

			// Given
			const page = 1;
			const perPage = 20;
			const afterTimestamp = null;
			const stravaApiCallSpy = spyOn(stravaConnector, "stravaApiCall").and.callThrough();
			spyOn(stravaConnector, "stravaTokensUpdater").and.returnValue(Promise.resolve());
			const httpGetSpy = spyOn(Service.instance().httpClient, "get").and.returnValue(Promise.resolve(createErrorResponse(HttpCodes.Unauthorized)));
			fetchRemoteStravaBareActivityModelsSpy.and.callThrough();
			const expectedCallsTimes = 1;
			const expectedErrorSync = ErrorSyncEvent.STRAVA_API_UNAUTHORIZED.create();

			// When
			const promise = stravaConnector.fetchRemoteStravaBareActivityModels(page, perPage, afterTimestamp);

			// Then
			promise.then(() => {

				throw new Error("Should not be here!");

			}, error => {

				expect(error).toEqual(expectedErrorSync);
				expect(stravaApiCallSpy).toHaveBeenCalledTimes(expectedCallsTimes);
				expect(httpGetSpy).toHaveBeenCalledTimes(expectedCallsTimes);

				done();
			});

		});

		it("should fetch a remote activity stream from strava api", (done: Function) => {

			// Given
			const activityId = 666;
			const expectedResult = [];
			const stravaApiCallSpy = spyOn(stravaConnector, "stravaApiCall").and.callThrough();
			spyOn(stravaConnector, "stravaTokensUpdater").and.returnValue(Promise.resolve());
			const httpGetSpy = spyOn(Service.instance().httpClient, "get").and.returnValue(Promise.resolve(createSuccessResponse(expectedResult)));
			fetchRemoteStravaActivityStreamsSpy.and.callThrough();
			const expectedCallsTimes = 1;

			// When
			const promise = stravaConnector.fetchRemoteStravaActivityStreams(activityId);

			// Then
			promise.then(result => {

				expect(result).toEqual(expectedResult);
				expect(stravaApiCallSpy).toHaveBeenCalledTimes(expectedCallsTimes);
				expect(httpGetSpy).toHaveBeenCalledTimes(expectedCallsTimes);
				done();

			}, () => {
				throw new Error("Should not be here!");
			});

		});

		it("should reject a fetch of a remote activity stream from strava api (Not found)", (done: Function) => {

			// Given
			const activityId = 666;
			const stravaApiCallSpy = spyOn(stravaConnector, "stravaApiCall").and.callThrough();
			spyOn(stravaConnector, "stravaTokensUpdater").and.returnValue(Promise.resolve());
			const httpGetSpy = spyOn(Service.instance().httpClient, "get").and.returnValue(Promise.resolve(createErrorResponse(HttpCodes.NotFound)));
			fetchRemoteStravaActivityStreamsSpy.and.callThrough();
			const expectedCallsTimes = 1;
			const expectedErrorSync = ErrorSyncEvent.STRAVA_API_RESOURCE_NOT_FOUND.create(StravaConnector.generateFetchStreamsEndpoint(activityId));

			// When
			const promise = stravaConnector.fetchRemoteStravaActivityStreams(activityId);

			// Then
			promise.then(() => {

				throw new Error("Should not be here!");

			}, error => {

				expect(error).toEqual(expectedErrorSync);
				expect(stravaApiCallSpy).toHaveBeenCalledTimes(expectedCallsTimes);
				expect(httpGetSpy).toHaveBeenCalledTimes(expectedCallsTimes);

				done();
			});

		});


		it("should perform a successful strava api request and compute next call wait time properly", (done: Function) => {

			// Given
			const syncEvents$ = new Subject<SyncEvent>();
			const url = "http://api.strava.com/v3/fake";
			const expectedResult = [];

			const httpClientResponse = createSuccessResponse(expectedResult);
			httpClientResponse.message.headers[StravaConnector.STRAVA_RATELIMIT_LIMIT_HEADER] = "600,30000";
			httpClientResponse.message.headers[StravaConnector.STRAVA_RATELIMIT_USAGE_HEADER] = "300,300"; // Override Ratelimit usage (50% of limit reached on time interval

			spyOn(Service.instance().httpClient, "get").and.returnValue(Promise.resolve(httpClientResponse));
			const stravaTokensUpdaterSpy = spyOn(stravaConnector, "stravaTokensUpdater").and.returnValue(Promise.resolve());
			const computeNextCallWaitTimeSpy = spyOn(StravaConnector, "computeNextCallWaitTime").and.callThrough();
			const expectedNextCallWaitTime = 1.5;

			// When
			const promise = stravaConnector.stravaApiCall(syncEvents$, url);

			// Then
			promise.then(result => {
				expect(stravaTokensUpdaterSpy).toHaveBeenCalledTimes(1);
				expect(stravaTokensUpdaterSpy).toHaveBeenCalledWith(syncEvents$, stravaConnector.stravaApiCredentials);
				expect(computeNextCallWaitTimeSpy).toHaveBeenCalledTimes(1);
				expect(stravaConnector.nextCallWaitTime).toEqual(expectedNextCallWaitTime);
				expect(result).toEqual(expectedResult);
				done();

			}, error => {
				expect(error).toBeNull();
				done();
			});

		});

	});

	describe("Postpone next strava api calls depending on rate limits", () => {

		it("should compute next call wait time (0% of available calls under 15min)", (done: Function) => {

			// Given
			const currentCallsCount = 0;
			const thresholdCount = 600;
			const timeIntervalSeconds = 15 * 60; // 15 minutes
			const expectedTimeResult = 0;

			// When
			const result = StravaConnector.computeNextCallWaitTime(currentCallsCount, thresholdCount, timeIntervalSeconds);

			// Then
			expect(result).toEqual(expectedTimeResult);
			done();
		});

		it("should compute next call wait time (50% of available calls under 15min)", (done: Function) => {

			// Given
			const currentCallsCount = 300;
			const thresholdCount = 600;
			const timeIntervalSeconds = 15 * 60; // 15 minutes
			const expectedTimeResult = 1.5;

			// When
			const result = StravaConnector.computeNextCallWaitTime(currentCallsCount, thresholdCount, timeIntervalSeconds);

			// Then
			expect(result).toEqual(expectedTimeResult);
			done();
		});

		it("should compute next call wait time (100% of available calls under 15min)", (done: Function) => {

			// Given
			const currentCallsCount = 600;
			const thresholdCount = 600;
			const timeIntervalSeconds = 15 * 60; // 15 minutes
			const expectedTimeResult = 3;

			// When
			const result = StravaConnector.computeNextCallWaitTime(currentCallsCount, thresholdCount, timeIntervalSeconds);

			// Then
			expect(result).toEqual(expectedTimeResult);
			done();
		});

		it("should throw when computing next call wait time with invalid params (negative numbers)", (done: Function) => {

			// Given
			const currentCallsCount = -1000;
			const thresholdCount = -1000;
			const timeIntervalSeconds = -1000; // 15 minutes
			const expectedErrorMessage = "Params must be numbers and positive while computing strava next call wait time";

			// When
			const call = () => {
				StravaConnector.computeNextCallWaitTime(currentCallsCount, thresholdCount, timeIntervalSeconds);
			};

			// Then
			expect(call).toThrowError(expectedErrorMessage);
			done();
		});

		it("should throw when computing next call wait time with invalid params (not numbers)", (done: Function) => {

			// Given
			const currentCallsCount = null;
			const thresholdCount = 1000;
			const timeIntervalSeconds = 1000; // 15 minutes
			const expectedErrorMessage = "Params must be numbers and positive while computing strava next call wait time";

			// When
			const call = () => {
				StravaConnector.computeNextCallWaitTime(currentCallsCount, thresholdCount, timeIntervalSeconds);
			};

			// Then
			expect(call).toThrowError(expectedErrorMessage);
			done();
		});


	});

	describe("Process bare activities", () => {

		it("should find for existing activity when processing bare activities", (done: Function) => {

			// Given
			const syncEvents = new Subject<SyncEvent>();
			const page = 1;
			const perPage = 20;
			const bareActivities = getActivitiesFixture(page, perPage, fakeActivitiesFixture);
			const expectedFindActivityCalls = perPage;

			// When
			const promise = stravaConnector.processBareActivities(syncEvents, bareActivities);

			// Then
			promise.then(() => {

				expect(findSyncedActivityModelsSpy).toBeCalledTimes(expectedFindActivityCalls);
				done();

			}, error => {
				expect(error).toBeNull();
				done();
			});

		});

		it("should send activity sync event when processing 1 bare activity that already exists (updateSyncedActivitiesNameAndType = true)", (done: Function) => {

			// Given
			const syncEvents = new Subject<SyncEvent>();
			const syncEventsSpy = spyOn(syncEvents, "next");
			const page = 1;
			const perPage = 20;
			const bareActivities = getActivitiesFixture(page, perPage, fakeActivitiesFixture);
			const trackCallId = 1; // the 2nd one

			stravaConnector.updateSyncedActivitiesNameAndType = true;

			const expectedSyncedActivityModelUpdate = _.cloneDeep(<SyncedActivityModel> _.cloneDeep(bareActivities[trackCallId]));
			expectedSyncedActivityModelUpdate.name = "FakeName";
			expectedSyncedActivityModelUpdate.type = "FakeType";
			const expectedActivitySyncEvent = new ActivitySyncEvent(ConnectorType.STRAVA, null, expectedSyncedActivityModelUpdate, false);

			// Emulate 1 existing activity
			findSyncedActivityModelsSpy.and.callFake(() => {
				if (findSyncedActivityModelsSpy.calls.count() === (trackCallId + 1)) {
					return Promise.resolve([expectedSyncedActivityModelUpdate]);
				}
				return Promise.resolve(null);
			});


			// When
			const promise = stravaConnector.processBareActivities(syncEvents, bareActivities);

			// Then
			promise.then(() => {

				const activitySyncEventSent = <ActivitySyncEvent> syncEventsSpy.calls.argsFor(trackCallId)[0]; // Catching call args

				expect(activitySyncEventSent.fromConnectorType).toEqual(expectedActivitySyncEvent.fromConnectorType);
				expect(activitySyncEventSent.description).toEqual(expectedActivitySyncEvent.description);
				expect(activitySyncEventSent.isNew).toEqual(expectedActivitySyncEvent.isNew);
				expect(activitySyncEventSent.activity.name).toEqual(expectedActivitySyncEvent.activity.name);
				expect(activitySyncEventSent.activity.type).toEqual(expectedActivitySyncEvent.activity.type);
				expect(syncEventsSpy).toBeCalledTimes(perPage);

				done();

			}, error => {
				expect(error).toBeNull();
				done();
			});

		});

		it("should send activity sync event when processing 1 bare activity that already exists (updateSyncedActivitiesNameAndType = false)", (done: Function) => {

			// Given
			const syncEvents = new Subject<SyncEvent>();
			const syncEventsSpy = spyOn(syncEvents, "next");
			const page = 1;
			const perPage = 20;
			const bareActivities = getActivitiesFixture(page, perPage, fakeActivitiesFixture);
			const trackCallId = 1; // the 2nd one

			stravaConnector.updateSyncedActivitiesNameAndType = false;

			const expectedSyncedActivityModelUpdate = _.cloneDeep(<SyncedActivityModel> _.cloneDeep(bareActivities[trackCallId]));
			expectedSyncedActivityModelUpdate.name = "FakeName";
			expectedSyncedActivityModelUpdate.type = "FakeType";

			// Emulate 1 existing activity
			findSyncedActivityModelsSpy.and.callFake(() => {
				if (findSyncedActivityModelsSpy.calls.count() === (trackCallId + 1)) {
					return Promise.resolve([expectedSyncedActivityModelUpdate]);
				}
				return Promise.resolve(null);
			});

			// When
			const promise = stravaConnector.processBareActivities(syncEvents, bareActivities);

			// Then
			promise.then(() => {

				expect(syncEventsSpy).toBeCalledTimes(perPage - 1);

				_.forEach(syncEventsSpy.calls.all(), call => {
					const activitySyncEventSent = <ActivitySyncEvent> call.args[0];
					expect(activitySyncEventSent.isNew).toEqual(true); // Call is always a new activity
				});

				done();

			}, error => {
				expect(error).toBeNull();
				done();
			});

		});

		it("should send error sync event when processing 1 bare activity that already exists (multiple results found)", (done: Function) => {

			// Given
			const syncEvents = new Subject<SyncEvent>();
			const syncEventNextSpy = spyOn(syncEvents, "next");
			const page = 1;
			const perPage = 20;
			const bareActivities = getActivitiesFixture(page, perPage, fakeActivitiesFixture);
			const trackCallId = 1; // the 2nd one

			stravaConnector.updateSyncedActivitiesNameAndType = true;

			const expectedSyncedActivityModelUpdate = _.cloneDeep(<SyncedActivityModel> _.cloneDeep(bareActivities[trackCallId]));
			expectedSyncedActivityModelUpdate.name = "FakeName";
			expectedSyncedActivityModelUpdate.type = "FakeType";
			expectedSyncedActivityModelUpdate.start_time = new Date().toISOString();

			// Emulate 1 existing activity
			findSyncedActivityModelsSpy.and.callFake(() => {

				if (findSyncedActivityModelsSpy.calls.count() === (trackCallId + 1)) {
					return Promise.resolve([expectedSyncedActivityModelUpdate, expectedSyncedActivityModelUpdate]);
				}
				return Promise.resolve(null);
			});

			const expectedActivitiesFound = expectedSyncedActivityModelUpdate.name + " (" + new Date(expectedSyncedActivityModelUpdate.start_time).toString() + ")";
			const expectedErrorSyncEvent = ErrorSyncEvent.MULTIPLE_ACTIVITIES_FOUND.create(ConnectorType.STRAVA, bareActivities[trackCallId].name,
				new Date((<any> bareActivities[trackCallId]).start_date), [expectedActivitiesFound, expectedActivitiesFound]);

			// When
			const promise = stravaConnector.processBareActivities(syncEvents, bareActivities);

			// Then
			promise.then(() => {
				expect(syncEventNextSpy).toBeCalledTimes(perPage);
				expect(syncEventNextSpy).toBeCalledWith(expectedErrorSyncEvent);
				done();

			}, error => {
				expect(error).toBeNull();
				done();
			});

		});

		it("should send activity sync event when processing 1 bare activity that do not exists", (done: Function) => {

			// Given
			const syncEvents = new Subject<SyncEvent>();
			const syncEventsSpy = spyOn(syncEvents, "next");
			const page = 1;
			const perPage = 20;
			const bareActivities = getActivitiesFixture(page, perPage, fakeActivitiesFixture);
			const trackCallId = 1; // the 2nd one

			stravaConnector.updateSyncedActivitiesNameAndType = true;

			const expectedSyncedActivityModelUpdate = _.cloneDeep(<SyncedActivityModel> _.cloneDeep(bareActivities[trackCallId])); // "Mini Zwift & Pschitt"
			const expectedStartTime = "2019-03-10T16:17:32.000Z";
			const expectedEndTime = "2019-03-10T16:49:23.000Z";

			const expectedActivitySyncEvent = new ActivitySyncEvent(ConnectorType.STRAVA, null, expectedSyncedActivityModelUpdate, true);

			// Emulate 1 existing activity
			findSyncedActivityModelsSpy.and.returnValue(Promise.resolve(null));

			// When
			const promise = stravaConnector.processBareActivities(syncEvents, bareActivities);

			// Then
			promise.then(() => {

				const activitySyncEventSent = <ActivitySyncEvent> syncEventsSpy.calls.argsFor(trackCallId)[0]; // Catching 2nd call
				expect(activitySyncEventSent.activity.start_time).toEqual(expectedStartTime);
				expect(activitySyncEventSent.activity.end_time).toEqual(expectedEndTime);
				expect(activitySyncEventSent.activity.name).toEqual(expectedActivitySyncEvent.activity.name);
				expect(activitySyncEventSent.activity.type).toEqual(expectedActivitySyncEvent.activity.type);
				expect(activitySyncEventSent.activity.sourceConnectorType).toEqual(ConnectorType.STRAVA);
				expect(activitySyncEventSent.activity.streams).not.toBeNull();
				expect(activitySyncEventSent.activity.athleteSnapshot).toEqual(stravaConnector.athleteSnapshotResolver.getCurrent());
				expect(activitySyncEventSent.activity.extendedStats).not.toBeNull();
				done();

			}, error => {
				expect(error).toBeNull();
				done();
			});

		});

		it("should reject processing bare activities when fetching stream trigger a unhandled error", (done: Function) => {

			// Given
			const syncEvents = new Subject<SyncEvent>();
			const syncEventsSpy = spyOn(syncEvents, "next");
			const page = 1;
			const perPage = 20;
			const bareActivities = getActivitiesFixture(page, perPage, fakeActivitiesFixture);
			const trackCallId = 1; // the 2nd one

			stravaConnector.updateSyncedActivitiesNameAndType = true;

			const expectedSyncedActivityModelUpdate = _.cloneDeep(<SyncedActivityModel> _.cloneDeep(bareActivities[trackCallId]));
			expectedSyncedActivityModelUpdate.name = "FakeName";
			expectedSyncedActivityModelUpdate.type = "FakeType";
			const expectedErrorSyncEvent = ErrorSyncEvent.UNHANDLED_ERROR_SYNC.create(ConnectorType.STRAVA, "Whoops :/");

			// Emulate 1 existing activity
			fetchRemoteStravaActivityStreamsSpy.and.callFake(() => {
				if (fetchRemoteStravaActivityStreamsSpy.calls.count() === (trackCallId + 1)) {
					return Promise.reject(expectedErrorSyncEvent);
				}
				return Promise.resolve(_.cloneDeep(fakeStreamsFixture));
			});


			// When
			const promise = stravaConnector.processBareActivities(syncEvents, bareActivities);

			// Then
			promise.then(() => {

				throw new Error("Test fail!");

			}, error => {

				expect(error).toEqual(expectedErrorSyncEvent);
				expect(fetchRemoteStravaActivityStreamsSpy).toBeCalledTimes(2);
				expect(syncEventsSpy).toBeCalledTimes(1);

				done();
			});

		});

	});

	describe("Activity streams", () => {

		it("should get streams of an activity", (done: Function) => {

			// Given
			const activityId = 666;

			// When
			const promise = stravaConnector.getStravaActivityStreams(activityId);

			// Then
			promise.then((activityStreamsModel: ActivityStreamsModel) => {

				expect(fetchRemoteStravaActivityStreamsSpy).toBeCalledTimes(1);

				expect(activityStreamsModel).not.toBeNull();
				expect(activityStreamsModel.time).toEqual(_.find(fakeStreamsFixture, {type: "time"})["data"]);
				expect(activityStreamsModel.distance).toEqual(_.find(fakeStreamsFixture, {type: "distance"})["data"]);
				expect(activityStreamsModel.latlng).toEqual(_.find(fakeStreamsFixture, {type: "latlng"})["data"]);
				expect(activityStreamsModel.altitude).toEqual(_.find(fakeStreamsFixture, {type: "altitude"})["data"]);
				expect(activityStreamsModel.velocity_smooth).toEqual(_.find(fakeStreamsFixture, {type: "velocity_smooth"})["data"]);
				expect(activityStreamsModel.heartrate).toEqual(_.find(fakeStreamsFixture, {type: "heartrate"})["data"]);
				expect(activityStreamsModel.cadence).toEqual(_.find(fakeStreamsFixture, {type: "cadence"})["data"]);
				expect(activityStreamsModel.watts).toEqual(_.find(fakeStreamsFixture, {type: "watts"})["data"]);
				expect(activityStreamsModel.watts_calc).toEqual(_.find(fakeStreamsFixture, {type: "watts_calc"})["data"]);
				expect(activityStreamsModel.grade_smooth).toEqual(_.find(fakeStreamsFixture, {type: "grade_smooth"})["data"]);
				expect(activityStreamsModel.grade_adjusted_speed).toEqual(_.find(fakeStreamsFixture, {type: "grade_adjusted_speed"})["data"]);

				done();

			}, error => {
				expect(error).toBeNull();
				done();
			});

		});

		it("should get empty streams when an activity has no streams (404 not found)", (done: Function) => {

			// Given
			const activityId = 666;
			fetchRemoteStravaActivityStreamsSpy.and.callThrough();
			spyOn(stravaConnector, "stravaApiCall").and.callThrough();
			spyOn(stravaConnector, "stravaTokensUpdater").and.returnValue(Promise.resolve());
			spyOn(Service.instance().httpClient, "get").and.returnValue(Promise.resolve(createErrorResponse(HttpCodes.NotFound)));

			// When
			const promise = stravaConnector.getStravaActivityStreams(activityId);

			// Then
			promise.then((activityStreamsModel: ActivityStreamsModel) => {

				expect(activityStreamsModel).toBeNull();
				done();

			}, error => {
				expect(error).toBeNull();
				done();
			});
		});

		it("should reject when an error occurs while getting streams (UNHANDLED HTTP GET ERROR)", (done: Function) => {

			// Given
			const activityId = 666;
			fetchRemoteStravaActivityStreamsSpy.and.callThrough();
			spyOn(stravaConnector, "stravaApiCall").and.callThrough();
			spyOn(stravaConnector, "stravaTokensUpdater").and.returnValue(Promise.resolve());
			spyOn(Service.instance().httpClient, "get").and.returnValue(Promise.resolve(createErrorResponse(HttpCodes.Forbidden)));

			const expectedErrorSync = ErrorSyncEvent.STRAVA_API_FORBIDDEN.create();

			// When
			const promise = stravaConnector.getStravaActivityStreams(activityId);

			// Then
			promise.then(() => {
				throw new Error("Test fail!");
			}, error => {
				expect(error).not.toBeNull();
				expect(error).toEqual(expectedErrorSync);
				done();
			});
		});

	});

});
