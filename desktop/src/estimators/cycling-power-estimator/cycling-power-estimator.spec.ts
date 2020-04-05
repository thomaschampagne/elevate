import { CyclingPower } from "./cycling-power-estimator";

describe("CyclingPowerEstimator", () => {

    it("should calculate cycling power of a rider climbing a 6% hill", done => {

        // Given
        const speedKph = 10;
        const params: Partial<CyclingPower.Params> = {
            riderWeightKg: 75,
            gradePercentage: 6,
        };
        const expectedPower = 153.99;

        // When
        const power = CyclingPower.Estimator.calc(speedKph, params);

        // Then
        expect(power).toEqual(expectedPower);
        done();
    });

    it("should calculate cycling power of a rider climbing a -2% hill", done => {

        // Given
        const speedKph = 35;
        const params: Partial<CyclingPower.Params> = {
            riderWeightKg: 75,
            gradePercentage: -2,
        };
        const expectedPower = 63.23;

        // When
        const power = CyclingPower.Estimator.calc(speedKph, params);

        // Then
        expect(power).toEqual(expectedPower);
        done();
    });

    it("should calculate cycling power of a rider climbing a -10% hill", done => {

        // Given
        const speedKph = 35;
        const params: Partial<CyclingPower.Params> = {
            riderWeightKg: 75,
            gradePercentage: -10,
        };
        const expectedPower = 0;

        // When
        const power = CyclingPower.Estimator.calc(speedKph, params);

        // Then
        expect(power).toEqual(expectedPower);
        done();
    });

});
