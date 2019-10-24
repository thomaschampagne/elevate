import { powerTimeData } from "./power_data_1480020375";
import * as _ from "lodash";
import { SplitCalculator } from "@elevate/shared/sync";

describe("SplitCalculator", () => {

	let _POWER_TIME_DATA_: { time: number[], watts: number[] };

	beforeEach((done: Function) => {
		_POWER_TIME_DATA_ = _.cloneDeep(powerTimeData);
		done();
	});

	it("should normalize data over scale", (done: Function) => {

		// Given
		const scale: number[] = [0, 1, 3, 6];
		const data: number[] = [0, 10, 40, 50];
		const expectedNormalizedScale: number[] = [0, 1, 2, 3, 4, 5, 6];
		const expectedInterpolatedData: number[] = [0, 10, 25, 40, 43.3333, 46.6666, 50];

		// When
		const splitCalculator = new SplitCalculator(scale, data);

		// Then
		expect(splitCalculator.scale).toEqual(expectedNormalizedScale);
		expect(splitCalculator.data).toEqual(expectedInterpolatedData);
		expect(splitCalculator.scale.length).toEqual(splitCalculator.data.length);

		done();
	});

	it("should NOT normalize scale having a gaps over 5000", (done: Function) => {

		// Given
		const maxScaleGapThreshold = 60 * 60 * 8; // 8 hours
		const scale: number[] = [0, 1, 3, 6, 50 + maxScaleGapThreshold];
		const data: number[] = [0, 10, 40, 60, 90];
		const scaleRange = 3;

		// When
		const call = () => {
			const splitCalculator = new SplitCalculator(scale, data, maxScaleGapThreshold);
			splitCalculator.getBestSplit(scaleRange, true);
		};

		// Then
		expect(call).toThrow(new Error("Scale has a too importants gap. Cannot normalize scale"));

		done();
	});

	it("should NOT normalize scale having gaps < 0", (done: Function) => {

		// Given
		const scale: number[] = [0, 1, 3, 6, 5];
		const data: number[] = [0, 10, 40, 60, 90];
		const scaleRange = 3;

		// When
		const call = () => {
			const splitCalculator = new SplitCalculator(scale, data);
			splitCalculator.getBestSplit(scaleRange, true);
		};

		// Then
		expect(call).toThrow(new Error("Scale should have gaps >= 0"));

		done();
	});

	it("should get best split with scale of 3", (done: Function) => {

		// Given
		const scale: number[] = [0, 1, 6, 8];
		const data: number[] = [0, 10, 40, 60];
		const scaleRange = 3;

		// When
		const splitCalculator = new SplitCalculator(scale, data);
		const bestSplit = splitCalculator.getBestSplit(scaleRange, true);

		// Then
		expect(bestSplit).toEqual(50);

		done();
	});

	it("should NOT get best split with scale range higher than scale", (done: Function) => {

		// Given
		const scale: number[] = [0, 1, 3, 6];
		const data: number[] = [0, 10, 40, 60];
		const scaleRange = 100;

		// When
		const splitCalculator = new SplitCalculator(scale, data);
		const call = () => {
			splitCalculator.getBestSplit(scaleRange, true);
		};

		// Then
		expect(call).toThrow(new Error("Requested scaleRange of " + scaleRange + " is greater than scale range length of 7."));

		done();
	});

	it("should get rider FTP of activity 1480020375", (done: Function) => {

		// Given
		const expectedFTP = 226;
		const timeScale: number[] = _POWER_TIME_DATA_.time;
		const wattsData: number[] = _POWER_TIME_DATA_.watts;
		const scaleRange = 20 * 60; // 20 minutes

		// When
		const splitCalculator = new SplitCalculator(timeScale, wattsData);
		const riderFTP = splitCalculator.getBestSplit(scaleRange, true);

		// Then
		expect(Math.floor(riderFTP)).toEqual(expectedFTP);

		done();
	});

	it("should get rider power curve of activity 1480020375", (done: Function) => {

		// Given
		const expectedPowerOneMinute = 370;
		const expectedFTP = 226;
		const timeScale: number[] = _POWER_TIME_DATA_.time;
		const wattsData: number[] = _POWER_TIME_DATA_.watts;
		const scaleRanges: number[] = [60, 20 * 60]; // 20 minutes

		// When
		const splitCalculator = new SplitCalculator(timeScale, wattsData);
		const results = splitCalculator.getBestSplitRanges(scaleRanges);

		// Then
		expect(Math.floor(results[0].range)).toEqual(60);
		expect(Math.floor(results[0].result)).toEqual(expectedPowerOneMinute);
		expect(Math.floor(results[1].range)).toEqual(20 * 60);
		expect(Math.floor(results[1].result)).toEqual(expectedFTP);

		done();
	});

});
