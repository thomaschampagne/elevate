import { MeasureSystem } from "@elevate/shared/enums";
import { Constant } from "@elevate/shared/constants";
import _ from "lodash";
import { BaseSensor } from "./base.sensor";

export class DistanceSensor extends BaseSensor {
  public static readonly NAME: string = "Distance";
  public static readonly DEFAULT: DistanceSensor = new DistanceSensor();
  public defaultRoundDecimals = 1;
  public name: string = DistanceSensor.NAME;
  public displayUnit: { short: string; full: string } | Map<MeasureSystem, { short: string; full: string }> = new Map<
    MeasureSystem,
    { short: string; full: string }
  >([
    [MeasureSystem.METRIC, { short: "km", full: "Kilometers" }],
    [MeasureSystem.IMPERIAL, { short: "mi", full: "Miles" }]
  ]);

  public fromStatsConvert(
    distanceMeters: number,
    measureSystem: MeasureSystem,
    roundDecimals: number
  ): number | string {
    const distance =
      (distanceMeters / 1000) * (measureSystem === MeasureSystem.IMPERIAL ? Constant.KM_TO_MILE_FACTOR : 1);
    return Number.isFinite(roundDecimals) ? _.round(distance, roundDecimals) : distance;
  }
}
