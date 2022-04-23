import { Time } from "@elevate/shared/tools/time";
import { AthleteSnapshot } from "@elevate/shared/models/athlete/athlete-snapshot.model";
import { AthleteSettings } from "@elevate/shared/models/athlete/athlete-settings/athlete-settings.model";
import { Activity, ActivityStats } from "@elevate/shared/models/sync/activity.model";
import { ActivityComputer } from "@elevate/shared/sync/compute/activity-computer";
import { Gender } from "@elevate/shared/models/athlete/gender.enum";
import { ElevateSport } from "@elevate/shared/enums/elevate-sport.enum";
import { Streams } from "@elevate/shared/models/activity-data/streams.model";

describe("ActivityComputer", () => {
  describe("compute scores", () => {
    let _ATHLETE_MODEL_SNAP_: AthleteSnapshot;

    beforeEach(done => {
      _ATHLETE_MODEL_SNAP_ = new AthleteSnapshot(
        Gender.MEN,
        30,
        new AthleteSettings(
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

    it("should compute swim SWOLF", done => {
      // Given
      const averageStrokePerMin = 26;
      const poolLength = 20;
      const swimPace = "02:58"; // mm:ss/100m
      const expectedSwolf = 51;
      const secondsPer100m = Time.militaryToSec(swimPace);

      // When
      const swolf = ActivityComputer.computeSwimSwolf(secondsPer100m, averageStrokePerMin, poolLength);

      // Then
      expect(swolf).toEqual(expectedSwolf);
      done();
    });
  });

  describe("manage lthr preferences", () => {
    let _ATHLETE_MODEL_SNAP_: AthleteSnapshot;

    beforeEach(done => {
      _ATHLETE_MODEL_SNAP_ = new AthleteSnapshot(
        Gender.MEN,
        30,
        new AthleteSettings(
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

    let activityStats: ActivityStats;
    let athleteSettingsModel: AthleteSettings;
    let streams: Streams;

    beforeEach(done => {
      activityStats = new ActivityStats();
      athleteSettingsModel = AthleteSettings.DEFAULT_MODEL;
      streams = new Streams();
      done();
    });

    describe("No heartrate monitor", () => {
      describe("Cycling", () => {
        it("should lack of cycling ftp settings WITH power data", done => {
          [ElevateSport.Ride, ElevateSport.VirtualRide].forEach(cyclingType => {
            // Given
            athleteSettingsModel.cyclingFtp = null;
            activityStats.power = {
              avg: 150
            } as never;

            // When
            const settingsLack: boolean = ActivityComputer.hasAthleteSettingsLacks(
              distance,
              movingTime,
              elapsedTime,
              cyclingType,
              activityStats,
              athleteSettingsModel
            );

            // Then
            expect(settingsLack).toBeTruthy();
          });
          done();
        });

        it("should NOT lack of cycling ftp settings WITHOUT power data", done => {
          [ElevateSport.Ride, ElevateSport.VirtualRide].forEach(cyclingType => {
            // Given
            athleteSettingsModel.cyclingFtp = null;

            // When
            const settingsLack: boolean = ActivityComputer.hasAthleteSettingsLacks(
              distance,
              movingTime,
              elapsedTime,
              cyclingType,
              activityStats,
              athleteSettingsModel
            );

            // Then
            expect(settingsLack).toBeFalsy();
          });
          done();
        });

        it("should NOT lack of cycling ftp settings WITH power data", done => {
          [ElevateSport.Ride, ElevateSport.VirtualRide].forEach(cyclingType => {
            // Given
            athleteSettingsModel.cyclingFtp = 150;
            activityStats.power = {
              avg: 150
            } as never;

            // When
            const settingsLack: boolean = ActivityComputer.hasAthleteSettingsLacks(
              distance,
              movingTime,
              elapsedTime,
              cyclingType,
              activityStats,
              athleteSettingsModel
            );

            // Then
            expect(settingsLack).toBeFalsy();
          });
          done();
        });

        it("should NOT lack of cycling ftp settings WITHOUT power data", done => {
          [ElevateSport.Ride, ElevateSport.VirtualRide].forEach(cyclingType => {
            // Given
            athleteSettingsModel.cyclingFtp = 150;

            // When
            const settingsLack: boolean = ActivityComputer.hasAthleteSettingsLacks(
              distance,
              movingTime,
              elapsedTime,
              cyclingType,
              activityStats,
              athleteSettingsModel
            );

            // Then
            expect(settingsLack).toBeFalsy();
          });
          done();
        });
      });

      describe("Running", () => {
        it("should lack of running ftp settings WITH grade adj speed data", done => {
          [ElevateSport.Run, ElevateSport.VirtualRun].forEach(runningType => {
            // Given
            athleteSettingsModel.runningFtp = null;
            activityStats.pace = {
              gapAvg: 300
            } as never;

            // When
            const settingsLack: boolean = ActivityComputer.hasAthleteSettingsLacks(
              distance,
              movingTime,
              elapsedTime,
              runningType,
              activityStats,
              athleteSettingsModel
            );

            // Then
            expect(settingsLack).toBeTruthy();
          });
          done();
        });

        it("should NOT lack of running ftp settings WITHOUT grade adj speed data", done => {
          [ElevateSport.Run, ElevateSport.VirtualRun].forEach(runningType => {
            // Given
            athleteSettingsModel.runningFtp = null;

            // When
            const settingsLack: boolean = ActivityComputer.hasAthleteSettingsLacks(
              distance,
              movingTime,
              elapsedTime,
              runningType,
              activityStats,
              athleteSettingsModel
            );

            // Then
            expect(settingsLack).toBeFalsy();
          });
          done();
        });

        it("should NOT lack of running ftp settings WITH grade adj speed data", done => {
          [ElevateSport.Run, ElevateSport.VirtualRun].forEach(runningType => {
            // Given
            athleteSettingsModel.runningFtp = 150;
            activityStats.pace = {
              gapAvg: 300
            } as never;

            // When
            const settingsLack: boolean = ActivityComputer.hasAthleteSettingsLacks(
              distance,
              movingTime,
              elapsedTime,
              runningType,
              activityStats,
              athleteSettingsModel
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

            // When
            const settingsLack: boolean = ActivityComputer.hasAthleteSettingsLacks(
              distance,
              movingTime,
              elapsedTime,
              runningType,
              activityStats,
              athleteSettingsModel
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
            activityStats,
            athleteSettingsModel
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
            activityStats,
            athleteSettingsModel
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
              activityStats,
              athleteSettingsModel
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
          activityStats = {
            scores: {
              stress: {
                hrss: 100,
                trimp: 100
              }
            }
          } as ActivityStats;

          if (Activity.isRide(type)) {
            activityStats.power = {
              avg: 150
            } as never;
          }

          if (Activity.isRun(type)) {
            activityStats.pace = {
              gapAvg: 300
            } as never;
          }

          // When
          const settingsLack: boolean = ActivityComputer.hasAthleteSettingsLacks(
            distance,
            movingTime,
            elapsedTime,
            type,
            activityStats,
            athleteSettingsModel
          );

          // Then
          expect(settingsLack).toBeFalsy();
          done();
        });
      });
    });
  });
});
