import { ElevateSport } from "@elevate/shared/enums/elevate-sport.enum";
import { CaloriesEstimator } from "@elevate/shared/sync/compute/calories-estimator";
import { AthleteSettings } from "@elevate/shared/models/athlete/athlete-settings/athlete-settings.model";
import { ActivityStats } from "@elevate/shared/models/sync/activity.model";
import { ActivityComputer } from "@elevate/shared/sync/compute/activity-computer";
import { Gender } from "@elevate/shared/models/athlete/gender.enum";
import { Streams } from "@elevate/shared/models/activity-data/streams.model";

describe("CaloriesEstimator", () => {
  describe("With cycling Power", () => {
    it("should calculate calories of cycling activity performed by a MEN with cycling power meter (1)", done => {
      // Given
      const sportType: ElevateSport = ElevateSport.Ride;
      const movingTime = 3600;
      const weight = 80;
      const age = 34;
      const gender = Gender.MEN;
      const avgWatts = 150;
      const avgBpm = 150;
      const expectedCalories = 540;

      // When
      const calories = CaloriesEstimator.calc(sportType, movingTime, weight, age, gender, avgWatts, avgBpm);

      // Then
      expect(calories).toEqual(expectedCalories);
      done();
    });
  });

  describe("With HRM", () => {
    it("should calculate calories of cycling activity performed by a MEN with HRM (1)", done => {
      // Given
      const sportType: ElevateSport = ElevateSport.Ride;
      const movingTime = 3600;
      const weight = 80;
      const age = 34;
      const gender = Gender.MEN;
      const avgBpm = 150;
      const avgWatts = null;
      const expectedCalories = 893.4;

      // When
      const calories = CaloriesEstimator.calc(sportType, movingTime, weight, age, gender, avgWatts, avgBpm);

      // Then
      expect(calories).toEqual(expectedCalories);
      done();
    });

    it("should calculate calories of cycling activity performed by a MEN with HRM (2)", done => {
      // Given
      const sportType: ElevateSport = ElevateSport.Ride;
      const movingTime = 3600 * 3;
      const weight = 75;
      const age = 27;
      const gender = Gender.MEN;
      const avgBpm = 178;
      const avgWatts = null;
      const expectedCalories = 3336.7;

      // When
      const calories = CaloriesEstimator.calc(sportType, movingTime, weight, age, gender, avgWatts, avgBpm);

      // Then
      expect(calories).toEqual(expectedCalories);
      done();
    });

    it("should calculate calories of running activity performed by a WOMEN with HRM (1)", done => {
      // Given
      const sportType: ElevateSport = ElevateSport.Run;
      const movingTime = 3600 * 2;
      const weight = 55;
      const age = 42;
      const gender = Gender.WOMEN;
      const avgBpm = 169;
      const avgWatts = null;
      const expectedCalories = 1472.4;

      // When
      const calories = CaloriesEstimator.calc(sportType, movingTime, weight, age, gender, avgWatts, avgBpm);

      // Then
      expect(calories).toEqual(expectedCalories);
      done();
    });

    it("should calculate calories of running activity performed by a WOMEN with HRM (2)", done => {
      // Given
      const sportType: ElevateSport = ElevateSport.Run;
      const movingTime = 3600;
      const weight = 49;
      const age = 31;
      const gender = Gender.WOMEN;
      const avgBpm = 90;
      const avgWatts = null;
      const expectedCalories = 228.7;

      // When
      const calories = CaloriesEstimator.calc(sportType, movingTime, weight, age, gender, avgWatts, avgBpm);

      // Then
      expect(calories).toEqual(expectedCalories);
      done();
    });
  });

  describe("Without HRM and cycling power", () => {
    it("should calculate calories of cycling activity", done => {
      // Given
      const sportType: ElevateSport = ElevateSport.Ride;
      const movingTime = 3600;
      const weight = 75;
      const expectedCalories = 669.4;

      // When
      const calories = CaloriesEstimator.calc(sportType, movingTime, weight);

      // Then
      expect(calories).toEqual(expectedCalories);
      done();
    });

    it("should calculate calories of running activity", done => {
      // Given
      const sportType: ElevateSport = ElevateSport.Run;
      const movingTime = 3600;
      const weight = 75;
      const expectedCalories = 771.8;

      // When
      const calories = CaloriesEstimator.calc(sportType, movingTime, weight);

      // Then
      expect(calories).toEqual(expectedCalories);
      done();
    });

    it("should not calculate calories if moving time is not a number", done => {
      // Given
      const sportType: ElevateSport = ElevateSport.Run;
      const movingTime = null;
      const weight = 75;
      const expectedCalories = null;

      // When
      const calories = CaloriesEstimator.calc(sportType, movingTime, weight);

      // Then
      expect(calories).toEqual(expectedCalories);
      done();
    });

    it("should not calculate calories if weight is not a number", done => {
      // Given
      const sportType: ElevateSport = ElevateSport.Run;
      const movingTime = 3600;
      const weight = null;
      const expectedCalories = null;

      // When
      const calories = CaloriesEstimator.calc(sportType, movingTime, weight);

      // Then
      expect(calories).toEqual(expectedCalories);
      done();
    });
  });
});

