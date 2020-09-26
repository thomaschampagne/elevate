import { StatsGroup } from "../../stat-group.model";
import { SyncedActivityModel } from "@elevate/shared/models";
import { StatsDef } from "../../stats-def.namespace";
import { SummaryStatsGroup } from "../../summary-stat-group.model";
import { RunningPowerSensor } from "../../../sensors/power.sensor";

export class SwimmingSummaryStatsGroup extends SummaryStatsGroup {
  constructor(name: string) {
    super(name);
  }

  public static fromActivity(activity: SyncedActivityModel): StatsGroup {
    return SwimmingSummaryStatsGroup.getDefault(activity);
  }

  public static getDefault(activity: SyncedActivityModel): StatsGroup {
    const powerSensor = RunningPowerSensor.getDefault(activity);

    const summaryStatsGroup = new SwimmingSummaryStatsGroup("Swimming");

    summaryStatsGroup.addStatsPool([StatsDef.Generic.movingTime, StatsDef.Generic.elapsedTime]);

    summaryStatsGroup.addStatsPool([StatsDef.Generic.accurateDistance]);

    summaryStatsGroup.addStatsPool([StatsDef.Generic.Swimming.swolf, StatsDef.Generic.moveRatio]);

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
      StatsDef.HeartRate.hrss,
      StatsDef.Pace.Swimming.swimStressScore(activity.start_time),
      StatsDef.Generic.calories
    ]);

    summaryStatsGroup.addStatsPool([
      StatsDef.HeartRate.hrssPerHour,
      StatsDef.Pace.Swimming.swimStressScorePerHour(activity.start_time),
      StatsDef.Generic.caloriesPerHour
    ]);

    summaryStatsGroup.addStatsPool([StatsDef.Cadence.Swimming.avgDistPerStroke]);

    return summaryStatsGroup.mutateAsStatsGroup(activity);
  }
}
