import { LegacySplitCalculator } from "./legacy-split-calculator";
import _ from "lodash";
import { Peak } from "../../models/sync/activity.model";
import { Constant } from "../../constants/constant";

export class TimePeaksCalculator {
  private static readonly MAX_HOURS: number = 4;

  /**
   * Compute peaks of data overtime up to MAX_HOURS (=2h by default)
   */
  public static compute(time: number[], data: number[], upToHours: number = TimePeaksCalculator.MAX_HOURS): Peak[] {
    const splitCalculator = new LegacySplitCalculator(time, data, {
      maxScaleGapToLerp: Constant.SPLITS_MAX_SECONDS_GAP_TO_LERP,
      maxScaleGapAllowed: 60 * 60 * Constant.SPLITS_MAX_HOURS_ALLOWED_GAP_HOURS
    });

    // Calculate when ranges end
    const endSeconds = upToHours * 60 * 60;

    let splitsRanges = [
      ..._.range(1, 10, 1),
      ..._.range(10, 60, 10),
      ..._.range(60, 5 * 60, 60),
      ..._.range(5 * 60, 20 * 60, 5 * 60),
      ..._.range(20 * 60, 60 * 60, 10 * 60),
      ..._.range(60 * 60, endSeconds, 30 * 60)
    ];

    // Remove ranges no supported by activity if duration under MAX_HOURS
    const maxTime = Math.min(time[time.length - 1], endSeconds);
    splitsRanges = [...splitsRanges.filter(t => t < maxTime), maxTime];

    return splitCalculator.computeRanges(splitsRanges);
  }
}
