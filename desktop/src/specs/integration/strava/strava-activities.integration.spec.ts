import { ReplaySubject } from "rxjs";
import { SyncEvent } from "@elevate/shared/sync/events/sync.event";
import { container } from "tsyringe";
import { AthleteSettings } from "@elevate/shared/models/athlete/athlete-settings/athlete-settings.model";
import { AthleteSnapshot } from "@elevate/shared/models/athlete/athlete-snapshot.model";
import { Gender } from "@elevate/shared/models/athlete/gender.enum";
import { AthleteModel } from "@elevate/shared/models/athlete/athlete.model";
import { DatedAthleteSettings } from "@elevate/shared/models/athlete/athlete-settings/dated-athlete-settings.model";
import {
  StravaActivity,
  StravaApiStreamType,
  StravaBareActivity,
  StravaConnector
} from "../../../connectors/strava/strava.connector";
import fs from "fs";
import { Streams } from "@elevate/shared/models/activity-data/streams.model";
import _ from "lodash";
import { StravaConnectorConfig } from "../../../connectors/connector-config.model";
import { UserSettings } from "@elevate/shared/models/user-settings/user-settings.namespace";
import { BuildTarget } from "@elevate/shared/enums/build-target.enum";
import { Activity } from "@elevate/shared/models/sync/activity.model";
import { ActivityComputeProcessor } from "../../../processors/activity-compute/activity-compute.processor";
import { ActivitySyncEvent } from "@elevate/shared/sync/events/activity-sync.event";
import { ElevateSport } from "@elevate/shared/enums/elevate-sport.enum";
import BaseUserSettings = UserSettings.BaseUserSettings;

describe("Strava activities integration tests", () => {
  function createStravaActivity(filePath: string): { activity: StravaActivity; streams: any } {
    return JSON.parse(fs.readFileSync(filePath, { encoding: "utf8", flag: "r" }));
  }

  function injectActivityForTesting(filePath: string): void {
    const stravaActivity = createStravaActivity(filePath);
    const stravaBareActivities: StravaBareActivity[] = [stravaActivity.activity];
    spyOn(stravaConnector, "getStravaBareActivityModels").and.returnValues(
      Promise.resolve(stravaBareActivities),
      Promise.resolve([]) // Stop sync
    );

    const streamTypes: StravaApiStreamType[] = [];
    const streamsKeys = _.keys(stravaActivity.streams);
    streamsKeys.forEach(key => {
      streamTypes.push({ type: key, data: stravaActivity.streams[key] } as StravaApiStreamType);
    });

    spyOn(stravaConnector, "fetchRemoteStravaStreams").and.returnValue(Promise.resolve(streamTypes));
    spyOn(stravaConnector, "fetchRemoteStravaActivity").and.returnValue(Promise.resolve(stravaActivity.activity));
  }

  function extractResultActivity(): Activity {
    const secondArg = syncEventsSpy.calls.all()[1].args[0];

    if (!(secondArg instanceof ActivitySyncEvent)) {
      console.error(secondArg);
      throw new Error(`Not an activity`);
    }

    return secondArg.activity;
  }

  let stravaConnectorConfig: StravaConnectorConfig;
  let stravaConnector: StravaConnector;
  let athleteSettings: AthleteSettings;
  let syncEvents$: ReplaySubject<SyncEvent>;
  let syncEventsSpy: jasmine.Spy;

  beforeEach(done => {
    stravaConnector = container.resolve(StravaConnector);
    syncEvents$ = new ReplaySubject<SyncEvent>();
    stravaConnector.syncEvents$ = syncEvents$;

    // Reset athlete settings to
    athleteSettings = AthleteSettings.DEFAULT_MODEL;
    athleteSettings.weight = 75;
    athleteSettings.maxHr = 195;
    athleteSettings.restHr = 65;
    athleteSettings.cyclingFtp = 210;
    athleteSettings.runningFtp = 275;
    athleteSettings.swimFtp = 31;

    const athleteSnapshotModel: AthleteSnapshot = new AthleteSnapshot(Gender.MEN, 30, athleteSettings);
    const athleteModel = new AthleteModel(Gender.MEN, [new DatedAthleteSettings(null, athleteSettings)]);

    stravaConnectorConfig = {
      syncFromDateTime: null,
      athleteModel: athleteModel,
      userSettings: UserSettings.getDefaultsByBuildTarget(BuildTarget.DESKTOP),
      info: {} as any
    };

    stravaConnector.configure(stravaConnectorConfig);

    spyOn(stravaConnector.athleteSnapshotResolver, "resolve").and.returnValue(athleteSnapshotModel);
    spyOn(stravaConnector, "findLocalActivities").and.returnValue(Promise.resolve(null));

    syncEventsSpy = spyOn(syncEvents$, "next").and.callThrough();

    // Activity computing: avoid worker use
    spyOn(stravaConnector, "computeActivity").and.callFake(
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

  it("should sync on virtual ride", done => {
    // Given
    injectActivityForTesting(`${__dirname}/fixtures/6271393008.json`);

    // When
    const promise = stravaConnector.syncPages(syncEvents$);

    // Then
    promise.then(() => {
      const activity = extractResultActivity();
      expect(activity.type).toEqual(ElevateSport.VirtualRide);
      expect(activity.stats.distance).toEqual(26733.8);
      done();
    });
  });

  it("should sync a manual activity", done => {
    // Given
    injectActivityForTesting(`${__dirname}/fixtures/5002496450.json`);

    // When
    const promise = stravaConnector.syncPages(syncEvents$);

    // Then
    promise.then(() => {
      const activity = extractResultActivity();
      expect(activity.type).toEqual(ElevateSport.Run);
      expect(activity.stats.distance).toEqual(3500);
      expect(activity.stats.elevationGain).toEqual(16);
      expect(activity.stats.movingTime).toEqual(1500);
      expect(activity.stats.elapsedTime).toEqual(1500);
      done();
    });
  });
});
