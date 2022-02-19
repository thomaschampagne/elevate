import { StatsGroup } from "../../stat-group.model";
import { RunningPowerSensor } from "../../../sensors/power.sensor";
import { StatsDef } from "../../stats-def.namespace";
import { SummaryStatsGroup } from "../../summary-stat-group.model";
import { Activity } from "@elevate/shared/models/sync/activity.model";

export class RunningSummaryStatsGroup extends SummaryStatsGroup {
  constructor(name: string) {
    super(name);
  }

  public static fromActivity(activity: Activity): StatsGroup {
    return RunningSummaryStatsGroup.getDefault(activity);
  }

  public static getDefault(activity: Activity): StatsGroup {
    const powerSensor = RunningPowerSensor.getDefault(activity);

    const summaryStatsGroup = new RunningSummaryStatsGroup("Running");

    summaryStatsGroup.addStatsPool([StatsDef.Distance.Running.distance]);

    summaryStatsGroup.addStatsPool([StatsDef.Generic.movingTime, StatsDef.Generic.elapsedTime]);

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
      StatsDef.Scores.Stress.hrss,
      StatsDef.Scores.Stress.Running.runningStressScore(activity.startTime),
      StatsDef.Generic.calories
    ]);

    summaryStatsGroup.addStatsPool([
      StatsDef.Scores.Stress.hrssPerHour,
      StatsDef.Scores.Stress.Running.runningStressScorePerHour(activity.startTime),
      StatsDef.Generic.caloriesPerHour
    ]);

    summaryStatsGroup.addStatsPool([StatsDef.Elevation.avgVertSpeed]);

    return summaryStatsGroup.mutateAsStatsGroup(activity);
  }
}
