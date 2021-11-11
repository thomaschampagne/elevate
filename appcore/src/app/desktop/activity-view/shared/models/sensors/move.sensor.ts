import { Sensor } from "./sensor.model";
import _ from "lodash";
import { Streams } from "@elevate/shared/models/activity-data/streams.model";
import { ActivityStats, Peaks } from "@elevate/shared/models/sync/activity.model";
import { Movement } from "@elevate/shared/tools/movement";
import { MeasureSystem } from "@elevate/shared/enums/measure-system.enum";
import { Constant } from "@elevate/shared/constants/constant";
import { Time } from "@elevate/shared/tools/time";
import { ZoneType } from "@elevate/shared/enums/zone-type.enum";

export abstract class MoveSensor extends Sensor {
  public defaultRoundDecimals = 1;
  public color = "#52bdff";
  public streamKey: keyof Streams = "velocity_smooth";
  public peaksPath: [keyof ActivityStats, keyof Peaks] = ["speed", "peaks"];
}

export class SpeedSensor extends MoveSensor {
  public static readonly NAME: string = "Speed";
  public static readonly DEFAULT: SpeedSensor = new SpeedSensor();

  public name: string = SpeedSensor.NAME;
  public displayUnit: { short: string; full: string } | Map<MeasureSystem, { short: string; full: string }> = new Map<
    MeasureSystem,
    { short: string; full: string }
  >([
    [MeasureSystem.METRIC, { short: "kph", full: "Kilometers / hour" }],
    [MeasureSystem.IMPERIAL, { short: "mph", full: "Miles / hour" }]
  ]);

  public zoneType: ZoneType = ZoneType.SPEED;

  public fromStreamConvert(streamMeterPerSec: number, measureSystem: MeasureSystem): number {
    const speedFactor =
      Constant.MPS_KPH_FACTOR * (measureSystem === MeasureSystem.IMPERIAL ? Constant.KM_TO_MILE_FACTOR : 1);
    return streamMeterPerSec * speedFactor;
  }

  public fromZoneBoundConvert(zoneBoundValue: number, measureSystem: MeasureSystem): number {
    return measureSystem === MeasureSystem.IMPERIAL
      ? _.round(zoneBoundValue * Constant.KM_TO_MILE_FACTOR, 1)
      : zoneBoundValue;
  }

  public fromStatsConvert(
    statValue: number | string,
    measureSystem: MeasureSystem,
    roundDecimals: number = this.defaultRoundDecimals
  ): number | string {
    const speed = (statValue as number) * (measureSystem === MeasureSystem.IMPERIAL ? Constant.KM_TO_MILE_FACTOR : 1);
    return Number.isFinite(roundDecimals) ? _.round(speed, roundDecimals) : speed;
  }
}

export class PaceSensor extends MoveSensor {
  public static readonly NAME: string = "Pace";
  public static readonly DEFAULT: PaceSensor = new PaceSensor();

  public name = PaceSensor.NAME;
  public displayUnit: { short: string; full: string } | Map<MeasureSystem, { short: string; full: string }> = new Map<
    MeasureSystem,
    { short: string; full: string }
  >([
    [MeasureSystem.METRIC, { short: "/km", full: "Time / kilometer" }],
    [MeasureSystem.IMPERIAL, { short: "/mi", full: "Time / mile" }]
  ]);

  public zoneType: ZoneType = ZoneType.PACE;

  public fromStreamConvert(
    streamMeterPerSec: number,
    measureSystem: MeasureSystem,
    lastConvertedValue: number
  ): number {
    const paceAsSecondsPerKm = Movement.speedToPace(streamMeterPerSec * Constant.MPS_KPH_FACTOR);
    // Test value validity
    if (paceAsSecondsPerKm === null) {
      return lastConvertedValue;
    } else {
      // Valid. Now convert it along measurement system
      return measureSystem === MeasureSystem.IMPERIAL
        ? paceAsSecondsPerKm / Constant.KM_TO_MILE_FACTOR
        : paceAsSecondsPerKm;
    }
  }

  public fromZoneBoundConvert(zoneBoundValue: number, measureSystem: MeasureSystem): number {
    return measureSystem === MeasureSystem.IMPERIAL
      ? _.round(zoneBoundValue / Constant.KM_TO_MILE_FACTOR, 1)
      : zoneBoundValue;
  }

  public displayZoneBoundValue(zoneBoundValue: number): string {
    return Time.secToMilitary(zoneBoundValue, true);
  }

  public fromStatsConvert(
    statValue: number | string,
    measureSystem: MeasureSystem,
    roundDecimals: number = this.defaultRoundDecimals
  ): number | string {
    const paceAsSeconds = statValue as number;
    const systemConvertedZoneBoundValue =
      measureSystem === MeasureSystem.IMPERIAL ? _.round(paceAsSeconds / Constant.KM_TO_MILE_FACTOR, 1) : paceAsSeconds;
    return Time.secToMilitary(systemConvertedZoneBoundValue, true);
  }
}

export class GradeAdjustedPaceSensor extends PaceSensor {
  public static readonly NAME: string = "Grade Adj. Pace";
  public static readonly DEFAULT: GradeAdjustedPaceSensor = new GradeAdjustedPaceSensor();

  public name = GradeAdjustedPaceSensor.NAME;
  public color = "#966bff";

  constructor() {
    super();
    this.streamKey = "grade_adjusted_speed";
  }
}

export class SwimmingPaceSensor extends PaceSensor {
  public static readonly DEFAULT: SwimmingPaceSensor = new SwimmingPaceSensor();

  public displayUnit: { short: string; full: string } | Map<MeasureSystem, { short: string; full: string }> = new Map<
    MeasureSystem,
    { short: string; full: string }
  >([
    [MeasureSystem.METRIC, { short: "/hm", full: "Time / hundred meters" }],
    [MeasureSystem.IMPERIAL, { short: "/hy", full: "Time / hundred yards" }]
  ]);

  public fromStreamConvert(
    streamMeterPerSec: number,
    measureSystem: MeasureSystem,
    lastConvertedValue: number
  ): number {
    // Convert to s/100m
    const secondsPer100m = Movement.speedToSwimPace(streamMeterPerSec * Constant.MPS_KPH_FACTOR);

    if (!Number.isFinite(secondsPer100m)) {
      return lastConvertedValue;
    } else {
      return measureSystem === MeasureSystem.IMPERIAL ? secondsPer100m * Constant.METER_TO_YARD_FACTOR : secondsPer100m;
    }
  }

  public fromStatsConvert(
    statValue: number | string,
    measureSystem: MeasureSystem,
    roundDecimals: number = this.defaultRoundDecimals
  ): number | string {
    const secondsPerKm = statValue as number;
    const secondsPer100m = (secondsPerKm / 1000) * 100;
    return Time.secToMilitary(
      measureSystem === MeasureSystem.IMPERIAL ? secondsPer100m * Constant.METER_TO_YARD_FACTOR : secondsPer100m,
      true
    );
  }
}
