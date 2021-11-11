import { Sensor } from "./sensor.model";
import _ from "lodash";
import { Streams } from "@elevate/shared/models/activity-data/streams.model";
import { Activity, ActivityStats, Peaks } from "@elevate/shared/models/sync/activity.model";
import { MeasureSystem } from "@elevate/shared/enums/measure-system.enum";
import { ZoneType } from "@elevate/shared/enums/zone-type.enum";

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

  public peaksPath: [keyof ActivityStats, keyof Peaks] = ["power", "peaks"];

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

  public static getDefault(activity: Activity): CyclingPowerSensor {
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

  public static getDefault(activity: Activity): RunningPowerSensor {
    return activity.hasPowerMeter ? RunningPowerSensor.DEFAULT_PW : RunningPowerSensor.DEFAULT_EST_PW;
  }
}

/**
 * Sensor used to debug the calculated watts against real power w/ "DEBUG_EST_VS_REAL_WATTS" LS key)
 */
export class PowerEstDebugSensor extends PowerSensor {
  constructor(hasPowerMeter: boolean) {
    super(hasPowerMeter);
  }
  public static readonly NAME: string = "Est Debug Power";

  public streamKey: keyof Streams = "watts_calc";
  public color = "#8749ff";
  public name: string = PowerEstDebugSensor.NAME;
  public defaultRoundDecimals = 0;

  public peaksPath: [keyof ActivityStats, keyof Peaks] = null;
  public zoneType: ZoneType = ZoneType.POWER;

  public static getDefault(activity: Activity): PowerEstDebugSensor {
    const sensor = new PowerEstDebugSensor(false);
    sensor.name += ` (${activity.athleteSnapshot.athleteSettings.weight} Kg)`;
    return sensor;
  }
}
