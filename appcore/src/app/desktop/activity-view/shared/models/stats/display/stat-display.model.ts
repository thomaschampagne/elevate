import { Stat } from "../stat.model";
import { Sensor } from "../../sensors/sensor.model";
import { MeasureSystem } from "@elevate/shared/enums/measure-system.enum";

export class StatDisplay {
  private static readonly MISSING_VALUE_DISPLAY: string = "-";

  public name: string;
  public details: string;
  public unit: string | null;
  public value: number | string;
  public description: string;
  public color: string;
  public forceDisplay: boolean;

  public static create(stat: Stat<any>, statValue: number | string, measureSystem: MeasureSystem): StatDisplay {
    let unit: string;

    if (stat.unit || stat.unit === null) {
      unit = stat.unit;
    } else if (stat.baseSensor.displayUnit) {
      unit = stat.baseSensor.getDisplayUnit(measureSystem);
    } else {
      unit = null;
    }

    let color: string = null;
    if (stat.baseSensor instanceof Sensor) {
      color = stat.baseSensor.color;
    }

    let targetValue: number | string;
    let isValueMissing = false;

    if (Number.isFinite(statValue)) {
      statValue = (statValue as number) * stat.factor;
      targetValue = stat.baseSensor.formatFromStat(
        statValue,
        measureSystem,
        stat.roundDecimals || stat.baseSensor.defaultRoundDecimals
      );
    } else if (typeof statValue === "string") {
      targetValue = statValue;
    } else {
      targetValue = StatDisplay.MISSING_VALUE_DISPLAY;
      isValueMissing = true;
    }

    let details = null;
    if (stat.details) {
      details = typeof stat.details === "function" ? stat.details(targetValue) : stat.details;
    }

    return {
      name: stat.name,
      details: details,
      unit: unit,
      value: targetValue,
      description: isValueMissing && stat.missingMessage ? `${stat.missingMessage}` : stat.description,
      color: color,
      forceDisplay: stat.forceDisplay
    };
  }
}
