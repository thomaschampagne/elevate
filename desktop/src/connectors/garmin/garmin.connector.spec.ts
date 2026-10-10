import { container } from "tsyringe";
import { filter } from "rxjs/operators";
import fs from "fs";
import path from "path";
import { GarminConnectClient, GarminActivitySummary } from "./garmin-connect.client";
import { GarminConnector } from "./garmin.connector";
import { ActivityFile } from "../file/activity-file.model";
import { SportsLibProcessor } from "../../processors/sports-lib.processor";
import { ActivityComputeProcessor } from "../../processors/activity-compute/activity-compute.processor";
import { GarminConnectorConfig } from "../connector-config.model";
import { GarminConnectorInfo } from "@elevate/shared/sync/connectors/garmin-connector-info.model";
import { AthleteModel } from "@elevate/shared/models/athlete/athlete.model";
import { BuildTarget } from "@elevate/shared/enums/build-target.enum";
import { UserSettings } from "@elevate/shared/models/user-settings/user-settings.namespace";
import { Activity } from "@elevate/shared/models/sync/activity.model";
import { SyncEvent } from "@elevate/shared/sync/events/sync.event";
import { SyncEventType } from "@elevate/shared/sync/events/sync-event-type";
import { ActivitySyncEvent } from "@elevate/shared/sync/events/activity-sync.event";
import { Streams } from "@elevate/shared/models/activity-data/streams.model";
import { AthleteSnapshot } from "@elevate/shared/models/athlete/athlete-snapshot.model";
import BaseUserSettings = UserSettings.BaseUserSettings;

describe("GarminConnectClient", () => {
  let garminConnectClient: GarminConnectClient;

  beforeEach(() => {
    garminConnectClient = container.resolve(GarminConnectClient);
  });

  it("should not be authenticated by default", () => {
    expect(garminConnectClient.isAuthenticated()).toBe(false);
  });

  it("should list activities from the wrapped library", done => {
    // Given
    const fakeActivities = [
      { activityId: 1, activityName: "Ride", startTimeGMT: "2019-08-11 12:00:00", beginTimestamp: 1565534400000 }
    ] as unknown as GarminActivitySummary[];

    (garminConnectClient as unknown as { client: unknown }).client = {
      getActivities: () => Promise.resolve(fakeActivities),
      countActivities: () => Promise.resolve({ totalCount: 1 })
    };

    // When
    const promise = garminConnectClient.listActivities(0, 20);

    // Then
    promise.then(activities => {
      expect(activities.length).toEqual(1);
      expect(activities[0].activityId).toEqual(1);
      done();
    });
  });

  it("should count activities", done => {
    (garminConnectClient as unknown as { client: unknown }).client = {
      countActivities: () => Promise.resolve({ totalCount: 42 })
    };

    garminConnectClient.countActivities().then(count => {
      expect(count).toEqual(42);
      done();
    });
  });

  it("should reject activity listing when not authenticated", done => {
    (garminConnectClient as unknown as { client: unknown }).client = null;

    garminConnectClient.listActivities(0, 20).then(
      () => {
        throw new Error("Should not be here");
      },
      error => {
        expect(error.message).toContain("not authenticated");
        done();
      }
    );
  });
});

