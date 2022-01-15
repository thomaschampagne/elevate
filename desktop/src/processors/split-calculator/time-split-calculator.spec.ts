import { TimeSplitCalculator, TimeSplitCalculatorOptions } from "@elevate/shared/sync/compute/time-split-calculator";
import FIXTURE from "./power_data_1480020375.json";

describe("TimeSplitCalculator", () => {
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
    const timeSplitCalculator = new TimeSplitCalculator(scale, data);

    // Then
    expect(timeSplitCalculator.timeScale).toEqual(expectedNormalizedScale);
    expect(timeSplitCalculator.data).toEqual(expectedInterpolatedData);
    expect(timeSplitCalculator.timeScale.length).toEqual(timeSplitCalculator.data.length);

    done();
  });

  it("should normalize data over scale under max scale linear interpolate gap", done => {
    // Given
    const options: TimeSplitCalculatorOptions = { maxScaleGapToLerp: 5 };
    const scale: number[] = [0, 1, 3, 5, /*      fill scale here     */ 11, 13, 14, 15];
    const data: number[] = [0, 10, 30, 50, /* skip interpolation here */ 110, 130, 140, 150];
    const expectedNormalizedScale = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
    const expectedInterpolatedData = [0, 10, 20, 30, 40, 50, null, null, null, null, null, 110, 120, 130, 140, 150];

    // When
    const timeSplitCalculator = new TimeSplitCalculator(scale, data, options);

    // Then
    expect(timeSplitCalculator.timeScale).toEqual(expectedNormalizedScale);
    expect(timeSplitCalculator.data).toEqual(expectedInterpolatedData);
    expect(timeSplitCalculator.timeScale.length).toEqual(timeSplitCalculator.data.length);

    done();
  });

  it("should NOT normalize scale having a gaps over maxScaleGapThreshold", done => {
    // Given
    const options: TimeSplitCalculatorOptions = {
      maxScaleGapAllowed: 60 * 60 * 8 // 8 hours
    };

    const scale: number[] = [0, 1, 3, 6, 50 + (options.maxScaleGapAllowed as number)];
    const data: number[] = [0, 10, 40, 60, 90];
    const scaleRange = 3;

    // When
    const call = () => {
      const timeSplitCalculator = new TimeSplitCalculator(scale, data, options);
      timeSplitCalculator.computeTimeBestSplit(scaleRange);
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
      const timeSplitCalculator = new TimeSplitCalculator(scale, data);
      timeSplitCalculator.computeTimeBestSplit(scaleRange);
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
    const timeSplitCalculator = new TimeSplitCalculator(scale, data);
    const bestSplit = timeSplitCalculator.computeTimeBestSplit(scaleRange);

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
    const timeSplitCalculator = new TimeSplitCalculator(scale, data);
    const call = () => {
      timeSplitCalculator.computeTimeBestSplit(scaleRange);
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
    const timeSplitCalculator = new TimeSplitCalculator(timeScale, wattsData);
    const riderFTPBestSplit = timeSplitCalculator.computeTimeBestSplit(scaleRange);

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
    const timeSplitCalculator = new TimeSplitCalculator(timeScale, wattsData);
    const results = timeSplitCalculator.computeTimeBestSplitRanges(scaleRanges);

    // Then
    expect(Math.floor(results[0].range)).toEqual(60);
    expect(Math.floor(results[0].result)).toEqual(expectedPowerOneMinute);
    expect(Math.floor(results[1].range)).toEqual(20 * 60);
    expect(Math.floor(results[1].result)).toEqual(expectedFTP);

    done();
  });

  /*
    TODO Support distance based splits in dedicated calculator
   xit("should get speed split based on distance of activity 208748758", done => {
    // Given
    // TODO Use data from ./speed_data_208748758.json
    const expectedSpeed = 28;
    const distanceScale: number[] = _SPEED_DISTANCE_DATA_.distance;
    const speedData: number[] = _SPEED_DISTANCE_DATA_.velocity_smooth;
    const scaleRange = 50 * 1000; // 50k

    // When
    const splitCalculator = new SplitCalculator(distanceScale, speedData);
    const speed = splitCalculator.getBestSplit(scaleRange);

    // Then
    expect(speed.value * Constant.MPS_KPH_FACTOR).toEqual(expectedSpeed);
    done();
  });*/
});
