import { CyclingPowerSensor } from "../../../sensors/power.sensor";
import { SyncedActivityModel } from "@elevate/shared/models";
import { StatsGroup } from "../../stat-group.model";
import { StatsDef } from "../../stats-def.namespace";
import { SummaryStatsGroup } from "../../summary-stat-group.model";

export class CyclingSummaryStatsGroup extends SummaryStatsGroup {
  constructor(name: string) {
    super(name);
  }

  public static fromActivity(activity: SyncedActivityModel): StatsGroup {
    return CyclingSummaryStatsGroup.getDefault(activity);
  }

  public static getDefault(activity: SyncedActivityModel): StatsGroup {
    const powerSensor = CyclingPowerSensor.getDefault(activity);

    const summaryStatsGroup = new CyclingSummaryStatsGroup("Cycling");

    summaryStatsGroup.addStatsPool([StatsDef.Generic.movingTime, StatsDef.Generic.elapsedTime]);

    summaryStatsGroup.addStatsPool([StatsDef.Generic.distance]);

    summaryStatsGroup.addStatsPool([StatsDef.Elevation.ascentGain, StatsDef.Generic.moveRatio]);

    summaryStatsGroup.addStatsPool([StatsDef.Speed.avg]);

    summaryStatsGroup.addStatsPool([StatsDef.HeartRate.avg, StatsDef.Speed.max]);

    summaryStatsGroup.addStatsPool([StatsDef.Cadence.Cycling.activeAvg, StatsDef.HeartRate.hrr, StatsDef.Speed.q75]);

    summaryStatsGroup.addStatsPool([
      powerSensor.isEstimated ? null : StatsDef.Power.threshold(powerSensor),
      StatsDef.HeartRate.threshold,
      StatsDef.Speed.threshold
    ]);

    summaryStatsGroup.addStatsPool([
      powerSensor.isEstimated ? null : StatsDef.Power.Cycling.pss(powerSensor, activity.start_time),
      StatsDef.HeartRate.hrss,
      StatsDef.Generic.calories
    ]);

    summaryStatsGroup.addStatsPool([
      powerSensor.isEstimated ? null : StatsDef.Power.Cycling.pssPerHour(powerSensor, activity.start_time),
      StatsDef.HeartRate.hrssPerHour,
      StatsDef.Generic.caloriesPerHour
    ]);

    summaryStatsGroup.addStatsPool([StatsDef.Elevation.avgVertSpeed]);

    return summaryStatsGroup.mutateAsStatsGroup(activity);
  }
}
