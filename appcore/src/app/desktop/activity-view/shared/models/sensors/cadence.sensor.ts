import { Sensor } from "./sensor.model";
import { AnalysisDataModel, PeaksData, Streams } from "@elevate/shared/models";
import { MeasureSystem, ZoneType } from "@elevate/shared/enums";
import _ from "lodash";

export abstract class CadenceSensor extends Sensor {
  public static readonly NAME: string = "Cadence";

  public defaultRoundDecimals = 0;

  public name: string = CadenceSensor.NAME;
  public color = "#ff61dd";
  public streamKey: keyof Streams = "cadence";

  public peaksPath: [keyof AnalysisDataModel, keyof PeaksData] = ["cadenceData", "peaks"];
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
