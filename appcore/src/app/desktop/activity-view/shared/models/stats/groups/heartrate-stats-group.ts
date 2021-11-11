import { StatsGroup } from "../stat-group.model";
import { Stat } from "../stat.model";
import { HeartRateSensor } from "../../sensors/heart-rate.sensor";
import { StatsDef } from "../stats-def.namespace";
import { HeartRateStats, StressScores } from "@elevate/shared/models/sync/activity.model";

export class HearRateStatsGroup extends StatsGroup {
  private static readonly STATS: Stat<HeartRateStats & StressScores>[] = [
    StatsDef.HeartRate.avg,
    StatsDef.HeartRate.max,
    StatsDef.Scores.Stress.hrss,
    StatsDef.Scores.Stress.hrssPerHour,
    StatsDef.Scores.Stress.trimp,
    StatsDef.Scores.Stress.trimpPerHour,
    StatsDef.HeartRate.threshold,
    StatsDef.HeartRate.thresholdHour,
    StatsDef.HeartRate.hrr,
    StatsDef.HeartRate.maxHrr,
    StatsDef.HeartRate.q25,
    StatsDef.HeartRate.q50,
    StatsDef.HeartRate.q75
  ];

  public static readonly DEFAULT: HearRateStatsGroup = new HearRateStatsGroup(
    HeartRateSensor.DEFAULT.name,
    HearRateStatsGroup.STATS,
    HeartRateSensor.DEFAULT.color
  );

  constructor(name: string, stats: Stat<any>[], color: string) {
    super(name, stats, color);
  }
}
