import { BuildTarget } from "@elevate/shared/enums/build-target.enum";
import { ElevateSport } from "@elevate/shared/enums/elevate-sport.enum";
import { AthleteModel } from "@elevate/shared/models/athlete/athlete.model";
import { Activity } from "@elevate/shared/models/sync/activity.model";
import { UserSettings } from "@elevate/shared/models/user-settings/user-settings.namespace";
import { ConnectorType } from "@elevate/shared/sync/connectors/connector-type.enum";
import { IntervalsIcuConnectorInfo } from "@elevate/shared/sync/connectors/intervals-icu-connector-info.model";
import { ActivitySyncEvent } from "@elevate/shared/sync/events/activity-sync.event";
import { ErrorSyncEvent } from "@elevate/shared/sync/events/error-sync.event";
import { SyncEventType } from "@elevate/shared/sync/events/sync-event-type";
import { SyncEvent } from "@elevate/shared/sync/events/sync.event";
import { AxiosError } from "axios";
import { filter } from "rxjs/operators";
import { container } from "tsyringe";
import { IntervalsIcuApiClient } from "../../clients/intervals-icu-api.client";
import { StatusCodes } from "../../enum/status-codes.enum";
import { IntervalsIcuConnectorConfig } from "../connector-config.model";
import { IntervalsIcuActivity, IntervalsIcuConnector, IntervalsIcuStream } from "./intervals-icu.connector";

const createIntervalsIcuActivity = (id: string, startDate: string, overrides: Partial<IntervalsIcuActivity> = {}) => {
  return {
    id: id,
    name: `Activity ${id}`,
    description: "Some notes",
    type: "Ride",
    source: "GARMIN_CONNECT",
    start_date: startDate,
    start_date_local: startDate,
    distance: 30000,
    moving_time: 3500,
    elapsed_time: 3600,
    total_elevation_gain: 250,
    trainer: false,
    commute: false,
    device_watts: true,
    device_name: "Garmin Edge 530",
    average_speed: 8.5,
    max_speed: 14,
    average_cadence: 85,
    average_heartrate: 140,
    max_heartrate: 175,
    calories: 800,
    ...overrides
  } as IntervalsIcuActivity;
};

const FAKE_STREAMS: IntervalsIcuStream[] = [
  { type: "time", name: "Time", data: [0, 1, 2, 3] },
  { type: "latlng", name: "Lat/Lng", data: [45.1, null, 45.3, 45.4], data2: [5.1, null, 5.3, 5.4] },
  { type: "distance", name: "Distance", data: [0, 8, 16, 24] },
  { type: "heartrate", name: "Heart Rate", data: [null, 120, null, 125] },
  { type: "watts", name: "Power", data: [200, 210, 220, 230] },
  { type: "torque", name: "Torque", data: [1, 2, 3, 4] }
];

