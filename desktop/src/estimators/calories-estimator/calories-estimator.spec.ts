import { CaloriesEstimator } from "./calories-estimator";
import { ElevateSport } from "@elevate/shared/enums";

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
        const expectedCalories = 771.7;

        // When
        const calories = CaloriesEstimator.calc(sportType, movingTime, weight);

        // Then
        expect(calories).toEqual(expectedCalories);
        done();
    });

    it("should not calculate calories if sportType is not supported", done => {

        // Given
        const sportType: ElevateSport = ElevateSport.Cricket;
        const movingTime = 3600;
        const weight = 75;
        const expectedCalories = null;

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
