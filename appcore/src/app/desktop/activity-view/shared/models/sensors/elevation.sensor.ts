import { Sensor } from "./sensor.model";
import _ from "lodash";
import { Streams } from "@elevate/shared/models/activity-data/streams.model";
import { ActivityStats, Peaks } from "@elevate/shared/models/sync/activity.model";
import { MeasureSystem } from "@elevate/shared/enums/measure-system.enum";
import { Constant } from "@elevate/shared/constants/constant";
import { ZoneType } from "@elevate/shared/enums/zone-type.enum";

export class ElevationSensor extends Sensor {
  public static readonly NAME: string = "Elevation";
  public static readonly DEFAULT: ElevationSensor = new ElevationSensor();
  public streamKey: keyof Streams = "altitude";
  public name = ElevationSensor.NAME;
  public color = "#29b13d";
  public areaColor = "#29B13D38";
  public defaultRoundDecimals = 0;
  public displayUnit: { short: string; full: string } | Map<MeasureSystem, { short: string; full: string }> = new Map<
    MeasureSystem,
    { short: string; full: string }
  >([
    [MeasureSystem.METRIC, { short: "m", full: "Meters" }],
    [MeasureSystem.IMPERIAL, { short: "ft", full: "Feet" }]
  ]);

  public peaksPath: [keyof ActivityStats, keyof Peaks] = ["elevation", "peaks"];
  public zoneType: ZoneType = ZoneType.ELEVATION;

  public fromStreamConvert(streamMeters: number, measureSystem: MeasureSystem): number {
    return streamMeters * (measureSystem === MeasureSystem.IMPERIAL ? Constant.METER_TO_FEET_FACTOR : 1);
  }

  public fromZoneBoundConvert(zoneBoundValue: number, measureSystem: MeasureSystem): number {
    return measureSystem === MeasureSystem.IMPERIAL
      ? _.round(zoneBoundValue * Constant.METER_TO_FEET_FACTOR)
      : zoneBoundValue;
  }

  public formatFromStat(meters: number, measureSystem: MeasureSystem, roundDecimals: number): number | string {
    const converted = meters * (measureSystem === MeasureSystem.IMPERIAL ? Constant.METER_TO_FEET_FACTOR : 1);
    return Number.isFinite(roundDecimals) ? _.round(converted, roundDecimals) : converted;
  }
}

export class ElevationAscentSpeedSensor extends ElevationSensor {
  public static readonly NAME: string = "Ascent Speed";
  public static readonly DEFAULT: ElevationAscentSpeedSensor = new ElevationAscentSpeedSensor();

  public streamKey: keyof Streams = "ascent_speed";
  public name: string = ElevationAscentSpeedSensor.NAME;

  public displayUnit: { short: string; full: string } | Map<MeasureSystem, { short: string; full: string }> = new Map<
    MeasureSystem,
    { short: string; full: string }
  >([
    [MeasureSystem.METRIC, { short: "vm/h", full: "Vertical meters / hour" }],
    [MeasureSystem.IMPERIAL, { short: "vf/h", full: "Vertical feet / hour" }]
  ]);
}
