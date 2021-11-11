import { BaseSensor } from "./base.sensor";
import { MeasureSystem } from "@elevate/shared/enums/measure-system.enum";
import { Time } from "@elevate/shared/tools/time";

export class TimeSensor extends BaseSensor {
  public static readonly NAME: string = "Time";
  public static readonly DEFAULT: TimeSensor = new TimeSensor();

  public name: string = TimeSensor.NAME;
  public defaultRoundDecimals = 0;

  public displayUnit: { short: string; full: string } | Map<MeasureSystem, { short: string; full: string }> = null;

  public fromStatsConvert(statValue: number | string): number | string {
    return Time.secToMilitary(statValue as number, true);
  }
}
