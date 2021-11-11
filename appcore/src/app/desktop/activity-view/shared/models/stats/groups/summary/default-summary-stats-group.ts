import { StatsGroup } from "../../stat-group.model";
import { StatsDef } from "../../stats-def.namespace";
import { SummaryStatsGroup } from "../../summary-stat-group.model";
import { Activity } from "@elevate/shared/models/sync/activity.model";

export class DefaultSummaryStatsGroup extends SummaryStatsGroup {
  constructor(name: string) {
    super(name);
  }

  public static getDefault(activity: Activity): StatsGroup {
    const summaryStatsGroup = new DefaultSummaryStatsGroup("Default");

    summaryStatsGroup.addStatsPool([StatsDef.Distance.distance]);

    summaryStatsGroup.addStatsPool([StatsDef.Generic.movingTime, StatsDef.Generic.elapsedTime]);

    summaryStatsGroup.addStatsPool([StatsDef.Elevation.ascentGain, StatsDef.Generic.moveRatio]);

    summaryStatsGroup.addStatsPool([StatsDef.Speed.avg]);

    summaryStatsGroup.addStatsPool([StatsDef.HeartRate.avg, StatsDef.Speed.max]);

    summaryStatsGroup.addStatsPool([StatsDef.Cadence.Cycling.activeAvg, StatsDef.HeartRate.hrr, StatsDef.Speed.q75]);

    summaryStatsGroup.addStatsPool([StatsDef.HeartRate.threshold, StatsDef.Speed.threshold]);

    summaryStatsGroup.addStatsPool([StatsDef.Scores.Stress.hrss, StatsDef.Generic.calories]);

    summaryStatsGroup.addStatsPool([StatsDef.Scores.Stress.hrssPerHour, StatsDef.Generic.caloriesPerHour]);

    return summaryStatsGroup.mutateAsStatsGroup(activity);
  }
}
