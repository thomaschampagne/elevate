import fs from "fs";
import os from "os";
import path from "path";
import { container } from "tsyringe";
import { ReplaySubject } from "rxjs";
import { GarminConnector } from "./garmin.connector";
import { GarminConnectorConfig } from "../connector-config.model";
import { GarminActivitySummary, GarminApiClient } from "../../clients/garmin-api.client";
import { SportsLibProcessor } from "../../processors/sports-lib.processor";
import { ActivityComputeProcessor } from "../../processors/activity-compute/activity-compute.processor";
import { WorkerService } from "../../worker-service";
import { WorkerType } from "../../enum/worker-type.enum";
import { UserSettings } from "@elevate/shared/models/user-settings/user-settings.namespace";
import { AthleteModel } from "@elevate/shared/models/athlete/athlete.model";
import { BuildTarget } from "@elevate/shared/enums/build-target.enum";
import { GarminConnectorInfo } from "@elevate/shared/sync/connectors/garmin-connector-info.model";
import { SyncEvent } from "@elevate/shared/sync/events/sync.event";
import { SyncEventType } from "@elevate/shared/sync/events/sync-event-type";
import { ActivitySyncEvent } from "@elevate/shared/sync/events/activity-sync.event";
import { ErrorSyncEvent } from "@elevate/shared/sync/events/error-sync.event";
import { StoppedSyncEvent } from "@elevate/shared/sync/events/stopped-sync.event";
import { ConnectorType } from "@elevate/shared/sync/connectors/connector-type.enum";
import { ElevateSport } from "@elevate/shared/enums/elevate-sport.enum";
import { Activity } from "@elevate/shared/models/sync/activity.model";
import { AthleteSnapshot } from "@elevate/shared/models/athlete/athlete-snapshot.model";
import { Streams } from "@elevate/shared/models/activity-data/streams.model";
import BaseUserSettings = UserSettings.BaseUserSettings;

/**
 * Fixture "2088390344.zip" is the archive shape returned by Garmin download service:
 * a zip holding the original FIT file "2088390344_ACTIVITY.fit".
 * Activity inside: Running from 2017-10-11T16:48:25Z to 2017-10-11T17:20:28Z (Garmin VivoActive HR).
 */
const FIXTURE_ARCHIVE = path.join(__dirname, "fixtures", "2088390344.zip");

const createSummary = (overrides: Partial<GarminActivitySummary> = {}): GarminActivitySummary => {
  return {
    activityId: 2088390344,
    activityName: "Lunch run along the river",
    description: "Easy pace",
    startTimeGMT: "2017-10-11 16:48:25",
    activityType: { typeKey: "running" },
    duration: 1923,
    elapsedDuration: 1923,
    movingDuration: 1900,
    distance: 5012.4,
    averageSpeed: 2.61,
    calories: 340,
    ...overrides
  };
};

/**
 * Run a sync and collect its events. Resolves on completion, on error, or shortly after a STOPPED event
 * (a stopped sync stream is not completed, by design of connectors)
 */
const collectSync = (garminConnector: GarminConnector): Promise<{ events: SyncEvent[]; error: any }> => {
  return new Promise(resolve => {
    const events: SyncEvent[] = [];
    let settled = false;
    let error: any = null;
    const settle = () => {
      if (!settled) {
        settled = true;
        resolve({ events: events, error: error });
      }
    };
    garminConnector.sync().subscribe(
      event => {
        events.push(event);
        if (event.type === SyncEventType.STOPPED) {
          setTimeout(settle, 50);
        }
      },
      err => {
        error = err;
        settle();
      },
      () => settle()
    );
  });
};

