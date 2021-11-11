import { StatsGroup } from "../stat-group.model";
import { Stat } from "../stat.model";
import { SpeedSensor } from "../../sensors/move.sensor";
import { StatsDef } from "../stats-def.namespace";
import { SpeedStats } from "@elevate/shared/models/sync/activity.model";

export class SpeedStatsGroup extends StatsGroup {
  private static readonly STATS: Stat<SpeedStats>[] = [
    StatsDef.Speed.avg,
    StatsDef.Speed.max,
    StatsDef.Speed.threshold,
    StatsDef.Speed.avgPace,
    StatsDef.Speed.q25,
    StatsDef.Speed.q50,
    StatsDef.Speed.q75,
    StatsDef.Speed.stdDeviation
  ];

  public static readonly DEFAULT: SpeedStatsGroup = new SpeedStatsGroup(
    SpeedSensor.DEFAULT.name,
    SpeedStatsGroup.STATS,
    SpeedSensor.DEFAULT.color
  );

  constructor(name: string, stats: Stat<any>[], color: string) {
    super(name, stats, color);
  }
}