describe("GarminConnector", () => {
  const garminFitFixturePath = path.join(
    __dirname,
    "../file/fixtures/activities-02/runs/garmin_export/20171011_run_2088390344.fit"
  );

  let garminConnector: GarminConnector;
  let garminConnectClient: GarminConnectClient;
  let garminConnectorConfig: GarminConnectorConfig;
  let findLocalActivitiesSpy: jasmine.Spy;

  const fakeGarminActivity = (
    activityId: number,
    activityName: string,
    startTimeGMT: string,
    beginTimestamp: number
  ): GarminActivitySummary =>
    ({
      activityId,
      activityName,
      startTimeGMT,
      beginTimestamp,
      distance: 5000,
      duration: 1800,
      activityType: { typeId: 1, typeKey: "running" },
      locationName: "Lyon"
    } as unknown as GarminActivitySummary);

  beforeEach(() => {
    garminConnector = container.resolve(GarminConnector);
    garminConnectClient = container.resolve(GarminConnectClient);

    garminConnectorConfig = {
      syncFromDateTime: null,
      athleteModel: AthleteModel.DEFAULT_MODEL,
      userSettings: UserSettings.getDefaultsByBuildTarget(BuildTarget.DESKTOP),
      info: new GarminConnectorInfo("runner@example.com", "oauth1", "oauth2", 0, "Runner")
    };

    garminConnector = garminConnector.configure(garminConnectorConfig);

    // Avoid worker use for sports-lib computation. Do it directly (as FileConnector spec does).
    spyOn(garminConnector, "computeSportsLibEvent").and.callFake((activityFile: ActivityFile) => {
      return SportsLibProcessor.getEvent(activityFile.location.path);
    });

    // Same for activity computing: avoid worker use
    spyOn(garminConnector, "computeActivity").and.callFake(
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

    // Speed up tests (remove artificial sleeps)
    spyOn(garminConnector, "wait").and.returnValue(Promise.resolve());

    // No local activity exists yet => new activity (avoids real IPC)
    findLocalActivitiesSpy = spyOn(garminConnector, "findLocalActivities").and.returnValue(Promise.resolve(null));
  });

  it("should sync a Garmin activity through the sports-lib pipeline and emit a new GARMIN activity", done => {
    // Given
    const fakeActivity = {
      activityId: 2088390344,
      activityName: "Morning Run",
      startTimeGMT: "2017-10-11 16:48:25",
      startTimeLocal: "2017-10-11 16:48:25",
      beginTimestamp: 1507741705000,
      distance: 8000,
      duration: 2400,
      activityType: { typeId: 1, typeKey: "running" },
      locationName: "Lyon"
    } as unknown as GarminActivitySummary;

    // Session is considered authenticated (tokens already persisted)
    spyOn(garminConnectClient, "isAuthenticated").and.returnValue(true);

    // List returns our single activity (a single partial page)
    spyOn(garminConnectClient, "listActivities").and.returnValue(Promise.resolve([fakeActivity]));

    // Download returns a fake zip path (content not used: extract is stubbed below)
    spyOn(garminConnectClient, "downloadOriginalActivityData").and.returnValue(Promise.resolve("/tmp/2088390344.zip"));

    // Extract the real Garmin FIT fixture instead of unzipping
    spyOn(garminConnector as unknown as { extractFitFromZip: () => void }, "extractFitFromZip").and.returnValue(
      Promise.resolve(fs.existsSync(garminFitFixturePath) ? garminFitFixturePath : null)
    );

    // When
    garminConnector.sync();

    // Then
    garminConnector.syncEvents$
      .pipe(filter(syncEvent => syncEvent.type === SyncEventType.ACTIVITY || syncEvent.type === SyncEventType.ERROR))
      .subscribe(
        (syncEvent: SyncEvent) => {
          expect(syncEvent.type).toEqual(SyncEventType.ACTIVITY);
          const activitySyncEvent = syncEvent as ActivitySyncEvent;
          expect(activitySyncEvent.isNew).toBe(true);
          expect(activitySyncEvent.activity.connector).toEqual("GARMIN");
          expect(activitySyncEvent.activity.startTime).toBeDefined();
          done();
        },
        error => {
          throw error;
        }
      );
  }, 30000);

  it("should skip syncing when the Garmin account is not linked", done => {
    // Given: no tokens persisted
    garminConnector = garminConnector.configure({
      syncFromDateTime: null,
      athleteModel: AthleteModel.DEFAULT_MODEL,
      userSettings: UserSettings.getDefaultsByBuildTarget(BuildTarget.DESKTOP),
      info: new GarminConnectorInfo(null, null, null)
    });

    spyOn(garminConnectClient, "isAuthenticated").and.returnValue(false);

    // When
    garminConnector.sync();

    // Then: the "not linked" error is delivered through the observable error channel
    garminConnector.syncEvents$.subscribe(
      () => {
        /* ignore next events */
      },
      (syncEvent: SyncEvent) => {
        expect(syncEvent.type).toEqual(SyncEventType.ERROR);
        expect((syncEvent as { description?: string }).description).toContain("not linked");
        done();
      }
    );
  }, 30000);

  it("should stop an incremental sync as soon as an already synced activity is reached", done => {
    // Given: incremental sync (a "sync from" date time is provided)
    garminConnector = garminConnector.configure({
      syncFromDateTime: Date.UTC(2019, 0, 1), // 2019 => activities below are all included
      athleteModel: AthleteModel.DEFAULT_MODEL,
      userSettings: UserSettings.getDefaultsByBuildTarget(BuildTarget.DESKTOP),
      info: new GarminConnectorInfo("runner@example.com", "oauth1", "oauth2", 0, "Runner")
    });

    const garminFitFixturePath = path.join(
      __dirname,
      "../file/fixtures/activities-02/runs/garmin_export/20171011_run_2088390344.fit"
    );

    // Three activities, most recent first. The two older ones already exist locally.
    const newerActivity = fakeGarminActivity(111, "New Run", "2020-01-03 10:00:00", 1578045600000);
    const middleActivity = fakeGarminActivity(222, "Already Synced Run", "2020-01-02 10:00:00", 1577959200000);
    const oldestActivity = fakeGarminActivity(333, "Oldest Run", "2020-01-01 10:00:00", 1577872800000);

    spyOn(garminConnectClient, "isAuthenticated").and.returnValue(true);
    spyOn(garminConnectClient, "listActivities").and.returnValue(
      Promise.resolve([newerActivity, middleActivity, oldestActivity])
    );

    // The two older activities already exist locally => findLocalActivities returns a match for them
    findLocalActivitiesSpy.and.callFake((startDate: string) => {
      const start = new Date(startDate).getTime();
      if (start === middleActivity.beginTimestamp || start === oldestActivity.beginTimestamp) {
        return Promise.resolve([{ id: "existing" } as Activity]);
      }
      return Promise.resolve(null);
    });

    const downloadSpy = spyOn(garminConnectClient, "downloadOriginalActivityData").and.returnValue(
      Promise.resolve("/tmp/111.zip")
    );
    spyOn(garminConnector as unknown as { extractFitFromZip: () => void }, "extractFitFromZip").and.returnValue(
      Promise.resolve(fs.existsSync(garminFitFixturePath) ? garminFitFixturePath : null)
    );

    // When
    garminConnector.sync();

    // Then: only the newest activity is downloaded; the already synced ones are skipped and stop the sync
    garminConnector.syncEvents$.subscribe(
      () => {
        /* ignore next events */
      },
      error => {
        throw error;
      },
      () => {
        expect(downloadSpy).toHaveBeenCalledTimes(1);
        expect(downloadSpy).toHaveBeenCalledWith(newerActivity.activityId, expect.any(String));
        done();
      }
    );
  }, 30000);

  it("should skip downloading an already synced activity on a full sync", done => {
    // Given: full sync (no "sync from" date time)
    const existingActivity = fakeGarminActivity(333, "Already Synced", "2020-01-01 10:00:00", 1577872800000);

    spyOn(garminConnectClient, "isAuthenticated").and.returnValue(true);
    spyOn(garminConnectClient, "listActivities").and.returnValue(Promise.resolve([existingActivity]));

    // The only activity already exists locally
    findLocalActivitiesSpy.and.returnValue(Promise.resolve([{ id: "existing" } as Activity]));

    const downloadSpy = spyOn(garminConnectClient, "downloadOriginalActivityData");

    // When
    garminConnector.sync();

    // Then: nothing is downloaded because the activity already exists
    garminConnector.syncEvents$.subscribe(
      () => {
        /* ignore next events */
      },
      error => {
        throw error;
      },
      () => {
        expect(downloadSpy).not.toHaveBeenCalled();
        done();
      }
    );
  }, 30000);
});
