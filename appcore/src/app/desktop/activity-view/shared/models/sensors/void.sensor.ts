import { BaseSensor } from "./base.sensor";
import { MeasureSystem } from "@elevate/shared/enums";

export class VoidSensor extends BaseSensor {
  public static readonly NAME: string = "Void";
  public static readonly DEFAULT: VoidSensor = new VoidSensor();

  public name: string = VoidSensor.NAME;
  public defaultRoundDecimals = 0;

  public displayUnit: { short: string; full: string } | Map<MeasureSystem, { short: string; full: string }> = null;
}