describe("GarminConnector", () => {
  let garminConnector: GarminConnector;
  let garminApiClient: GarminApiClient;
  let connectorConfig: GarminConnectorConfig;
  let tempRoot: string;

  let searchActivitiesSpy: jasmine.Spy;
  let downloadActivityArchiveSpy: jasmine.Spy;
  let findLocalActivitiesSpy: jasmine.Spy;

  beforeEach(done => {
    garminConnector = container.resolve(GarminConnector);
    garminApiClient = container.resolve(GarminApiClient);

    connectorConfig = {
      syncFromDateTime: null,
      athleteModel: AthleteModel.DEFAULT_MODEL,
      userSettings: UserSettings.getDefaultsByBuildTarget(BuildTarget.DESKTOP),
      info: new GarminConnectorInfo("fake-api-key")
    };
    garminConnector.configure(connectorConfig);

    tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "garmin-connector-spec-"));
    spyOn(garminConnector, "getTempRoot").and.returnValue(tempRoot);

    // Default api behavior: one page with one activity, archive from fixtures
    searchActivitiesSpy = spyOn(garminApiClient, "searchActivities").and.callFake((apiKey, start: number) =>
      Promise.resolve(start === 0 ? [createSummary()] : [])
    );
    downloadActivityArchiveSpy = spyOn(garminApiClient, "downloadActivityArchive").and.callFake(() =>
      Promise.resolve(fs.readFileSync(FIXTURE_ARCHIVE))
    );

    findLocalActivitiesSpy = spyOn(garminConnector, "findLocalActivities").and.returnValue(Promise.resolve([]));

    // Avoid worker threads: parse & compute in current process
    const workerService = container.resolve(WorkerService);
    spyOn(workerService, "exec").and.callFake((workerType: WorkerType, params: any) => {
      if (workerType === WorkerType.SPORTS_LIB) {
        return SportsLibProcessor.getEvent(params.path) as any;
      }
      return Promise.reject(`Unexpected worker ${workerType}`);
    });

    spyOn(garminConnector, "computeActivity").and.callFake(
      (
        activity: Partial<Activity>,
        athleteSnapshot: AthleteSnapshot,
        userSettings: BaseUserSettings,
        streams: Streams,
        deflateStreams: boolean
      ) => ActivityComputeProcessor.compute(activity, athleteSnapshot, userSettings, streams, deflateStreams)
    );

    done();
  });

  afterEach(done => {
    fs.rmSync(tempRoot, { recursive: true, force: true });
    done();
  });

  describe("Mapping helpers", () => {
    it("should parse Garmin GMT dates", done => {
      expect(GarminConnector.parseGmtDate("2017-10-11 16:48:25").toISOString()).toEqual("2017-10-11T16:48:25.000Z");
      expect(GarminConnector.parseGmtDate("2017-10-11T16:48:25.0").toISOString()).toEqual("2017-10-11T16:48:25.000Z");
      expect(GarminConnector.parseGmtDate("not a date")).toBeNull();
      expect(GarminConnector.parseGmtDate(null)).toBeNull();
      done();
    });

    it("should map Garmin activity types to Elevate sports", done => {
      expect(GarminConnector.resolveElevateSport({ activityType: { typeKey: "trail_running" } })).toEqual(
        ElevateSport.Run
      );
      expect(GarminConnector.resolveElevateSport({ activityType: { typeKey: "gravel_cycling" } })).toEqual(
        ElevateSport.Ride
      );
      expect(GarminConnector.resolveElevateSport({ activityType: { typeKey: "virtual_ride" } })).toEqual(
        ElevateSport.VirtualRide
      );
      expect(GarminConnector.resolveElevateSport({ activityType: { typeKey: "unknown_sport" } })).toBeNull();
      expect(GarminConnector.resolveElevateSport({})).toBeNull();
      done();
    });

    it("should prepare bare activity times from Garmin summary", done => {
      const bareActivity = garminConnector.prepareBareActivity(createSummary());
      expect(bareActivity.startTime).toEqual("2017-10-11T16:48:25.000Z");
      expect(bareActivity.endTime).toEqual("2017-10-11T17:20:28.000Z");
      expect(bareActivity.type).toEqual(ElevateSport.Run);
      expect(garminConnector.prepareBareActivity(createSummary({ startTimeGMT: null }))).toBeNull();
      done();
    });

    it("should search from last sync date minus a safety margin on fast sync", done => {
      expect(garminConnector.getSearchStartDate()).toBeNull();

      garminConnector.configure({ ...connectorConfig, syncFromDateTime: Date.parse("2026-10-20T10:00:00Z") });
      expect(garminConnector.getSearchStartDate().toISOString()).toEqual("2026-10-13T10:00:00.000Z");
      done();
    });
  });

  describe("Paging", () => {
    it("should go through pages until a partial page", done => {
      const perPage = GarminConnector.ACTIVITIES_PER_PAGE;
      const page = (count: number, firstId: number) =>
        Array.from({ length: count }, (_v, i) => createSummary({ activityId: firstId + i })) as GarminActivitySummary[];

      searchActivitiesSpy.and.returnValues(
        Promise.resolve(page(perPage, 1)),
        Promise.resolve(page(perPage, 101)),
        Promise.resolve(page(5, 201))
      );
      const processSpy = spyOn(garminConnector, "processActivitySummaries").and.returnValue(Promise.resolve());

      garminConnector.syncEvents$ = new ReplaySubject<SyncEvent>();
      garminConnector.syncPages(garminConnector.syncEvents$).then(() => {
        expect(searchActivitiesSpy).toHaveBeenCalledTimes(3);
        expect(searchActivitiesSpy.calls.argsFor(0)[1]).toEqual(0);
        expect(searchActivitiesSpy.calls.argsFor(1)[1]).toEqual(perPage);
        expect(searchActivitiesSpy.calls.argsFor(2)[1]).toEqual(perPage * 2);
        expect(processSpy).toHaveBeenCalledTimes(3);
        done();
      });
    });
  });

  describe("Paging guards", () => {
    it("should stop scanning once activities are older than the searched period", done => {
      garminConnector.configure({ ...connectorConfig, syncFromDateTime: Date.parse("2026-10-20T10:00:00Z") });
      const perPage = GarminConnector.ACTIVITIES_PER_PAGE;
      // Full page where only first 3 activities are within period (start date filter ignored by api)
      const page = Array.from({ length: perPage }, (_v, i) =>
        createSummary({ activityId: 100 + i, startTimeGMT: i < 3 ? "2026-10-19 08:00:00" : "2026-09-01 08:00:00" })
      );
      searchActivitiesSpy.and.returnValue(Promise.resolve(page));
      const processSpy = spyOn(garminConnector, "processActivitySummaries").and.returnValue(Promise.resolve());

      garminConnector.syncPages(new ReplaySubject<SyncEvent>()).then(() => {
        expect(searchActivitiesSpy).toHaveBeenCalledTimes(1);
        expect(processSpy.calls.mostRecent().args[1].length).toEqual(3);
        done();
      });
    });

    it("should stop scanning when the same page is served again", done => {
      const perPage = GarminConnector.ACTIVITIES_PER_PAGE;
      const page = Array.from({ length: perPage }, (_v, i) => createSummary({ activityId: i + 1 }));
      searchActivitiesSpy.and.returnValue(Promise.resolve(page)); // Paging param ignored by api
      const processSpy = spyOn(garminConnector, "processActivitySummaries").and.returnValue(Promise.resolve());

      garminConnector.syncPages(new ReplaySubject<SyncEvent>()).then(() => {
        expect(searchActivitiesSpy).toHaveBeenCalledTimes(2);
        expect(processSpy).toHaveBeenCalledTimes(1);
        done();
      });
    });
  });

  describe("Sync", () => {
    it("should import a new activity from the Garmin FIT file", done => {
      collectSync(garminConnector).then(({ events, error }) => {
        expect(error).toBeNull();

        const activityEvents = events.filter(e => e.type === SyncEventType.ACTIVITY) as ActivitySyncEvent[];
        expect(activityEvents.length).toEqual(1);

        const activityEvent = activityEvents[0];
        expect(activityEvent.isNew).toEqual(true);
        expect(activityEvent.fromConnectorType).toEqual(ConnectorType.GARMIN);
        expect(activityEvent.deflatedStreams).toBeTruthy();

        const activity = activityEvent.activity;
        expect(activity.name).toEqual("Lunch run along the river");
        expect(activity.type).toEqual(ElevateSport.Run);
        expect(activity.connector).toEqual(ConnectorType.GARMIN);
        expect(activity.extras.garmin.activityId).toEqual(2088390344);
        expect(activity.startTime).toEqual("2017-10-11T16:48:25.000Z");
        expect(activity.notes).toEqual("Easy pace");
        expect(activity.device).toContain("VivoActive");
        expect(activity.srcStats.distance).toBeGreaterThan(0);

        expect(findLocalActivitiesSpy).toHaveBeenCalledWith("2017-10-11T16:48:25.000Z", "2017-10-11T17:20:28.000Z");
        expect(downloadActivityArchiveSpy).toHaveBeenCalledTimes(1);

        // Temporary work folders are cleaned
        expect(fs.readdirSync(tempRoot).length).toEqual(0);
        done();
      });
    });

    it("should apply the type set on Garmin Connect over the file sport", done => {
      searchActivitiesSpy.and.callFake((apiKey, start: number) =>
        Promise.resolve(start === 0 ? [createSummary({ activityType: { typeKey: "virtual_run" } })] : [])
      );

      collectSync(garminConnector).then(({ events }) => {
        const activityEvent = events.find(e => e.type === SyncEventType.ACTIVITY) as ActivitySyncEvent;
        expect(activityEvent.activity.type).toEqual(ElevateSport.VirtualRun);
        done();
      });
    });

    it("should create an activity from summary when Garmin holds no file", done => {
      downloadActivityArchiveSpy.and.returnValue(
        Promise.reject(ErrorSyncEvent.GARMIN_API_RESOURCE_NOT_FOUND.create("https://fake"))
      );

      collectSync(garminConnector).then(({ events, error }) => {
        expect(error).toBeNull();
        const activityEvent = events.find(e => e.type === SyncEventType.ACTIVITY) as ActivitySyncEvent;
        expect(activityEvent.isNew).toEqual(true);
        expect(activityEvent.activity.manual).toEqual(true);
        expect(activityEvent.activity.name).toEqual("Lunch run along the river");
        expect(activityEvent.activity.extras.garmin.activityId).toEqual(2088390344);
        expect(activityEvent.activity.srcStats.distance).toEqual(5012.4);
        expect(activityEvent.activity.srcStats.elapsedTime).toEqual(1923);
        done();
      });
    });

    it("should update name and type of an existing activity without downloading it", done => {
      const existing = new Activity();
      existing.id = "local-1";
      existing.name = "Afternoon Run";
      existing.type = ElevateSport.Run;
      existing.extras = { file: { path: "/some/file.fit", type: null } };
      findLocalActivitiesSpy.and.returnValue(Promise.resolve([existing]));

      collectSync(garminConnector).then(({ events }) => {
        const activityEvent = events.find(e => e.type === SyncEventType.ACTIVITY) as ActivitySyncEvent;
        expect(activityEvent.isNew).toEqual(false);
        expect(activityEvent.activity.name).toEqual("Lunch run along the river");
        expect(activityEvent.activity.extras.garmin.activityId).toEqual(2088390344);
        expect(activityEvent.activity.extras.file.path).toEqual("/some/file.fit");
        expect(downloadActivityArchiveSpy).not.toHaveBeenCalled();
        done();
      });
    });

    it("should leave existing activities untouched when update option is off", done => {
      garminConnector.configure({ ...connectorConfig, info: new GarminConnectorInfo("fake-api-key", false) });
      findLocalActivitiesSpy.and.returnValue(Promise.resolve([new Activity()]));

      collectSync(garminConnector).then(({ events }) => {
        expect(events.filter(e => e.type === SyncEventType.ACTIVITY).length).toEqual(0);
        expect(downloadActivityArchiveSpy).not.toHaveBeenCalled();
        done();
      });
    });

    it("should skip a multisport activity already synced as several activities", done => {
      const leg = (type: ElevateSport) => {
        const activity = new Activity();
        activity.type = type;
        activity.extras = { garmin: { activityId: 2088390344 } };
        return activity;
      };
      findLocalActivitiesSpy.and.returnValue(
        Promise.resolve([leg(ElevateSport.Swim), leg(ElevateSport.Ride), leg(ElevateSport.Run)])
      );

      collectSync(garminConnector).then(({ events, error }) => {
        expect(error).toBeNull();
        expect(events.filter(e => e.type === SyncEventType.ERROR).length).toEqual(0);
        expect(events.filter(e => e.type === SyncEventType.ACTIVITY).length).toEqual(0);
        expect(downloadActivityArchiveSpy).not.toHaveBeenCalled();
        done();
      });
    });

    it("should not download files of manual activities", done => {
      searchActivitiesSpy.and.callFake((apiKey, start: number) =>
        Promise.resolve(start === 0 ? [createSummary({ manualActivity: true })] : [])
      );

      collectSync(garminConnector).then(({ events }) => {
        const activityEvent = events.find(e => e.type === SyncEventType.ACTIVITY) as ActivitySyncEvent;
        expect(activityEvent.activity.manual).toEqual(true);
        expect(downloadActivityArchiveSpy).not.toHaveBeenCalled();
        done();
      });
    });

    it("should continue the sync when one activity download fails on server side", done => {
      searchActivitiesSpy.and.callFake((apiKey, start: number) =>
        Promise.resolve(
          start === 0
            ? [
                createSummary({ activityId: 1, startTimeGMT: "2017-10-12 10:00:00" }),
                createSummary({ activityId: 2088390344 })
              ]
            : []
        )
      );
      downloadActivityArchiveSpy.and.callFake((apiKey: string, activityId: number) =>
        activityId === 1
          ? Promise.reject(ErrorSyncEvent.GARMIN_API_HTTP_ERROR.create("https://fake", 500, "Server Error"))
          : Promise.resolve(fs.readFileSync(FIXTURE_ARCHIVE))
      );

      collectSync(garminConnector).then(({ events, error }) => {
        expect(error).toBeNull();
        const errorEvents = events.filter(e => e.type === SyncEventType.ERROR) as ErrorSyncEvent[];
        expect(errorEvents.length).toEqual(1);
        expect(errorEvents[0].code).toEqual(ErrorSyncEvent.GARMIN_API_HTTP_ERROR.code);
        expect(events.filter(e => e.type === SyncEventType.ACTIVITY).length).toEqual(1);
        done();
      });
    });

    it("should notify when several local activities overlap", done => {
      findLocalActivitiesSpy.and.returnValue(Promise.resolve([new Activity(), new Activity()]));

      collectSync(garminConnector).then(({ events, error }) => {
        expect(error).toBeNull();
        const errorEvent = events.find(e => e.type === SyncEventType.ERROR) as ErrorSyncEvent;
        expect(errorEvent.code).toEqual(ErrorSyncEvent.MULTIPLE_ACTIVITIES_FOUND.code);
        done();
      });
    });

    it("should notify a broken activity file and continue with next activities", done => {
      searchActivitiesSpy.and.callFake((apiKey, start: number) =>
        Promise.resolve(
          start === 0
            ? [
                createSummary({ activityId: 1, startTimeGMT: "2017-10-12 10:00:00" }),
                createSummary({ activityId: 2088390344 })
              ]
            : []
        )
      );
      downloadActivityArchiveSpy.and.callFake((apiKey: string, activityId: number) =>
        Promise.resolve(activityId === 1 ? Buffer.from("not a zip archive") : fs.readFileSync(FIXTURE_ARCHIVE))
      );

      collectSync(garminConnector).then(({ events, error }) => {
        expect(error).toBeNull();
        const errorEvents = events.filter(e => e.type === SyncEventType.ERROR) as ErrorSyncEvent[];
        expect(errorEvents.length).toEqual(1);
        expect(errorEvents[0].code).toEqual(ErrorSyncEvent.SYNC_ERROR_COMPUTE.code);
        expect(events.filter(e => e.type === SyncEventType.ACTIVITY).length).toEqual(1);
        expect(fs.readdirSync(tempRoot).length).toEqual(0);
        done();
      });
    });

    it("should stop the sync when Garmin rejects the api key", done => {
      downloadActivityArchiveSpy.and.returnValue(Promise.reject(ErrorSyncEvent.GARMIN_API_UNAUTHORIZED.create()));

      collectSync(garminConnector).then(({ events, error }) => {
        expect(error.code).toEqual(ErrorSyncEvent.GARMIN_API_UNAUTHORIZED.code);
        expect(events.some(e => e.type === SyncEventType.STOPPED)).toEqual(true);
        expect(garminConnector.isSyncing).toEqual(false);
        done();
      });
    });

    it("should stop when requested", done => {
      garminConnector.stopRequested = true;

      collectSync(garminConnector).then(({ events }) => {
        expect(events.some(e => e instanceof StoppedSyncEvent)).toEqual(true);
        expect(searchActivitiesSpy).not.toHaveBeenCalled();
        garminConnector.stopRequested = false;
        done();
      });
    });
  });
});
