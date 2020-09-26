import { StatsGroup } from "../stat-group.model";
import { Stat } from "../stat.model";
import { HeartRateDataModel } from "@elevate/shared/models";
import { HeartRateSensor } from "../../sensors/heart-rate.sensor";
import { StatsDef } from "../stats-def.namespace";

export class HearRateStatsGroup extends StatsGroup {
  private static readonly STATS: Stat<HeartRateDataModel>[] = [
    StatsDef.HeartRate.avg,
    StatsDef.HeartRate.max,
    StatsDef.HeartRate.hrss,
    StatsDef.HeartRate.hrssPerHour,
    StatsDef.HeartRate.trimp,
    StatsDef.HeartRate.trimpPerHour,
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
