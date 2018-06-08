import { LowPassFilter } from "../../scripts/utils/LowPassFilter";

describe("LowPassFilter", () => {

	let lowPassFilter: LowPassFilter;

	beforeEach((done: Function) => {
		lowPassFilter = new LowPassFilter();
		done();
	});

	describe("init()", () => {

		it("should return initiated stream", () => {
			lowPassFilter.init([10, 8, 9, 10, 12, 8, 50, 10, 12, 8]);
			expect(lowPassFilter.buffer).toEqual([10, 8, 9, 10, 12, 8, 50, 10, 12, 8]);
		});

		it("should return initiated stream - overflow", () => {
			lowPassFilter.init([10, 8, 9, 10, 12, 8, 50, 10, 12, 8, 15, 20, 30]);
			expect(lowPassFilter.buffer).toEqual([10, 12, 8, 50, 10, 12, 8, 15, 20, 30]);
		});

	});

	describe("next()", () => {

		it("should return same value", () => {
			lowPassFilter.smoothing = 1;
			lowPassFilter.init([10, 8, 9, 10, 12, 8, 50, 10, 12, 8]);
			const result = Math.round(lowPassFilter.next(50));
			expect(result).toEqual(50);
		});

		it("should return smoothed value", () => {
			lowPassFilter.smoothing = 0.2;
			lowPassFilter.init([10, 10, 10, 10, 10, 10, 10, 10, 10, 10]);
			const result = Math.round(lowPassFilter.next(20));
			expect(result).toEqual(12);
		});

	});

	describe("smoothArray()", () => {

		it("should return same array", () => {
			lowPassFilter.smoothing = 1;
			const values = [10, 8, 9, 10, 12, 8, 50, 10, 12, 8];
			expect(lowPassFilter.smoothArray(values)).toEqual(values);
		});

		it("should return smoothed array", () => {
			lowPassFilter.smoothing = 0.5;
			const values = [10, 8, 9, 10, 12, 8, 50, 10, 12, 8];
			expect(lowPassFilter.smoothArray(values)).toEqual([10, 9, 9, 10, 11, 9, 30, 20, 16, 12]);
		});

	});

	describe("adaptiveSmoothArray()", () => {

		it("should return same array", () => {
			// Given
			lowPassFilter.smoothing = 1;
			const values = [0, 4, 8, 12, 16, 8, 64, 0, 4, 4, 4];
			const scale = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
			const variationTrigger = 16;
			const negativeVariationTrigger = 16;
			const expected = [0, 4, 8, 12, 16, 8, 64, 0, 4, 4, 4];

			// When
			const actual = lowPassFilter.adaptiveSmoothArray(values, scale,
				variationTrigger, negativeVariationTrigger);

			// Then
			expect(actual).toEqual(expected);
		});

		it("should return smoothed array", () => {

			// Given
			lowPassFilter.smoothing = 0.5;
			const values = [0, 4, 8, 12, 16, 8, 64, 0, 4, 4, 4];
			const scale = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
			const variationTrigger = 16;
			const negativeVariationTrigger = 16;
			const expected = [0, 4, 8, 12, 16, 8, 36, 18, 4, 4, 4];

			// When
			const actual = lowPassFilter.adaptiveSmoothArray(values, scale,
				variationTrigger, negativeVariationTrigger);

			// Then
			expect(actual).toEqual(expected);
		});

		it("should return smoothed array (1)", () => {

			// Given
			lowPassFilter.smoothing = 0.5;
			const values = [0, 4, 8, 12, 16, 8, 64, 0, 4, 4, 4];
			const scale = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
			const variationTrigger = 16;
			const negativeVariationTrigger = null;
			const expected = [0, 4, 8, 12, 16, 8, 36, 0, 4, 4, 4];

			// When
			const actual = lowPassFilter.adaptiveSmoothArray(values, scale,
				variationTrigger, negativeVariationTrigger);

			// Then
			expect(actual).toEqual(expected);
		});
	});

});
