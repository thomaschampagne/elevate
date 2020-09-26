import { StatsGroup } from "../stat-group.model";
import { Stat } from "../stat.model";
import { SpeedDataModel } from "@elevate/shared/models";
import { SpeedSensor } from "../../sensors/move.sensor";
import { StatsDef } from "../stats-def.namespace";

export class SpeedStatsGroup extends StatsGroup {
  private static readonly STATS: Stat<SpeedDataModel>[] = [
    StatsDef.Speed.avg,
    StatsDef.Speed.fullAvg,
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
