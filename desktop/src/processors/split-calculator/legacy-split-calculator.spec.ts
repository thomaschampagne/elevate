import { LegacySplitCalculator, SplitCalculatorOptions } from "@elevate/shared/sync/compute/legacy-split-calculator";
import FIXTURE from "./data_1480020375.json";

describe("LegacySplitCalculator", () => {
  let _POWER_TIME_DATA_: { time: number[]; watts: number[] };

  beforeEach(done => {
    _POWER_TIME_DATA_ = FIXTURE;
    done();
  });

  it("should normalize data over scale", done => {
    // Given
    const scale: number[] = [0, 1, 3, 6];
    const data: number[] = [0, 10, 40, 50];
    const expectedNormalizedScale: number[] = [0, 1, 2, 3, 4, 5, 6];
    const expectedInterpolatedData: number[] = [0, 10, 25, 40, 43.3333, 46.6666, 50];

    // When
    const splitCalculator = new LegacySplitCalculator(scale, data);

    // Then
    expect(splitCalculator.timeScale).toEqual(expectedNormalizedScale);
    expect(splitCalculator.data).toEqual(expectedInterpolatedData);
    expect(splitCalculator.timeScale.length).toEqual(splitCalculator.data.length);

    done();
  });

  it("should normalize data over scale under max scale linear interpolate gap", done => {
    // Given
    const options: SplitCalculatorOptions = { maxScaleGapToLerp: 5 };
    const scale: number[] = [0, 1, 3, 5, /*      fill scale here     */ 11, 13, 14, 15];
    const data: number[] = [0, 10, 30, 50, /* skip interpolation here */ 110, 130, 140, 150];
    const expectedNormalizedScale = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
    const expectedInterpolatedData = [0, 10, 20, 30, 40, 50, null, null, null, null, null, 110, 120, 130, 140, 150];

    // When
    const splitCalculator = new LegacySplitCalculator(scale, data, options);

    // Then
    expect(splitCalculator.timeScale).toEqual(expectedNormalizedScale);
    expect(splitCalculator.data).toEqual(expectedInterpolatedData);
    expect(splitCalculator.timeScale.length).toEqual(splitCalculator.data.length);

    done();
  });

  it("should NOT normalize scale having a gaps over maxScaleGapThreshold", done => {
    // Given
    const options: SplitCalculatorOptions = {
      maxScaleGapAllowed: 60 * 60 * 8 // 8 hours
    };

    const scale: number[] = [0, 1, 3, 6, 50 + (options.maxScaleGapAllowed as number)];
    const data: number[] = [0, 10, 40, 60, 90];
    const scaleRange = 3;

    // When
    const call = () => {
      const splitCalculator = new LegacySplitCalculator(scale, data, options);
      splitCalculator.compute(scaleRange);
    };

    // Then
    expect(call).toThrow(new Error("Scale has a too important gap. Cannot normalize scale"));

    done();
  });

  it("should NOT normalize scale having gaps < 0", done => {
    // Given
    const scale: number[] = [0, 1, 3, 6, 5];
    const data: number[] = [0, 10, 40, 60, 90];
    const scaleRange = 3;

    // When
    const call = () => {
      const splitCalculator = new LegacySplitCalculator(scale, data);
      splitCalculator.compute(scaleRange);
    };

    // Then
    expect(call).toThrow(new Error("Scale should have gaps >= 0"));

    done();
  });

  it("should get best split with scale of 3", done => {
    // Given
    const scale: number[] = [0, 1, 6, 8];
    const data: number[] = [0, 10, 40, 60];
    const scaleRange = 3;

    // When
    const splitCalculator = new LegacySplitCalculator(scale, data);
    const bestSplit = splitCalculator.compute(scaleRange);

    // Then
    expect(bestSplit.value).toEqual(50);
    expect(bestSplit.start).toEqual(2);
    expect(bestSplit.end).toEqual(3);

    done();
  });

  it("should NOT get best split with scale range higher than scale", done => {
    // Given
    const scale: number[] = [0, 1, 3, 6];
    const data: number[] = [0, 10, 40, 60];
    const scaleRange = 100;

    // When
    const splitCalculator = new LegacySplitCalculator(scale, data);
    const call = () => {
      splitCalculator.compute(scaleRange);
    };

    // Then
    expect(call).toThrow(
      new Error("Requested scaleRange of " + scaleRange + " is greater than scale range length of 7.")
    );

    done();
  });

  it("should get rider FTP of activity 1480020375", done => {
    // Given
    const expectedFTP = 226;
    const timeScale: number[] = _POWER_TIME_DATA_.time;
    const wattsData: number[] = _POWER_TIME_DATA_.watts;
    const scaleRange = 20 * 60; // 20 minutes

    // When
    const splitCalculator = new LegacySplitCalculator(timeScale, wattsData);
    const riderFTPBestSplit = splitCalculator.compute(scaleRange);

    // Then
    expect(Math.floor(riderFTPBestSplit.value)).toEqual(expectedFTP);
    done();
  });

  it("should get rider power curve of activity 1480020375", done => {
    // Given
    const expectedPowerOneMinute = 370;
    const expectedFTP = 226;
    const timeScale: number[] = _POWER_TIME_DATA_.time;
    const wattsData: number[] = _POWER_TIME_DATA_.watts;
    const scaleRanges: number[] = [60, 20 * 60]; // 20 minutes

    // When
    const splitCalculator = new LegacySplitCalculator(timeScale, wattsData);
    const results = splitCalculator.computeRanges(scaleRanges);

    // Then
    expect(Math.floor(results[0].range)).toEqual(60);
    expect(Math.floor(results[0].result)).toEqual(expectedPowerOneMinute);
    expect(Math.floor(results[1].range)).toEqual(20 * 60);
    expect(Math.floor(results[1].result)).toEqual(expectedFTP);

    done();
  });
});
