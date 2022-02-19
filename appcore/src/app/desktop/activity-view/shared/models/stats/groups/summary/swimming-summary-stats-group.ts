import { StatsGroup } from "../../stat-group.model";
import { StatsDef } from "../../stats-def.namespace";
import { SummaryStatsGroup } from "../../summary-stat-group.model";
import { RunningPowerSensor } from "../../../sensors/power.sensor";
import { Activity } from "@elevate/shared/models/sync/activity.model";

export class SwimmingSummaryStatsGroup extends SummaryStatsGroup {
  constructor(name: string) {
    super(name);
  }

  public static fromActivity(activity: Activity): StatsGroup {
    return SwimmingSummaryStatsGroup.getDefault(activity);
  }

  public static getDefault(activity: Activity): StatsGroup {
    const powerSensor = RunningPowerSensor.getDefault(activity);

    const summaryStatsGroup = new SwimmingSummaryStatsGroup("Swimming");

    summaryStatsGroup.addStatsPool([StatsDef.Distance.Swimming.distance]);

    summaryStatsGroup.addStatsPool([StatsDef.Generic.movingTime, StatsDef.Generic.elapsedTime]);

    summaryStatsGroup.addStatsPool([StatsDef.Scores.Swimming.swolf25, StatsDef.Generic.moveRatio]);

    summaryStatsGroup.addStatsPool([StatsDef.Pace.Swimming.avg]);

    summaryStatsGroup.addStatsPool([StatsDef.HeartRate.avg, StatsDef.Pace.Swimming.max]);

    summaryStatsGroup.addStatsPool([
      StatsDef.Cadence.Swimming.activeAvg,
      StatsDef.HeartRate.hrr,
      StatsDef.Pace.Swimming.q75
    ]);

    summaryStatsGroup.addStatsPool([
      StatsDef.HeartRate.threshold,
      StatsDef.Pace.Swimming.threshold,
      StatsDef.Power.threshold(powerSensor)
    ]);

    summaryStatsGroup.addStatsPool([
      StatsDef.Scores.Stress.hrss,
      StatsDef.Scores.Stress.Swimming.swimStressScore(activity.startTime),
      StatsDef.Generic.calories
    ]);

    summaryStatsGroup.addStatsPool([
      StatsDef.Scores.Stress.hrssPerHour,
      StatsDef.Scores.Stress.Swimming.swimStressScorePerHour(activity.startTime),
      StatsDef.Generic.caloriesPerHour
    ]);

    summaryStatsGroup.addStatsPool([StatsDef.Cadence.Swimming.avgDistPerStroke]);

    return summaryStatsGroup.mutateAsStatsGroup(activity);
  }
}
