import { ActivityFile, ActivityFileType, FileConnector } from "./file.connector";
import {
  ActivityStreamsModel,
  AthleteModel,
  AthleteSettingsModel,
  AthleteSnapshotModel,
  DatedAthleteSettingsModel,
  Gender,
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

  function extractResultStream(): ActivityStreamsModel {
    return ActivityStreamsModel.inflate(syncEventsSpy.calls.mostRecent().args[0].compressedStream);
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

    const athleteSnapshotModel: AthleteSnapshotModel = new AthleteSnapshotModel(Gender.MEN, athleteSettingsModel);
    const athleteModel = new AthleteModel(Gender.MEN, [new DatedAthleteSettingsModel(null, athleteSettingsModel)]);

    fileConnectorConfig = {
      connectorSyncDateTime: null,
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
        expect(activity.hash).toEqual("0e173a5b150ad02f47216c07");
        expect(activity.start_time).toEqual("2015-07-10T08:58:32.000Z");
        expect(activity.end_time).toEqual("2015-07-10T15:05:48.000Z");
        expect(activity.trainer).toBeFalsy();
        expect(activity.hasPowerMeter).toBeFalsy();
        expect(activity.moving_time_raw).toEqual(activity.extendedStats.movingTime);
        expect(activity.elapsed_time_raw).toEqual(activity.extendedStats.elapsedTime);
        SpecUtils.assertNearEqual(activity.distance_raw, 141924.84, 1);
        SpecUtils.assertNearEqual(activity.elevation_gain_raw, 2086, 1);
        SpecUtils.assertNearEqual(activity.latLngCenter[0], 45.128159, 5);
        SpecUtils.assertNearEqual(activity.latLngCenter[1], 5.9212365, 5);
        SpecUtils.assertNearEqualTime(activity.moving_time_raw, "05:24:26");
        SpecUtils.assertNearEqualTime(activity.elapsed_time_raw, "06:07:13");
        SpecUtils.assertNearEqual(activity.extendedStats.calories, 4058);
        SpecUtils.assertNearEqual(activity.extendedStats.caloriesPerHour, 663);

        // Speed
        SpecUtils.assertNearEqual(activity.extendedStats.speedData.genuineAvgSpeed, 26.3, 1);
        SpecUtils.assertNearEqual(activity.extendedStats.speedData.totalAvgSpeed, 23.2, 1);
        SpecUtils.assertNearEqual(activity.extendedStats.speedData.avgPace, 135);
        SpecUtils.assertNearEqual(activity.extendedStats.speedData.best20min, 42);
        SpecUtils.assertNearEqual(activity.extendedStats.speedData.maxSpeed, 66.5, 1);
        SpecUtils.assertNearEqual(activity.extendedStats.speedData.lowerQuartileSpeed, 13.8, 1);
        SpecUtils.assertNearEqual(activity.extendedStats.speedData.medianSpeed, 26.2, 1);
        SpecUtils.assertNearEqual(activity.extendedStats.speedData.upperQuartileSpeed, 35.6, 1);
        SpecUtils.assertNearEqual(activity.extendedStats.speedData.standardDeviationSpeed, 12.9, 1);

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
        SpecUtils.assertNearEqual(activity.extendedStats.powerData.avgWatts, 185);
        SpecUtils.assertNearEqual(activity.extendedStats.powerData.avgWattsPerKg, 2.47, 2);
        SpecUtils.assertNearEqual(activity.extendedStats.powerData.weightedPower, 223);
        SpecUtils.assertNearEqual(activity.extendedStats.powerData.weightedWattsPerKg, 3.01, 2);
        SpecUtils.assertNearEqual(activity.extendedStats.powerData.best20min, 283);
        SpecUtils.assertNearEqual(activity.extendedStats.powerData.bestEightyPercent, 175);
        SpecUtils.assertNearEqual(activity.extendedStats.powerData.lowerQuartileWatts, 128);
        SpecUtils.assertNearEqual(activity.extendedStats.powerData.medianWatts, 201);
        SpecUtils.assertNearEqual(activity.extendedStats.powerData.upperQuartileWatts, 246);
        SpecUtils.assertNearEqual(activity.extendedStats.powerData.maxPower, 1201);
        SpecUtils.assertNearEqual(activity.extendedStats.powerData.powerStressScore, 626);
        SpecUtils.assertNearEqual(activity.extendedStats.powerData.powerStressScorePerHour, 115);
        SpecUtils.assertNearEqual(activity.extendedStats.powerData.punchFactor, 1.07, 2);
        SpecUtils.assertNearEqual(activity.extendedStats.powerData.variabilityIndex, 1.22, 2);
        expect(activity.extendedStats.powerData.hasPowerMeter).toBeFalsy();

        // Cadence
        SpecUtils.assertNearEqual(activity.extendedStats.cadenceData.averageCadence, 67);
        SpecUtils.assertNearEqual(activity.extendedStats.cadenceData.averageActiveCadence, 78);
        SpecUtils.assertNearEqual(activity.extendedStats.cadenceData.cadenceActivePercentage, 87);
        SpecUtils.assertNearEqual(activity.extendedStats.cadenceData.maxCadence, 118);
        SpecUtils.assertNearEqualTime(activity.extendedStats.cadenceData.cadenceActiveTime, 17083);
        SpecUtils.assertNearEqual(activity.extendedStats.cadenceData.upFlatDownCadencePaceData.up, 72);
        SpecUtils.assertNearEqual(activity.extendedStats.cadenceData.upFlatDownCadencePaceData.flat, 83);
        SpecUtils.assertNearEqual(activity.extendedStats.cadenceData.upFlatDownCadencePaceData.down, 86);
        SpecUtils.assertNearEqual(activity.extendedStats.cadenceData.standardDeviationCadence, 13);
        SpecUtils.assertNearEqual(activity.extendedStats.cadenceData.totalOccurrences, 24291);
        SpecUtils.assertNearEqual(activity.extendedStats.cadenceData.averageDistancePerOccurrence, 5.84, 2);
        SpecUtils.assertNearEqual(activity.extendedStats.cadenceData.medianCadence, 81);
        SpecUtils.assertNearEqual(activity.extendedStats.cadenceData.lowerQuartileCadence, 69);
        SpecUtils.assertNearEqual(activity.extendedStats.cadenceData.upperQuartileCadence, 89);

        // Grade
        SpecUtils.assertNearEqual(activity.extendedStats.gradeData.avgGrade, 1.6, 1);
        SpecUtils.assertNearEqual(activity.extendedStats.gradeData.avgMaxGrade, 12.8, 1);
        SpecUtils.assertNearEqual(activity.extendedStats.gradeData.avgMinGrade, -15);
        SpecUtils.assertNearEqual(activity.extendedStats.gradeData.lowerQuartileGrade, -1);
        SpecUtils.assertNearEqual(activity.extendedStats.gradeData.medianGrade, 1);
        SpecUtils.assertNearEqual(activity.extendedStats.gradeData.upperQuartileGrade, 5);
        SpecUtils.assertNearEqual(activity.extendedStats.gradeData.upFlatDownDistanceData.down, 41.3, 1);
        SpecUtils.assertNearEqual(activity.extendedStats.gradeData.upFlatDownDistanceData.flat, 61.6, 1);
        SpecUtils.assertNearEqual(activity.extendedStats.gradeData.upFlatDownDistanceData.up, 39.5, 1);
        SpecUtils.assertNearEqual(activity.extendedStats.gradeData.upFlatDownMoveData.down, 40.8, 1);
        SpecUtils.assertNearEqual(activity.extendedStats.gradeData.upFlatDownMoveData.flat, 31.4, 1);
        SpecUtils.assertNearEqual(activity.extendedStats.gradeData.upFlatDownMoveData.up, 15.6, 1);
        expect(activity.extendedStats.gradeData.gradeProfile).toEqual(GradeProfile.HILLY);

        // Elevation
        SpecUtils.assertNearEqual(activity.extendedStats.elevationData.accumulatedElevationAscent, 2086);
        SpecUtils.assertNearEqual(activity.extendedStats.elevationData.accumulatedElevationDescent, 2073);
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

        SpecUtils.assertNearEqual(activity.extendedStats.cadenceData.maxCadence, 167);
        SpecUtils.assertNearEqual(activity.extendedStats.cadenceData.upFlatDownCadencePaceData.up, 71);
        SpecUtils.assertNearEqual(activity.extendedStats.cadenceData.upFlatDownCadencePaceData.flat, 79);
        SpecUtils.assertNearEqual(activity.extendedStats.cadenceData.upFlatDownCadencePaceData.down, 87);

        SpecUtils.assertNearEqual(activity.extendedStats.gradeData.upFlatDownMoveData.down, 39.8, 1);
        SpecUtils.assertNearEqual(activity.extendedStats.gradeData.upFlatDownMoveData.up, 16.6, 1);

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
        SpecUtils.assertNearEqualTime(activity.moving_time_raw, "01:25:40");
        SpecUtils.assertNearEqualTime(activity.elapsed_time_raw, "03:05:14");

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

        SpecUtils.assertNearEqual(activity.elevation_gain_raw, 623);
        expect(activity.moving_time_raw).toEqual(activity.extendedStats.movingTime);
        expect(activity.elapsed_time_raw).toEqual(activity.extendedStats.elapsedTime);

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
        expect(activity.hash).toEqual("b39e1541091f1a3f919a725f");
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
        SpecUtils.assertNearEqual(activity.extendedStats.speedData.lowerQuartileSpeed, 10.2, 1);
        SpecUtils.assertNearEqual(activity.extendedStats.speedData.upperQuartileSpeed, 14.21, 2);
        SpecUtils.assertNearEqual(activity.extendedStats.speedData.maxSpeed, 12.24, 2);
        SpecUtils.assertNearEqual(activity.extendedStats.speedData.medianSpeed, 12.3, 2);
        SpecUtils.assertNearEqual(activity.extendedStats.speedData.standardDeviationSpeed, 3.16, 2);

        // Pace
        SpecUtils.assertNearEqualTime(activity.extendedStats.paceData.avgPace, "04:54");
        SpecUtils.assertNearEqual(activity.extendedStats.paceData.best20min, 296);
        SpecUtils.assertNearEqualTime(activity.extendedStats.paceData.genuineGradeAdjustedAvgPace, "04:20");
        SpecUtils.assertNearEqual(activity.extendedStats.paceData.lowerQuartilePace, 354);
        SpecUtils.assertNearEqual(activity.extendedStats.paceData.maxPace, 294);
        SpecUtils.assertNearEqual(activity.extendedStats.paceData.medianPace, 293);
        SpecUtils.assertNearEqual(activity.extendedStats.paceData.runningStressScore, 153);
        SpecUtils.assertNearEqual(activity.extendedStats.paceData.runningStressScorePerHour, 112);
        SpecUtils.assertNearEqual(activity.extendedStats.paceData.upperQuartilePace, 254);
        SpecUtils.assertNearEqual(activity.extendedStats.paceData.standardDeviationPace, 1140);

        expect(activity.extendedStats.paceData.genuineGradeAdjustedAvgPace).toBeLessThanOrEqual(
          activity.extendedStats.paceData.avgPace
        );

        // Heart-rate: No heart-rate data

        // Power
        SpecUtils.assertNearEqual(activity.extendedStats.powerData.maxPower, 1774);
        SpecUtils.assertNearEqual(activity.extendedStats.powerData.avgWatts, 284);
        SpecUtils.assertNearEqual(activity.extendedStats.powerData.avgWattsPerKg, 3.78, 2);
        SpecUtils.assertNearEqual(activity.extendedStats.powerData.weightedPower, 370);
        SpecUtils.assertNearEqual(activity.extendedStats.powerData.weightedWattsPerKg, 4.93, 2);
        SpecUtils.assertNearEqual(activity.extendedStats.powerData.best20min, 386);
        SpecUtils.assertNearEqual(activity.extendedStats.powerData.bestEightyPercent, 290);
        SpecUtils.assertNearEqual(activity.extendedStats.powerData.variabilityIndex, 1.3, 2);
        SpecUtils.assertNearEqual(activity.extendedStats.powerData.lowerQuartileWatts, 56);
        SpecUtils.assertNearEqual(activity.extendedStats.powerData.medianWatts, 236);
        SpecUtils.assertNearEqual(activity.extendedStats.powerData.upperQuartileWatts, 410);
        expect(activity.extendedStats.powerData.hasPowerMeter).toBeFalsy();
        expect(activity.extendedStats.powerData.powerStressScore).toBeNull(); // Until running power threshold is supported
        expect(activity.extendedStats.powerData.powerStressScorePerHour).toBeNull(); // Until running power threshold is supported
        expect(activity.extendedStats.powerData.punchFactor).toBeNull(); // Until running power threshold is supported

        // Cadence
        SpecUtils.assertNearEqual(activity.extendedStats.cadenceData.averageCadence, 85);
        SpecUtils.assertNearEqual(activity.extendedStats.cadenceData.averageActiveCadence, 85);
        SpecUtils.assertNearEqual(activity.extendedStats.cadenceData.cadenceActivePercentage, 98);
        SpecUtils.assertNearEqual(activity.extendedStats.cadenceData.averageDistancePerOccurrence, 1.21, 2);
        SpecUtils.assertNearEqualTime(activity.extendedStats.cadenceData.cadenceActiveTime, "01:20:33");
        SpecUtils.assertNearEqual(activity.extendedStats.cadenceData.lowerQuartileCadence, 84);
        SpecUtils.assertNearEqual(activity.extendedStats.cadenceData.maxCadence, 106);
        SpecUtils.assertNearEqual(activity.extendedStats.cadenceData.medianCadence, 85);
        SpecUtils.assertNearEqual(activity.extendedStats.cadenceData.standardDeviationCadence, 4.18, 2);
        SpecUtils.assertNearEqual(activity.extendedStats.cadenceData.upFlatDownCadencePaceData.down, 86);
        SpecUtils.assertNearEqual(activity.extendedStats.cadenceData.upFlatDownCadencePaceData.flat, 85);
        SpecUtils.assertNearEqual(activity.extendedStats.cadenceData.upFlatDownCadencePaceData.up, 86);

        // Grade
        SpecUtils.assertNearEqual(activity.extendedStats.gradeData.avgGrade, 1.16, 2);
        SpecUtils.assertNearEqual(activity.extendedStats.gradeData.avgMaxGrade, 28.29, 2);
        SpecUtils.assertNearEqual(activity.extendedStats.gradeData.avgMinGrade, -45.25, 2);
        SpecUtils.assertNearEqual(activity.extendedStats.gradeData.lowerQuartileGrade, -3.9, 1);
        SpecUtils.assertNearEqual(activity.extendedStats.gradeData.upperQuartileGrade, 7.5, 1);
        SpecUtils.assertNearEqual(activity.extendedStats.gradeData.upFlatDownDistanceData.down, 6.75, 2);
        SpecUtils.assertNearEqual(activity.extendedStats.gradeData.upFlatDownDistanceData.flat, 3.09, 2);
        SpecUtils.assertNearEqual(activity.extendedStats.gradeData.upFlatDownDistanceData.up, 6.89, 2);
        SpecUtils.assertNearEqual(activity.extendedStats.gradeData.upFlatDownMoveData.down, 13.75, 2);
        SpecUtils.assertNearEqual(activity.extendedStats.gradeData.upFlatDownMoveData.flat, 12.56, 2);
        SpecUtils.assertNearEqual(activity.extendedStats.gradeData.upFlatDownMoveData.up, 10.75, 2);
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
        SpecUtils.assertNearEqual(activity.extendedStats.elevationData.ascentSpeed.avg, 878);

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

        SpecUtils.assertNearEqual(activity.elevation_gain_raw, 413);
        SpecUtils.assertNearEqualTime(activity.extendedStats.paceData.avgPace, "09:19");
        SpecUtils.assertNearEqualTime(activity.extendedStats.paceData.genuineGradeAdjustedAvgPace, "06:54");
        SpecUtils.assertNearEqualTime(activity.moving_time_raw, "57:34");
        SpecUtils.assertNearEqualTime(activity.elapsed_time_raw, "1:07:50");
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

        SpecUtils.assertNearEqual(activity.elevation_gain_raw, 89);
        SpecUtils.assertNearEqualTime(activity.extendedStats.paceData.avgPace, "08:19");
        SpecUtils.assertNearEqualTime(activity.extendedStats.paceData.genuineGradeAdjustedAvgPace, "08:18");
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
        SpecUtils.assertNearEqualTime(activity.extendedStats.paceData.genuineGradeAdjustedAvgPace, "06:51");
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
        SpecUtils.assertNearEqualTime(activity.extendedStats.paceData.genuineGradeAdjustedAvgPace, "06:55");
        SpecUtils.assertNearEqualTime(activity.moving_time_raw, "39:00");
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
        SpecUtils.assertNearEqualTime(activity.extendedStats.paceData.avgPace, "09:26");
        SpecUtils.assertNearEqualTime(activity.extendedStats.paceData.genuineGradeAdjustedAvgPace, "05:58");
        SpecUtils.assertNearEqualTime(activity.moving_time_raw, "45:24");
        SpecUtils.assertNearEqualTime(activity.elapsed_time_raw, "1:07:19");
        expect(activity.extendedStats.paceData.genuineGradeAdjustedAvgPace).toBeLessThanOrEqual(
          activity.extendedStats.paceData.avgPace
        );
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
        expect(activity.hash).toEqual("00034a56392c2e78092cd762");
        SpecUtils.assertNearEqual(activity.distance_raw, 780);
        SpecUtils.assertNearEqual(activity.extendedStats.calories, 224);
        SpecUtils.assertNearEqual(activity.extendedStats.caloriesPerHour, 600);
        SpecUtils.assertNearEqual(activity.extendedStats.swimSwolf, 62);
        SpecUtils.assertNearEqualTime(activity.moving_time_raw, "21:21");
        SpecUtils.assertNearEqualTime(activity.elapsed_time_raw, "22:26");
        SpecUtils.assertNearEqualTime(activity.extendedStats.cadenceData.cadenceActiveTime, "21:21");

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
        expect(activity.hash).toEqual("2041533dd2a7055036fa1dbd");
        SpecUtils.assertNearEqual(activity.distance_raw, 2536);
        SpecUtils.assertNearEqual(activity.extendedStats.calories, 603);
        SpecUtils.assertNearEqualTime(activity.moving_time_raw, "57:28");
        SpecUtils.assertNearEqualTime(activity.elapsed_time_raw, "01:14:47");

        SpecUtils.endTrackAssertFailed();

        done();
      });
    });
  });
});