describe("Detect lack of FTPs settings", () => {
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
      it("should lack of cycling ftp settings WITH power stream", done => {
        [ElevateSport.Ride, ElevateSport.VirtualRide].forEach(cyclingType => {
          // Given
          athleteSettingsModel.cyclingFtp = null;
          streams.watts = [10, 10, 10];

          // When
          const settingsLack: boolean = ActivityComputer.hasAthleteSettingsLacks(
            distance,
            movingTime,
            elapsedTime,
            cyclingType,
            activityStats,
            athleteSettingsModel,
            streams
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
          streams.watts = [];

          // When
          const settingsLack: boolean = ActivityComputer.hasAthleteSettingsLacks(
            distance,
            movingTime,
            elapsedTime,
            cyclingType,
            activityStats,
            athleteSettingsModel,
            streams
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
          streams.watts = [10, 10, 10];

          // When
          const settingsLack: boolean = ActivityComputer.hasAthleteSettingsLacks(
            distance,
            movingTime,
            elapsedTime,
            cyclingType,
            activityStats,
            athleteSettingsModel,
            streams
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
          streams.watts = [];

          // When
          const settingsLack: boolean = ActivityComputer.hasAthleteSettingsLacks(
            distance,
            movingTime,
            elapsedTime,
            cyclingType,
            activityStats,
            athleteSettingsModel,
            streams
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
          streams.grade_adjusted_speed = [10, 10, 10];

          // When
          const settingsLack: boolean = ActivityComputer.hasAthleteSettingsLacks(
            distance,
            movingTime,
            elapsedTime,
            runningType,
            activityStats,
            athleteSettingsModel,
            streams
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
          streams.grade_adjusted_speed = [];

          // When
          const settingsLack: boolean = ActivityComputer.hasAthleteSettingsLacks(
            distance,
            movingTime,
            elapsedTime,
            runningType,
            activityStats,
            athleteSettingsModel,
            streams
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
          streams.grade_adjusted_speed = [10, 10, 10];

          // When
          const settingsLack: boolean = ActivityComputer.hasAthleteSettingsLacks(
            distance,
            movingTime,
            elapsedTime,
            runningType,
            activityStats,
            athleteSettingsModel,
            streams
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
          streams.grade_adjusted_speed = [];

          // When
          const settingsLack: boolean = ActivityComputer.hasAthleteSettingsLacks(
            distance,
            movingTime,
            elapsedTime,
            runningType,
            activityStats,
            athleteSettingsModel,
            streams
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
          athleteSettingsModel,
          streams
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
          athleteSettingsModel,
          streams
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
            athleteSettingsModel,
            streams
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

        // When
        const settingsLack: boolean = ActivityComputer.hasAthleteSettingsLacks(
          distance,
          movingTime,
          elapsedTime,
          type,
          activityStats,
          athleteSettingsModel,
          streams
        );

        // Then
        expect(settingsLack).toBeFalsy();
        done();
      });
    });
  });
});
