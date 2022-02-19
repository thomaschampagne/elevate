import _ from "lodash";
import { Peak } from "../../models/sync/activity.model";
import { SplitCalculator } from "./split-calculator";

export class TimePeaksCalculator {
  /**
   * Compute peaks of data overtime (max 1 hour)
   */
  public static compute(time: number[], data: number[]): Peak[] {
    const splitCalculator = new SplitCalculator(time, data);

    // Calculate when ranges end
    let splitsRanges = [1, 2, 5, 10, 20, 30, 60, 2 * 60, 5 * 60, 10 * 60, 20 * 60, 30 * 60, 60 * 60];

    // Remove ranges no supported by activity
    const maxTime = Math.min(_.last(time), _.last(splitsRanges));
    splitsRanges = splitsRanges.filter(t => t <= maxTime);

    return splitCalculator.computeRanges(splitsRanges);
  }
}
