import { StatsGroup } from "../../stat-group.model";
import { StatsDef } from "../../stats-def.namespace";
import { SummaryStatsGroup } from "../../summary-stat-group.model";
import { SyncedActivityModel } from "@elevate/shared/models";

export class DefaultSummaryStatsGroup extends SummaryStatsGroup {
  constructor(name: string) {
    super(name);
  }

  public static getDefault(activity: SyncedActivityModel): StatsGroup {
    const summaryStatsGroup = new DefaultSummaryStatsGroup("Default");

    summaryStatsGroup.addStatsPool([StatsDef.Generic.movingTime, StatsDef.Generic.elapsedTime]);

    summaryStatsGroup.addStatsPool([StatsDef.Generic.distance]);

    summaryStatsGroup.addStatsPool([StatsDef.Elevation.ascentGain, StatsDef.Generic.moveRatio]);

    summaryStatsGroup.addStatsPool([StatsDef.Speed.avg]);

    summaryStatsGroup.addStatsPool([StatsDef.HeartRate.avg, StatsDef.Speed.max]);

    summaryStatsGroup.addStatsPool([StatsDef.Cadence.Cycling.activeAvg, StatsDef.HeartRate.hrr, StatsDef.Speed.q75]);

    summaryStatsGroup.addStatsPool([StatsDef.HeartRate.threshold, StatsDef.Speed.threshold]);

    summaryStatsGroup.addStatsPool([StatsDef.HeartRate.hrss, StatsDef.Generic.calories]);

    summaryStatsGroup.addStatsPool([StatsDef.HeartRate.hrssPerHour, StatsDef.Generic.caloriesPerHour]);

    return summaryStatsGroup.mutateAsStatsGroup(activity);
  }
}
