import { ActivityFile, ActivityFileType, FileConnector } from "./file.connector";
import {
  AthleteModel,
  AthleteSettingsModel,
  AthleteSnapshotModel,
  DatedAthleteSettingsModel,
  Gender,
  Streams,
  SyncedActivityModel,
  UserSettings
} from "@elevate/shared/models";
import { BuildTarget, ElevateSport, GradeProfile } from "@elevate/shared/enums";
import { FileConnectorConfig } from "../connector-config.model";
import { container } from "tsyringe";
import { SyncEvent } from "@elevate/shared/sync";
import { Subject } from "rxjs";
import path from "path";
import { SpecUtils } from "../../spec/spec-utils";

describe("Activity compute integration tests through file connector", () => {
  function createActivityFile(filePath: string): ActivityFile {
    const type = path.extname(filePath).slice(1) as ActivityFileType;
    return new ActivityFile(type, filePath, null);
  }

  function injectActivityForTesting(filePath: string): void {
    const activityFiles: ActivityFile[] = [createActivityFile(filePath)];
    spyOn(fileConnector, "scanForActivities").and.returnValue(activityFiles);
  }

  function extractResultActivity(): SyncedActivityModel {
    return syncEventsSpy.calls.mostRecent().args[0].activity;
  }

  function extractResultStream(): Streams {
    return Streams.inflate(syncEventsSpy.calls.mostRecent().args[0].deflatedStream);
  }

  let fileConnectorConfig: FileConnectorConfig;
  let fileConnector: FileConnector;
  let syncEvents$: Subject<SyncEvent>;
  let syncEventsSpy: jasmine.Spy;

  beforeEach(done => {
    syncEvents$ = new Subject<SyncEvent>();
    fileConnector = container.resolve(FileConnector);

    const athleteSettingsModel = AthleteSettingsModel.DEFAULT_MODEL;
    athleteSettingsModel.weight = 75;
    athleteSettingsModel.maxHr = 195;
    athleteSettingsModel.restHr = 65;
    athleteSettingsModel.cyclingFtp = 210;
    athleteSettingsModel.runningFtp = 275;
    athleteSettingsModel.swimFtp = 31;

    const athleteSnapshotModel: AthleteSnapshotModel = new AthleteSnapshotModel(Gender.MEN, 30, athleteSettingsModel);
    const athleteModel = new AthleteModel(Gender.MEN, [new DatedAthleteSettingsModel(null, athleteSettingsModel)]);

    fileConnectorConfig = {
      syncFromDateTime: null,
      athleteModel: athleteModel,
      userSettingsModel: UserSettings.getDefaultsByBuildTarget(BuildTarget.DESKTOP),
      info: { sourceDirectory: null } as any
    };
    fileConnector = fileConnector.configure(fileConnectorConfig);

    spyOn(fileConnector.athleteSnapshotResolver, "resolve").and.returnValue(athleteSnapshotModel);
    spyOn(fileConnector, "findSyncedActivityModels").and.returnValue(Promise.resolve(null));
    spyOn(fileConnector.getFs(), "existsSync").and.returnValue(true);

    syncEventsSpy = spyOn(syncEvents$, "next").and.callThrough();

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
      done();
    });
  });*/

  describe("Cycling", () => {
    it("should perform sync and calculation on Alpes d'Huez", done => {
      // Given
      injectActivityForTesting(`${__dirname}/integration-fixtures/cycling/huez.fit`);

      // When
      const promise = fileConnector.syncFiles(syncEvents$);

      // Then
      promise.then(() => {
        const activity = extractResultActivity();

        SpecUtils.startTrackAssertFailed();

        // Common
        expect(activity.type).toEqual(ElevateSport.Ride);
        expect(activity.hash).toEqual("1b5706ea0df79ee9e6768078");
        expect(activity.start_time).toEqual("2015-07-10T08:58:32.000Z");
        expect(activity.end_time).toEqual("2015-07-10T15:05:48.000Z");
        expect(activity.trainer).toBeFalsy();
        expect(activity.hasPowerMeter).toBeFalsy();
        expect(activity.moving_time_raw).toEqual(activity.extendedStats.movingTime);
        expect(activity.elapsed_time_raw).toEqual(activity.extendedStats.elapsedTime);
        SpecUtils.assertNearEqual(activity.distance_raw, 141924.84, 1);
        SpecUtils.assertNearEqual(activity.elevation_gain_raw, 2064, 1);
        SpecUtils.assertNearEqual(activity.latLngCenter[0], 45.128159, 5);
        SpecUtils.assertNearEqual(activity.latLngCenter[1], 5.9212365, 5);
        SpecUtils.assertNearEqualTime(activity.moving_time_raw, "05:24:26");
        SpecUtils.assertNearEqualTime(activity.elapsed_time_raw, "06:07:13");
        SpecUtils.assertNearEqual(activity.extendedStats.calories, 4599);
        SpecUtils.assertNearEqual(activity.extendedStats.caloriesPerHour, 751);

        // Speed
        SpecUtils.assertNearEqual(activity.extendedStats.speedData.genuineAvgSpeed, 26.3, 1);
        SpecUtils.assertNearEqual(activity.extendedStats.speedData.totalAvgSpeed, 23.2, 1);
        SpecUtils.assertNearEqual(activity.extendedStats.speedData.avgPace, 135);
        SpecUtils.assertNearEqual(activity.extendedStats.speedData.best20min, 42);
        SpecUtils.assertNearEqual(activity.extendedStats.speedData.maxSpeed, 66.5, 1);
        SpecUtils.assertNearEqual(activity.extendedStats.speedData.lowerQuartileSpeed, 13.8, 1);
        SpecUtils.assertNearEqual(activity.extendedStats.speedData.medianSpeed, 26.2, 1);
        SpecUtils.assertNearEqual(activity.extendedStats.speedData.upperQuartileSpeed, 35.6, 1);
        SpecUtils.assertNearEqual(activity.extendedStats.speedData.standardDeviationSpeed, 13.1, 1);

        // Heart-rate
        SpecUtils.assertNearEqual(activity.extendedStats.heartRateData.averageHeartRate, 148);
        SpecUtils.assertNearEqual(activity.extendedStats.heartRateData.maxHeartRate, 174);
        SpecUtils.assertNearEqual(activity.extendedStats.heartRateData.activityHeartRateReserve, 63.7, 1);
        SpecUtils.assertNearEqual(activity.extendedStats.heartRateData.activityHeartRateReserveMax, 83.8, 1);
        SpecUtils.assertNearEqual(activity.extendedStats.heartRateData.TRIMP, 508);
        SpecUtils.assertNearEqual(activity.extendedStats.heartRateData.TRIMPPerHour, 83);
        SpecUtils.assertNearEqual(activity.extendedStats.heartRateData.HRSS, 304);
        SpecUtils.assertNearEqual(activity.extendedStats.heartRateData.HRSSPerHour, 51);
        SpecUtils.assertNearEqual(activity.extendedStats.heartRateData.best20min, 165);
        SpecUtils.assertNearEqual(activity.extendedStats.heartRateData.best60min, 160);
        SpecUtils.assertNearEqual(activity.extendedStats.heartRateData.lowerQuartileHeartRate, 142);
        SpecUtils.assertNearEqual(activity.extendedStats.heartRateData.medianHeartRate, 151);
        SpecUtils.assertNearEqual(activity.extendedStats.heartRateData.upperQuartileHeartRate, 156);

        // Power
        SpecUtils.assertNearEqual(activity.extendedStats.powerData.avgWatts, 180);
        SpecUtils.assertNearEqual(activity.extendedStats.powerData.avgWattsPerKg, 2.4, 2);
        SpecUtils.assertNearEqual(activity.extendedStats.powerData.weightedPower, 215);
        SpecUtils.assertNearEqual(activity.extendedStats.powerData.weightedWattsPerKg, 2.87, 2);
        SpecUtils.assertNearEqual(activity.extendedStats.powerData.best20min, 290);
        SpecUtils.assertNearEqual(activity.extendedStats.powerData.bestEightyPercent, 179);
        SpecUtils.assertNearEqual(activity.extendedStats.powerData.lowerQuartileWatts, 154);
        SpecUtils.assertNearEqual(activity.extendedStats.powerData.medianWatts, 201);
        SpecUtils.assertNearEqual(activity.extendedStats.powerData.upperQuartileWatts, 230);
        SpecUtils.assertNearEqual(activity.extendedStats.powerData.maxPower, 396);
        SpecUtils.assertNearEqual(activity.extendedStats.powerData.powerStressScore, 571);
        SpecUtils.assertNearEqual(activity.extendedStats.powerData.powerStressScorePerHour, 105);
        SpecUtils.assertNearEqual(activity.extendedStats.powerData.punchFactor, 1.03, 2);
        SpecUtils.assertNearEqual(activity.extendedStats.powerData.variabilityIndex, 1.2, 2);
        expect(activity.extendedStats.powerData.hasPowerMeter).toBeFalsy();

        // Cadence
        SpecUtils.assertNearEqual(activity.extendedStats.cadenceData.averageCadence, 67);
        SpecUtils.assertNearEqual(activity.extendedStats.cadenceData.averageActiveCadence, 78);
        SpecUtils.assertNearEqual(activity.extendedStats.cadenceData.cadenceActivePercentage, 91);
        SpecUtils.assertNearEqual(activity.extendedStats.cadenceData.maxCadence, 109);
        SpecUtils.assertNearEqualTime(activity.extendedStats.cadenceData.cadenceActiveTime, "04:55:39");
        SpecUtils.assertNearEqual(activity.extendedStats.cadenceData.upFlatDownCadencePaceData.up, 72);
        SpecUtils.assertNearEqual(activity.extendedStats.cadenceData.upFlatDownCadencePaceData.flat, 83);
        SpecUtils.assertNearEqual(activity.extendedStats.cadenceData.upFlatDownCadencePaceData.down, 88);
        SpecUtils.assertNearEqual(activity.extendedStats.cadenceData.standardDeviationCadence, 12);
        SpecUtils.assertNearEqual(activity.extendedStats.cadenceData.totalOccurrences, 24773);
        SpecUtils.assertNearEqual(activity.extendedStats.cadenceData.averageDistancePerOccurrence, 5.73, 2);
        SpecUtils.assertNearEqual(activity.extendedStats.cadenceData.medianCadence, 81);
        SpecUtils.assertNearEqual(activity.extendedStats.cadenceData.lowerQuartileCadence, 69);
        SpecUtils.assertNearEqual(activity.extendedStats.cadenceData.upperQuartileCadence, 89);

        // Grade
        SpecUtils.assertNearEqual(activity.extendedStats.gradeData.avgGrade, 1.3, 1);
        SpecUtils.assertNearEqual(activity.extendedStats.gradeData.avgMaxGrade, 11, 1);
        SpecUtils.assertNearEqual(activity.extendedStats.gradeData.avgMinGrade, -10);
        SpecUtils.assertNearEqual(activity.extendedStats.gradeData.lowerQuartileGrade, -1);
        SpecUtils.assertNearEqual(activity.extendedStats.gradeData.medianGrade, 1);
        SpecUtils.assertNearEqual(activity.extendedStats.gradeData.upperQuartileGrade, 4);
        SpecUtils.assertNearEqual(activity.extendedStats.gradeData.upFlatDownDistanceData.down, 53040, 1);
        SpecUtils.assertNearEqual(activity.extendedStats.gradeData.upFlatDownDistanceData.flat, 59871, 1);
        SpecUtils.assertNearEqual(activity.extendedStats.gradeData.upFlatDownDistanceData.up, 39315, 1);
        SpecUtils.assertNearEqual(activity.extendedStats.gradeData.upFlatDownMoveData.down, 40.8, 1);
        SpecUtils.assertNearEqual(activity.extendedStats.gradeData.upFlatDownMoveData.flat, 30.9, 1);
        SpecUtils.assertNearEqual(activity.extendedStats.gradeData.upFlatDownMoveData.up, 15.6, 1);
        expect(activity.extendedStats.gradeData.gradeProfile).toEqual(GradeProfile.HILLY);

        // Elevation
        SpecUtils.assertNearEqual(activity.extendedStats.elevationData.accumulatedElevationAscent, 2048);
        SpecUtils.assertNearEqual(activity.extendedStats.elevationData.accumulatedElevationDescent, 2025);
        SpecUtils.assertNearEqual(activity.extendedStats.elevationData.avgElevation, 760);
        SpecUtils.assertNearEqual(activity.extendedStats.elevationData.maxElevation, 1806);
        SpecUtils.assertNearEqual(activity.extendedStats.elevationData.minElevation, 213);
        SpecUtils.assertNearEqual(activity.extendedStats.elevationData.lowerQuartileElevation, 339);
        SpecUtils.assertNearEqual(activity.extendedStats.elevationData.medianElevation, 644);
        SpecUtils.assertNearEqual(activity.extendedStats.elevationData.upperQuartileElevation, 1161);
        SpecUtils.assertNearEqual(activity.extendedStats.elevationData.ascentSpeed.avg, 604);

        SpecUtils.endTrackAssertFailed();

        done();
      });
    });

    it("should perform sync and calculation on brevet 200k", done => {
      // Given
      injectActivityForTesting(`${__dirname}/integration-fixtures/cycling/brevet-200k.fit`);

      // When
      const promise = fileConnector.syncFiles(syncEvents$);

      // Then
      promise.then(() => {
        const activity = extractResultActivity();
        expect(activity.moving_time_raw).toEqual(activity.extendedStats.movingTime);
        expect(activity.elapsed_time_raw).toEqual(activity.extendedStats.elapsedTime);

        SpecUtils.assertNearEqual(activity.elevation_gain_raw, 1976);

        SpecUtils.assertNearEqualTime(activity.moving_time_raw, "07:36:38");
        SpecUtils.assertNearEqualTime(activity.elapsed_time_raw, "08:27:17");

        SpecUtils.assertNearEqual(activity.extendedStats.speedData.genuineAvgSpeed, 26.9, 1);

        SpecUtils.assertNearEqual(activity.extendedStats.cadenceData.maxCadence, 122);
        SpecUtils.assertNearEqual(activity.extendedStats.cadenceData.upFlatDownCadencePaceData.up, 71);
        SpecUtils.assertNearEqual(activity.extendedStats.cadenceData.upFlatDownCadencePaceData.flat, 79);
        SpecUtils.assertNearEqual(activity.extendedStats.cadenceData.upFlatDownCadencePaceData.down, 89);

        SpecUtils.assertNearEqual(activity.extendedStats.powerData.avgWatts, 186);
        SpecUtils.assertNearEqual(activity.extendedStats.powerData.maxPower, 411);

        SpecUtils.assertNearEqual(activity.extendedStats.gradeData.upFlatDownMoveData.down, 38.9, 1);
        SpecUtils.assertNearEqual(activity.extendedStats.gradeData.upFlatDownMoveData.up, 17.8, 1);

        done();
      });
    });

    it("should perform sync and calculation on Mini Enduro", done => {
      // Given
      injectActivityForTesting(`${__dirname}/integration-fixtures/cycling/mini-enduro.tcx`);

      // When
      const promise = fileConnector.syncFiles(syncEvents$);

      // Then
      promise.then(() => {
        const activity = extractResultActivity();

        SpecUtils.assertNearEqual(activity.elevation_gain_raw, 320);
        SpecUtils.assertNearEqualTime(activity.moving_time_raw, "01:24:40");
        SpecUtils.assertNearEqualTime(activity.elapsed_time_raw, "03:05:14");

        SpecUtils.assertNearEqual(activity.extendedStats.powerData.avgWatts, 81);
        SpecUtils.assertNearEqual(activity.extendedStats.powerData.maxPower, 339);

        SpecUtils.assertNearEqual(activity.extendedStats.speedData.genuineAvgSpeed, 18, 1);
        SpecUtils.assertNearEqual(activity.extendedStats.speedData.totalAvgSpeed, 9, 1);

        done();
      });
    });

    it("should perform sync and calculation on Lac de Monteynard, 145k", done => {
      // Given
      injectActivityForTesting(`${__dirname}/integration-fixtures/cycling/mont-eynard.fit`);

      // When
      const promise = fileConnector.syncFiles(syncEvents$);

      // Then
      promise.then(() => {
        const activity = extractResultActivity();

        SpecUtils.assertNearEqual(activity.elevation_gain_raw, 1773);
        SpecUtils.assertNearEqualTime(activity.moving_time_raw, "05:52:40");
        SpecUtils.assertNearEqualTime(activity.elapsed_time_raw, "07:04:40");

        SpecUtils.assertNearEqual(activity.extendedStats.speedData.genuineAvgSpeed, 25.5, 1);
        SpecUtils.assertNearEqual(activity.extendedStats.speedData.totalAvgSpeed, 20);

        SpecUtils.assertNearEqual(activity.extendedStats.powerData.avgWatts, 180);
        SpecUtils.assertNearEqual(activity.extendedStats.powerData.maxPower, 382);

        SpecUtils.assertNearEqual(activity.extendedStats.cadenceData.averageCadence, 62);
        SpecUtils.assertNearEqual(activity.extendedStats.cadenceData.averageActiveCadence, 77);
        SpecUtils.assertNearEqual(activity.extendedStats.cadenceData.upFlatDownCadencePaceData.up, 73);
        SpecUtils.assertNearEqual(activity.extendedStats.cadenceData.upFlatDownCadencePaceData.flat, 76);
        SpecUtils.assertNearEqual(activity.extendedStats.cadenceData.upFlatDownCadencePaceData.down, 87);

        done();
      });
    });

    it("should perform sync and calculation on Frozen feet", done => {
      // Given
      injectActivityForTesting(`${__dirname}/integration-fixtures/cycling/frozen.fit`);

      // When
      const promise = fileConnector.syncFiles(syncEvents$);

      // Then
      promise.then(() => {
        const activity = extractResultActivity();

        SpecUtils.assertNearEqual(activity.elevation_gain_raw, 574);
        expect(activity.moving_time_raw).toEqual(activity.extendedStats.movingTime);
        expect(activity.elapsed_time_raw).toEqual(activity.extendedStats.elapsedTime);

        SpecUtils.assertNearEqual(activity.extendedStats.powerData.avgWatts, 149);
        SpecUtils.assertNearEqual(activity.extendedStats.powerData.maxPower, 456);

        SpecUtils.assertNearEqualTime(activity.moving_time_raw, "4:17:34");
        SpecUtils.assertNearEqualTime(activity.elapsed_time_raw, "4:56:21");

        done();
      });
    });
  });

  describe("Running", () => {
    it("should perform sync and calculation on Fartleck", done => {
      // Given https://www.strava.com/activities/3497177564 or https://connect.garmin.com/modern/activity/6048438275
      injectActivityForTesting(`${__dirname}/integration-fixtures/running/fartleck.gpx`);

      // When
      const promise = fileConnector.syncFiles(syncEvents$);

      // Then
      promise.then(() => {
        const activity = extractResultActivity();

        SpecUtils.startTrackAssertFailed();

        expect(activity.type).toEqual(ElevateSport.Run);
        expect(activity.hash).toEqual("6316e0a4cb378b8c3a895f34");
        expect(activity.start_time).toEqual("2020-12-27T15:50:06.000Z");
        expect(activity.end_time).toEqual("2020-12-27T17:12:56.000Z");
        expect(activity.trainer).toBeFalsy();
        expect(activity.hasPowerMeter).toBeFalsy();
        expect(activity.moving_time_raw).toEqual(activity.extendedStats.movingTime);
        expect(activity.elapsed_time_raw).toEqual(activity.extendedStats.elapsedTime);
        SpecUtils.assertNearEqual(activity.distance_raw, 16772);
        SpecUtils.assertNearEqual(activity.elevation_gain_raw, 592);
        SpecUtils.assertNearEqual(activity.latLngCenter[0], 45.530626, 5);
        SpecUtils.assertNearEqual(activity.latLngCenter[1], 4.5191385, 5);
        SpecUtils.assertNearEqualTime(activity.moving_time_raw, "01:22:14");
        SpecUtils.assertNearEqualTime(activity.elapsed_time_raw, "01:22:50");
        SpecUtils.assertNearEqual(activity.extendedStats.calories, 1058);

        // Speed
        SpecUtils.assertNearEqual(activity.extendedStats.speedData.genuineAvgSpeed, 12.21, 2);
        SpecUtils.assertNearEqual(activity.extendedStats.speedData.avgPace, 294);
        SpecUtils.assertNearEqual(activity.extendedStats.speedData.totalAvgSpeed, 12.15, 2);
        SpecUtils.assertNearEqual(activity.extendedStats.speedData.lowerQuartileSpeed, 9.8, 1);
        SpecUtils.assertNearEqual(activity.extendedStats.speedData.upperQuartileSpeed, 14.4, 2);
        SpecUtils.assertNearEqual(activity.extendedStats.speedData.maxSpeed, 12.24, 2);
        SpecUtils.assertNearEqual(activity.extendedStats.speedData.medianSpeed, 12.3, 2);
        SpecUtils.assertNearEqual(activity.extendedStats.speedData.standardDeviationSpeed, 3.7, 2);

        // Pace
        SpecUtils.assertNearEqualTime(activity.extendedStats.paceData.avgPace, "04:54");
        SpecUtils.assertNearEqual(activity.extendedStats.paceData.best20min, 296);
        SpecUtils.assertNearEqualTime(activity.extendedStats.paceData.genuineGradeAdjustedAvgPace, "04:15");
        SpecUtils.assertNearEqual(activity.extendedStats.paceData.lowerQuartilePace, 368);
        SpecUtils.assertNearEqual(activity.extendedStats.paceData.maxPace, 294);
        SpecUtils.assertNearEqual(activity.extendedStats.paceData.medianPace, 293);
        SpecUtils.assertNearEqual(activity.extendedStats.paceData.runningStressScore, 160);
        SpecUtils.assertNearEqual(activity.extendedStats.paceData.runningStressScorePerHour, 116);
        SpecUtils.assertNearEqual(activity.extendedStats.paceData.upperQuartilePace, 250);
        SpecUtils.assertNearEqual(activity.extendedStats.paceData.standardDeviationPace, 974);

        expect(activity.extendedStats.paceData.genuineGradeAdjustedAvgPace).toBeLessThanOrEqual(
          activity.extendedStats.paceData.avgPace
        );

        // Heart-rate: No heart-rate data

        // Power
        SpecUtils.assertNearEqual(activity.extendedStats.powerData.maxPower, 453);
        SpecUtils.assertNearEqual(activity.extendedStats.powerData.avgWatts, 202);
        SpecUtils.assertNearEqual(activity.extendedStats.powerData.avgWattsPerKg, 2.69, 2);
        SpecUtils.assertNearEqual(activity.extendedStats.powerData.weightedPower, 230);
        SpecUtils.assertNearEqual(activity.extendedStats.powerData.weightedWattsPerKg, 3.07, 2);
        SpecUtils.assertNearEqual(activity.extendedStats.powerData.best20min, 237);
        SpecUtils.assertNearEqual(activity.extendedStats.powerData.bestEightyPercent, 205);
        SpecUtils.assertNearEqual(activity.extendedStats.powerData.variabilityIndex, 1.14, 2);
        SpecUtils.assertNearEqual(activity.extendedStats.powerData.lowerQuartileWatts, 168);
        SpecUtils.assertNearEqual(activity.extendedStats.powerData.medianWatts, 211);
        SpecUtils.assertNearEqual(activity.extendedStats.powerData.upperQuartileWatts, 252);
        expect(activity.extendedStats.powerData.hasPowerMeter).toBeFalsy();
        expect(activity.extendedStats.powerData.powerStressScore).toBeNull(); // Until running power threshold is supported
        expect(activity.extendedStats.powerData.powerStressScorePerHour).toBeNull(); // Until running power threshold is supported
        expect(activity.extendedStats.powerData.punchFactor).toBeNull(); // Until running power threshold is supported

        // Cadence
        SpecUtils.assertNearEqual(activity.extendedStats.cadenceData.averageCadence, 85);
        SpecUtils.assertNearEqual(activity.extendedStats.cadenceData.averageActiveCadence, 85);
        SpecUtils.assertNearEqual(activity.extendedStats.cadenceData.cadenceActivePercentage, 98);
        SpecUtils.assertNearEqual(activity.extendedStats.cadenceData.averageDistancePerOccurrence, 1.19, 2);
        SpecUtils.assertNearEqualTime(activity.extendedStats.cadenceData.cadenceActiveTime, "01:21:27");
        SpecUtils.assertNearEqual(activity.extendedStats.cadenceData.lowerQuartileCadence, 84);
        SpecUtils.assertNearEqual(activity.extendedStats.cadenceData.maxCadence, 106);
        SpecUtils.assertNearEqual(activity.extendedStats.cadenceData.medianCadence, 85);
        SpecUtils.assertNearEqual(activity.extendedStats.cadenceData.standardDeviationCadence, 4.42, 2);
        SpecUtils.assertNearEqual(activity.extendedStats.cadenceData.upFlatDownCadencePaceData.down, 86);
        SpecUtils.assertNearEqual(activity.extendedStats.cadenceData.upFlatDownCadencePaceData.flat, 85);
        SpecUtils.assertNearEqual(activity.extendedStats.cadenceData.upFlatDownCadencePaceData.up, 86);

        // Grade
        SpecUtils.assertNearEqual(activity.extendedStats.gradeData.avgGrade, -1.01, 2);
        SpecUtils.assertNearEqual(activity.extendedStats.gradeData.avgMaxGrade, 19.79, 2);
        SpecUtils.assertNearEqual(activity.extendedStats.gradeData.avgMinGrade, -31, 2);
        SpecUtils.assertNearEqual(activity.extendedStats.gradeData.lowerQuartileGrade, -5, 1);
        SpecUtils.assertNearEqual(activity.extendedStats.gradeData.upperQuartileGrade, 4.7, 1);
        SpecUtils.assertNearEqual(activity.extendedStats.gradeData.upFlatDownDistanceData.down, 6006, 2);
        SpecUtils.assertNearEqual(activity.extendedStats.gradeData.upFlatDownDistanceData.flat, 3329, 2);
        SpecUtils.assertNearEqual(activity.extendedStats.gradeData.upFlatDownDistanceData.up, 6307, 2);
        SpecUtils.assertNearEqual(activity.extendedStats.gradeData.upFlatDownMoveData.down, 11.66, 2);
        SpecUtils.assertNearEqual(activity.extendedStats.gradeData.upFlatDownMoveData.flat, 11.32, 2);
        SpecUtils.assertNearEqual(activity.extendedStats.gradeData.upFlatDownMoveData.up, 10.9, 2);
        expect(activity.extendedStats.gradeData.gradeProfile).toEqual(GradeProfile.HILLY);

        // Elevation
        SpecUtils.assertNearEqual(activity.extendedStats.elevationData.accumulatedElevationAscent, 598);
        SpecUtils.assertNearEqual(activity.extendedStats.elevationData.accumulatedElevationDescent, 599);
        SpecUtils.assertNearEqual(activity.extendedStats.elevationData.avgElevation, 606);
        SpecUtils.assertNearEqual(activity.extendedStats.elevationData.lowerQuartileElevation, 491);
        SpecUtils.assertNearEqual(activity.extendedStats.elevationData.maxElevation, 781);
        SpecUtils.assertNearEqual(activity.extendedStats.elevationData.medianElevation, 603);
        SpecUtils.assertNearEqual(activity.extendedStats.elevationData.minElevation, 403.1);
        SpecUtils.assertNearEqual(activity.extendedStats.elevationData.upperQuartileElevation, 750);
        SpecUtils.assertNearEqual(activity.extendedStats.elevationData.ascentSpeed.avg, 896);

        SpecUtils.endTrackAssertFailed();

        done();
      });
    });

    it("should perform sync and calculation Bastille", done => {
      // Given
      injectActivityForTesting(`${__dirname}/integration-fixtures/running/bastille.gpx`);

      // When
      const promise = fileConnector.syncFiles(syncEvents$);

      // Then
      promise.then(() => {
        const activity = extractResultActivity();

        SpecUtils.assertNearEqual(activity.elevation_gain_raw, 409);
        SpecUtils.assertNearEqualTime(activity.extendedStats.paceData.avgPace, "09:12");
        SpecUtils.assertNearEqualTime(activity.extendedStats.paceData.genuineGradeAdjustedAvgPace, "06:33");
        SpecUtils.assertNearEqualTime(activity.moving_time_raw, "59:45");
        SpecUtils.assertNearEqualTime(activity.elapsed_time_raw, "1:07:50");

        SpecUtils.assertNearEqual(activity.extendedStats.powerData.avgWatts, 167);

        expect(activity.extendedStats.paceData.genuineGradeAdjustedAvgPace).toBeLessThanOrEqual(
          activity.extendedStats.paceData.avgPace
        );
        done();
      });
    });

    it("should perform sync and calculation Ile amour", done => {
      // Given
      injectActivityForTesting(`${__dirname}/integration-fixtures/running/ile-a.gpx`);

      // When
      const promise = fileConnector.syncFiles(syncEvents$);

      // Then
      promise.then(() => {
        const activity = extractResultActivity();

        SpecUtils.assertNearEqual(activity.elevation_gain_raw, 87);
        SpecUtils.assertNearEqualTime(activity.extendedStats.paceData.avgPace, "08:14");
        SpecUtils.assertNearEqualTime(activity.extendedStats.paceData.genuineGradeAdjustedAvgPace, "08:09");
        SpecUtils.assertNearEqualTime(activity.moving_time_raw, "01:14:19");
        SpecUtils.assertNearEqualTime(activity.elapsed_time_raw, "01:15:03");
        expect(activity.extendedStats.paceData.genuineGradeAdjustedAvgPace).toBeLessThanOrEqual(
          activity.extendedStats.paceData.avgPace
        );
        done();
      });
    });

    it("should perform sync and calculation on Nico/Mag run", done => {
      // Given
      injectActivityForTesting(`${__dirname}/integration-fixtures/running/nico-mag.gpx`);

      // When
      const promise = fileConnector.syncFiles(syncEvents$);

      // Then
      promise.then(() => {
        const activity = extractResultActivity();

        SpecUtils.assertNearEqual(activity.elevation_gain_raw, 46);
        SpecUtils.assertNearEqualTime(activity.extendedStats.paceData.avgPace, "06:51");
        SpecUtils.assertNearEqualTime(activity.extendedStats.paceData.genuineGradeAdjustedAvgPace, "06:45");
        SpecUtils.assertNearEqualTime(activity.moving_time_raw, "32:25");
        SpecUtils.assertNearEqualTime(activity.elapsed_time_raw, "32:38");
        expect(activity.extendedStats.paceData.genuineGradeAdjustedAvgPace).toBeLessThanOrEqual(
          activity.extendedStats.paceData.avgPace
        );
        done();
      });
    });

    it("should perform sync and calculation on chicoutimi run", done => {
      // Given
      injectActivityForTesting(`${__dirname}/integration-fixtures/running/chicoutimi.gpx`);

      // When
      const promise = fileConnector.syncFiles(syncEvents$);

      // Then
      promise.then(() => {
        const activity = extractResultActivity();

        SpecUtils.assertNearEqual(activity.elevation_gain_raw, 76);
        SpecUtils.assertNearEqualTime(activity.extendedStats.paceData.avgPace, "07:00");
        SpecUtils.assertNearEqualTime(activity.extendedStats.paceData.genuineGradeAdjustedAvgPace, "06:49");
        SpecUtils.assertNearEqualTime(activity.moving_time_raw, "39:41");
        SpecUtils.assertNearEqualTime(activity.elapsed_time_raw, "43:06");
        expect(activity.extendedStats.paceData.genuineGradeAdjustedAvgPace).toBeLessThanOrEqual(
          activity.extendedStats.paceData.avgPace
        );

        done();
      });
    });

    it("should perform sync and calculation on vercors run", done => {
      // Given https://www.strava.com/activities/3632493456 or https://connect.garmin.com/modern/activity/6037744996
      injectActivityForTesting(`${__dirname}/integration-fixtures/running/run-vercors.gpx`);

      // When
      const promise = fileConnector.syncFiles(syncEvents$);

      // Then
      promise.then(() => {
        const activity = extractResultActivity();

        SpecUtils.assertNearEqual(activity.elevation_gain_raw, 525);
        SpecUtils.assertNearEqualTime(activity.extendedStats.paceData.avgPace, "08:02");
        SpecUtils.assertNearEqualTime(activity.extendedStats.paceData.genuineGradeAdjustedAvgPace, "05:37");
        SpecUtils.assertNearEqualTime(activity.moving_time_raw, "39:30");
        SpecUtils.assertNearEqualTime(activity.elapsed_time_raw, "1:07:19");
        expect(activity.extendedStats.paceData.genuineGradeAdjustedAvgPace).toBeLessThanOrEqual(
          activity.extendedStats.paceData.avgPace
        );
        done();
      });
    });

    it("should perform sync and calculation on morning beach", done => {
      // Given https://www.strava.com/activities/2837127866
      injectActivityForTesting(`${__dirname}/integration-fixtures/running/morning-beach.fit`);

      // When
      const promise = fileConnector.syncFiles(syncEvents$);

      // Then
      promise.then(() => {
        const activity = extractResultActivity();

        SpecUtils.assertNearEqual(activity.elevation_gain_raw, 19);
        SpecUtils.assertNearEqualTime(activity.extendedStats.paceData.avgPace, "06:29");
        SpecUtils.assertNearEqualTime(activity.extendedStats.paceData.genuineGradeAdjustedAvgPace, "06:27");
        SpecUtils.assertNearEqualTime(activity.moving_time_raw, "46:39");
        SpecUtils.assertNearEqualTime(activity.elapsed_time_raw, "46:49");
        console.log(activity.extendedStats.gradeData.gradeProfile);
        expect(activity.extendedStats.paceData.genuineGradeAdjustedAvgPace).toBeLessThanOrEqual(
          activity.extendedStats.paceData.avgPace
        );
        done();
      });
    });

    it("should perform sync and calculation on strong viking", done => {
      // Given https://www.strava.com/activities/1815953150
      injectActivityForTesting(`${__dirname}/integration-fixtures/running/strong-viking.tcx`);

      // When
      const promise = fileConnector.syncFiles(syncEvents$);

      // Then
      promise.then(() => {
        const activity = extractResultActivity();

        SpecUtils.assertNearEqual(activity.elevation_gain_raw, 81);
        SpecUtils.assertNearEqualTime(activity.extendedStats.paceData.avgPace, "11:59");
        SpecUtils.assertNearEqualTime(activity.extendedStats.paceData.genuineGradeAdjustedAvgPace, "11:55");
        SpecUtils.assertNearEqualTime(activity.moving_time_raw, "03:09:46");
        SpecUtils.assertNearEqualTime(activity.elapsed_time_raw, "03:09:55");
        console.log(activity.extendedStats.gradeData.gradeProfile);
        expect(activity.extendedStats.paceData.genuineGradeAdjustedAvgPace).toBeLessThanOrEqual(
          activity.extendedStats.paceData.avgPace
        );
        done();
      });
    });

    it("should perform sync and calculation on strong bam beat run", done => {
      // Given https://www.strava.com/activities/743555491
      injectActivityForTesting(`${__dirname}/integration-fixtures/running/bam-beat-run.tcx`);

      // When
      const promise = fileConnector.syncFiles(syncEvents$);

      // Then
      promise.then(() => {
        const activity = extractResultActivity();

        SpecUtils.assertNearEqual(activity.elevation_gain_raw, 64);
        SpecUtils.assertNearEqualTime(activity.extendedStats.paceData.avgPace, "06:14");
        SpecUtils.assertNearEqualTime(activity.extendedStats.paceData.genuineGradeAdjustedAvgPace, "06:13");
        SpecUtils.assertNearEqualTime(activity.moving_time_raw, "01:02:36");
        SpecUtils.assertNearEqualTime(activity.elapsed_time_raw, "01:02:36");
        expect(activity.extendedStats.paceData.genuineGradeAdjustedAvgPace).toBeLessThanOrEqual(
          activity.extendedStats.paceData.avgPace
        );
        done();
      });
    });

    it("should perform sync and calculation on 'Strong Viking - Warrior mud edition' run", done => {
      // https://www.strava.com/activities/2286922504
      injectActivityForTesting(`${__dirname}/integration-fixtures/running/viking-warrior-mud.gpx`);

      // When
      const promise = fileConnector.syncFiles(syncEvents$);

      // Then
      promise.then(() => {
        const activity = extractResultActivity();

        SpecUtils.assertNearEqual(activity.extendedStats.powerData.maxPower, 771);
        SpecUtils.assertNearEqual(activity.extendedStats.gradeData.avgMaxGrade, 16);
        SpecUtils.assertNearEqual(activity.extendedStats.gradeData.avgMinGrade, -19);

        // TODO To be uncommented and fixed
        // SpecUtils.assertNearEqual(activity.elevation_gain_raw, 122);
        // SpecUtils.assertNearEqualTime(activity.extendedStats.paceData.avgPace, "08:30");
        // SpecUtils.assertNearEqualTime(activity.extendedStats.paceData.genuineGradeAdjustedAvgPace, "07:58");
        // SpecUtils.assertNearEqualTime(activity.moving_time_raw, "02:02:37");
        // SpecUtils.assertNearEqualTime(activity.elapsed_time_raw, "03:14:28");
        // expect(activity.extendedStats.paceData.genuineGradeAdjustedAvgPace).toBeLessThanOrEqual(
        //   activity.extendedStats.paceData.avgPace
        // );
        done();
      });
    });
  });

  describe("Swimming", () => {
    it("should perform sync and calculation on swim in pool", done => {
      injectActivityForTesting(`${__dirname}/integration-fixtures/swimming/pool-swim.fit`);

      // When
      const promise = fileConnector.syncFiles(syncEvents$);

      // Then
      promise.then(() => {
        const activity = extractResultActivity();

        SpecUtils.startTrackAssertFailed();

        expect(activity.type).toEqual(ElevateSport.Swim);
        expect(activity.hash).toEqual("9592c24f4e49e9cb3faa8590");
        SpecUtils.assertNearEqual(activity.distance_raw, 780);
        SpecUtils.assertNearEqual(activity.extendedStats.calories, 224);
        SpecUtils.assertNearEqual(activity.extendedStats.caloriesPerHour, 581);
        SpecUtils.assertNearEqual(activity.extendedStats.swimSwolf, 59);
        SpecUtils.assertNearEqualTime(activity.moving_time_raw, "21:21");
        SpecUtils.assertNearEqualTime(activity.elapsed_time_raw, "23:10");
        SpecUtils.assertNearEqualTime(activity.extendedStats.cadenceData.cadenceActiveTime, "21:21");

        expect(activity.moving_time_raw).toBeLessThanOrEqual(activity.elapsed_time_raw);

        SpecUtils.endTrackAssertFailed();

        done();
      });
    });

    it("should perform sync and calculation on open water swim", done => {
      injectActivityForTesting(`${__dirname}/integration-fixtures/swimming/open-water-swim.gpx`);

      // When
      const promise = fileConnector.syncFiles(syncEvents$);

      // Then
      promise.then(() => {
        const activity = extractResultActivity();

        SpecUtils.startTrackAssertFailed();

        expect(activity.type).toEqual(ElevateSport.Swim);
        expect(activity.hash).toEqual("6e3bcc8a2fe8da5913de3fe5");
        SpecUtils.assertNearEqual(activity.distance_raw, 2536);
        SpecUtils.assertNearEqualTime(activity.moving_time_raw, "01:10:03");
        SpecUtils.assertNearEqualTime(activity.elapsed_time_raw, "01:14:47");
        SpecUtils.assertNearEqual(activity.extendedStats.calories, 949);

        expect(activity.moving_time_raw).toBeLessThanOrEqual(activity.elapsed_time_raw);

        SpecUtils.endTrackAssertFailed();

        done();
      });
    });

    it("should perform sync and calculation on spiros-01 swim (https://www.strava.com/activities/4232464474)", done => {
      injectActivityForTesting(`${__dirname}/integration-fixtures/swimming/spiros-01.fit`);

      // When
      const promise = fileConnector.syncFiles(syncEvents$);

      // Then
      promise.then(() => {
        const activity = extractResultActivity();

        SpecUtils.startTrackAssertFailed();

        expect(activity.type).toEqual(ElevateSport.Swim);
        SpecUtils.assertNearEqual(activity.distance_raw, 2300);
        SpecUtils.assertNearEqualTime(activity.moving_time_raw, "41:18");
        SpecUtils.assertNearEqualTime(activity.elapsed_time_raw, "01:06:22");
        SpecUtils.assertNearEqual(activity.extendedStats.paceData.swimStressScore, 638);
        SpecUtils.assertNearEqual(activity.extendedStats.calories, 434);

        expect(activity.moving_time_raw).toBeLessThanOrEqual(activity.elapsed_time_raw);

        SpecUtils.endTrackAssertFailed();

        done();
      });
    });

    it("should perform sync and calculation on spiros-02 swim (https://www.strava.com/activities/4126640979)", done => {
      injectActivityForTesting(`${__dirname}/integration-fixtures/swimming/spiros-02.fit`);

      // When
      const promise = fileConnector.syncFiles(syncEvents$);

      // Then
      promise.then(() => {
        const activity = extractResultActivity();

        SpecUtils.startTrackAssertFailed();

        expect(activity.type).toEqual(ElevateSport.Swim);
        SpecUtils.assertNearEqual(activity.distance_raw, 2000);
        SpecUtils.assertNearEqualTime(activity.moving_time_raw, "34:31");
        SpecUtils.assertNearEqualTime(activity.elapsed_time_raw, "52:32");
        SpecUtils.assertNearEqual(activity.extendedStats.paceData.swimStressScore, 569);
        SpecUtils.assertNearEqual(activity.extendedStats.calories, 362);

        expect(activity.moving_time_raw).toBeLessThanOrEqual(activity.elapsed_time_raw);

        SpecUtils.endTrackAssertFailed();

        done();
      });
    });
  });
});
