import { SplitCalculator } from "@elevate/shared/sync/compute/split-calculator";
import { Constant } from "@elevate/shared/constants/constant";
import ACTIVITY_DATA_01 from "./data_208748758.json";
import ACTIVITY_DATA_02 from "./data_1480020375.json";

describe("SplitCalculator", () => {
  it("should get best split with scale of 5", done => {
    // Given
    const scale: number[] = [0, 1, 3, 5, 8, 11, 12, 14, 16, 20];
    const data: number[] = [5, 10, 9, 8, 10, 5, 4, 5, 5, 5];
    const range = 5;

    // When
    const splitCalculator = new SplitCalculator(scale, data);
    const result = splitCalculator.compute(range);

    // Then
    expect(result.value).toEqual(9.25);
    expect(result.start).toEqual(1);
    expect(result.end).toEqual(4);

    done();
  });

  it("should get speed split based on distance of activity 208748758", done => {
    // Given
    const expectedSpeed = 28.5;
    const distanceScale: number[] = ACTIVITY_DATA_01.distance;
    const speedData: number[] = ACTIVITY_DATA_01.velocity_smooth;
    const range = 50 * 1000; // 50k

    // When
    const splitCalculator = new SplitCalculator(distanceScale, speedData);
    const result = splitCalculator.compute(range);

    // Then
    expect(result.value * Constant.MPS_KPH_FACTOR).toBeCloseTo(expectedSpeed, 1);
    done();
  });

  it("should get rider FTP of activity 1480020375", done => {
    // Given
    const timeScale: number[] = ACTIVITY_DATA_02.time;
    const wattsData: number[] = ACTIVITY_DATA_02.watts;
    const range = 20 * 60; // 20 minutes

    // When
    const splitCalculator = new SplitCalculator(timeScale, wattsData);
    const result = splitCalculator.compute(range);

    // Then
    expect(result.value).toBeCloseTo(229, 0);
    done();
  });

  it("should get rider power ranges of activity 1480020375 (1)", done => {
    // Given
    const timeScale: number[] = ACTIVITY_DATA_02.time;
    const wattsData: number[] = ACTIVITY_DATA_02.watts;
    const ranges = [60, 20 * 60]; // 20 minutes

    // When
    const splitCalculator = new SplitCalculator(timeScale, wattsData);
    const results = splitCalculator.computeRanges(ranges);

    // Then
    expect(results[0].result).toBeCloseTo(370, 0);
    expect(results[1].result).toBeCloseTo(229, 0);
    done();
  });

  /*  it("should get rider power ranges of activity 1480020375 (2)", done => {
    // Given
    const timeScale: number[] = ACTIVITY_DATA_02.time;
    const wattsData: number[] = ACTIVITY_DATA_02.watts;
    // const ranges = [60, 20 * 60]; // 20 minutes

    const endSeconds = 2 * 60 * 60;
    let ranges = [
      ..._.range(1, 60, 1), // 1s to 60s every 1s
      ..._.range(60, 5 * 60, 5), // to 5m every 5s
      ..._.range(5 * 60, 10 * 60, 10), // to 10m every 10s
      ..._.range(10 * 60, 30 * 60, 20), // to 30m every 20s
      ..._.range(30 * 60, 60 * 60, 60), // to 60m every 60s
      ..._.range(60 * 60, endSeconds, 5 * 60) // to MAX_HOURS hour every 5m
    ];

    // Remove ranges no supported by activity if duration under MAX_HOURS
    const maxTime = Math.min(timeScale[timeScale.length - 1], endSeconds);
    ranges = [...ranges.filter(t => t < maxTime), maxTime];

    // When
    const splitCalculator = new SplitCalculator(timeScale, wattsData);
    const results = splitCalculator.computeRanges(ranges);

    // Then
    expect(results[0].result).toBeCloseTo(370, 0);
    expect(results[1].result).toBeCloseTo(229, 0);
    done();
  });*/
});
