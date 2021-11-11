import { StatsGroup } from "../stat-group.model";
import { Stat } from "../stat.model";
import { ElevationSensor } from "../../sensors/elevation.sensor";
import { StatsDef } from "../stats-def.namespace";
import { ElevationStats } from "@elevate/shared/models/sync/activity.model";

export class ElevationStatsGroup extends StatsGroup {
  private static readonly STATS: Stat<ElevationStats>[] = [
    StatsDef.Elevation.ascentGain,
    StatsDef.Elevation.descentGain,
    StatsDef.Elevation.max,
    StatsDef.Elevation.min,
    StatsDef.Elevation.avgVertSpeed,
    StatsDef.Elevation.q25,
    StatsDef.Elevation.q50,
    StatsDef.Elevation.q75
  ];

  public static readonly DEFAULT: ElevationStatsGroup = new ElevationStatsGroup(
    ElevationSensor.DEFAULT.name,
    ElevationStatsGroup.STATS,
    ElevationSensor.DEFAULT.color
  );

  constructor(name: string, stats: Stat<any>[], color: string) {
    super(name, stats, color);
  }
}
