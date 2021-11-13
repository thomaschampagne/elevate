import _ from "lodash";
import { WarningException } from "../../exceptions/warning.exception";

export interface SplitCalculatorOptions {
  // Maximal scale gap under which data is interpolated
  maxScaleGapToLerp?: number;
  maxScaleGapAllowed?: number;
}

export class SplitCalculator {
  private static readonly MAX_SCALE_GAP_TO_LERP = 60;
  private static readonly MAX_SCALE_GAP_ALLOWED = 60 * 60;

  constructor(public scale: number[], public data: number[], public options: SplitCalculatorOptions = {}) {
    this.scale = _.cloneDeep(scale);
    this.data = _.cloneDeep(data);
    this.options.maxScaleGapToLerp = this.options.maxScaleGapToLerp || SplitCalculator.MAX_SCALE_GAP_TO_LERP;
    this.options.maxScaleGapAllowed = this.options.maxScaleGapAllowed || SplitCalculator.MAX_SCALE_GAP_ALLOWED;
    this.normalize();
  }

  public normalize(): void {
    const normalizedScale: number[] = [];
    const interpolatedData: number[] = [];

    _.forEach(this.scale, (scaleValue: number, index: number, scale: number[]) => {
      interpolatedData.push(_.isNumber(this.data[index]) ? this.data[index] : 0);
      normalizedScale.push(scaleValue);

      const nextScaleValue = scale[index + 1];

      if (_.isNumber(nextScaleValue)) {
        const nextScaleDiff = nextScaleValue - scaleValue;

        if (nextScaleDiff < 0) {
          throw new Error("Scale should have gaps >= 0");
        }

        if (this.options.maxScaleGapAllowed && nextScaleDiff > this.options.maxScaleGapAllowed) {
          throw new WarningException("Scale has a too importants gap. Cannot normalize scale");
        }

        // If we step over 1 seconds and stay under min scale gap, then we can perform interpolation of values between
        // Use case example: We want to avoid interpolation during a too long pause (let's say 30s) which could generate invalid data
        // In this case the scale is the time and  minScaleGap = 30 sec. Over 30s we don't interpolate.
        if (nextScaleDiff > 1 && nextScaleDiff <= this.options.maxScaleGapToLerp) {
          // Is next scale not linear normalized (+1) with current scale?
          const linearFunction = this.getLinearFunction(
            this.data[index + 1],
            this.data[index],
            nextScaleValue,
            scaleValue
          );
          let missingScaleValue = scaleValue + 1;

          while (missingScaleValue < nextScaleValue) {
            interpolatedData.push(linearFunction(missingScaleValue));
            normalizedScale.push(missingScaleValue);
            missingScaleValue++;
          }
        } else if (nextScaleDiff > this.options.maxScaleGapToLerp) {
          // The scale gap to the next value is over minimal gap threshold.
          // Interpolating data here might lead to invalid data
          let missingScaleValue = scaleValue + 1;

          while (missingScaleValue < nextScaleValue) {
            interpolatedData.push(null);
            normalizedScale.push(missingScaleValue);
            missingScaleValue++;
          }
        } else {
          // Next scale gap should be increment by 1 here. It's perfect, do nothing.
        }
      }
    });

    this.scale = normalizedScale;
    this.data = interpolatedData;
  }

  public getBestSplit(scaleRange: number, roundDecimals: number = 3): number {
    if (scaleRange > this.scale.length) {
      throw new WarningException(
        "Requested scaleRange of " + scaleRange + " is greater than scale range length of " + this.scale.length + "."
      );
    }

    let maxSumFound: number;
    let currentMaxSum: number;

    if (scaleRange > 1) {
      let index = 0;
      currentMaxSum = _.sum(this.data.slice(index, scaleRange));
      maxSumFound = currentMaxSum;

      while (this.scale[scaleRange + index]) {
        currentMaxSum = currentMaxSum + this.data[scaleRange + index] - this.data[index];
        if (maxSumFound < currentMaxSum) {
          maxSumFound = currentMaxSum;
        }
        index++;
      }
    } else {
      maxSumFound = _.max(this.data);
    }

    return _.round(maxSumFound / scaleRange, roundDecimals);
  }

  public getBestSplitRanges(ranges: number[]): { range: number; result: number }[] {
    const results: { range: number; result: number }[] = [];

    _.forEach(ranges, (range: number) => {
      try {
        results.push({
          range: range,
          result: this.getBestSplit(range)
        });
      } catch (err) {
        const isWarnError = err instanceof WarningException;
        if (!isWarnError) {
          throw err;
        }
      }
    });

    return results;
  }

  public getLinearFunction(y1: number, y0: number, x1: number, x0: number): (value: number) => number {
    const a: number = (y1 - y0) / (x1 - x0);
    const b: number = y0 - a * x0;
    return (value: number) => {
      return _.floor(a * value + b, 4);
    };
  }
}
