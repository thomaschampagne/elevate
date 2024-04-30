import { FileConnector } from "../../../connectors/file/file.connector";
import { FileConnectorConfig } from "../../../connectors/connector-config.model";
import { container } from "tsyringe";
import { Subject } from "rxjs";
import path from "path";
import { SpecsUtils } from "../../specs-utils";
import { ActivityFile } from "../../../connectors/file/activity-file.model";
import { SportsLibProcessor } from "../../../processors/sports-lib.processor";
import { ActivityComputeProcessor } from "../../../processors/activity-compute/activity-compute.processor";
import _ from "lodash";
import { ElevateSport } from "@elevate/shared/enums/elevate-sport.enum";
import { BuildTarget } from "@elevate/shared/enums/build-target.enum";
import { ActivityFileType } from "@elevate/shared/sync/connectors/activity-file-type.enum";
import { UserSettings } from "@elevate/shared/models/user-settings/user-settings.namespace";
import { SyncEvent } from "@elevate/shared/sync/events/sync.event";
import {
  ProcessStreamMode,
  StreamProcessor,
  StreamProcessorParams
} from "@elevate/shared/sync/compute/stream-processor";
import { AthleteSettings } from "@elevate/shared/models/athlete/athlete-settings/athlete-settings.model";
import { Activity, ActivityFlag, ActivityStats, SlopeProfile } from "@elevate/shared/models/sync/activity.model";
import { Gender } from "@elevate/shared/models/athlete/gender.enum";
import { DatedAthleteSettings } from "@elevate/shared/models/athlete/athlete-settings/dated-athlete-settings.model";
import { AthleteModel } from "@elevate/shared/models/athlete/athlete.model";
import { ActivitySyncEvent } from "@elevate/shared/sync/events/activity-sync.event";
import { ActivityComputer } from "@elevate/shared/sync/compute/activity-computer";
import { AthleteSnapshot } from "@elevate/shared/models/athlete/athlete-snapshot.model";
import { Streams } from "@elevate/shared/models/activity-data/streams.model";
import { EmptyEventLibError } from "@thomaschampagne/sports-lib/lib/errors/empty-event-sports-libs.error";
import BaseUserSettings = UserSettings.BaseUserSettings;

