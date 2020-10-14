import {
  ActivitySourceDataModel,
  ActivityStreamsModel,
  AnalysisDataModel,
  AthleteSettingsModel,
  AthleteSnapshotModel,
  Gender,
  UserSettings
} from "@elevate/shared/models";
import { ElevateSport } from "@elevate/shared/enums";
import _ from "lodash";
import { ActivityComputer } from "@elevate/shared/sync";
import streamJson from "../fixtures/723224273/stream.json";
import activitySourceDataJson from "../fixtures/723224273/activitySourceData.json";
import UserSettingsModel = UserSettings.UserSettingsModel;
import DesktopUserSettingsModel = UserSettings.DesktopUserSettingsModel;

describe("ActivityComputer", () => {
  // Cycling
  it('should compute correctly "Bon rythme ! 33 KPH !" @ https://www.strava.com/activities/723224273', done => {
    const stream = _.cloneDeep(streamJson) as ActivityStreamsModel;
    const activitySourceData = (_.cloneDeep(activitySourceDataJson) as unknown) as ActivitySourceDataModel;
    const powerMeter = false;

    const userSettingsMock: UserSettingsModel = DesktopUserSettingsModel.DEFAULT_MODEL;
    const athleteSnapshot = new AthleteSnapshotModel(
      Gender.MEN,
      new AthleteSettingsModel(200, 45, null, 240, null, null, 71.9)
    );

    stream.watts = stream.watts_calc; // because powerMeter is false

    const isOwner = true;
    const activityComputer: ActivityComputer = new ActivityComputer(
      ElevateSport.Ride,
      powerMeter,
      userSettingsMock,
      athleteSnapshot,
      isOwner,
      powerMeter,
      stream,
      null,
      true,
      true,
      activitySourceData
    );

    const result: AnalysisDataModel = activityComputer.compute();

    expect(result).not.toBeNull();
    expect(result.speedData).not.toBeNull();
    expect(result.cadenceData).not.toBeNull();
    expect(result.heartRateData).not.toBeNull();
    expect(result.powerData).not.toBeNull();
    expect(result.gradeData).not.toBeNull();
    expect(result.elevationData).not.toBeNull();
    expect(result.paceData).not.toBeNull();

    // Test extended stats
    expect(_.floor(result.moveRatio, 1)).toEqual(0.9);
    expect(_.floor(result.speedData.genuineAvgSpeed, 1)).toEqual(33.0);
    expect(_.floor(result.speedData.totalAvgSpeed, 1)).toEqual(33.0);
    expect(_.floor(result.speedData.avgPace, 1)).toEqual(108);
    expect(_.floor(result.speedData.lowerQuartileSpeed, 1)).toEqual(27.3);
    expect(_.floor(result.speedData.medianSpeed, 1)).toEqual(33.4);
    expect(_.floor(result.speedData.upperQuartileSpeed, 1)).toEqual(38.8);
    expect(_.floor(result.speedData.varianceSpeed, 1)).toEqual(73.8);
    expect(_.floor(result.speedData.standardDeviationSpeed, 1)).toEqual(8.5);

    expect(_.floor(result.paceData.avgPace, 1)).toEqual(108);
    expect(_.floor(result.paceData.lowerQuartilePace, 1)).toEqual(131.5);
    expect(_.floor(result.paceData.medianPace, 1)).toEqual(107.5);
    expect(_.floor(result.paceData.upperQuartilePace, 1)).toEqual(92.5);
    expect(_.floor(result.paceData.variancePace, 1)).toEqual(48.7);

    expect(result.powerData.hasPowerMeter).toEqual(false);
    expect(_.floor(result.powerData.avgWatts, 1)).toEqual(210.6);
    expect(_.floor(result.powerData.weightedPower, 1)).toEqual(244.6);

    expect(_.floor(result.heartRateData.TRIMP, 1)).toEqual(228.4);
    expect(_.floor(result.heartRateData.TRIMPPerHour, 1)).toEqual(134.2);
    expect(_.floor(result.heartRateData.lowerQuartileHeartRate, 1)).toEqual(161);
    expect(_.floor(result.heartRateData.medianHeartRate, 1)).toEqual(167);
    expect(_.floor(result.heartRateData.upperQuartileHeartRate, 1)).toEqual(174);
    expect(_.floor(result.heartRateData.averageHeartRate, 1)).toEqual(164.3);
    expect(_.floor(result.heartRateData.maxHeartRate, 1)).toEqual(190);
    expect(_.floor(result.heartRateData.activityHeartRateReserve, 1)).toEqual(76.9);
    expect(_.floor(result.heartRateData.activityHeartRateReserveMax, 1)).toEqual(93.5);

    expect(_.floor(result.cadenceData.cadencePercentageMoving, 1)).toEqual(89.2);
    expect(_.floor(result.cadenceData.cadenceTimeMoving, 1)).toEqual(5463);
    expect(_.floor(result.cadenceData.averageCadenceMoving, 1)).toEqual(84.1);
    expect(_.floor(result.cadenceData.standardDeviationCadence, 1)).toEqual(15.7);
    expect(_.floor(result.cadenceData.totalOccurrences, 1)).toEqual(7740.9);
    expect(_.floor(result.cadenceData.lowerQuartileCadence, 1)).toEqual(79);
    expect(_.floor(result.cadenceData.medianCadence, 1)).toEqual(87);
    expect(_.floor(result.cadenceData.upperQuartileCadence, 1)).toEqual(93);

    expect(_.floor(result.gradeData.avgGrade, 1)).toEqual(0.0);
    expect(_.floor(result.gradeData.avgMaxGrade, 1)).toEqual(8.8);
    expect(_.floor(result.gradeData.avgMinGrade, 1)).toEqual(-9.2);
    expect(_.floor(result.gradeData.lowerQuartileGrade, 1)).toEqual(-1.3);
    expect(_.floor(result.gradeData.medianGrade, 1)).toEqual(0);
    expect(_.floor(result.gradeData.upperQuartileGrade, 1)).toEqual(1.5);
    expect(result.gradeData.gradeProfile).toEqual("HILLY");
    expect(_.floor(result.gradeData.upFlatDownInSeconds.up, 1)).toEqual(1745);
    expect(_.floor(result.gradeData.upFlatDownInSeconds.flat, 1)).toEqual(3278);
    expect(_.floor(result.gradeData.upFlatDownInSeconds.down, 1)).toEqual(1103);
    expect(_.floor(result.gradeData.upFlatDownInSeconds.total, 1)).toEqual(6126);
    expect(_.floor(result.gradeData.upFlatDownMoveData.up, 1)).toEqual(26.3);
    expect(_.floor(result.gradeData.upFlatDownMoveData.flat, 1)).toEqual(34.5);
    expect(_.floor(result.gradeData.upFlatDownMoveData.down, 1)).toEqual(39.2);
    expect(_.floor(result.gradeData.upFlatDownDistanceData.up, 1)).toEqual(12.7);
    expect(_.floor(result.gradeData.upFlatDownDistanceData.flat, 1)).toEqual(31.4);
    expect(_.floor(result.gradeData.upFlatDownDistanceData.down, 1)).toEqual(12.0);

    expect(_.floor(result.elevationData.avgElevation, 1)).toEqual(240);
    expect(_.floor(result.elevationData.accumulatedElevationAscent, 1)).toEqual(451);
    expect(_.floor(result.elevationData.accumulatedElevationDescent, 1)).toEqual(438.9);
    expect(_.floor(result.elevationData.lowerQuartileElevation, 1)).toEqual(215);
    expect(_.floor(result.elevationData.medianElevation, 1)).toEqual(231);
    expect(_.floor(result.elevationData.upperQuartileElevation, 1)).toEqual(246);

    done();
  });

  describe("compute stress scores", () => {
    let _ATHLETE_MODEL_SNAP_: AthleteSnapshotModel;

    beforeEach(done => {
      _ATHLETE_MODEL_SNAP_ = new AthleteSnapshotModel(
        Gender.MEN,
        new AthleteSettingsModel(
          190,
          60,
          {
            default: 163,
            cycling: null,
            running: null
          },
          150,
          300,
          31,
          70
        )
      );
      done();
    });

    it("should compute hrSS", done => {
      // Given
      const activityTrainingImpulse = 333;
      const expectedStressScore = 239;

      // When
      const heartRateStressScore = ActivityComputer.computeHeartRateStressScore(
        _ATHLETE_MODEL_SNAP_.gender,
        _ATHLETE_MODEL_SNAP_.athleteSettings.maxHr,
        _ATHLETE_MODEL_SNAP_.athleteSettings.restHr,
        _ATHLETE_MODEL_SNAP_.athleteSettings.lthr.default,
        activityTrainingImpulse
      );

      // Then
      expect(Math.floor(heartRateStressScore)).toEqual(expectedStressScore);
      done();
    });

    it("should compute hrSS without lactate threshold given (has to use Karvonen formula with 85% of HRR)", done => {
      // Given
      _ATHLETE_MODEL_SNAP_.athleteSettings.lthr.default = 170.5;
      const activityTrainingImpulse = 333;
      const expectedStressScore = 199;

      // When
      const heartRateStressScore = ActivityComputer.computeHeartRateStressScore(
        _ATHLETE_MODEL_SNAP_.gender,
        _ATHLETE_MODEL_SNAP_.athleteSettings.maxHr,
        _ATHLETE_MODEL_SNAP_.athleteSettings.restHr,
        _ATHLETE_MODEL_SNAP_.athleteSettings.lthr.default,
        activityTrainingImpulse
      );

      // Then
      expect(Math.floor(heartRateStressScore)).toEqual(expectedStressScore);

      done();
    });

    // Compute Running Stress Score (RSS)
    it("should compute RSS (1)", done => {
      // Given
      const expectedStressScore = 100;
      const movingTime = 3600; // 1 hours
      const gradeAdjustedPace = 300; // 300sec or 00:05:00/dist.
      const runningThresholdPace = 300; // 300sec or 00:05:00/dist.

      // When
      const runningStressScore = ActivityComputer.computeRunningStressScore(
        movingTime,
        gradeAdjustedPace,
        runningThresholdPace
      );

      // Then
      expect(Math.floor(runningStressScore)).toEqual(expectedStressScore);
      done();
    });

    it("should compute RSS (2)", done => {
      // Given
      const expectedStressScore = 100;
      const movingTime = 3600; // 1 hours
      const gradeAdjustedPace = 300; // 300sec or 00:05:00/dist.
      const runningThresholdPace = 600; // 600sec or 00:10:00/dist.

      // When
      const runningStressScore = ActivityComputer.computeRunningStressScore(
        movingTime,
        gradeAdjustedPace,
        runningThresholdPace
      );

      // Then
      expect(Math.floor(runningStressScore)).toBeGreaterThan(expectedStressScore);
      done();
    });
  });

  describe("manage lthr preferences", () => {
    let _ATHLETE_MODEL_SNAP_: AthleteSnapshotModel;

    beforeEach(done => {
      _ATHLETE_MODEL_SNAP_ = new AthleteSnapshotModel(
        Gender.MEN,
        new AthleteSettingsModel(
          190,
          60,
          {
            default: 163,
            cycling: null,
            running: null
          },
          150,
          300,
          31,
          70
        )
      );
      done();
    });

    it("should resolve LTHR without user LTHR preferences, activityType='Ride'", done => {
      // Given
      const activityType = ElevateSport.Ride;
      const expectedLTHR = 170.5;
      _ATHLETE_MODEL_SNAP_.athleteSettings.lthr = {
        default: null,
        cycling: null,
        running: null
      };

      // When
      const lthr = ActivityComputer.resolveLTHR(activityType, _ATHLETE_MODEL_SNAP_.athleteSettings);

      // Then
      expect(lthr).toEqual(expectedLTHR);
      done();
    });

    it("should resolve LTHR without user LTHR preferences (empty), activityType='Ride'", done => {
      // Given
      const activityType = ElevateSport.Ride;
      const expectedLTHR = 170.5;
      _ATHLETE_MODEL_SNAP_.athleteSettings.lthr = null;

      // When
      const lthr = ActivityComputer.resolveLTHR(activityType, _ATHLETE_MODEL_SNAP_.athleteSettings);

      // Then
      expect(lthr).toEqual(expectedLTHR);
      done();
    });

    it("should resolve LTHR without user LTHR preferences, activityType='Run'", done => {
      // Given
      const activityType = ElevateSport.Run;
      const expectedLTHR = 170.5;
      _ATHLETE_MODEL_SNAP_.athleteSettings.lthr = {
        default: null,
        cycling: null,
        running: null
      };

      // When
      const lthr = ActivityComputer.resolveLTHR(activityType, _ATHLETE_MODEL_SNAP_.athleteSettings);

      // Then
      expect(lthr).toEqual(expectedLTHR);
      done();
    });

    it("should resolve LTHR without user LTHR preferences, activityType='Rowing'", done => {
      // Given
      const activityType = ElevateSport.Rowing;
      const expectedLTHR = 163;
      _ATHLETE_MODEL_SNAP_.athleteSettings.lthr = {
        default: 163,
        cycling: 175,
        running: 185
      };

      // When
      const lthr = ActivityComputer.resolveLTHR(activityType, _ATHLETE_MODEL_SNAP_.athleteSettings);

      // Then
      expect(lthr).toEqual(expectedLTHR);
      done();
    });

    it("should resolve LTHR with user Default LTHR=163, activityType='Ride'", done => {
      // Given
      const activityType = ElevateSport.Ride;
      const expectedLTHR = 163;
      _ATHLETE_MODEL_SNAP_.athleteSettings.lthr = {
        default: 163,
        cycling: null,
        running: null
      };

      // When
      const lthr = ActivityComputer.resolveLTHR(activityType, _ATHLETE_MODEL_SNAP_.athleteSettings);

      // Then
      expect(lthr).toEqual(expectedLTHR);
      done();
    });

    it("should resolve LTHR with user Default LTHR=163, activityType='Run'", done => {
      // Given
      const activityType = ElevateSport.Run;
      const expectedLTHR = 163;
      _ATHLETE_MODEL_SNAP_.athleteSettings.lthr = {
        default: 163,
        cycling: null,
        running: null
      };

      // When
      const lthr = ActivityComputer.resolveLTHR(activityType, _ATHLETE_MODEL_SNAP_.athleteSettings);

      // Then
      expect(lthr).toEqual(expectedLTHR);
      done();
    });

    it("should resolve LTHR with user Default LTHR=163, activityType='Rowing'", done => {
      // Given
      const activityType = ElevateSport.Rowing;
      const expectedLTHR = 163;
      _ATHLETE_MODEL_SNAP_.athleteSettings.lthr = {
        default: 163,
        cycling: null,
        running: null
      };

      // When
      const lthr = ActivityComputer.resolveLTHR(activityType, _ATHLETE_MODEL_SNAP_.athleteSettings);

      // Then
      expect(lthr).toEqual(expectedLTHR);
      done();
    });

    it("should resolve LTHR with user Default LTHR=163, Cycling LTHR=175, activityType='Ride'", done => {
      // Given
      const activityType = ElevateSport.Ride;
      const expectedLTHR = 175;
      _ATHLETE_MODEL_SNAP_.athleteSettings.lthr = {
        default: 163,
        cycling: 175,
        running: null
      };

      // When
      const lthr = ActivityComputer.resolveLTHR(activityType, _ATHLETE_MODEL_SNAP_.athleteSettings);

      // Then
      expect(lthr).toEqual(expectedLTHR);
      done();
    });

    it("should resolve LTHR with user Cycling LTHR=175, activityType='VirtualRide'", done => {
      // Given
      const activityType = ElevateSport.VirtualRide;
      const expectedLTHR = 175;
      _ATHLETE_MODEL_SNAP_.athleteSettings.lthr = {
        default: null,
        cycling: 175,
        running: null
      };

      // When
      const lthr = ActivityComputer.resolveLTHR(activityType, _ATHLETE_MODEL_SNAP_.athleteSettings);

      // Then
      expect(lthr).toEqual(expectedLTHR);
      done();
    });

    it("should resolve LTHR with user Cycling LTHR=175, Running LTHR=185, activityType='EBikeRide'", done => {
      // Given
      const activityType = ElevateSport.EBikeRide;
      const expectedLTHR = 175;
      _ATHLETE_MODEL_SNAP_.athleteSettings.lthr = {
        default: null,
        cycling: 175,
        running: 185
      };

      // When
      const lthr = ActivityComputer.resolveLTHR(activityType, _ATHLETE_MODEL_SNAP_.athleteSettings);

      // Then
      expect(lthr).toEqual(expectedLTHR);
      done();
    });

    it("should resolve LTHR with user Cycling LTHR=175, Running LTHR=185, activityType='Run'", done => {
      // Given
      const activityType = ElevateSport.Run;
      const expectedLTHR = 185;
      _ATHLETE_MODEL_SNAP_.athleteSettings.lthr = {
        default: null,
        cycling: 175,
        running: 185
      };

      // When
      const lthr = ActivityComputer.resolveLTHR(activityType, _ATHLETE_MODEL_SNAP_.athleteSettings);

      // Then
      expect(lthr).toEqual(expectedLTHR);
      done();
    });

    it("should resolve LTHR with user Default LTHR=163, Cycling LTHR=175, Running LTHR=185, activityType='Run'", done => {
      // Given
      const activityType = ElevateSport.Run;
      const expectedLTHR = 185;
      _ATHLETE_MODEL_SNAP_.athleteSettings.lthr = {
        default: 163,
        cycling: 175,
        running: 185
      };

      // When
      const lthr = ActivityComputer.resolveLTHR(activityType, _ATHLETE_MODEL_SNAP_.athleteSettings);

      // Then
      expect(lthr).toEqual(expectedLTHR);
      done();
    });

    it("should resolve LTHR with user Default LTHR=163, Cycling LTHR=175, Running LTHR=185, activityType='Rowing'", done => {
      // Given
      const activityType = ElevateSport.Rowing;
      const expectedLTHR = 163;
      _ATHLETE_MODEL_SNAP_.athleteSettings.lthr = {
        default: 163,
        cycling: 175,
        running: 185
      };

      // When
      const lthr = ActivityComputer.resolveLTHR(activityType, _ATHLETE_MODEL_SNAP_.athleteSettings);

      // Then
      expect(lthr).toEqual(expectedLTHR);
      done();
    });
  });

  describe("detect lack of FTPs settings", () => {
    let distance = 100;
    let movingTime = 100;
    let elapsedTime = 100;

    let analysisDataModel: AnalysisDataModel;
    let athleteSettingsModel: AthleteSettingsModel;
    let activityStreamsModel: ActivityStreamsModel;

    beforeEach(done => {
      analysisDataModel = new AnalysisDataModel();
      athleteSettingsModel = AthleteSettingsModel.DEFAULT_MODEL;
      activityStreamsModel = new ActivityStreamsModel();
      done();
    });

    describe("No heartrate monitor", () => {
      describe("Cycling", () => {
        it("should lack of cycling ftp settings WITH power stream", done => {
          [ElevateSport.Ride, ElevateSport.VirtualRide].forEach(cyclingType => {
            // Given
            athleteSettingsModel.cyclingFtp = null;
            activityStreamsModel.watts = [10, 10, 10];

            // When
            const settingsLack: boolean = ActivityComputer.hasAthleteSettingsLacks(
              distance,
              movingTime,
              elapsedTime,
              cyclingType,
              analysisDataModel,
              athleteSettingsModel,
              activityStreamsModel
            );

            // Then
            expect(settingsLack).toBeTruthy();
          });
          done();
        });

        it("should NOT lack of cycling ftp settings WITHOUT power stream", done => {
          [ElevateSport.Ride, ElevateSport.VirtualRide].forEach(cyclingType => {
            // Given
            athleteSettingsModel.cyclingFtp = null;
            activityStreamsModel.watts = [];

            // When
            const settingsLack: boolean = ActivityComputer.hasAthleteSettingsLacks(
              distance,
              movingTime,
              elapsedTime,
              cyclingType,
              analysisDataModel,
              athleteSettingsModel,
              activityStreamsModel
            );

            // Then
            expect(settingsLack).toBeFalsy();
          });
          done();
        });

        it("should NOT lack of cycling ftp settings WITH power stream", done => {
          [ElevateSport.Ride, ElevateSport.VirtualRide].forEach(cyclingType => {
            // Given
            athleteSettingsModel.cyclingFtp = 150;
            activityStreamsModel.watts = [10, 10, 10];

            // When
            const settingsLack: boolean = ActivityComputer.hasAthleteSettingsLacks(
              distance,
              movingTime,
              elapsedTime,
              cyclingType,
              analysisDataModel,
              athleteSettingsModel,
              activityStreamsModel
            );

            // Then
            expect(settingsLack).toBeFalsy();
          });
          done();
        });

        it("should NOT lack of cycling ftp settings WITHOUT power stream", done => {
          [ElevateSport.Ride, ElevateSport.VirtualRide].forEach(cyclingType => {
            // Given
            athleteSettingsModel.cyclingFtp = 150;
            activityStreamsModel.watts = [];

            // When
            const settingsLack: boolean = ActivityComputer.hasAthleteSettingsLacks(
              distance,
              movingTime,
              elapsedTime,
              cyclingType,
              analysisDataModel,
              athleteSettingsModel,
              activityStreamsModel
            );

            // Then
            expect(settingsLack).toBeFalsy();
          });
          done();
        });
      });

      describe("Running", () => {
        it("should lack of running ftp settings WITH grade adj speed stream", done => {
          [ElevateSport.Run, ElevateSport.VirtualRun].forEach(runningType => {
            // Given
            athleteSettingsModel.runningFtp = null;
            activityStreamsModel.grade_adjusted_speed = [10, 10, 10];

            // When
            const settingsLack: boolean = ActivityComputer.hasAthleteSettingsLacks(
              distance,
              movingTime,
              elapsedTime,
              runningType,
              analysisDataModel,
              athleteSettingsModel,
              activityStreamsModel
            );

            // Then
            expect(settingsLack).toBeTruthy();
          });
          done();
        });

        it("should NOT lack of running ftp settings WITHOUT grade adj speed stream", done => {
          [ElevateSport.Run, ElevateSport.VirtualRun].forEach(runningType => {
            // Given
            athleteSettingsModel.runningFtp = null;
            activityStreamsModel.grade_adjusted_speed = [];

            // When
            const settingsLack: boolean = ActivityComputer.hasAthleteSettingsLacks(
              distance,
              movingTime,
              elapsedTime,
              runningType,
              analysisDataModel,
              athleteSettingsModel,
              activityStreamsModel
            );

            // Then
            expect(settingsLack).toBeFalsy();
          });
          done();
        });

        it("should NOT lack of running ftp settings WITH grade adj speed stream", done => {
          [ElevateSport.Run, ElevateSport.VirtualRun].forEach(runningType => {
            // Given
            athleteSettingsModel.runningFtp = 150;
            activityStreamsModel.grade_adjusted_speed = [10, 10, 10];

            // When
            const settingsLack: boolean = ActivityComputer.hasAthleteSettingsLacks(
              distance,
              movingTime,
              elapsedTime,
              runningType,
              analysisDataModel,
              athleteSettingsModel,
              activityStreamsModel
            );

            // Then
            expect(settingsLack).toBeFalsy();
          });
          done();
        });

        it("should NOT lack of running ftp settings WITHOUT grade adj speed stream", done => {
          [ElevateSport.Run, ElevateSport.VirtualRun].forEach(runningType => {
            // Given
            athleteSettingsModel.runningFtp = 150;
            activityStreamsModel.grade_adjusted_speed = [];

            // When
            const settingsLack: boolean = ActivityComputer.hasAthleteSettingsLacks(
              distance,
              movingTime,
              elapsedTime,
              runningType,
              analysisDataModel,
              athleteSettingsModel,
              activityStreamsModel
            );

            // Then
            expect(settingsLack).toBeFalsy();
          });
          done();
        });
      });

      describe("Swimming", () => {
        it("should lack of swimming ftp settings WITH required params available", done => {
          // Given
          const type = ElevateSport.Swim;
          athleteSettingsModel.swimFtp = null;

          // When
          const settingsLack: boolean = ActivityComputer.hasAthleteSettingsLacks(
            distance,
            movingTime,
            elapsedTime,
            type,
            analysisDataModel,
            athleteSettingsModel,
            activityStreamsModel
          );

          // Then
          expect(settingsLack).toBeTruthy();

          done();
        });

        it("should NOT lack of swimming ftp settings WITHOUT required params available", done => {
          // Given
          const type = ElevateSport.Swim;
          athleteSettingsModel.swimFtp = null;
          distance = 0; // Wrong value
          movingTime = 0; // Wrong value
          elapsedTime = 0; // Wrong value

          // When
          const settingsLack: boolean = ActivityComputer.hasAthleteSettingsLacks(
            distance,
            movingTime,
            elapsedTime,
            type,
            analysisDataModel,
            athleteSettingsModel,
            activityStreamsModel
          );

          // Then
          expect(settingsLack).toBeFalsy();
          done();
        });
      });

      describe("Other", () => {
        [ElevateSport.AlpineSki, ElevateSport.InlineSkate].forEach(type => {
          it(`should NOT lack of ftp settings with activity type ${type}`, done => {
            // Given, When
            const settingsLack: boolean = ActivityComputer.hasAthleteSettingsLacks(
              distance,
              movingTime,
              elapsedTime,
              type,
              analysisDataModel,
              athleteSettingsModel,
              activityStreamsModel
            );

            // Then
            expect(settingsLack).toBeFalsy();
            done();
          });
        });
      });
    });

    describe("With heartrate monitor", () => {
      [
        ElevateSport.Ride,
        ElevateSport.VirtualRide,
        ElevateSport.Run,
        ElevateSport.VirtualRun,
        ElevateSport.AlpineSki,
        ElevateSport.WeightTraining
      ].forEach(type => {
        it(`should NOT lack of ftp settings if heart rate stress score are available for ${type} activity`, done => {
          // Given
          athleteSettingsModel.cyclingFtp = null;
          athleteSettingsModel.runningFtp = null;
          athleteSettingsModel.swimFtp = null;
          analysisDataModel = {
            heartRateData: {
              HRSS: 100,
              TRIMP: 100
            }
          } as AnalysisDataModel;

          // When
          const settingsLack: boolean = ActivityComputer.hasAthleteSettingsLacks(
            distance,
            movingTime,
            elapsedTime,
            type,
            analysisDataModel,
            athleteSettingsModel,
            activityStreamsModel
          );

          // Then
          expect(settingsLack).toBeFalsy();
          done();
        });
      });
    });
  });
});
