import { StatsGroup } from "../stat-group.model";
import { Stat } from "../stat.model";
import { CyclingPowerSensor, RunningPowerSensor } from "../../sensors/power.sensor";
import { StatsDef } from "../stats-def.namespace";
import { Activity, PowerStats, StressScores } from "@elevate/shared/models/sync/activity.model";

export abstract class PowerStatsGroup extends StatsGroup {
  protected constructor(name: string, stats: Stat<any>[], color: string) {
    super(name, stats, color);
  }
}

export class CyclingPowerStatsGroup extends PowerStatsGroup {
  public static getDefault(activity: Activity): CyclingPowerStatsGroup {
    return new CyclingPowerStatsGroup(activity);
  }

  private static getStats(activity: Activity): Stat<PowerStats & StressScores>[] {
    const cyclingPowerSensor = CyclingPowerSensor.getDefault(activity);

    return [
      StatsDef.Power.avg(cyclingPowerSensor),
      StatsDef.Power.avgPerKg(cyclingPowerSensor),
      StatsDef.Power.avgWeighted(cyclingPowerSensor),
      StatsDef.Power.avgWeightedPerKg(cyclingPowerSensor),
      StatsDef.Power.max(cyclingPowerSensor),
      StatsDef.Power.work(cyclingPowerSensor),
      StatsDef.Power.threshold(cyclingPowerSensor),
      StatsDef.Scores.Stress.Cycling.pss(cyclingPowerSensor, activity.startTime),
      StatsDef.Scores.Stress.Cycling.pssPerHour(cyclingPowerSensor, activity.startTime),
      StatsDef.Power.Cycling.intensity(cyclingPowerSensor, activity.startTime),
      StatsDef.Power.variabilityIndex(cyclingPowerSensor),
      StatsDef.Power.q25(cyclingPowerSensor),
      StatsDef.Power.q50(cyclingPowerSensor),
      StatsDef.Power.q75(cyclingPowerSensor),
      StatsDef.Power.stdDeviation(cyclingPowerSensor)
    ];
  }

  constructor(activity: Activity) {
    const cyclingPowerSensor = CyclingPowerSensor.getDefault(activity);
    super(cyclingPowerSensor.name, CyclingPowerStatsGroup.getStats(activity), cyclingPowerSensor.color);
  }
}

export class RunningPowerStatsGroup extends PowerStatsGroup {
  public static getDefault(activity: Activity): RunningPowerStatsGroup {
    return new RunningPowerStatsGroup(activity);
  }

  private static getStats(activity: Activity): Stat<PowerStats & StressScores>[] {
    const runningPowerSensor = RunningPowerSensor.getDefault(activity);

    return [
      StatsDef.Power.avg(runningPowerSensor),
      StatsDef.Power.avgPerKg(runningPowerSensor),
      StatsDef.Power.avgWeighted(runningPowerSensor),
      StatsDef.Power.avgWeightedPerKg(runningPowerSensor),
      StatsDef.Power.max(runningPowerSensor),
      StatsDef.Power.work(runningPowerSensor),
      StatsDef.Power.threshold(runningPowerSensor),
      StatsDef.Power.variabilityIndex(runningPowerSensor),
      StatsDef.Power.q25(runningPowerSensor),
      StatsDef.Power.q50(runningPowerSensor),
      StatsDef.Power.q75(runningPowerSensor),
      StatsDef.Power.stdDeviation(runningPowerSensor)
    ];
  }

  constructor(activity: Activity) {
    const runningPowerSensor = RunningPowerSensor.getDefault(activity);
    super(runningPowerSensor.name, RunningPowerStatsGroup.getStats(activity), runningPowerSensor.color);
  }
}
