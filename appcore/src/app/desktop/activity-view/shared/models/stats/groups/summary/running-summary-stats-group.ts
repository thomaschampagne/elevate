import { StatsGroup } from "../../stat-group.model";
import { SyncedActivityModel } from "@elevate/shared/models";
import { RunningPowerSensor } from "../../../sensors/power.sensor";
import { StatsDef } from "../../stats-def.namespace";
import { SummaryStatsGroup } from "../../summary-stat-group.model";

export class RunningSummaryStatsGroup extends SummaryStatsGroup {
  constructor(name: string) {
    super(name);
  }

  public static fromActivity(activity: SyncedActivityModel): StatsGroup {
    return RunningSummaryStatsGroup.getDefault(activity);
  }

  public static getDefault(activity: SyncedActivityModel): StatsGroup {
    const powerSensor = RunningPowerSensor.getDefault(activity);

    const summaryStatsGroup = new RunningSummaryStatsGroup("Running");

    summaryStatsGroup.addStatsPool([StatsDef.Generic.movingTime, StatsDef.Generic.elapsedTime]);

    summaryStatsGroup.addStatsPool([StatsDef.Generic.distance]);

    summaryStatsGroup.addStatsPool([StatsDef.Elevation.ascentGain, StatsDef.Generic.moveRatio]);

    summaryStatsGroup.addStatsPool([StatsDef.Pace.Running.avg]);

    summaryStatsGroup.addStatsPool([StatsDef.HeartRate.avg, StatsDef.Pace.Running.gap]);

    summaryStatsGroup.addStatsPool([
      StatsDef.Cadence.Running.activeAvg,
      StatsDef.HeartRate.hrr,
      StatsDef.Pace.Running.q75
    ]);

    summaryStatsGroup.addStatsPool([
      StatsDef.HeartRate.threshold,
      StatsDef.Pace.Running.threshold,
      StatsDef.Power.threshold(powerSensor)
    ]);

    summaryStatsGroup.addStatsPool([
      StatsDef.HeartRate.hrss,
      StatsDef.Pace.Running.runningStressScore(activity.start_time),
      StatsDef.Generic.calories
    ]);

    summaryStatsGroup.addStatsPool([
      StatsDef.HeartRate.hrssPerHour,
      StatsDef.Pace.Running.runningStressScorePerHour(activity.start_time),
      StatsDef.Generic.caloriesPerHour
    ]);

    summaryStatsGroup.addStatsPool([StatsDef.Elevation.avgVertSpeed]);

    return summaryStatsGroup.mutateAsStatsGroup(activity);
  }
}
