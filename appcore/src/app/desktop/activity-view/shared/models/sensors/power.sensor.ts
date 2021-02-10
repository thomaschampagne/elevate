import { Sensor } from "./sensor.model";
import { MeasureSystem, ZoneType } from "@elevate/shared/enums";
import { AnalysisDataModel, PeaksData, Streams, SyncedActivityModel } from "@elevate/shared/models";
import _ from "lodash";

export abstract class PowerSensor extends Sensor {
  public static readonly NAME: string = "Power";

  public defaultRoundDecimals = 0;
  public name: string = PowerSensor.NAME;
  public color = "#ffa620";
  public streamKey: keyof Streams = "watts";

  public displayUnit: { short: string; full: string } | Map<MeasureSystem, { short: string; full: string }> = {
    short: "w",
    full: "Watts"
  };

  public peaksPath: [keyof AnalysisDataModel, keyof PeaksData] = ["powerData", "peaks"];

  public fromStatsConvert(watts: number, measureSystem: MeasureSystem, roundDecimals: number): number | string {
    return _.round(watts, roundDecimals);
  }

  protected constructor(hasPowerMeter: boolean) {
    super();
    this.isEstimated = !hasPowerMeter;

    if (this.isEstimated) {
      this.name = `Est. ${this.name}`;
    }
  }
}

export class CyclingPowerSensor extends PowerSensor {
  constructor(hasPowerMeter: boolean) {
    super(hasPowerMeter);
  }

  private static readonly DEFAULT_PW: CyclingPowerSensor = new CyclingPowerSensor(true);
  private static readonly DEFAULT_EST_PW: CyclingPowerSensor = new CyclingPowerSensor(false);
  public zoneType: ZoneType = ZoneType.POWER;

  public static getDefault(activity: SyncedActivityModel): CyclingPowerSensor {
    return activity.hasPowerMeter ? CyclingPowerSensor.DEFAULT_PW : CyclingPowerSensor.DEFAULT_EST_PW;
  }
}

export class RunningPowerSensor extends PowerSensor {
  constructor(hasPowerMeter: boolean) {
    super(hasPowerMeter);
  }
  private static readonly DEFAULT_PW: RunningPowerSensor = new RunningPowerSensor(true);
  private static readonly DEFAULT_EST_PW: RunningPowerSensor = new RunningPowerSensor(false);
  public zoneType: ZoneType = ZoneType.RUNNING_POWER;

  public static getDefault(activity: SyncedActivityModel): RunningPowerSensor {
    return activity.hasPowerMeter ? RunningPowerSensor.DEFAULT_PW : RunningPowerSensor.DEFAULT_EST_PW;
  }
}