describe("File activities integration tests", () => {
  function createActivityFile(filePath: string): ActivityFile {
    const type = path.extname(filePath).slice(1) as ActivityFileType;
    return new ActivityFile(type, filePath, null);
  }

  function injectActivityForTesting(filePath: string): void {
    const activityFiles: ActivityFile[] = [createActivityFile(filePath)];
    spyOn(fileConnector, "scanForActivities").and.returnValue(activityFiles);
  }

  function extractResultActivity(): Activity {
    const firstArg = syncEventsSpy.calls.mostRecent().args[0];

    if (!(firstArg instanceof ActivitySyncEvent)) {
      console.error(firstArg);
      throw new Error(`Not an activity`);
    }

    return firstArg.activity;
  }

  /**
   * Return computed stats only (without source stats merged into)
   */
  function extractComputedActivityStats(): ActivityStats {
    return applySourceStatsSpy.calls.mostRecent().args[2];
  }

  function extractActivityStreams(): Streams {
    return Streams.inflate(syncEventsSpy.calls.mostRecent().args[0].deflatedStreams);
  }

  let fileConnectorConfig: FileConnectorConfig;
  let fileConnector: FileConnector;
  let syncEvents$: Subject<SyncEvent>;
  let syncEventsSpy: jasmine.Spy;
  let applySourceStatsSpy: jasmine.Spy;
  let computeSportsLibEventSpy: jasmine.Spy;

  let athleteSettings: AthleteSettings;

  beforeEach(done => {
    syncEvents$ = new Subject<SyncEvent>();
    fileConnector = container.resolve(FileConnector);

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

    fileConnectorConfig = {
      syncFromDateTime: null,
      athleteModel: athleteModel,
      userSettings: UserSettings.getDefaultsByBuildTarget(BuildTarget.DESKTOP),
      info: { sourceDirectory: null } as any
    };
    fileConnector = fileConnector.configure(fileConnectorConfig);

    spyOn(fileConnector.athleteSnapshotResolver, "resolve").and.returnValue(athleteSnapshotModel);
    spyOn(fileConnector, "findLocalActivities").and.returnValue(Promise.resolve(null));
    spyOn(fileConnector.getFs(), "existsSync").and.returnValue(true);

    syncEventsSpy = spyOn(syncEvents$, "next").and.callThrough();
    applySourceStatsSpy = spyOn(Activity, "applySourceStats").and.callThrough();

    // Avoid worker use for sports-lib computation. Do it directly
    computeSportsLibEventSpy = spyOn(fileConnector, "computeSportsLibEvent").and.callFake(
      (activityFile: ActivityFile) => {
        return SportsLibProcessor.getEvent(activityFile.location.path);
      }
    );

    // Same for activity computing: avoid worker use
    spyOn(fileConnector, "computeActivity").and.callFake(
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

  /* it("Debug activity file", done => {
    // Given
    injectActivityForTesting("/path/to/file/to/debug");

    // When
    const promise = fileConnector.syncFiles(syncEvents$);

    // Then
    promise.then(() => {
      const activity = extractResultActivity();
      expect(activity.stats.scores.runPerfIndex).toBeCloseTo(63);
      done();
    });
  });*/

  describe("Activity parsing", () => {
    describe("Cycling", () => {
      it("should sync on Alpes d'Huez (fit)", done => {
        // Given https://connect.garmin.com/modern/activity/828989227 OR https://www.strava.com/activities/343080886
        const filePath = `${__dirname}/fixtures/cycling/huez.fit`;
        injectActivityForTesting(filePath);
        athleteSettings.weight = 72; // Kg

        // When
        const promise = fileConnector.syncFiles(syncEvents$);

        // Then
        promise.then(() => {
          // (1) Test the computed stats only (no src stats applied)
          const computedStats = extractComputedActivityStats();
          expect(computedStats.speed.avg).toBeCloseTo(26.4, 1);
          expect(computedStats.distance).toBeCloseTo(141930, 0);
          SpecsUtils.assertEqualTime(computedStats.movingTime, "05:22:21");
          SpecsUtils.assertEqualTime(computedStats.elapsedTime, "06:07:13");
          SpecsUtils.assertNearEqual(computedStats.elevationGain, 2052);
          SpecsUtils.assertNearEqual(computedStats.elevation.ascent, 2052);
          SpecsUtils.assertNearEqual(computedStats.elevation.descent, 2036);
          SpecsUtils.assertNearEqual(computedStats.calories, 3204);
          SpecsUtils.assertNearEqual(computedStats.caloriesPerHour, 524);

          // Scores
          SpecsUtils.assertNearEqual(computedStats.scores.stress.trimp, 445);
          SpecsUtils.assertNearEqual(computedStats.scores.stress.trimpPerHour, 83);
          SpecsUtils.assertNearEqual(computedStats.scores.stress.hrss, 267);
          SpecsUtils.assertNearEqual(computedStats.scores.stress.hrssPerHour, 51);
          SpecsUtils.assertNearEqual(computedStats.scores.stress.pss, 527);
          SpecsUtils.assertNearEqual(computedStats.scores.stress.pssPerHour, 98);
          expect(computedStats.scores.stress.sss).toBeNull();
          expect(computedStats.scores.stress.sssPerHour).toBeNull();

          // Speed
          SpecsUtils.assertNearEqual(computedStats.speed.avg, 26.4, 1);
          SpecsUtils.assertNearEqual(computedStats.speed.max, 67.8, 1);
          SpecsUtils.assertNearEqual(computedStats.speed.best20min, 43);
          SpecsUtils.assertNearEqual(computedStats.speed.lowQ, 13.1, 1);
          SpecsUtils.assertNearEqual(computedStats.speed.median, 25.8, 1);
          SpecsUtils.assertNearEqual(computedStats.speed.upperQ, 35.1, 1);
          SpecsUtils.assertNearEqual(computedStats.speed.stdDev, 13.3, 1);

          // Heart-rate
          expect(computedStats.heartRate.avg).toEqual(148);
          expect(computedStats.heartRate.max).toEqual(174);
          SpecsUtils.assertNearEqual(computedStats.heartRate.avgReserve, 63.7, 1);
          SpecsUtils.assertNearEqual(computedStats.heartRate.maxReserve, 83.8, 1);
          SpecsUtils.assertNearEqual(computedStats.heartRate.best20min, 165);
          SpecsUtils.assertNearEqual(computedStats.heartRate.best60min, 160);
          SpecsUtils.assertNearEqual(computedStats.heartRate.stdDev, 14);
          SpecsUtils.assertNearEqual(computedStats.heartRate.lowQ, 142);
          SpecsUtils.assertNearEqual(computedStats.heartRate.median, 151);
          SpecsUtils.assertNearEqual(computedStats.heartRate.upperQ, 156);

          // Power
          SpecsUtils.assertNearEqual(computedStats.power.avg, 168);
          SpecsUtils.assertNearEqual(computedStats.power.avgKg, 2.3, 2);
          SpecsUtils.assertNearEqual(computedStats.power.weighted, 208);
          SpecsUtils.assertNearEqual(computedStats.power.weightedKg, 2.89, 2);
          SpecsUtils.assertNearEqual(computedStats.power.best20min, 264);
          SpecsUtils.assertNearEqual(computedStats.power.lowQ, 120);
          SpecsUtils.assertNearEqual(computedStats.power.median, 193);
          SpecsUtils.assertNearEqual(computedStats.power.upperQ, 227);
          SpecsUtils.assertNearEqual(computedStats.power.max, 641);
          SpecsUtils.assertNearEqual(computedStats.power.intensityFactor, 0.99, 2);
          SpecsUtils.assertNearEqual(computedStats.power.variabilityIndex, 1.26, 2);

          // Cadence
          SpecsUtils.assertNearEqual(computedStats.cadence.avg, 67);
          SpecsUtils.assertNearEqual(computedStats.cadence.avgActive, 78);
          SpecsUtils.assertNearEqual(computedStats.cadence.activeRatio, 0.9);
          SpecsUtils.assertNearEqual(computedStats.cadence.max, 118);
          SpecsUtils.assertNearEqualTime(computedStats.cadence.activeTime, "04:46:38");
          SpecsUtils.assertNearEqual(computedStats.cadence.slope.up, 72);
          SpecsUtils.assertNearEqual(computedStats.cadence.slope.flat, 83);
          SpecsUtils.assertNearEqual(computedStats.cadence.slope.down, 88);
          SpecsUtils.assertNearEqual(computedStats.cadence.stdDev, 14);
          SpecsUtils.assertNearEqual(computedStats.cadence.cycles, 22337);
          SpecsUtils.assertNearEqual(computedStats.cadence.distPerCycle, 6.35, 2);
          SpecsUtils.assertNearEqual(computedStats.cadence.median, 81);
          SpecsUtils.assertNearEqual(computedStats.cadence.lowQ, 69);
          SpecsUtils.assertNearEqual(computedStats.cadence.upperQ, 89);

          // Grade
          SpecsUtils.assertNearEqual(computedStats.grade.avg, 1.6, 1);
          SpecsUtils.assertNearEqual(computedStats.grade.max, 12.1, 1);
          SpecsUtils.assertNearEqual(computedStats.grade.min, -12);
          SpecsUtils.assertNearEqual(computedStats.grade.lowQ, -1);
          SpecsUtils.assertNearEqual(computedStats.grade.stdDev, 5);
          SpecsUtils.assertNearEqual(computedStats.grade.median, 1);
          SpecsUtils.assertNearEqual(computedStats.grade.upperQ, 4);
          SpecsUtils.assertNearEqual(computedStats.grade.slopeDistance.down, 44841, 1);
          SpecsUtils.assertNearEqual(computedStats.grade.slopeDistance.flat, 59600.5, 1);
          SpecsUtils.assertNearEqual(computedStats.grade.slopeDistance.up, 41768.5, 1);
          SpecsUtils.assertNearEqual(computedStats.grade.slopeSpeed.down, 41.9, 1);
          SpecsUtils.assertNearEqual(computedStats.grade.slopeSpeed.flat, 31.2, 1);
          SpecsUtils.assertNearEqual(computedStats.grade.slopeSpeed.up, 15.6, 1);
          expect(computedStats.grade.slopeProfile).toEqual(SlopeProfile.HILLY);

          // Elevation
          SpecsUtils.assertNearEqual(computedStats.elevation.ascent, 2052);
          SpecsUtils.assertNearEqual(computedStats.elevation.descent, 2025);
          SpecsUtils.assertNearEqual(computedStats.elevation.avg, 760);
          SpecsUtils.assertNearEqual(computedStats.elevation.max, 1806);
          SpecsUtils.assertNearEqual(computedStats.elevation.min, 213);
          SpecsUtils.assertNearEqual(computedStats.elevation.lowQ, 339);
          SpecsUtils.assertNearEqual(computedStats.elevation.stdDev, 486);
          SpecsUtils.assertNearEqual(computedStats.elevation.median, 644);
          SpecsUtils.assertNearEqual(computedStats.elevation.upperQ, 1161);
          SpecsUtils.assertNearEqual(computedStats.elevation.ascentSpeed, 575);

          // (2) Test final activity returned
          const activity = extractResultActivity();

          expect(activity.type).toEqual(ElevateSport.Ride);
          expect(activity.hash).toEqual("9760427c9097d17c2af934c8");
          expect(activity.startTime).toEqual("2015-07-10T08:58:32.000Z");
          expect(activity.endTime).toEqual("2015-07-10T15:05:48.000Z");
          expect(activity.trainer).toBeFalsy();
          expect(activity.hasPowerMeter).toBeFalsy();
          expect(activity.creationTime).toBeDefined();
          expect(activity.lastEditTime).toBeDefined();
          expect(activity.autoDetectedType).toBeFalsy();
          expect(activity.hasPowerMeter).toBeFalsy();
          expect(activity.extras.file.path).toEqual(filePath);
          expect(activity.extras.file.type).toEqual(ActivityFileType.FIT);

          SpecsUtils.assertNearEqual(activity.latLngCenter[0], 45.128159, 5);
          SpecsUtils.assertNearEqual(activity.latLngCenter[1], 5.9212365, 5);

          // Test activity file source stats
          expect(activity.srcStats.distance).toEqual(141944.2);
          expect(activity.srcStats.elevationGain).toEqual(2052);
          expect(activity.srcStats.calories).toEqual(2629);
          expect(activity.srcStats.speed.avg).toEqual(25.988);
          expect(activity.srcStats.caloriesPerHour).toBeCloseTo(429.6, 1);
          SpecsUtils.assertEqualTime(activity.srcStats.movingTime, "05:27:44");
          SpecsUtils.assertEqualTime(activity.srcStats.elapsedTime, "06:07:08");
          expect(activity.srcStats.dynamics).toBeUndefined();

          done();
        });
      });

      it("should sync on brevet 200k (fit)", done => {
        // Given https://connect.garmin.com/modern/activity/568251524 OR https://www.strava.com/activities/181999714
        injectActivityForTesting(`${__dirname}/fixtures/cycling/brevet-200k.fit`);
        athleteSettings.weight = 70; // Kg

        // When
        const promise = fileConnector.syncFiles(syncEvents$);

        // Then
        promise.then(() => {
          const computedStats = extractComputedActivityStats();
          SpecsUtils.assertNearEqual(computedStats.speed.avg, 27);
          SpecsUtils.assertEqualTime(computedStats.movingTime, "07:39:39");
          SpecsUtils.assertEqualTime(computedStats.elapsedTime, "08:27:17");
          SpecsUtils.assertNearEqual(computedStats.elevationGain, 1955);
          SpecsUtils.assertNearEqual(computedStats.cadence.slope.up, 71);
          SpecsUtils.assertNearEqual(computedStats.cadence.slope.flat, 79);
          SpecsUtils.assertNearEqual(computedStats.cadence.slope.down, 89);
          SpecsUtils.assertNearEqual(computedStats.power.avg, 152);
          SpecsUtils.assertNearEqual(computedStats.power.max, 549);
          SpecsUtils.assertNearEqual(computedStats.grade.slopeSpeed.down, 40.4, 1);
          SpecsUtils.assertNearEqual(computedStats.grade.slopeSpeed.up, 17, 1);

          const activity = extractResultActivity();
          expect(activity.srcStats.elevationGain).toEqual(2068);
          expect(activity.srcStats.speed.avg).toBeCloseTo(27, 0);
          SpecsUtils.assertEqualTime(activity.srcStats.movingTime, "07:34:49");
          SpecsUtils.assertEqualTime(activity.srcStats.elapsedTime, "08:27:11");

          done();
        });
      });

      it("should sync on First Power Ride (fit)", done => {
        // Given https://connect.garmin.com/modern/activity/7432332116 OR https://www.strava.com/activities/5910143591 (FTP 201 w @ Weight 78.3 kg)
        injectActivityForTesting(`${__dirname}/fixtures/cycling/first-power-ride.fit`);
        athleteSettings.weight = 78;

        // When
        const promise = fileConnector.syncFiles(syncEvents$);

        // Then
        promise.then(() => {
          const computedStats = extractComputedActivityStats();
          SpecsUtils.assertNearEqual(computedStats.speed.avg, 25);
          SpecsUtils.assertEqualTime(computedStats.movingTime, "02:47:38");
          SpecsUtils.assertEqualTime(computedStats.elapsedTime, "02:54:13");
          SpecsUtils.assertNearEqual(computedStats.elevationGain, 669);
          SpecsUtils.assertNearEqual(computedStats.elevation.descent, 637);
          SpecsUtils.assertNearEqual(computedStats.elevation.ascentSpeed, 403);
          SpecsUtils.assertNearEqual(computedStats.calories, 1525);

          SpecsUtils.assertNearEqual(computedStats.heartRate.avg, 165);
          SpecsUtils.assertNearEqual(computedStats.heartRate.max, 184);

          SpecsUtils.assertNearEqual(computedStats.grade.max, 10.9, 1);
          SpecsUtils.assertNearEqual(computedStats.grade.min, -12);

          SpecsUtils.assertNearEqual(computedStats.power.avg, 152);
          SpecsUtils.assertNearEqual(computedStats.power.weighted, 172);
          SpecsUtils.assertNearEqual(computedStats.power.best20min, 201);
          SpecsUtils.assertNearEqual(computedStats.power.max, 564);
          expect(computedStats.power.work).toEqual(1525);

          const activity = extractResultActivity();
          SpecsUtils.assertNearEqual(activity.srcStats.elevationGain, 626);
          SpecsUtils.assertEqualTime(activity.srcStats.movingTime, "02:47:36");
          SpecsUtils.assertEqualTime(activity.srcStats.elapsedTime, "02:54:13");
          expect(activity.srcStats.speed.avg).toEqual(25.261);
          expect(activity.srcStats.calories).toEqual(1532);
          expect(activity.srcStats.power.work).toEqual(1533);
          expect(activity.hasPowerMeter).toBeTruthy();
          done();
        });
      });

      it("should sync on Pinet (fit)", done => {
        // Given https://connect.garmin.com/modern/activity/7298789718 OR https://www.strava.com/activities/5787142695
        injectActivityForTesting(`${__dirname}/fixtures/cycling/pinet.fit`);

        // When
        const promise = fileConnector.syncFiles(syncEvents$);

        // Then
        promise.then(() => {
          const computedStats = extractComputedActivityStats();
          SpecsUtils.assertNearEqual(computedStats.grade.max, 12.2, 1);
          SpecsUtils.assertNearEqual(computedStats.grade.min, -11);
          done();
        });
      });

      it("should sync on Mini Enduro (fit)", done => {
        // Given https://connect.garmin.com/modern/activity/542979416 OR https://www.strava.com/activities/166829840
        injectActivityForTesting(`${__dirname}/fixtures/cycling/mini-enduro.fit`);

        // When
        const promise = fileConnector.syncFiles(syncEvents$);

        // Then
        promise.then(() => {
          const computedStats = extractComputedActivityStats();
          SpecsUtils.assertNearEqual(computedStats.speed.avg, 16);
          SpecsUtils.assertEqualTime(computedStats.movingTime, "01:35:35");
          SpecsUtils.assertEqualTime(computedStats.elapsedTime, "03:05:14");
          SpecsUtils.assertNearEqual(computedStats.elevationGain, 315);
          SpecsUtils.assertNearEqual(computedStats.elevation.descent, 396);

          const activity = extractResultActivity();
          SpecsUtils.assertNearEqual(activity.srcStats.elevationGain, 332);
          SpecsUtils.assertEqualTime(activity.srcStats.movingTime, "01:30:16");
          SpecsUtils.assertEqualTime(activity.srcStats.elapsedTime, "03:05:11");
          expect(activity.srcStats.speed.avg).toEqual(18.382);
          done();
        });
      });

      it("should sync on Lac de Monteynard, 145k (fit)", done => {
        // Given FIT Source: https://connect.garmin.com/modern/activity/614953343 OR https://www.strava.com/activities/208748758
        injectActivityForTesting(`${__dirname}/fixtures/cycling/mont-eynard.fit`);
        athleteSettings.weight = 70;

        // When
        const promise = fileConnector.syncFiles(syncEvents$);

        // Then
        promise.then(() => {
          const computedStats = extractComputedActivityStats();
          SpecsUtils.assertNearEqual(computedStats.speed.avg, 24.4);
          SpecsUtils.assertEqualTime(computedStats.movingTime, "05:40:38");
          SpecsUtils.assertEqualTime(computedStats.elapsedTime, "07:04:40");
          SpecsUtils.assertNearEqual(computedStats.elevationGain, 1752);
          SpecsUtils.assertNearEqual(computedStats.elevation.descent, 1770);
          SpecsUtils.assertNearEqual(computedStats.calories, 2902);
          SpecsUtils.assertNearEqual(computedStats.power.avg, 142);
          SpecsUtils.assertNearEqual(computedStats.power.max, 612);
          SpecsUtils.assertNearEqual(computedStats.cadence.avg, 63);
          SpecsUtils.assertNearEqual(computedStats.cadence.avgActive, 75);
          SpecsUtils.assertNearEqual(computedStats.cadence.slope.up, 73);
          SpecsUtils.assertNearEqual(computedStats.cadence.slope.flat, 76);
          SpecsUtils.assertNearEqual(computedStats.cadence.slope.down, 84);

          const activity = extractResultActivity();
          expect(activity.srcStats.speed.avg).toBeCloseTo(24.4, 1);
          expect(activity.srcStats.elevationGain).toEqual(1830);
          SpecsUtils.assertEqualTime(activity.srcStats.movingTime, "05:54:34");
          SpecsUtils.assertEqualTime(activity.srcStats.elapsedTime, "07:04:31");
          expect(activity.srcStats.calories).toEqual(2798);

          done();
        });
      });

      it("should sync on Frozen feet (fit)", done => {
        // Given https://connect.garmin.com/modern/activity/1131205197 OR  https://www.strava.com/activities/549238663
        injectActivityForTesting(`${__dirname}/fixtures/cycling/frozen.fit`);
        athleteSettings.weight = 73; // Kg

        // When
        const promise = fileConnector.syncFiles(syncEvents$);

        // Then
        promise.then(() => {
          const computedStats = extractComputedActivityStats();
          SpecsUtils.assertNearEqual(computedStats.speed.avg, 28.6);
          SpecsUtils.assertEqualTime(computedStats.movingTime, "04:17:57");
          SpecsUtils.assertEqualTime(computedStats.elapsedTime, "04:56:21");
          SpecsUtils.assertNearEqual(computedStats.elevationGain, 534);
          SpecsUtils.assertNearEqual(computedStats.power.avg, 139);
          SpecsUtils.assertNearEqual(computedStats.power.max, 830);

          const activity = extractResultActivity();
          expect(activity.srcStats.speed.avg).toBeCloseTo(28.6, 1);
          SpecsUtils.assertNearEqual(activity.srcStats.elevationGain, 505);
          SpecsUtils.assertEqualTime(activity.srcStats.movingTime, "04:17:11");
          SpecsUtils.assertEqualTime(activity.srcStats.elapsedTime, "04:56:18");
          done();
        });
      });

      it("should sync on Biking Trainer (fit)", done => {
        // Given https://connect.garmin.com/modern/activity/7494731788 OR https://www.strava.com/activities/5965425170
        injectActivityForTesting(`${__dirname}/fixtures/cycling/biking-500-trainer.fit`);

        // When
        const promise = fileConnector.syncFiles(syncEvents$);

        // Then
        promise.then(() => {
          const activity = extractResultActivity();
          expect(activity.trainer).toBeTruthy();
          expect(activity.hasPowerMeter).toBeFalsy();
          expect(activity.stats.power).toBeNull(); // No power stats expected because trainer + no-power-meter
          done();
        });
      });

      it("should sync on Mini Zwift & Pschitt (fit)", done => {
        // Given https://connect.garmin.com/modern/activity/3451492997 OR https://www.strava.com/activities/2204692225
        injectActivityForTesting(`${__dirname}/fixtures/cycling/zwift-pschit.fit`);

        // When
        const promise = fileConnector.syncFiles(syncEvents$);

        // Then
        promise.then(() => {
          const activity = extractResultActivity();
          expect(activity.trainer).toBeTruthy();
          expect(activity.stats.power.avg).toBeDefined();

          done();
        });
      });

      it("should sync on Brasilia (fit)", done => {
        // Given FIT Source: https://connect.garmin.com/modern/activity/7386755164 OR https://www.strava.com/activities/5952147686
        injectActivityForTesting(`${__dirname}/fixtures/cycling/brasilia.fit`);

        // When
        const promise = fileConnector.syncFiles(syncEvents$);

        // Then
        promise.then(() => {
          const computedStats = extractComputedActivityStats();
          expect(computedStats.power.work).toEqual(830);

          const activity = extractResultActivity();
          expect(activity.hasPowerMeter).toBeTruthy();
          expect(activity.trainer).toBeFalsy();
          expect(activity.srcStats.power.work).toEqual(832);
          expect(activity.srcStats.dynamics.cycling.balance.left).toEqual(51.45);
          expect(activity.srcStats.dynamics.cycling.balance.right).toEqual(48.55);
          expect(activity.srcStats.dynamics.cycling.torqueEffectiveness.left).toEqual(80);
          expect(activity.srcStats.dynamics.cycling.torqueEffectiveness.right).toEqual(76.5);
          expect(activity.srcStats.dynamics.cycling.pedalSmoothness.left).toEqual(22);
          expect(activity.srcStats.dynamics.cycling.pedalSmoothness.right).toEqual(20.5);
          SpecsUtils.assertEqualTime(activity.srcStats.dynamics.cycling.standingTime, "17:53");
          SpecsUtils.assertEqualTime(activity.srcStats.dynamics.cycling.seatedTime, "01:25:02");

          expect(activity.srcStats.scores.stress.trainingEffect.aerobic).toEqual(3.2);
          expect(activity.srcStats.scores.stress.trainingEffect.anaerobic).toEqual(2.3);

          done();
        });
      });
    });

    describe("Running", () => {
      it("should sync Sloatsburg (GENUINE_GAP: strava @ 04:58/km) (fit)", done => {
        // Given: https://connect.garmin.com/modern/activity/6782987395 OR https://www.strava.com/activities/2451375851
        injectActivityForTesting(`${__dirname}/fixtures/running/sloatsburg.fit`);
        athleteSettings.weight = 67.5;
        athleteSettings.runningFtp = 300; // 5:00/km

        // When
        const promise = fileConnector.syncFiles(syncEvents$);

        // Then
        promise.then(() => {
          const computedStats = extractComputedActivityStats();
          SpecsUtils.assertEqualTime(computedStats.pace.avg, "05:56");
          SpecsUtils.assertEqualTime(computedStats.pace.gapAvg, "05:12");
          expect(computedStats.pace.gapAvg).toBeLessThanOrEqual(computedStats.pace.avg);
          SpecsUtils.assertNearEqual(computedStats.elevationGain, 363);
          SpecsUtils.assertNearEqual(computedStats.elevation.descent, 386);
          SpecsUtils.assertNearEqual(computedStats.calories, 1090);
          SpecsUtils.assertNearEqual(computedStats.caloriesPerHour, 787);

          // Scores
          SpecsUtils.assertNearEqual(computedStats.scores.runningRating, 72.5, 1);
          SpecsUtils.assertNearEqual(computedStats.scores.stress.hrss, 51.3, 1);

          // Heart rate
          expect(computedStats.heartRate.avg).toEqual(137);
          expect(computedStats.heartRate.max).toEqual(166);
          SpecsUtils.assertNearEqual(computedStats.heartRate.avgReserve, 55.5, 1);
          SpecsUtils.assertNearEqual(computedStats.heartRate.maxReserve, 77.7, 1);
          SpecsUtils.assertNearEqual(computedStats.heartRate.best20min, 148);
          SpecsUtils.assertNearEqual(computedStats.heartRate.best60min, 138);
          SpecsUtils.assertNearEqual(computedStats.heartRate.stdDev, 15);
          SpecsUtils.assertNearEqual(computedStats.heartRate.lowQ, 129);
          SpecsUtils.assertNearEqual(computedStats.heartRate.median, 140);
          SpecsUtils.assertNearEqual(computedStats.heartRate.upperQ, 149);

          // Cadence
          SpecsUtils.assertNearEqual(computedStats.cadence.avg, 80);
          SpecsUtils.assertNearEqual(computedStats.cadence.avgActive, 85);
          SpecsUtils.assertNearEqual(computedStats.cadence.max, 106);
          SpecsUtils.assertNearEqual(computedStats.cadence.slope.up, 83);
          SpecsUtils.assertNearEqual(computedStats.cadence.slope.flat, 88);
          SpecsUtils.assertNearEqual(computedStats.cadence.slope.down, 84);

          // Grade
          SpecsUtils.assertNearEqual(computedStats.grade.avg, 1, 1);
          SpecsUtils.assertNearEqual(computedStats.grade.max, 44.1, 1);
          SpecsUtils.assertNearEqual(computedStats.grade.min, -31);
          SpecsUtils.assertNearEqual(computedStats.grade.lowQ, -3);
          SpecsUtils.assertNearEqual(computedStats.grade.stdDev, 12);
          SpecsUtils.assertNearEqual(computedStats.grade.median, 0);
          SpecsUtils.assertNearEqual(computedStats.grade.upperQ, 4);
          SpecsUtils.assertNearEqual(computedStats.grade.slopeDistance.down, 4526, 1);
          SpecsUtils.assertNearEqual(computedStats.grade.slopeDistance.flat, 4917, 1);
          SpecsUtils.assertNearEqual(computedStats.grade.slopeDistance.up, 4577, 1);
          SpecsUtils.assertNearEqual(computedStats.grade.slopeSpeed.down, 9.5, 1);
          SpecsUtils.assertNearEqual(computedStats.grade.slopeSpeed.flat, 12.1, 1);
          SpecsUtils.assertNearEqual(computedStats.grade.slopeSpeed.up, 9, 1);
          expect(computedStats.grade.slopeProfile).toEqual(SlopeProfile.HILLY);

          // Power
          SpecsUtils.assertNearEqual(computedStats.power.avg, 219);
          SpecsUtils.assertNearEqual(computedStats.power.avgKg, 3.24);
          SpecsUtils.assertNearEqual(computedStats.power.weighted, 242);
          SpecsUtils.assertNearEqual(computedStats.power.weightedKg, 3.6);
          SpecsUtils.assertNearEqual(computedStats.power.max, 407);
          SpecsUtils.assertNearEqual(computedStats.power.stdDev, 77.5);
          SpecsUtils.assertNearEqual(computedStats.power.variabilityIndex, 1.106);
          expect(computedStats.power.intensityFactor).toBeNull();

          // Elevation
          SpecsUtils.assertNearEqual(computedStats.elevation.ascent, 363);
          SpecsUtils.assertNearEqual(computedStats.elevation.descent, 386);
          SpecsUtils.assertNearEqual(computedStats.elevation.avg, 195);
          SpecsUtils.assertNearEqual(computedStats.elevation.max, 320);
          SpecsUtils.assertNearEqual(computedStats.elevation.min, 116);
          SpecsUtils.assertNearEqual(computedStats.elevation.stdDev, 71);
          SpecsUtils.assertNearEqual(computedStats.elevation.lowQ, 134);
          SpecsUtils.assertNearEqual(computedStats.elevation.median, 152);
          SpecsUtils.assertNearEqual(computedStats.elevation.upperQ, 277);
          SpecsUtils.assertNearEqual(computedStats.elevation.ascentSpeed, 647);

          const activity = extractResultActivity();

          SpecsUtils.assertNearEqual(activity.srcStats.elevationGain, 347);
          SpecsUtils.assertEqualTime(activity.srcStats.pace.avg, "05:56");
          SpecsUtils.assertEqualTime(activity.srcStats.pace.gapAvg, "05:16");
          SpecsUtils.assertEqualTime(activity.srcStats.movingTime, "01:19:45");
          SpecsUtils.assertEqualTime(activity.srcStats.elapsedTime, "01:23:09");
          expect(computedStats.pace.gapAvg).toBeLessThanOrEqual(activity.srcStats.pace.avg);
          expect(activity.hash).toEqual("38e0ba715e9eedfefdb37754");
          done();
        });
      });

      it("should sync Sloatsburg (GENUINE_GAP: strava @ 04:58/km) (tcx)", done => {
        // Given TCX Source: https://connect.garmin.com/modern/activity/6851149716 OR  https://www.strava.com/activities/5366592367
        injectActivityForTesting(`${__dirname}/fixtures/running/sloatsburg.tcx`);

        // When
        const promise = fileConnector.syncFiles(syncEvents$);

        // Then
        promise.then(() => {
          const computedStats = extractComputedActivityStats();
          SpecsUtils.assertEqualTime(computedStats.pace.avg, "05:56");
          SpecsUtils.assertEqualTime(computedStats.pace.gapAvg, "05:12");
          expect(computedStats.pace.gapAvg).toBeLessThanOrEqual(computedStats.pace.avg);
          SpecsUtils.assertNearEqual(computedStats.elevationGain, 363);

          const activity = extractResultActivity();

          SpecsUtils.assertNearEqual(activity.srcStats.elevationGain, 363);
          SpecsUtils.assertEqualTime(activity.srcStats.pace.avg, "05:41");
          SpecsUtils.assertEqualTime(activity.srcStats.pace.gapAvg, "05:16");
          SpecsUtils.assertEqualTime(activity.srcStats.movingTime, "01:19:46");
          SpecsUtils.assertEqualTime(activity.srcStats.elapsedTime, "01:23:09");
          expect(computedStats.pace.gapAvg).toBeLessThanOrEqual(activity.srcStats.pace.avg);

          done();
        });
      });

      it("should sync Pyselsky (GENUINE_GAP: strava @ 06:38/km) (fit)", done => {
        // Given: https://connect.garmin.com/modern/activity/6916728382 OR https://www.strava.com/activities/3101609393
        injectActivityForTesting(`${__dirname}/fixtures/running/pyselsky.fit`);

        // When
        const promise = fileConnector.syncFiles(syncEvents$);

        // Then
        promise.then(() => {
          const computedStats = extractComputedActivityStats();
          SpecsUtils.assertEqualTime(computedStats.pace.avg, "07:28");
          SpecsUtils.assertEqualTime(computedStats.pace.gapAvg, "06:56");
          expect(computedStats.pace.gapAvg).toBeLessThanOrEqual(computedStats.pace.avg);
          SpecsUtils.assertEqualTime(computedStats.movingTime, "02:40:32");
          SpecsUtils.assertEqualTime(computedStats.elapsedTime, "02:41:39");
          SpecsUtils.assertNearEqual(computedStats.elevationGain, 524);
          SpecsUtils.assertNearEqual(computedStats.elevation.descent, 504);

          const activity = extractResultActivity();
          SpecsUtils.assertNearEqual(activity.srcStats.elevationGain, 539);
          SpecsUtils.assertEqualTime(activity.srcStats.pace.avg, "07:31");
          SpecsUtils.assertEqualTime(activity.srcStats.pace.gapAvg, "06:57");
          SpecsUtils.assertEqualTime(activity.srcStats.movingTime, "02:40:09");
          SpecsUtils.assertEqualTime(activity.srcStats.elapsedTime, "02:41:39");
          expect(computedStats.pace.gapAvg).toBeLessThanOrEqual(activity.srcStats.pace.avg);

          done();
        });
      });

      it("should sync Loup Blanc (GENUINE_GAP: strava @ 05:31/km) (fit)", done => {
        // Given: https://connect.garmin.com/modern/activity/7428153946 OR https://www.strava.com/activities/5889573727
        injectActivityForTesting(`${__dirname}/fixtures/running/loup-blanc.fit`);

        // When
        const promise = fileConnector.syncFiles(syncEvents$);

        // Then
        promise.then(() => {
          const computedStats = extractComputedActivityStats();
          SpecsUtils.assertEqualTime(computedStats.pace.avg, "07:53");
          SpecsUtils.assertEqualTime(computedStats.pace.gapAvg, "05:42");
          expect(computedStats.pace.gapAvg).toBeLessThanOrEqual(computedStats.pace.avg);
          SpecsUtils.assertEqualTime(computedStats.movingTime, "04:51:33");
          SpecsUtils.assertEqualTime(computedStats.elapsedTime, "05:13:11");
          SpecsUtils.assertNearEqual(computedStats.elevationGain, 2578);
          SpecsUtils.assertNearEqual(computedStats.elevation.descent, 2578);

          const activity = extractResultActivity();
          SpecsUtils.assertNearEqual(activity.srcStats.elevationGain, 2578);
          SpecsUtils.assertEqualTime(activity.srcStats.pace.avg, "07:38");
          SpecsUtils.assertEqualTime(activity.srcStats.pace.gapAvg, "05:46");
          SpecsUtils.assertEqualTime(activity.srcStats.movingTime, "04:39:07");
          SpecsUtils.assertEqualTime(activity.srcStats.elapsedTime, "05:13:10");
          expect(computedStats.pace.gapAvg).toBeLessThanOrEqual(activity.srcStats.pace.avg);

          done();
        });
      });

      it("should sync Trosku (GENUINE_GAP: strava @ 04:21/km) (fit)", done => {
        // Given: https://connect.garmin.com/modern/activity/6916663933 OR https://www.strava.com/activities/3182582645
        injectActivityForTesting(`${__dirname}/fixtures/running/trosku.fit`);

        // When
        const promise = fileConnector.syncFiles(syncEvents$);

        // Then
        promise.then(() => {
          const computedStats = extractComputedActivityStats();
          SpecsUtils.assertEqualTime(computedStats.pace.avg, "04:30");
          SpecsUtils.assertEqualTime(computedStats.pace.gapAvg, "04:23");
          expect(computedStats.pace.gapAvg).toBeLessThanOrEqual(computedStats.pace.avg);
          SpecsUtils.assertEqualTime(computedStats.movingTime, "48:23");
          SpecsUtils.assertEqualTime(computedStats.elapsedTime, "48:42");
          SpecsUtils.assertNearEqual(computedStats.elevationGain, 136);
          SpecsUtils.assertNearEqual(computedStats.elevation.descent, 142);

          const activity = extractResultActivity();
          SpecsUtils.assertNearEqual(activity.srcStats.elevationGain, 142);
          SpecsUtils.assertEqualTime(activity.srcStats.pace.avg, "04:32");
          SpecsUtils.assertEqualTime(activity.srcStats.pace.gapAvg, "04:23");
          SpecsUtils.assertEqualTime(activity.srcStats.movingTime, "48:30");
          SpecsUtils.assertEqualTime(activity.srcStats.elapsedTime, "48:42");
          expect(computedStats.pace.gapAvg).toBeLessThanOrEqual(activity.srcStats.pace.avg);

          done();
        });
      });

      it("should sync Portland Trails (GENUINE_GAP strava @ 05:33/km) (fit)", done => {
        // Given: https://connect.garmin.com/modern/activity/7518173110 OR https://www.strava.com/activities/1414575841
        injectActivityForTesting(`${__dirname}/fixtures/running/portland.fit`);

        // When
        const promise = fileConnector.syncFiles(syncEvents$);

        // Then
        promise.then(() => {
          const computedStats = extractComputedActivityStats();
          SpecsUtils.assertEqualTime(computedStats.pace.avg, "06:22");
          SpecsUtils.assertEqualTime(computedStats.pace.gapAvg, "05:39");
          expect(computedStats.pace.gapAvg).toBeLessThanOrEqual(computedStats.pace.avg);
          SpecsUtils.assertEqualTime(computedStats.movingTime, "01:42:13");
          SpecsUtils.assertEqualTime(computedStats.elapsedTime, "01:53:11");
          SpecsUtils.assertNearEqual(computedStats.elevationGain, 571);
          SpecsUtils.assertNearEqual(computedStats.elevation.descent, 582);

          const activity = extractResultActivity();
          SpecsUtils.assertNearEqual(activity.srcStats.elevationGain, 543);
          SpecsUtils.assertEqualTime(activity.srcStats.pace.avg, "06:24");
          SpecsUtils.assertEqualTime(activity.srcStats.pace.gapAvg, "05:42");
          SpecsUtils.assertEqualTime(activity.srcStats.movingTime, "01:40:30");
          SpecsUtils.assertEqualTime(activity.srcStats.elapsedTime, "01:53:11");
          expect(computedStats.pace.gapAvg).toBeLessThanOrEqual(activity.srcStats.pace.avg);

          done();
        });
      });

      it("should sync Treadmill (fit)", done => {
        // Given FIT Source: https://connect.garmin.com/modern/activity/6860622783 or https://www.strava.com/activities/5375834427
        injectActivityForTesting(`${__dirname}/fixtures/running/treadmill.fit`);

        // When
        const promise = fileConnector.syncFiles(syncEvents$);

        // Then
        promise.then(() => {
          const computedStats = extractComputedActivityStats();
          expect(computedStats.power.work).toEqual(726);
          expect(computedStats.cadence.cycles).toEqual(4424);

          const activity = extractResultActivity();
          expect(activity.hasPowerMeter).toBeTruthy();
          expect(activity.trainer).toBeTruthy();
          expect(activity.srcStats.power.work).toEqual(692);

          expect(activity.srcStats.dynamics.running.stanceTimeBalance.left).toEqual(49.91);
          expect(activity.srcStats.dynamics.running.stanceTimeBalance.right).toEqual(50.09);
          expect(activity.srcStats.dynamics.running.stanceTime).toEqual(271.3);
          expect(activity.srcStats.dynamics.running.verticalOscillation).toEqual(0.0972);
          expect(activity.srcStats.dynamics.running.verticalRatio).toEqual(9.57);
          expect(activity.srcStats.dynamics.running.avgStrideLength).toEqual(1.04);

          expect(activity.srcStats.scores.stress.trainingEffect.aerobic).toEqual(2.2);
          expect(activity.srcStats.scores.stress.trainingEffect.anaerobic).toEqual(1.8);

          done();
        });
      });
    });

    describe("Swimming", () => {
      it("should sync on swim in pool", done => {
        // Given FIT Source:  https://connect.garmin.com/modern/activity/6021532030 OR https://www.strava.com/activities/5258304128
        injectActivityForTesting(`${__dirname}/fixtures/swimming/pool-swim.fit`);

        // When
        const promise = fileConnector.syncFiles(syncEvents$);

        // Then
        promise.then(() => {
          const computedStats = extractComputedActivityStats();
          SpecsUtils.assertEqualTime(SpecsUtils.kmPaceToSwim100mPace(computedStats.pace.avg), "02:37");
          SpecsUtils.assertNearEqualTime(computedStats.movingTime, "20:28");
          SpecsUtils.assertNearEqualTime(computedStats.elapsedTime, "23:10");
          SpecsUtils.assertNearEqual(computedStats.distance, 780);
          SpecsUtils.assertNearEqual(computedStats.calories, 228);
          SpecsUtils.assertNearEqual(computedStats.caloriesPerHour, 591);

          const activity = extractResultActivity();
          expect(activity.type).toEqual(ElevateSport.Swim);

          SpecsUtils.assertNearEqual(activity.srcStats.distance, 780);
          SpecsUtils.assertNearEqual(activity.srcStats.calories, 235);
          SpecsUtils.assertNearEqual(activity.srcStats.caloriesPerHour, 599);
          SpecsUtils.assertNearEqual(activity.srcStats.scores.swolf["25"], 63);
          SpecsUtils.assertNearEqualTime(activity.srcStats.movingTime, "23:10");
          SpecsUtils.assertNearEqualTime(activity.srcStats.elapsedTime, "23:31");
          SpecsUtils.assertEqualTime(SpecsUtils.kmPaceToSwim100mPace(activity.srcStats.pace.avg), "02:58");

          expect(activity.srcStats.movingTime).toBeLessThanOrEqual(activity.srcStats.elapsedTime);
          expect(activity.isSwimPool).toBeTruthy();
          expect(activity.hash).toEqual("5c53d732a32baf911c498dfe");

          done();
        });
      });

      it("should sync on open water swim", done => {
        // Given GPX Source: https://connect.garmin.com/modern/activity/6867446668 OR https://www.strava.com/activities/5382426315
        injectActivityForTesting(`${__dirname}/fixtures/swimming/open-water-swim.gpx`);

        // When
        const promise = fileConnector.syncFiles(syncEvents$);

        // Then
        promise.then(() => {
          const computedStats = extractComputedActivityStats();
          SpecsUtils.assertEqualTime(SpecsUtils.kmPaceToSwim100mPace(computedStats.pace.avg), "02:28");
          SpecsUtils.assertNearEqualTime(computedStats.movingTime, "01:02:03");
          SpecsUtils.assertNearEqualTime(computedStats.elapsedTime, "01:14:47");
          SpecsUtils.assertNearEqual(computedStats.calories, 850);

          const activity = extractResultActivity();
          expect(activity.type).toEqual(ElevateSport.Swim);

          SpecsUtils.assertNearEqual(activity.srcStats.distance, 2536);
          SpecsUtils.assertNearEqualTime(activity.srcStats.movingTime, "55:43");
          SpecsUtils.assertNearEqualTime(activity.srcStats.elapsedTime, "01:14:47");

          SpecsUtils.assertEqualTime(SpecsUtils.kmPaceToSwim100mPace(activity.srcStats.pace.avg), "02:29");
          expect(activity.srcStats.movingTime).toBeLessThanOrEqual(activity.srcStats.elapsedTime);
          expect(activity.isSwimPool).toBeDefined();
          expect(activity.isSwimPool).toBeFalsy();

          done();
        });
      });

      it("should sync on spiros-01 swim", done => {
        // Given https://connect.garmin.com/modern/activity/6688025408 OR https://www.strava.com/activities/4232464474
        injectActivityForTesting(`${__dirname}/fixtures/swimming/spiros-01.fit`);

        // When
        const promise = fileConnector.syncFiles(syncEvents$);

        // Then
        promise.then(() => {
          const computedStats = extractComputedActivityStats();
          SpecsUtils.assertEqualTime(SpecsUtils.kmPaceToSwim100mPace(computedStats.pace.avg), "03:00");
          SpecsUtils.assertEqualTime(computedStats.movingTime, "42:12");
          SpecsUtils.assertEqualTime(computedStats.elapsedTime, "01:06:04");
          SpecsUtils.assertNearEqual(computedStats.scores.stress.sss, 598);
          SpecsUtils.assertNearEqual(computedStats.scores.stress.sssPerHour, 851);

          const activity = extractResultActivity();
          expect(activity.type).toEqual(ElevateSport.Swim);

          SpecsUtils.assertEqualTime(SpecsUtils.kmPaceToSwim100mPace(activity.srcStats.pace.avg), "01:50");
          SpecsUtils.assertNearEqual(activity.srcStats.distance, 2300);
          SpecsUtils.assertEqualTime(activity.srcStats.movingTime, "44:02");
          SpecsUtils.assertEqualTime(activity.srcStats.elapsedTime, "01:06:23");
          SpecsUtils.assertNearEqual(activity.srcStats.calories, 458);
          expect(activity.srcStats.movingTime).toBeLessThanOrEqual(activity.srcStats.elapsedTime);
          expect(activity.srcStats.scores.swolf["25"]).toEqual(36.7);
          expect(activity.srcStats.scores.swolf["50"]).toEqual(73.4);
          expect(activity.isSwimPool).toBeTruthy();
          done();
        });
      });

      it("should sync on spiros-02 swim", done => {
        // Given https://connect.garmin.com/modern/activity/6710200645 OR https://www.strava.com/activities/4126640979
        injectActivityForTesting(`${__dirname}/fixtures/swimming/spiros-02.fit`);

        // When
        const promise = fileConnector.syncFiles(syncEvents$);

        // Then
        promise.then(() => {
          const computedStats = extractComputedActivityStats();
          SpecsUtils.assertEqualTime(SpecsUtils.kmPaceToSwim100mPace(computedStats.pace.avg), "02:37");
          SpecsUtils.assertEqualTime(computedStats.movingTime, "37:00");
          SpecsUtils.assertEqualTime(computedStats.elapsedTime, "52:14");
          SpecsUtils.assertNearEqual(computedStats.scores.stress.sss, 462);
          SpecsUtils.assertNearEqual(computedStats.scores.stress.sssPerHour, 752);

          const activity = extractResultActivity();
          expect(activity.type).toEqual(ElevateSport.Swim);
          SpecsUtils.assertEqualTime(SpecsUtils.kmPaceToSwim100mPace(activity.srcStats.pace.avg), "01:51");
          SpecsUtils.assertNearEqual(activity.srcStats.distance, 2000);
          SpecsUtils.assertEqualTime(activity.srcStats.movingTime, "37:00");
          SpecsUtils.assertEqualTime(activity.srcStats.elapsedTime, "52:33");
          SpecsUtils.assertNearEqual(activity.srcStats.calories, 444);
          expect(activity.srcStats.movingTime).toBeLessThanOrEqual(activity.srcStats.elapsedTime);
          expect(activity.isSwimPool).toBeTruthy();
          done();
        });
      });
    });

    describe("Others", () => {
      it("should handle empty file files", done => {
        // Given
        injectActivityForTesting(`${__dirname}/fixtures/others/empty.fit`);

        // When
        const promise = fileConnector.syncFiles(syncEvents$);

        // Then
        promise.then(() => {
          computeSportsLibEventSpy.calls.mostRecent().returnValue.catch(err => {
            expect(err.code).toEqual(EmptyEventLibError.CODE);
            done();
          });
        });
      });

      it("should flag/detect abnormal avg speed", done => {
        // Given https://connect.garmin.com/modern/activity/7848542087 OR https://www.strava.com/activities/6241774100
        injectActivityForTesting(`${__dirname}/fixtures/others/flagged-speed.fit`);

        // When
        const promise = fileConnector.syncFiles(syncEvents$);

        // Then
        promise.then(() => {
          const activity = extractResultActivity();
          expect(_.indexOf(activity.flags, ActivityFlag.SPEED_AVG_ABNORMAL) !== -1).toBeTruthy();
          done();
        });
      });

      it("should flag/detect abnormal heart rate data", done => {
        // Given https://connect.garmin.com/modern/activity/7848568703 OR https://www.strava.com/activities/6284385914
        injectActivityForTesting(`${__dirname}/fixtures/others/flagged-hr.fit`);

        // When
        const promise = fileConnector.syncFiles(syncEvents$);

        // Then
        promise.then(() => {
          const activity = extractResultActivity();
          expect(_.indexOf(activity.flags, ActivityFlag.SCORE_HRSS_PER_HOUR_ABNORMAL) !== -1).toBeTruthy();
          expect(_.indexOf(activity.flags, ActivityFlag.HR_AVG_ABNORMAL) !== -1).toBeTruthy();
          done();
        });
      });
    });
  });

  describe("Power streams estimation", () => {
    const processStreamsForWattsEstimation = (
      sport: ElevateSport,
      athleteSnapshot = new AthleteSnapshot(Gender.MEN, 30, AthleteSettings.DEFAULT_MODEL)
    ): { streams: Streams; realWatts: number[] } => {
      // Extract raw activity streams from activity
      const rawActivityStreams = extractActivityStreams();

      // Process streams as if you have a power meter (which is true..) with given sport & athlete snapshot
      const streams = StreamProcessor.handle(
        ProcessStreamMode.COMPUTE,
        {
          isSwimPool: false,
          hasPowerMeter: true,
          athleteSnapshot: athleteSnapshot,
          type: sport
        },
        rawActivityStreams
      );

      // Keep copy of real watts
      const realWatts = streams.watts;

      // Remove real watts from processed streams
      delete streams.watts;

      // Provide results !
      return { streams, realWatts };
    };

    const estimatedPowerComparisonStats = (time: number[], realWatts: number[], estimatedWatts: number[]) => {
      const estimatedAvgWatts = _.mean(estimatedWatts);
      const estimatedMaxWatts = _.max(estimatedWatts);
      const estimatedStdDev = ActivityComputer.computeStandardDeviation(estimatedWatts, estimatedAvgWatts);
      const estimatedNormalizedPower = _.round(ActivityComputer.computeNormalizedPower(estimatedWatts, time));

      const realAvgWatts = _.mean(realWatts);
      const realMaxWatts = _.max(realWatts);
      const realStdDev = ActivityComputer.computeStandardDeviation(realWatts, realAvgWatts);
      const realNormalizedPower = _.round(ActivityComputer.computeNormalizedPower(realWatts, time));

      const deltaAvg = SpecsUtils.compareStreamDeltaAvg(estimatedWatts, realWatts);
      return {
        est: {
          avg: estimatedAvgWatts,
          np: estimatedNormalizedPower,
          max: estimatedMaxWatts,
          stdDev: estimatedStdDev
        },
        real: {
          avg: realAvgWatts,
          np: realNormalizedPower,
          max: realMaxWatts,
          stdDev: realStdDev
        },
        deltaAvg: deltaAvg
      };
    };

    describe("Cycling power estimate", () => {
      const AVG_TOLERANCE_PERCENT = 10;
      const NP_TOLERANCE_PERCENT = 12;

      let cyclingProcessParams: StreamProcessorParams;

      beforeEach(done => {
        cyclingProcessParams = {
          isSwimPool: false,
          hasPowerMeter: false,
          athleteSnapshot: new AthleteSnapshot(Gender.MEN, 30, AthleteSettings.DEFAULT_MODEL),
          type: ElevateSport.Ride
        };
        done();
      });

      it("should estimate power of First Power Ride (fit)", done => {
        // Given FIT https://connect.garmin.com/modern/activity/7432332116 OR https://www.strava.com/activities/5910143591 (78.3 kg with gear)
        injectActivityForTesting(`${__dirname}/fixtures/cycling/first-power-ride.fit`);
        cyclingProcessParams.athleteSnapshot.athleteSettings.weight = 77; // Kg

        fileConnector.syncFiles(syncEvents$).then(() => {
          const { streams, realWatts } = processStreamsForWattsEstimation(cyclingProcessParams.type);

          // When
          const estimatedWatts = StreamProcessor.estimatedPowerStream(streams, cyclingProcessParams);

          // Then
          const comparisonStats = estimatedPowerComparisonStats(streams.time, realWatts, estimatedWatts);

          SpecsUtils.assertNearEqual(comparisonStats.est.avg, comparisonStats.real.avg, 0, AVG_TOLERANCE_PERCENT);
          SpecsUtils.assertNearEqual(comparisonStats.est.np, comparisonStats.real.np, 0, NP_TOLERANCE_PERCENT);

          done();
        });
      });

      it("should estimate power of Petite Pererree Ride (fit)", done => {
        // Given FIT https://connect.garmin.com/modern/activity/7534637267 OR https://www.strava.com/activities/6001607686 (78.3 kg with gear)
        injectActivityForTesting(`${__dirname}/fixtures/cycling/petite_pererree.fit`);
        cyclingProcessParams.athleteSnapshot.athleteSettings.weight = 77; // Kg

        fileConnector.syncFiles(syncEvents$).then(() => {
          const { streams, realWatts } = processStreamsForWattsEstimation(cyclingProcessParams.type);

          // When
          const estimatedWatts = StreamProcessor.estimatedPowerStream(streams, cyclingProcessParams);

          // Then
          const comparisonStats = estimatedPowerComparisonStats(streams.time, realWatts, estimatedWatts);

          SpecsUtils.assertNearEqual(comparisonStats.est.avg, comparisonStats.real.avg, 0, AVG_TOLERANCE_PERCENT);
          SpecsUtils.assertNearEqual(comparisonStats.est.np, comparisonStats.real.np, 0, NP_TOLERANCE_PERCENT);

          done();
        });
      });

      it("should estimate power of Noroeste Power Ride (fit)", done => {
        // Given FIT https://connect.garmin.com/modern/activity/7607263332 OR https://www.strava.com/activities/6067510309 (48.5 kg with gear)
        injectActivityForTesting(`${__dirname}/fixtures/cycling/noroeste.fit`);
        cyclingProcessParams.athleteSnapshot.athleteSettings.weight = 47; // Kg

        fileConnector.syncFiles(syncEvents$).then(() => {
          const computedStats = extractComputedActivityStats();

          SpecsUtils.assertNearEqual(computedStats.power.avg, 143);
          SpecsUtils.assertNearEqual(computedStats.power.weighted, 223);
          SpecsUtils.assertNearEqual(computedStats.power.best20min, 192);
          SpecsUtils.assertNearEqual(computedStats.power.max, 823);

          const { streams, realWatts } = processStreamsForWattsEstimation(cyclingProcessParams.type);

          // When
          const estimatedWatts = StreamProcessor.estimatedPowerStream(streams, cyclingProcessParams);

          // Then
          const comparisonStats = estimatedPowerComparisonStats(streams.time, realWatts, estimatedWatts);

          SpecsUtils.assertNearEqual(comparisonStats.est.avg, comparisonStats.real.avg, 0, AVG_TOLERANCE_PERCENT);
          SpecsUtils.assertNearEqual(comparisonStats.est.np, comparisonStats.real.np, 0, NP_TOLERANCE_PERCENT);

          done();
        });
      });

      it("should estimate power of Alexania Power Ride (fit)", done => {
        // Given FIT https://connect.garmin.com/modern/activity/7558912257 OR https://www.strava.com/activities/5542211980
        injectActivityForTesting(`${__dirname}/fixtures/cycling/alexania.fit`);
        cyclingProcessParams.athleteSnapshot.athleteSettings.weight = 79.3; // Kg

        fileConnector.syncFiles(syncEvents$).then(() => {
          const computedStats = extractComputedActivityStats();

          SpecsUtils.assertNearEqual(computedStats.power.avg, 161);
          SpecsUtils.assertNearEqual(computedStats.power.weighted, 217);
          SpecsUtils.assertNearEqual(computedStats.power.best20min, 224);
          SpecsUtils.assertNearEqual(computedStats.power.max, 1178);

          const { streams, realWatts } = processStreamsForWattsEstimation(cyclingProcessParams.type);

          // When
          const estimatedWatts = StreamProcessor.estimatedPowerStream(streams, cyclingProcessParams);

          // Then
          const comparisonStats = estimatedPowerComparisonStats(streams.time, realWatts, estimatedWatts);

          SpecsUtils.assertNearEqual(comparisonStats.est.avg, comparisonStats.real.avg, 0, AVG_TOLERANCE_PERCENT);
          SpecsUtils.assertNearEqual(comparisonStats.est.np, comparisonStats.real.np, 0, NP_TOLERANCE_PERCENT);

          done();
        });
      });
    });

    describe("Running power estimate", () => {
      const AVG_TOLERANCE_PERCENT = 5;
      const NP_TOLERANCE_PERCENT = 5;

      let runProcessParams: StreamProcessorParams;

      beforeEach(done => {
        runProcessParams = {
          isSwimPool: false,
          hasPowerMeter: false,
          athleteSnapshot: new AthleteSnapshot(Gender.MEN, 30, AthleteSettings.DEFAULT_MODEL),
          type: ElevateSport.Run
        };
        done();
      });

      it("should estimate power of Sloatsburg Power Run (fit)", done => {
        // Given: https://connect.garmin.com/modern/activity/6782987395 OR https://www.strava.com/activities/2451375851
        injectActivityForTesting(`${__dirname}/fixtures/running/sloatsburg.fit`);

        runProcessParams.athleteSnapshot.athleteSettings.weight = 67.5; // Kg

        fileConnector.syncFiles(syncEvents$).then(() => {
          const { streams, realWatts } = processStreamsForWattsEstimation(runProcessParams.type);

          // When
          const estimatedWatts = StreamProcessor.estimatedPowerStream(streams, runProcessParams);

          // Then
          const comparisonStats = estimatedPowerComparisonStats(streams.time, realWatts, estimatedWatts);

          SpecsUtils.assertNearEqual(comparisonStats.est.avg, comparisonStats.real.avg, 0, AVG_TOLERANCE_PERCENT);
          SpecsUtils.assertNearEqual(comparisonStats.est.np, comparisonStats.real.np, 0, NP_TOLERANCE_PERCENT);

          done();
        });
      });

      it("should estimate power of Kaiteriteri Power Run (fit)", done => {
        // Given: https://connect.garmin.com/modern/activity/7627126973 OR https://www.strava.com/activities/6085578203
        injectActivityForTesting(`${__dirname}/fixtures/running/kaiteriteri.fit`);

        runProcessParams.athleteSnapshot.athleteSettings.weight = 80.3; // Kg

        fileConnector.syncFiles(syncEvents$).then(() => {
          const { streams, realWatts } = processStreamsForWattsEstimation(runProcessParams.type);

          // When
          const estimatedWatts = StreamProcessor.estimatedPowerStream(streams, runProcessParams);

          // Then
          const comparisonStats = estimatedPowerComparisonStats(streams.time, realWatts, estimatedWatts);

          SpecsUtils.assertNearEqual(comparisonStats.est.avg, comparisonStats.real.avg, 0, AVG_TOLERANCE_PERCENT);
          SpecsUtils.assertNearEqual(comparisonStats.est.np, comparisonStats.real.np, 0, NP_TOLERANCE_PERCENT);

          done();
        });
      });

      it("should estimate power of Bloemendaal Power Run (fit)", done => {
        // Given: https://connect.garmin.com/modern/activity/7627148960 OR https://www.strava.com/activities/5423646653 (stryd power)
        injectActivityForTesting(`${__dirname}/fixtures/running/bloemendaal.fit`);

        runProcessParams.athleteSnapshot.athleteSettings.weight = 73; // Kg

        fileConnector.syncFiles(syncEvents$).then(() => {
          const { streams, realWatts } = processStreamsForWattsEstimation(runProcessParams.type);

          // When
          const estimatedWatts = StreamProcessor.estimatedPowerStream(streams, runProcessParams);

          // Then
          const comparisonStats = estimatedPowerComparisonStats(streams.time, realWatts, estimatedWatts);

          SpecsUtils.assertNearEqual(comparisonStats.est.avg, comparisonStats.real.avg, 0, AVG_TOLERANCE_PERCENT);
          SpecsUtils.assertNearEqual(comparisonStats.est.np, comparisonStats.real.np, 0, NP_TOLERANCE_PERCENT);

          done();
        });
      });

      it("should estimate power of Trosku Power Run (fit)", done => {
        // Given: https://connect.garmin.com/modern/activity/6916663933 OR https://www.strava.com/activities/3182582645
        injectActivityForTesting(`${__dirname}/fixtures/running/trosku.fit`);

        runProcessParams.athleteSnapshot.athleteSettings.weight = 80.2; // Kg

        fileConnector.syncFiles(syncEvents$).then(() => {
          const { streams, realWatts } = processStreamsForWattsEstimation(runProcessParams.type);

          // When
          const estimatedWatts = StreamProcessor.estimatedPowerStream(streams, runProcessParams);

          // Then
          const comparisonStats = estimatedPowerComparisonStats(streams.time, realWatts, estimatedWatts);

          SpecsUtils.assertNearEqual(comparisonStats.est.avg, comparisonStats.real.avg, 0, AVG_TOLERANCE_PERCENT);
          SpecsUtils.assertNearEqual(comparisonStats.est.np, comparisonStats.real.np, 0, NP_TOLERANCE_PERCENT);
          done();
        });
      });
    });
  });
});
