import { MeasureSystem } from "@elevate/shared/enums";
import _ from "lodash";

export abstract class BaseSensor {
  public abstract defaultRoundDecimals: number;
  public abstract name: string;
  public abstract displayUnit: { short: string; full: string } | Map<MeasureSystem, { short: string; full: string }>;

  public isEstimated = false; // Every sensor is non-estimated or "real" by default

  public getDisplayUnit(measureSystem: MeasureSystem, short: boolean = true): string {
    let unit: string;
    if (!this.isMeasureSystemDependent()) {
      unit = short
        ? (this.displayUnit as { short: string; full: string }).short
        : (this.displayUnit as { short: string; full: string }).full;
    } else {
      const unitDesc = (this.displayUnit as Map<MeasureSystem, { short: string; full: string }>).get(measureSystem);
      unit = short ? unitDesc.short : unitDesc.full;
    }
    return unit;
  }

  public fromStatsConvert(
    statValue: number | string,
    measureSystem: MeasureSystem,
    roundDecimals: number
  ): number | string {
    return _.round(statValue as number, roundDecimals);
  }

  public isMeasureSystemDependent(): boolean {
    return this.displayUnit instanceof Map;
  }

  public setIsEstimated(isEstimated: boolean): void {
    this.isEstimated = isEstimated;
  }
}
