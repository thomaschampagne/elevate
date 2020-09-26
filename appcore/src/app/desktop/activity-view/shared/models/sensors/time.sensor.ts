import { BaseSensor } from "./base.sensor";
import { MeasureSystem } from "@elevate/shared/enums";
import { Time } from "@elevate/shared/tools";

export class TimeSensor extends BaseSensor {
  public static readonly NAME: string = "Time";
  public static readonly DEFAULT: TimeSensor = new TimeSensor();

  public name: string = TimeSensor.NAME;
  public defaultRoundDecimals = 0;

  public displayUnit: { short: string; full: string } | Map<MeasureSystem, { short: string; full: string }> = null;

  public fromStatsConvert(seconds: number): number | string {
    return Time.secToMilitary(seconds, true);
  }
}
