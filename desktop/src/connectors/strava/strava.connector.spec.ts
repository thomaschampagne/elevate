import { BuildTarget } from "@elevate/shared/enums/build-target.enum";
import { ElevateSport } from "@elevate/shared/enums/elevate-sport.enum";
import { Streams } from "@elevate/shared/models/activity-data/streams.model";
import { AthleteSnapshot } from "@elevate/shared/models/athlete/athlete-snapshot.model";
import { AthleteModel } from "@elevate/shared/models/athlete/athlete.model";
import { Activity } from "@elevate/shared/models/sync/activity.model";
import { UserSettings } from "@elevate/shared/models/user-settings/user-settings.namespace";
import { ConnectorType } from "@elevate/shared/sync/connectors/connector-type.enum";
import { StravaConnectorInfo } from "@elevate/shared/sync/connectors/strava-connector-info.model";
import { ActivitySyncEvent } from "@elevate/shared/sync/events/activity-sync.event";
import { ErrorSyncEvent } from "@elevate/shared/sync/events/error-sync.event";
import { StartedSyncEvent } from "@elevate/shared/sync/events/started-sync.event";
import { StoppedSyncEvent } from "@elevate/shared/sync/events/stopped-sync.event";
import { SyncEventType } from "@elevate/shared/sync/events/sync-event-type";
import { SyncEvent } from "@elevate/shared/sync/events/sync.event";
import { AxiosError, AxiosResponse, AxiosResponseHeaders, InternalAxiosRequestConfig } from "axios";
import _ from "lodash";
import { Subject } from "rxjs";
import { filter } from "rxjs/operators";
import { container } from "tsyringe";
import { AppService } from "../../app-service";
import { StravaApiClient } from "../../clients/strava-api.client";
import { StatusCodes } from "../../enum/status-codes.enum";
import { ActivityComputeProcessor } from "../../processors/activity-compute/activity-compute.processor";
import { StravaConnectorConfig } from "../connector-config.model";
import jsonFakeActivitiesFixture from "./fixtures/sample_activities.fixture.json";
import jsonFakeActivityFixture from "./fixtures/sample_activity.fixture.json";
import jsonFakeStreamsFixture from "./fixtures/sample_streams.fixture.json";
import { StravaApiStreamType, StravaBareActivity, StravaConnector } from "./strava.connector";
import BaseUserSettings = UserSettings.BaseUserSettings;

const getActivitiesFixture = (page: number, perPage: number, activities: Array<StravaBareActivity[]>) => {
  const from = page > 1 ? (page - 1) * perPage : 0;
  const to = from + perPage;
  return _.cloneDeep(activities[0].slice(from, to));
};

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