describe("IntervalsIcuConnector", () => {
  let intervalsIcuConnector: IntervalsIcuConnector;
  let fetchRemoteActivitiesSpy: jasmine.Spy;
  let findLocalActivitiesSpy: jasmine.Spy;
  let computeActivitySpy: jasmine.Spy;

  beforeEach(done => {
    intervalsIcuConnector = container.resolve(IntervalsIcuConnector);

    const connectorConfig: IntervalsIcuConnectorConfig = {
      syncFromDateTime: null,
      athleteModel: AthleteModel.DEFAULT_MODEL,
      userSettings: UserSettings.getDefaultsByBuildTarget(BuildTarget.DESKTOP),
      info: new IntervalsIcuConnectorInfo("i12345", "fakeApiKey")
    };

    intervalsIcuConnector = intervalsIcuConnector.configure(connectorConfig);

    fetchRemoteActivitiesSpy = spyOn(intervalsIcuConnector, "fetchRemoteActivities").and.returnValue(
      Promise.resolve([
        createIntervalsIcuActivity("i3", "2024-03-03T08:00:00Z"),
        createIntervalsIcuActivity("i1", "2024-03-01T08:00:00Z", { type: "GravelRide" }),
        { id: "i2", start_date_local: "2024-03-02T08:00:00", source: "STRAVA", _note: "Not available" } as any
      ])
    );

    spyOn(intervalsIcuConnector, "fetchRemoteActivity").and.callFake((id: string) =>
      Promise.resolve(createIntervalsIcuActivity(id, "2024-03-01T08:00:00Z"))
    );
    spyOn(intervalsIcuConnector, "fetchRemoteStreams").and.returnValue(Promise.resolve(FAKE_STREAMS));

    findLocalActivitiesSpy = spyOn(intervalsIcuConnector, "findLocalActivities").and.returnValue(Promise.resolve(null));

    computeActivitySpy = spyOn(intervalsIcuConnector, "computeActivity").and.callFake((activity: Activity) =>
      Promise.resolve({ computedActivity: activity, deflatedStreams: null })
    );

    done();
  });

  describe("Api client", () => {
    it("should build basic auth header with API_KEY username", done => {
      const header = IntervalsIcuApiClient.authHeader("secret");
      expect(header).toEqual("Basic " + Buffer.from("API_KEY:secret").toString("base64"));
      done();
    });

    it("should reject unauthorized when credentials are missing", done => {
      const client = container.resolve(IntervalsIcuApiClient);
      client.get(new IntervalsIcuConnectorInfo(null, null), "https://intervals.icu/api/v1/whatever").then(
        () => done.fail("Should not resolve"),
        (errorSyncEvent: ErrorSyncEvent) => {
          expect(errorSyncEvent.code).toEqual(ErrorSyncEvent.INTERVALS_ICU_API_UNAUTHORIZED.code);
          done();
        }
      );
    });

    it("should map 404 to resource not found error", done => {
      const client = container.resolve(IntervalsIcuApiClient);
      spyOn(client.httpClient, "get").and.returnValue(
        Promise.reject({ response: { status: StatusCodes.NOT_FOUND, headers: {} } } as AxiosError)
      );
      client.get(new IntervalsIcuConnectorInfo("0", "key"), "https://intervals.icu/api/v1/activity/i1").then(
        () => done.fail("Should not resolve"),
        (errorSyncEvent: ErrorSyncEvent) => {
          expect(errorSyncEvent.code).toEqual(ErrorSyncEvent.INTERVALS_ICU_API_RESOURCE_NOT_FOUND.code);
          done();
        }
      );
    });

    it("should retry on too many requests", done => {
      const client = container.resolve(IntervalsIcuApiClient);
      spyOn(client, "sleep").and.returnValue(Promise.resolve());
      const getSpy = spyOn(client.httpClient, "get").and.returnValues(
        Promise.reject({ response: { status: StatusCodes.TOO_MANY_REQUESTS, headers: { "retry-after": "3" } } }),
        Promise.resolve({ data: { ok: true } } as any)
      );
      const onRetry = jasmine.createSpy("onRetry");

      client.get(new IntervalsIcuConnectorInfo("0", "key"), "https://intervals.icu/api/v1/x", onRetry).then(data => {
        expect(data).toEqual({ ok: true });
        expect(getSpy).toHaveBeenCalledTimes(2);
        expect(onRetry).toHaveBeenCalledWith(3000);
        done();
      }, done.fail);
    });
  });

  describe("Mappings", () => {
    it("should convert intervals.icu types to elevate sports", done => {
      expect(IntervalsIcuConnector.toElevateSport("Ride")).toEqual(ElevateSport.Ride);
      expect(IntervalsIcuConnector.toElevateSport("VirtualRun")).toEqual(ElevateSport.VirtualRun);
      expect(IntervalsIcuConnector.toElevateSport("GravelRide")).toEqual(ElevateSport.Ride);
      expect(IntervalsIcuConnector.toElevateSport("TrailRun")).toEqual(ElevateSport.Run);
      expect(IntervalsIcuConnector.toElevateSport("SomethingUnknown")).toEqual(ElevateSport.Other);
      expect(IntervalsIcuConnector.toElevateSport(null)).toEqual(ElevateSport.Other);
      done();
    });

    it("should map streams, zip latlng and fill gaps", done => {
      const streams = intervalsIcuConnector.mapStreams(FAKE_STREAMS);

      expect(streams.time).toEqual([0, 1, 2, 3]);
      expect(streams.latlng).toEqual([
        [45.1, 5.1],
        [45.1, 5.1],
        [45.3, 5.3],
        [45.4, 5.4]
      ]);
      expect(streams.heartrate).toEqual([120, 120, 120, 125]);
      expect(streams.watts).toEqual([200, 210, 220, 230]);
      expect((streams as any).torque).toBeUndefined();
      done();
    });

    it("should return null streams without time stream", done => {
      expect(intervalsIcuConnector.mapStreams([{ type: "watts", name: "Power", data: [1, 2] }])).toBeNull();
      expect(intervalsIcuConnector.mapStreams([])).toBeNull();
      done();
    });

    it("should prepare bare activity", done => {
      const bareActivity = intervalsIcuConnector.prepareBareActivity(
        createIntervalsIcuActivity("i9", "2024-03-01T08:00:00Z", { trainer: true, source: "MANUAL" })
      );

      expect(bareActivity.id).toEqual("i9");
      expect(bareActivity.type).toEqual(ElevateSport.Ride);
      expect(bareActivity.startTime).toEqual("2024-03-01T08:00:00.000Z");
      expect(bareActivity.endTime).toEqual("2024-03-01T09:00:00.000Z");
      expect(bareActivity.hasPowerMeter).toEqual(true);
      expect(bareActivity.trainer).toEqual(true);
      expect(bareActivity.manual).toEqual(true);
      done();
    });
  });

  describe("Sync", () => {
    it("should sync available activities from oldest to newest and skip unavailable ones", done => {
      const syncedActivities: Activity[] = [];

      intervalsIcuConnector
        .sync()
        .pipe(filter((syncEvent: SyncEvent) => syncEvent.type === SyncEventType.ACTIVITY))
        .subscribe(
          (activitySyncEvent: ActivitySyncEvent) => syncedActivities.push(activitySyncEvent.activity),
          error => done.fail(error),
          () => {
            expect(fetchRemoteActivitiesSpy).toHaveBeenCalledWith("1970-01-01", jasmine.any(String));
            expect(computeActivitySpy).toHaveBeenCalledTimes(2);
            expect(syncedActivities.map(activity => activity.extras.intervalsIcu.activityId)).toEqual(["i1", "i3"]);
            expect(syncedActivities[0].connector).toEqual(ConnectorType.INTERVALS_ICU);
            expect(syncedActivities[0].type).toEqual(ElevateSport.Ride);
            expect(syncedActivities[0].notes).toEqual("Some notes");
            expect(syncedActivities[0].srcStats.distance).toEqual(30000);
            done();
          }
        );
    });

    it("should update existing activity name and type", done => {
      const existingActivity = new Activity();
      existingActivity.id = "existing";
      existingActivity.name = "Old name";
      existingActivity.type = ElevateSport.Ride;
      existingActivity.extras = {};
      findLocalActivitiesSpy.and.returnValue(Promise.resolve([existingActivity]));

      const updated: ActivitySyncEvent[] = [];

      intervalsIcuConnector
        .sync()
        .pipe(filter((syncEvent: SyncEvent) => syncEvent.type === SyncEventType.ACTIVITY))
        .subscribe(
          (activitySyncEvent: ActivitySyncEvent) => updated.push(activitySyncEvent),
          error => done.fail(error),
          () => {
            expect(computeActivitySpy).not.toHaveBeenCalled();
            expect(updated.length).toEqual(2);
            expect(updated[0].isNew).toEqual(false);
            expect(updated[1].activity.name).toEqual("Activity i3");
            expect(updated[1].activity.extras.intervalsIcu.activityId).toEqual("i3");
            done();
          }
        );
    });

    it("should stop sync on unauthorized error", done => {
      fetchRemoteActivitiesSpy.and.returnValue(Promise.reject(ErrorSyncEvent.INTERVALS_ICU_API_UNAUTHORIZED.create()));

      intervalsIcuConnector.sync().subscribe(
        () => {},
        (errorSyncEvent: ErrorSyncEvent) => {
          expect(errorSyncEvent.code).toEqual(ErrorSyncEvent.INTERVALS_ICU_API_UNAUTHORIZED.code);
          expect(intervalsIcuConnector.isSyncing).toEqual(false);
          done();
        },
        () => done.fail("Should not complete")
      );
    });
  });
});
