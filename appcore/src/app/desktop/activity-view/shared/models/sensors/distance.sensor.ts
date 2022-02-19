import _ from "lodash";
import { BaseSensor } from "./base.sensor";
import { MeasureSystem } from "@elevate/shared/enums/measure-system.enum";
import { Constant } from "@elevate/shared/constants/constant";

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

  public formatFromStat(
    distanceMeters: number,
    measureSystem: MeasureSystem,
    roundDecimals: number = this.defaultRoundDecimals
  ): number | string {
    const distance =
      (distanceMeters / 1000) * (measureSystem === MeasureSystem.IMPERIAL ? Constant.KM_TO_MILE_FACTOR : 1);
    return Number.isFinite(roundDecimals) ? _.round(distance, roundDecimals) : distance;
  }
}

export class RunningDistanceSensor extends DistanceSensor {
  public static readonly DEFAULT: RunningDistanceSensor = new RunningDistanceSensor();
  public defaultRoundDecimals = 2;
}

export class SwimDistanceSensor extends DistanceSensor {
  public static readonly DEFAULT: SwimDistanceSensor = new SwimDistanceSensor();

  public defaultRoundDecimals = 2;
  public displayUnit: { short: string; full: string } | Map<MeasureSystem, { short: string; full: string }> = new Map<
    MeasureSystem,
    { short: string; full: string }
  >([
    [MeasureSystem.METRIC, { short: "m", full: "Meters" }],
    [MeasureSystem.IMPERIAL, { short: "yd", full: "Yards" }]
  ]);

  public formatFromStat(
    distanceMeters: number,
    measureSystem: MeasureSystem,
    roundDecimals: number = this.defaultRoundDecimals
  ): number | string {
    const distance = distanceMeters * (measureSystem === MeasureSystem.IMPERIAL ? Constant.METER_TO_YARD_FACTOR : 1);
    return Number.isFinite(roundDecimals) ? _.round(distance, roundDecimals) : distance;
  }
}
