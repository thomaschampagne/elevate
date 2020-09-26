import { StatsGroup } from "../stat-group.model";
import { Stat } from "../stat.model";
import { AnalysisDataModel } from "@elevate/shared/models";
import { StatsDef } from "../stats-def.namespace";
import _ from "lodash";

export class EssentialStatsGroup extends StatsGroup {
  private static readonly NAME: string = "Essential";
  private static readonly COLOR: string = "#e7e7e7";
  protected static readonly STATS: Stat<AnalysisDataModel>[] = [
    StatsDef.Generic.movingTime,
    StatsDef.Generic.elapsedTime,
    StatsDef.Generic.distance,
    StatsDef.Generic.ascentGain,
    StatsDef.Generic.moveRatio,
    StatsDef.Generic.calories,
    StatsDef.Generic.caloriesPerHour
  ];

  public static readonly DEFAULT: EssentialStatsGroup = new EssentialStatsGroup(EssentialStatsGroup.STATS);

  constructor(stats: Stat<any>[]) {
    super(EssentialStatsGroup.NAME, stats, EssentialStatsGroup.COLOR);
  }
}

export class RunningEssentialStatsGroup extends EssentialStatsGroup {
  public static readonly DEFAULT: RunningEssentialStatsGroup = new RunningEssentialStatsGroup(
    _.union(EssentialStatsGroup.STATS, [StatsDef.Generic.Running.performanceIndex])
  );

  constructor(stats: Stat<any>[]) {
    super(stats);
  }
}

export class SwimmingEssentialStatsGroup extends EssentialStatsGroup {
  public static readonly DEFAULT: SwimmingEssentialStatsGroup = new SwimmingEssentialStatsGroup(
    _.union(EssentialStatsGroup.STATS, [StatsDef.Generic.Swimming.swolf])
  );

  constructor(stats: Stat<any>[]) {
    super(stats);
  }
}