describe("StravaConnector", () => {
  const clientId = 9999;
  const clientSecret = "9999";
  const accessToken = "fakeToken";

  let stravaConnector: StravaConnector;
  let appService: AppService;

  let fetchRemoteStravaBareActivityModelsSpy: jasmine.Spy;
  let processBareActivitiesSpy: jasmine.Spy;
  let findActivitiesSpy: jasmine.Spy;
  let getStravaActivityStreamsSpy: jasmine.Spy;
  let fetchRemoteStravaStreamsSpy: jasmine.Spy;
  let fetchRemoteStravaActivitySpy: jasmine.Spy;
  let computeActivitySpy: jasmine.Spy;

  let fakeActivitiesFixture: Array<StravaBareActivity[]>;
  let fakeStreamsFixture: StravaApiStreamType[];

  beforeEach(done => {
    fakeActivitiesFixture = jsonFakeActivitiesFixture as any;
    fakeStreamsFixture = jsonFakeStreamsFixture as StravaApiStreamType[];

    appService = container.resolve(AppService);
    stravaConnector = container.resolve(StravaConnector);

    const stravaConnectorConfig: StravaConnectorConfig = {
      syncFromDateTime: null,
      athleteModel: AthleteModel.DEFAULT_MODEL,
      userSettings: UserSettings.getDefaultsByBuildTarget(BuildTarget.DESKTOP),
      info: new StravaConnectorInfo(clientId, clientSecret, accessToken)
    };

    stravaConnector = stravaConnector.configure(stravaConnectorConfig);

    // Simulate strava pages
    fetchRemoteStravaBareActivityModelsSpy = spyOn(stravaConnector, "fetchRemoteStravaBareActivityModels");
    fetchRemoteStravaBareActivityModelsSpy.and.callFake((page: number, perPage: number) => {
      return Promise.resolve(getActivitiesFixture(page, perPage, fakeActivitiesFixture));
    });

    processBareActivitiesSpy = spyOn(stravaConnector, "processBareActivities").and.callThrough();

    // By default there's no existing activities
    findActivitiesSpy = spyOn(stravaConnector, "findLocalActivities");
    findActivitiesSpy.and.returnValue(Promise.resolve(null));

    // Return a fake stream
    fetchRemoteStravaStreamsSpy = spyOn(stravaConnector, "fetchRemoteStravaStreams");
    fetchRemoteStravaStreamsSpy.and.returnValue(Promise.resolve(_.cloneDeep(fakeStreamsFixture)));

    // Return a fake complete activity
    fetchRemoteStravaActivitySpy = spyOn(stravaConnector, "fetchRemoteStravaActivity");
    fetchRemoteStravaActivitySpy.and.returnValue(Promise.resolve(_.cloneDeep(jsonFakeActivityFixture)));

    getStravaActivityStreamsSpy = spyOn(stravaConnector, "fetchRemoteAndMapStreams");
    getStravaActivityStreamsSpy.and.callThrough();

    // Skip sleep to 0ms
    spyOn(stravaConnector.stravaApiClient, "sleep").and.returnValue(Promise.resolve());

    // Avoid worker use for activity computing
    computeActivitySpy = spyOn(stravaConnector, "computeActivity").and.callFake(
      (
        activity: Partial<Activity>,
        athleteSnapshot: AthleteSnapshot,
        userSettings: BaseUserSettings,
        streams: Streams,
        deflateStreams: boolean
      ) => {
        return ActivityComputeProcessor.compute(activity, athleteSnapshot, userSettings, streams, deflateStreams);
      }
    );

    done();
  });

  describe("Configure connector", () => {
    it("should configure strava connector without sync from date time", done => {
      // Given
      const stravaConnectorConfig: StravaConnectorConfig = {
        syncFromDateTime: null,
        athleteModel: null,
        userSettings: null,
        info: null
      };

      // When
      stravaConnector = stravaConnector.configure(stravaConnectorConfig);

      // Then
      expect(stravaConnector.syncFromDateTime).toBeNull();
      done();
    });

    it("should configure strava connector with sync from date time", done => {
      // Given
      const syncFromDateTime = Date.now();
      const expectedSyncDateTime = syncFromDateTime;

      const stravaConnectorConfig: StravaConnectorConfig = {
        syncFromDateTime: syncFromDateTime,
        athleteModel: null,
        userSettings: null,
        info: null
      };

      // When
      stravaConnector = stravaConnector.configure(stravaConnectorConfig);

      // Then
      expect(stravaConnector.syncFromDateTime).toEqual(expectedSyncDateTime);
      done();
    });
  });

  describe("Root sync", () => {
    it("should complete the sync", done => {
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
      syncEvent$.pipe(filter(evt => evt.type !== SyncEventType.GENERIC)).subscribe(
        (syncEvent: SyncEvent) => {
          if (syncEvent.type === SyncEventType.STARTED) {
            startedSyncEventToBeCaught = syncEvent;
          } else {
            expect(syncEvent.type).toEqual(SyncEventType.ACTIVITY);
            expect((syncEvent as ActivitySyncEvent).activity).toBeDefined();
            expect((syncEvent as ActivitySyncEvent).deflatedStreams).toBeDefined();
          }

          expect(stravaConnector.isSyncing).toBeTruthy();
        },
        error => {
          expect(error).not.toBeDefined();
          throw new Error(error);
        },
        () => {
          expect(startedSyncEventToBeCaught).toEqual(expectedStartedSyncEvent);
          expect(stravaConnector.isSyncing).toBeFalsy();
          expect(syncPagesSpy).toBeCalledTimes(expectedSyncPagesCalls);
          expect(syncEvents$CompleteSpy).toBeCalledTimes(expectedCompleteCalls);
          done();
        }
      );
    });

    it("should stop sync and notify error when syncPages() reject an 'Unhandled error'", done => {
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
      const syncEvents$NextSpy = spyOn(syncEvent$, "next").and.callThrough();
      const syncEvents$ErrorsSpy = spyOn(syncEvent$, "error").and.callThrough();
      const syncEvents$CompleteSpy = spyOn(syncEvent$, "complete").and.callThrough();

      // Then
      syncEvent$.pipe(filter(evt => evt.type !== SyncEventType.GENERIC)).subscribe(
        () => {
          // Nothing...
        },
        error => {
          expect(error).toBeDefined();
          expect(syncPagesSpy).toBeCalledTimes(expectedSyncPagesCalls);
          expect(syncEvents$NextSpy).toHaveBeenCalledWith(new StoppedSyncEvent(ConnectorType.STRAVA));
          expect(syncEvents$CompleteSpy).not.toBeCalled();
          expect(syncEvents$ErrorsSpy).toBeCalledTimes(expectedSyncEventErrorCalls);
          expect(stravaConnector.isSyncing).toBeFalsy();

          done();
        },
        () => {
          throw new Error("Test failed!");
        }
      );
    });

    it("should not stop sync and notify errors when multiple errors are provided by syncPages()", done => {
      // Given
      const syncPagesSpy = spyOn(stravaConnector, "syncPages").and.callThrough();
      const expectedScanActivitiesSyncEvents = 3; // GenericSyncEvent: `Scanning X activities...`
      const expectedNextCalls = fakeActivitiesFixture[0].length + expectedScanActivitiesSyncEvents;
      const expectedSyncPagesCalls = 4;
      const computationError = new Error("Computation error!");
      computeActivitySpy.and.returnValue(Promise.reject(computationError));

      // When
      const syncEvent$ = stravaConnector.sync();
      const syncEvents$NextSpy = spyOn(syncEvent$, "next").and.callThrough();
      const syncEvents$ErrorsSpy = spyOn(syncEvent$, "error").and.callThrough();
      const syncEvents$CompleteSpy = spyOn(syncEvent$, "complete").and.callThrough();

      // Then
      syncEvent$.pipe(filter(evt => evt.type !== SyncEventType.GENERIC)).subscribe(
        (syncEvent: SyncEvent) => {
          if (syncEvent.type !== SyncEventType.STARTED) {
            expect(syncEvent.type).toEqual(SyncEventType.ERROR);
            expect((syncEvent as ErrorSyncEvent).fromConnectorType).toEqual(ConnectorType.STRAVA);
            expect((syncEvent as ErrorSyncEvent).description).toEqual(computationError.message);
            expect((syncEvent as ErrorSyncEvent).activity).toBeDefined();
            expect((syncEvent as ErrorSyncEvent).details).toEqual(computationError.message);
            expect((syncEvent as ErrorSyncEvent).stack).toBeDefined();
          }

          expect(stravaConnector.isSyncing).toBeTruthy();
        },
        error => {
          throw error;
        },
        () => {
          expect(syncPagesSpy).toBeCalledTimes(expectedSyncPagesCalls);
          expect(syncEvents$NextSpy).toBeCalledTimes(expectedNextCalls);
          expect(syncEvents$CompleteSpy).toBeCalledTimes(1);
          expect(syncEvents$ErrorsSpy).not.toBeCalled();
          expect(stravaConnector.isSyncing).toBeFalsy();
          done();
        }
      );
    });

    it("should reject recursive sync if connector is already syncing", done => {
      // Given
      const expectedErrorSyncEvent = ErrorSyncEvent.SYNC_ALREADY_STARTED.create(ConnectorType.STRAVA);
      const syncEvent$01 = stravaConnector.sync(); // Start a first sync

      // When
      const syncEvents$NextSpy = spyOn(syncEvent$01, "next").and.callThrough();
      const syncEvent$02 = stravaConnector.sync(); // Start a 2nd one.

      // Then
      syncEvent$01.subscribe(
        () => {
          expect(syncEvents$NextSpy).toHaveBeenCalledWith(expectedErrorSyncEvent);
        },
        () => {
          throw new Error("Test failed!");
        },
        () => {
          expect(syncEvent$01).toEqual(syncEvent$02);
          expect(syncEvent$01.isStopped).toBeTruthy();
          expect(syncEvent$02.isStopped).toBeTruthy();
          expect(syncEvents$NextSpy).toHaveBeenCalledWith(expectedErrorSyncEvent);
          done();
        }
      );
    });
  });

  describe("Sync pages", () => {
    it("should recursive sync strava activities pages", done => {
      // Given
      const syncEvents$ = new Subject<SyncEvent>();
      const syncPagesSpy = spyOn(stravaConnector, "syncPages").and.callThrough();
      const expectedSyncPagesCalls = 4;
      const expectedProcessCalls = 3;

      // When
      const promise = stravaConnector.syncPages(syncEvents$);

      // Then
      promise.then(
        () => {
          expect(syncPagesSpy).toBeCalledTimes(expectedSyncPagesCalls);
          expect(fetchRemoteStravaBareActivityModelsSpy).toBeCalledTimes(expectedSyncPagesCalls);
          expect(processBareActivitiesSpy).toBeCalledTimes(expectedProcessCalls);
          done();
        },
        error => {
          expect(error).toBeNull();
          done();
        }
      );
    });

    it("should reject recursive sync strava activities pages when a remote page unreachable", done => {
      // Given
      const syncEvents$ = new Subject<SyncEvent>();
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
      const promise = stravaConnector.syncPages(syncEvents$);

      // Then
      promise.then(
        () => {
          throw new Error("Whoops! I should not be here!");
        },
        error => {
          expect(error).not.toBeNull();
          expect(error).toEqual(expectedErrorSync);
          expect(syncPagesSpy).toBeCalledTimes(expectedSyncPagesCalls);
          expect(fetchRemoteStravaBareActivityModelsSpy).toBeCalledTimes(expectedSyncPagesCalls);
          expect(processBareActivitiesSpy).toBeCalledTimes(expectedProcessCalls);
          done();
        }
      );
    });

    it("should reject recursive sync when an error occurs while processing an activity", done => {
      // Given
      const syncEvents$ = new Subject<SyncEvent>();
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
      const promise = stravaConnector.syncPages(syncEvents$);

      // Then
      promise.then(
        () => {
          throw new Error("Whoops! I should not be here!");
        },
        error => {
          expect(error).not.toBeNull();
          expect(error).toEqual(errorMessage);
          done();
        }
      );
    });
  });

  describe("Stop sync", () => {
    it("should stop a processing sync", done => {
      // Given
      const stopSyncEventReceived = [];
      const expectedStoppedSyncEvent = new StoppedSyncEvent(ConnectorType.STRAVA);
      const expectedStoppedSyncEventReceived = 1;

      const syncEvent$ = stravaConnector.sync();
      syncEvent$
        .pipe(filter(syncEvent => syncEvent.type === SyncEventType.STOPPED))
        .subscribe((syncEvent: StoppedSyncEvent) => {
          stopSyncEventReceived.push(syncEvent);
        });

      // When
      const promise = stravaConnector.stop();

      // Then
      expect(stravaConnector.stopRequested).toBeTruthy();
      expect(stravaConnector.isSyncing).toBeTruthy();
      promise.then(
        () => {
          expect(stopSyncEventReceived.length).toEqual(expectedStoppedSyncEventReceived);
          expect(stopSyncEventReceived[0]).toEqual(expectedStoppedSyncEvent);
          expect(stravaConnector.stopRequested).toBeFalsy();
          expect(stravaConnector.isSyncing).toBeFalsy();
          done();
        },
        () => {
          throw new Error("Whoops! I should not be here!");
        }
      );
    });

    it("should stop a processing sync even if sync is 'pending' in background (cover case: Strava wants you to slow down...)", done => {
      // Given
      const stopSyncEventReceived = [];
      const expectedStoppedSyncEvent = new StoppedSyncEvent(ConnectorType.STRAVA);
      const expectedStoppedSyncEventReceived = 1;
      const syncEvent$ = stravaConnector.sync();
      syncEvent$
        .pipe(filter(syncEvent => syncEvent.type === SyncEventType.STOPPED))
        .subscribe((syncEvent: StoppedSyncEvent) => {
          stopSyncEventReceived.push(syncEvent);
        });

      // When, Then
      const promise = stravaConnector.stop();
      expect(stravaConnector.isSyncing).toBeTruthy(); // Should be still to true until stop is detected
      expect(stravaConnector.stopRequested).toBeTruthy(); // Should be still to true until stop is detected

      promise.then(
        () => {
          expect(stopSyncEventReceived.length).toEqual(expectedStoppedSyncEventReceived);
          expect(stopSyncEventReceived[0]).toEqual(expectedStoppedSyncEvent);
          expect(stravaConnector.stopRequested).toBeFalsy();
          expect(stravaConnector.isSyncing).toBeFalsy();
          done();
        },
        err => {
          console.error(err);
          throw new Error("Whoops! I should not be here!");
        }
      );
    });

    it("should reject a stop request when no sync is processed", done => {
      // Given
      stravaConnector.isSyncing = false;
      stravaConnector.stopRequested = false;

      // When
      const promise = stravaConnector.stop();

      // Then
      promise.then(
        () => {
          throw new Error("Whoops! I should not be here!");
        },
        error => {
          console.warn(error);
          expect(stravaConnector.isSyncing).toBeFalsy();
          expect(stravaConnector.stopRequested).toBeFalsy();
          done();
        }
      );
    });
  });

  describe("Process bare activities", () => {
    it("should find for existing activity when processing bare activities", done => {
      // Given
      const syncEvents$ = new Subject<SyncEvent>();
      const page = 1;
      const perPage = 20;
      const stravaBareActivities = getActivitiesFixture(page, perPage, fakeActivitiesFixture);
      const expectedFindActivityCalls = perPage;

      // When
      const promise = stravaConnector.processBareActivities(syncEvents$, stravaBareActivities);

      // Then
      promise.then(
        () => {
          expect(findActivitiesSpy).toBeCalledTimes(expectedFindActivityCalls);
          done();
        },
        error => {
          expect(error).toBeNull();
          done();
        }
      );
    });

    it("should send activity sync event and recalculate activity when processing 1 bare activity that already exists with a type change (updateExistingNamesTypesCommutes = true)", done => {
      // Given
      const syncEvents$ = new Subject<SyncEvent>();
      const syncEventsSpy = spyOn(syncEvents$, "next");
      const page = 1;
      const perPage = 20;
      const stravaBareActivities = getActivitiesFixture(page, perPage, fakeActivitiesFixture);
      const trackCallId = 1; // the 2nd one
      const expectedStravaId = 2204692225;

      stravaConnector.stravaConnectorConfig.info.updateExistingNamesTypesCommutes = true;

      const expectedActivityUpdate = new Activity();
      expectedActivityUpdate.name = "FakeName";
      expectedActivityUpdate.type = "FakeType" as ElevateSport;
      const expectedActivitySyncEvent = new ActivitySyncEvent(
        ConnectorType.STRAVA,
        null,
        expectedActivityUpdate,
        false
      );

      const findStreamsSpy = spyOn(stravaConnector, "findStreams").and.returnValue(Promise.resolve(new Streams()));

      computeActivitySpy.and.returnValue(Promise.resolve({ computedActivity: expectedActivityUpdate }));

      // Emulate 1 existing activity
      findActivitiesSpy.and.callFake(() => {
        if (findActivitiesSpy.calls.count() === trackCallId + 1) {
          return Promise.resolve([expectedActivityUpdate]);
        }
        return Promise.resolve(null);
      });

      // When
      const promise = stravaConnector.processBareActivities(syncEvents$, stravaBareActivities);

      // Then
      promise.then(
        () => {
          const activitySyncEventSent = syncEventsSpy.calls.argsFor(trackCallId)[0] as ActivitySyncEvent; // Catching call args
          expect(activitySyncEventSent.fromConnectorType).toEqual(expectedActivitySyncEvent.fromConnectorType);
          expect(activitySyncEventSent.description).toEqual(expectedActivitySyncEvent.description);
          expect(activitySyncEventSent.isNew).toEqual(expectedActivitySyncEvent.isNew);
          expect(activitySyncEventSent.deflatedStreams).toBeNull();
          expect(activitySyncEventSent.activity.name).toEqual(expectedActivitySyncEvent.activity.name);
          expect(activitySyncEventSent.activity.type).toEqual(expectedActivitySyncEvent.activity.type);
          expect(activitySyncEventSent.activity.extras.strava.activityId).toEqual(expectedStravaId);
          expect(syncEventsSpy).toBeCalledTimes(perPage);
          expect(findStreamsSpy).toBeCalledWith(expectedActivityUpdate.id);
          expect(findStreamsSpy).toBeCalledTimes(1);
          expect(computeActivitySpy).toHaveBeenCalledTimes(perPage);

          done();
        },
        error => {
          expect(error).toBeNull();
          done();
        }
      );
    });

    it("should send activity sync event when processing 1 bare activity that already exists (updateExistingNamesTypesCommutes = false)", done => {
      // Given
      const syncEvents$ = new Subject<SyncEvent>();
      const syncEventsSpy = spyOn(syncEvents$, "next");
      const page = 1;
      const perPage = 20;
      const stravaBareActivities = getActivitiesFixture(page, perPage, fakeActivitiesFixture);
      const trackCallId = 1; // the 2nd one

      stravaConnector.stravaConnectorConfig.info.updateExistingNamesTypesCommutes = false;

      const expectedActivityUpdate = new Activity();
      expectedActivityUpdate.name = "FakeName";
      expectedActivityUpdate.type = "FakeType" as ElevateSport;

      // Emulate 1 existing activity
      findActivitiesSpy.and.callFake(() => {
        if (findActivitiesSpy.calls.count() === trackCallId + 1) {
          return Promise.resolve([expectedActivityUpdate]);
        }
        return Promise.resolve(null);
      });

      // When
      const promise = stravaConnector.processBareActivities(syncEvents$, stravaBareActivities);

      // Then
      promise.then(
        () => {
          expect(syncEventsSpy).toBeCalledTimes(perPage - 1);

          _.forEach(syncEventsSpy.calls.all(), call => {
            const activitySyncEventSent = call.args[0] as ActivitySyncEvent;
            expect(activitySyncEventSent.isNew).toEqual(true); // Call is always a new activity
            expect(activitySyncEventSent.deflatedStreams).not.toBeNull();
          });

          done();
        },
        error => {
          expect(error).toBeNull();
          done();
        }
      );
    });

    it("should send error sync event when processing 1 bare activity that already exists (multiple results found)", done => {
      // Given
      const syncEvents$ = new Subject<SyncEvent>();
      const syncEventNextSpy = spyOn(syncEvents$, "next");
      const page = 1;
      const perPage = 20;
      const stravaBareActivities = getActivitiesFixture(page, perPage, fakeActivitiesFixture);
      const trackCallId = 1; // the 2nd one

      stravaConnector.stravaConnectorConfig.info.updateExistingNamesTypesCommutes = true;

      const expectedActivityUpdate = new Activity();
      expectedActivityUpdate.name = "FakeName";
      expectedActivityUpdate.type = "FakeType" as ElevateSport;
      expectedActivityUpdate.startTime = new Date().toISOString();

      // Emulate 1 existing activity
      findActivitiesSpy.and.callFake(() => {
        if (findActivitiesSpy.calls.count() === trackCallId + 1) {
          return Promise.resolve([expectedActivityUpdate, expectedActivityUpdate]);
        }
        return Promise.resolve(null);
      });

      const expectedActivitiesFound =
        expectedActivityUpdate.name + " (" + new Date(expectedActivityUpdate.startTime).toString() + ")";
      const startDate = new Date(stravaBareActivities[trackCallId].start_date);
      const endDate = new Date(startDate.getTime() + stravaBareActivities[trackCallId].elapsed_time * 1000);
      const expectedErrorSyncEvent = ErrorSyncEvent.MULTIPLE_ACTIVITIES_FOUND.create(
        ConnectorType.STRAVA,
        stravaBareActivities[trackCallId].name,
        startDate,
        endDate,
        [expectedActivitiesFound, expectedActivitiesFound]
      );

      // When
      const promise = stravaConnector.processBareActivities(syncEvents$, stravaBareActivities);

      // Then
      promise.then(
        () => {
          expect(syncEventNextSpy).toBeCalledTimes(perPage);
          const errorSyncEvent = syncEventNextSpy.calls.argsFor(trackCallId)[0] as ErrorSyncEvent;
          expect(errorSyncEvent.type).toEqual(expectedErrorSyncEvent.type);
          expect(errorSyncEvent.code).toEqual(expectedErrorSyncEvent.code);
          done();
        },
        error => {
          expect(error).toBeNull();
          done();
        }
      );
    });

    it("should send activity sync event when processing 1 bare activity that do not exists", done => {
      // Given
      const syncEvents$ = new Subject<SyncEvent>();
      const syncEventsSpy = spyOn(syncEvents$, "next");
      const page = 1;
      const perPage = 20;
      const stravaBareActivities = getActivitiesFixture(page, perPage, fakeActivitiesFixture);
      const trackCallId = 1; // the 2nd one

      stravaConnector.stravaConnectorConfig.info.updateExistingNamesTypesCommutes = true;

      const expectedActivityUpdate = new Activity();
      expectedActivityUpdate.name = "Mini Zwift & Pschitt";
      expectedActivityUpdate.type = ElevateSport.VirtualRide;
      const expectedStartTime = "2019-03-10T16:17:32.000Z";
      const expectedStartTimeStamp = new Date(expectedStartTime).getTime() / 1000;
      const expectedEndTime = "2019-03-10T16:49:23.000Z";
      const expectedStravaId = 2204692225;
      const expectedActivitySyncEvent = new ActivitySyncEvent(ConnectorType.STRAVA, null, expectedActivityUpdate, true);

      // Emulate 1 existing activity
      findActivitiesSpy.and.returnValue(Promise.resolve(null));

      // When
      const promise = stravaConnector.processBareActivities(syncEvents$, stravaBareActivities);

      // Then
      promise.then(
        () => {
          const activitySyncEventSent = syncEventsSpy.calls.argsFor(trackCallId)[0] as ActivitySyncEvent; // Catching 2nd call
          expect(activitySyncEventSent.activity.startTime).toEqual(expectedStartTime);
          expect(activitySyncEventSent.activity.startTimestamp).toEqual(expectedStartTimeStamp);
          expect(activitySyncEventSent.activity.endTime).toEqual(expectedEndTime);
          expect(activitySyncEventSent.activity.name).toEqual(expectedActivitySyncEvent.activity.name);
          expect(activitySyncEventSent.activity.type).toEqual(expectedActivitySyncEvent.activity.type);
          expect(activitySyncEventSent.activity.connector).toEqual(ConnectorType.STRAVA);
          expect(activitySyncEventSent.deflatedStreams).not.toBeNull();
          expect(activitySyncEventSent.activity.extras.strava.activityId).toEqual(expectedStravaId);
          expect(activitySyncEventSent.activity.athleteSnapshot).toEqual(
            stravaConnector.athleteSnapshotResolver.getCurrent()
          );
          expect(activitySyncEventSent.activity.stats).not.toBeNull();
          done();
        },
        error => {
          expect(error).toBeNull();
          done();
        }
      );
    });

    it("should reject processing bare activities when fetching stream trigger a unhandled error", done => {
      // Given
      const syncEvents$ = new Subject<SyncEvent>();
      const syncEventsSpy = spyOn(syncEvents$, "next");
      const page = 1;
      const perPage = 20;
      const stravaBareActivities = getActivitiesFixture(page, perPage, fakeActivitiesFixture);
      const trackCallId = 1; // the 2nd one

      stravaConnector.stravaConnectorConfig.info.updateExistingNamesTypesCommutes = true;

      const expectedActivityUpdate = new Activity();
      expectedActivityUpdate.name = "FakeName";
      expectedActivityUpdate.type = "FakeType" as ElevateSport;
      const expectedErrorSyncEvent = ErrorSyncEvent.UNHANDLED_ERROR_SYNC.create(ConnectorType.STRAVA, "Whoops :/");

      // Emulate 1 existing activity
      fetchRemoteStravaStreamsSpy.and.callFake(() => {
        if (fetchRemoteStravaStreamsSpy.calls.count() === trackCallId + 1) {
          return Promise.reject(expectedErrorSyncEvent);
        }
        return Promise.resolve(_.cloneDeep(fakeStreamsFixture));
      });

      // When
      const promise = stravaConnector.processBareActivities(syncEvents$, stravaBareActivities);

      // Then
      promise.then(
        () => {
          throw new Error("Test fail!");
        },
        error => {
          expect(error).toEqual(expectedErrorSyncEvent);
          expect(fetchRemoteStravaStreamsSpy).toBeCalledTimes(2);
          expect(syncEventsSpy).toBeCalledTimes(1);

          done();
        }
      );
    });
  });

  describe("Activity streams", () => {
    it("should get streams of an activity", done => {
      // Given
      const activityId = 666;

      // When
      const promise = stravaConnector.fetchRemoteAndMapStreams(activityId);

      // Then
      promise.then(
        (streams: Streams) => {
          expect(fetchRemoteStravaStreamsSpy).toBeCalledTimes(1);

          expect(streams).not.toBeNull();
          expect(streams.time).toEqual(_.find(fakeStreamsFixture, { type: "time" }).data);
          expect(streams.distance).toEqual(_.find(fakeStreamsFixture, { type: "distance" }).data);
          expect(streams.latlng).toEqual(_.find(fakeStreamsFixture, { type: "latlng" }).data);
          expect(streams.altitude).toEqual(_.find(fakeStreamsFixture, { type: "altitude" }).data);
          expect(streams.velocity_smooth).toEqual(_.find(fakeStreamsFixture, { type: "velocity_smooth" }).data);
          expect(streams.heartrate).toEqual(_.find(fakeStreamsFixture, { type: "heartrate" }).data);
          expect(streams.cadence).toEqual(_.find(fakeStreamsFixture, { type: "cadence" }).data);
          expect(streams.watts).toEqual(_.find(fakeStreamsFixture, { type: "watts" }).data);
          expect(streams.watts_calc).toEqual(_.find(fakeStreamsFixture, { type: "watts_calc" }).data);
          expect(streams.grade_smooth).toEqual(_.find(fakeStreamsFixture, { type: "grade_smooth" }).data);
          expect(streams.grade_adjusted_speed).toEqual(
            _.find(fakeStreamsFixture, { type: "grade_adjusted_speed" }).data
          );

          done();
        },
        error => {
          expect(error).toBeNull();
          done();
        }
      );
    });

    it("should get empty streams when an activity has no streams (404 not found)", done => {
      // Given
      const activityId = 666;
      fetchRemoteStravaStreamsSpy.and.callThrough();
      spyOn(stravaConnector.stravaApiClient, "get").and.callThrough();
      spyOn(stravaConnector.stravaApiClient, "stravaTokensUpdater").and.returnValue(Promise.resolve());
      spyOn(stravaConnector.stravaApiClient.httpClient, "get").and.returnValue(
        Promise.reject(createErrorResponse(StatusCodes.NOT_FOUND))
      );

      // When
      const promise = stravaConnector.fetchRemoteAndMapStreams(activityId);

      // Then
      promise.then(
        (streams: Streams) => {
          expect(streams).toBeNull();
          done();
        },
        error => {
          expect(error).toBeNull();
          done();
        }
      );
    });

    it("should reject when an error occurs while getting streams (UNHANDLED HTTP GET ERROR)", done => {
      // Given
      const activityId = 666;
      fetchRemoteStravaStreamsSpy.and.callThrough();
      spyOn(stravaConnector.stravaApiClient, "get").and.callThrough();
      spyOn(stravaConnector.stravaApiClient, "stravaTokensUpdater").and.returnValue(Promise.resolve());
      spyOn(stravaConnector.stravaApiClient.httpClient, "get").and.returnValue(
        Promise.reject(createErrorResponse(StatusCodes.FORBIDDEN))
      );

      const expectedErrorSync = ErrorSyncEvent.STRAVA_API_FORBIDDEN.create();

      // When
      const promise = stravaConnector.fetchRemoteAndMapStreams(activityId);

      // Then
      promise.then(
        () => {
          throw new Error("Test fail!");
        },
        error => {
          expect(error).not.toBeNull();
          expect(error).toEqual(expectedErrorSync);
          done();
        }
      );
    });
  });

  describe("Fetch remote bare activity models", () => {
    it("should fetch a remote activities page from strava api", done => {
      // Given
      const page = 1;
      const perPage = 20;
      const expectedResult = [];
      const afterTimestamp = null;
      const stravaApiCallSpy = spyOn(stravaConnector.stravaApiClient, "get").and.callThrough();
      spyOn(stravaConnector.stravaApiClient, "stravaTokensUpdater").and.returnValue(Promise.resolve());
      const httpGetSpy = spyOn(stravaConnector.stravaApiClient.httpClient, "get").and.returnValue(
        Promise.resolve(createResponse(expectedResult))
      );
      fetchRemoteStravaBareActivityModelsSpy.and.callThrough();
      const expectedCallsTimes = 1;

      // When
      const promise = stravaConnector.fetchRemoteStravaBareActivityModels(page, perPage, afterTimestamp);

      // Then
      promise.then(
        result => {
          expect(result).toEqual(expectedResult);
          expect(stravaApiCallSpy).toHaveBeenCalledTimes(expectedCallsTimes);
          expect(httpGetSpy).toHaveBeenCalledTimes(expectedCallsTimes);
          done();
        },
        () => {
          throw new Error("Should not be here!");
        }
      );
    });

    it("should reject a fetch of a remote activities page from strava api (Unauthorized)", done => {
      // Given
      const page = 1;
      const perPage = 20;
      const afterTimestamp = null;
      const stravaApiCallSpy = spyOn(stravaConnector.stravaApiClient, "get").and.callThrough();
      spyOn(stravaConnector.stravaApiClient, "stravaTokensUpdater").and.returnValue(Promise.resolve());
      const httpGetSpy = spyOn(stravaConnector.stravaApiClient.httpClient, "get").and.returnValue(
        Promise.reject(createErrorResponse(StatusCodes.UNAUTHORIZED))
      );
      fetchRemoteStravaBareActivityModelsSpy.and.callThrough();
      const expectedCallsTimes = 1;
      const expectedErrorSync = ErrorSyncEvent.STRAVA_API_UNAUTHORIZED.create();

      // When
      const promise = stravaConnector.fetchRemoteStravaBareActivityModels(page, perPage, afterTimestamp);

      // Then
      promise.then(
        () => {
          throw new Error("Should not be here!");
        },
        error => {
          expect(error).toEqual(expectedErrorSync);
          expect(stravaApiCallSpy).toHaveBeenCalledTimes(expectedCallsTimes);
          expect(httpGetSpy).toHaveBeenCalledTimes(expectedCallsTimes);

          done();
        }
      );
    });

    it("should fetch a remote activity stream from strava api", done => {
      // Given
      const activityId = 666;
      const expectedResult = [];
      const stravaApiCallSpy = spyOn(stravaConnector.stravaApiClient, "get").and.callThrough();
      spyOn(stravaConnector.stravaApiClient, "stravaTokensUpdater").and.returnValue(Promise.resolve());
      const httpGetSpy = spyOn(stravaConnector.stravaApiClient.httpClient, "get").and.returnValue(
        Promise.resolve(createResponse(expectedResult))
      );
      fetchRemoteStravaStreamsSpy.and.callThrough();
      const expectedCallsTimes = 1;

      // When
      const promise = stravaConnector.fetchRemoteStravaStreams(activityId);

      // Then
      promise.then(
        result => {
          expect(result).toEqual(expectedResult);
          expect(stravaApiCallSpy).toHaveBeenCalledTimes(expectedCallsTimes);
          expect(httpGetSpy).toHaveBeenCalledTimes(expectedCallsTimes);
          done();
        },
        () => {
          throw new Error("Should not be here!");
        }
      );
    });

    it("should reject a fetch of a remote activity stream from strava api (Not found)", done => {
      // Given
      const activityId = 666;
      const stravaApiCallSpy = spyOn(stravaConnector.stravaApiClient, "get").and.callThrough();
      spyOn(stravaConnector.stravaApiClient, "stravaTokensUpdater").and.returnValue(Promise.resolve());
      const httpGetSpy = spyOn(stravaConnector.stravaApiClient.httpClient, "get").and.returnValue(
        Promise.reject(createErrorResponse(StatusCodes.NOT_FOUND))
      );
      fetchRemoteStravaStreamsSpy.and.callThrough();
      const expectedCallsTimes = 1;
      const expectedErrorSync = ErrorSyncEvent.STRAVA_API_RESOURCE_NOT_FOUND.create(
        StravaConnector.generateFetchStreamsEndpoint(activityId)
      );

      // When
      const promise = stravaConnector.fetchRemoteStravaStreams(activityId);

      // Then
      promise.then(
        () => {
          throw new Error("Should not be here!");
        },
        error => {
          expect(error).toEqual(expectedErrorSync);
          expect(stravaApiCallSpy).toHaveBeenCalledTimes(expectedCallsTimes);
          expect(httpGetSpy).toHaveBeenCalledTimes(expectedCallsTimes);

          done();
        }
      );
    });
  });
});
