import { Sensor } from "./sensor.model";
import _ from "lodash";
import { ZoneType } from "@elevate/shared/enums/zone-type.enum";
import { MeasureSystem } from "@elevate/shared/enums/measure-system.enum";
import { ActivityStats, Peaks } from "@elevate/shared/models/sync/activity.model";
import { Streams } from "@elevate/shared/models/activity-data/streams.model";

export abstract class CadenceSensor extends Sensor {
  public static readonly NAME: string = "Cadence";

  public defaultRoundDecimals = 0;

  public name: string = CadenceSensor.NAME;
  public color = "#ff61dd";
  public areaColor = "#FF61DD38";
  public streamKey: keyof Streams = "cadence";

  public peaksPath: [keyof ActivityStats, keyof Peaks] = ["cadence", "peaks"];
}

export class CyclingCadenceSensor extends CadenceSensor {
  public static readonly DEFAULT: CyclingCadenceSensor = new CyclingCadenceSensor();
  public zoneType: ZoneType = ZoneType.CYCLING_CADENCE;

  public displayUnit: { short: string; full: string } | Map<MeasureSystem, { short: string; full: string }> = {
    short: "rpm",
    full: "Revolutions / minute"
  };
}

export class RunningCadenceSensor extends CadenceSensor {
  public static readonly DEFAULT: RunningCadenceSensor = new RunningCadenceSensor();
  public zoneType: ZoneType = ZoneType.RUNNING_CADENCE;

  public displayUnit: { short: string; full: string } | Map<MeasureSystem, { short: string; full: string }> = {
    short: "spm",
    full: "Strides / minute (2 legs)"
  };

  public fromZoneBoundConvert(cadence: number): number {
    return cadence * 2;
  }

  public fromStreamConvert(cadence: number): number {
    return cadence * 2;
  }

  public fromStatsConvert(cadence: number, measureSystem: MeasureSystem, roundDecimals: number): number | string {
    const runningCadence = cadence * 2;
    return Number.isFinite(roundDecimals) ? _.round(runningCadence, roundDecimals) : runningCadence;
  }
}

export class SwimmingCadenceSensor extends CadenceSensor {
  public static readonly DEFAULT: SwimmingCadenceSensor = new SwimmingCadenceSensor();
  public zoneType: ZoneType = null;

  public displayUnit: { short: string; full: string } | Map<MeasureSystem, { short: string; full: string }> = {
    short: "spm",
    full: "Strokes / minute"
  };
}
