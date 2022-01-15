import _ from "lodash";
import { WarningException } from "../../exceptions/warning.exception";

export class SplitCalculator {
  constructor(private scale: number[], private data: number[]) {}

  public compute(targetRange: number): { value: number; start: number; end: number } {
    if (targetRange > _.last(this.scale)) {
      throw new WarningException("Requested target range is greater than scale range length.");
    }

    let maxAvg = -Infinity;
    let winStartIdx = 0;
    let rangeDiff = 0;
    let start = 0;
    let end = 0;

    for (let currIdx = 0; currIdx < this.scale.length; currIdx++) {
      // Increase range until target range is reached
      rangeDiff = this.scale[currIdx] - this.scale[winStartIdx];

      // Continue if not
      if (rangeDiff < targetRange) {
        continue;
      }

      // Range is reached here
      // Compute the avg between currIdx & startIdx here
      const windowData = this.data.slice(winStartIdx, currIdx + 1);
      const avg = _.mean(windowData);

      // Store the best average detected
      if (avg > maxAvg) {
        maxAvg = avg;
        start = winStartIdx;
        end = currIdx;
      }

      // Reset range and shift the window with startIdx increment
      rangeDiff = 0;
      winStartIdx++;
    }

    maxAvg = Number.isFinite(maxAvg) ? maxAvg : null;

    return { value: maxAvg, start: start, end: end };
  }

  public computeRanges(ranges: number[]): { range: number; result: number; start: number; end: number }[] {
    const results: { range: number; result: number; start: number; end: number }[] = [];

    ranges.forEach((range: number) => {
      try {
        const bestSplit = this.compute(range);
        results.push({
          range: range,
          result: bestSplit.value,
          start: bestSplit.start,
          end: bestSplit.end
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
}
