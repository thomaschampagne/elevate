import { Sensor } from "./sensor.model";
import { MeasureSystem, ZoneType } from "@elevate/shared/enums";
import { Constant } from "@elevate/shared/constants";
import { AnalysisDataModel, PeaksData, Streams } from "@elevate/shared/models";
import _ from "lodash";

export class ElevationSensor extends Sensor {
  public static readonly NAME: string = "Elevation";
  public static readonly DEFAULT: ElevationSensor = new ElevationSensor();
  public streamKey: keyof Streams = "altitude";
  public name = ElevationSensor.NAME;
  public color = "#29b13d";
  public defaultRoundDecimals = 0;
  public displayUnit: { short: string; full: string } | Map<MeasureSystem, { short: string; full: string }> = new Map<
    MeasureSystem,
    { short: string; full: string }
  >([
    [MeasureSystem.METRIC, { short: "m", full: "Meters" }],
    [MeasureSystem.IMPERIAL, { short: "ft", full: "Feet" }]
  ]);

  public peaksPath: [keyof AnalysisDataModel, keyof PeaksData] = ["elevationData", "peaks"];
  public zoneType: ZoneType = ZoneType.ELEVATION;

  public fromStreamConvert(streamMeters: number, measureSystem: MeasureSystem): number {
    return streamMeters * (measureSystem === MeasureSystem.IMPERIAL ? Constant.METER_TO_FEET_FACTOR : 1);
  }

  public fromZoneBoundConvert(zoneBoundValue: number, measureSystem: MeasureSystem): number {
    return measureSystem === MeasureSystem.IMPERIAL
      ? _.round(zoneBoundValue * Constant.METER_TO_FEET_FACTOR)
      : zoneBoundValue;
  }

  public fromStatsConvert(meters: number, measureSystem: MeasureSystem, roundDecimals: number): number | string {
    const converted = meters * (measureSystem === MeasureSystem.IMPERIAL ? Constant.METER_TO_FEET_FACTOR : 1);
    return Number.isFinite(roundDecimals) ? _.round(converted, roundDecimals) : converted;
  }
}

export class ElevationAscentSpeedSensor extends ElevationSensor {
  public static readonly NAME: string = "Ascent Speed";
  public static readonly DEFAULT: ElevationAscentSpeedSensor = new ElevationAscentSpeedSensor();

  public name: string = ElevationAscentSpeedSensor.NAME;

  public displayUnit: { short: string; full: string } | Map<MeasureSystem, { short: string; full: string }> = new Map<
    MeasureSystem,
    { short: string; full: string }
  >([
    [MeasureSystem.METRIC, { short: "vm/h", full: "Vertical meters / hour" }],
    [MeasureSystem.IMPERIAL, { short: "vf/h", full: "Vertical feet / hour" }]
  ]);
}
