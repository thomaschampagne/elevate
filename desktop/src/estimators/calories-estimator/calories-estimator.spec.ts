import { ElevateSport } from "@elevate/shared/enums/elevate-sport.enum";
import { CaloriesEstimator } from "@elevate/shared/sync/compute/calories-estimator";
import { Gender } from "@elevate/shared/models/athlete/gender.enum";

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
