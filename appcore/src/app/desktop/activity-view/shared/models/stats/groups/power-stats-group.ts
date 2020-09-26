import { StatsGroup } from "../stat-group.model";
import { Stat } from "../stat.model";
import { PowerDataModel, SyncedActivityModel } from "@elevate/shared/models";
import { CyclingPowerSensor, RunningPowerSensor } from "../../sensors/power.sensor";
import { StatsDef } from "../stats-def.namespace";

export abstract class PowerStatsGroup extends StatsGroup {
  protected constructor(name: string, stats: Stat<any>[], color: string) {
    super(name, stats, color);
  }
}

export class CyclingPowerStatsGroup extends PowerStatsGroup {
  public static getDefault(activity: SyncedActivityModel): CyclingPowerStatsGroup {
    return new CyclingPowerStatsGroup(activity);
  }

  private static getStats(activity: SyncedActivityModel): Stat<PowerDataModel>[] {
    const cyclingPowerSensor = CyclingPowerSensor.getDefault(activity);

    return [
      StatsDef.Power.avg(cyclingPowerSensor),
      StatsDef.Power.avgPerKg(cyclingPowerSensor),
      StatsDef.Power.avgWeighted(cyclingPowerSensor),
      StatsDef.Power.avgWeightedPerKg(cyclingPowerSensor),
      StatsDef.Power.max(cyclingPowerSensor),
      StatsDef.Power.threshold(cyclingPowerSensor),
      StatsDef.Power.Cycling.pss(cyclingPowerSensor, activity.start_time),
      StatsDef.Power.Cycling.pssPerHour(cyclingPowerSensor, activity.start_time),
      StatsDef.Power.threshold80Percent(cyclingPowerSensor, activity.moving_time_raw),
      StatsDef.Power.variabilityIndex(cyclingPowerSensor),
      StatsDef.Power.Cycling.intensity(cyclingPowerSensor, activity.start_time),
      StatsDef.Power.q25(cyclingPowerSensor),
      StatsDef.Power.q50(cyclingPowerSensor),
      StatsDef.Power.q75(cyclingPowerSensor)
    ];
  }

  constructor(activity: SyncedActivityModel) {
    const cyclingPowerSensor = CyclingPowerSensor.getDefault(activity);
    super(cyclingPowerSensor.name, CyclingPowerStatsGroup.getStats(activity), cyclingPowerSensor.color);
  }
}

export class RunningPowerStatsGroup extends PowerStatsGroup {
  public static getDefault(activity: SyncedActivityModel): RunningPowerStatsGroup {
    return new RunningPowerStatsGroup(activity);
  }

  private static getStats(activity: SyncedActivityModel): Stat<PowerDataModel>[] {
    const runningPowerSensor = RunningPowerSensor.getDefault(activity);

    return [
      StatsDef.Power.avg(runningPowerSensor),
      StatsDef.Power.avgPerKg(runningPowerSensor),
      StatsDef.Power.avgWeighted(runningPowerSensor),
      StatsDef.Power.avgWeightedPerKg(runningPowerSensor),
      StatsDef.Power.max(runningPowerSensor),
      StatsDef.Power.threshold(runningPowerSensor),
      StatsDef.Power.threshold80Percent(runningPowerSensor, activity.moving_time_raw),
      StatsDef.Power.variabilityIndex(runningPowerSensor),
      StatsDef.Power.q25(runningPowerSensor),
      StatsDef.Power.q50(runningPowerSensor),
      StatsDef.Power.q75(runningPowerSensor)
    ];
  }

  constructor(activity: SyncedActivityModel) {
    const runningPowerSensor = RunningPowerSensor.getDefault(activity);
    super(runningPowerSensor.name, RunningPowerStatsGroup.getStats(activity), runningPowerSensor.color);
  }
}
