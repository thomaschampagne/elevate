import { ElevateSport } from "@elevate/shared/enums";
import { AnalysisDataModel, AthleteSettingsModel, Streams } from "@elevate/shared/models";
import { ActivityComputer, CaloriesEstimator } from "@elevate/shared/sync";

describe("CaloriesEstimator", () => {
  it("should calculate calories of cycling activity", done => {
    // Given
    const sportType: ElevateSport = ElevateSport.Ride;
    const movingTime = 3600;
    const weight = 75;
    const expectedCalories = 748.1;

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

describe("Detect lack of FTPs settings", () => {
  let distance = 100;
  let movingTime = 100;
  let elapsedTime = 100;

  let analysisDataModel: AnalysisDataModel;
  let athleteSettingsModel: AthleteSettingsModel;
  let streams: Streams;

  beforeEach(done => {
    analysisDataModel = new AnalysisDataModel();
    athleteSettingsModel = AthleteSettingsModel.DEFAULT_MODEL;
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
            analysisDataModel,
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
            analysisDataModel,
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
            analysisDataModel,
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
            analysisDataModel,
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
            analysisDataModel,
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
            analysisDataModel,
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
            analysisDataModel,
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
            analysisDataModel,
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
          analysisDataModel,
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
          analysisDataModel,
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
            analysisDataModel,
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
          streams
        );

        // Then
        expect(settingsLack).toBeFalsy();
        done();
      });
    });
  });
});
