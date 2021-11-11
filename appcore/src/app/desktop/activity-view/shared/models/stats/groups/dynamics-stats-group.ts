import { StatsGroup } from "../stat-group.model";
import { Stat } from "../stat.model";
import { StatsDef } from "../stats-def.namespace";

export abstract class DynamicsStatsGroup extends StatsGroup {}

export class CyclingDynamicsStatsGroup extends DynamicsStatsGroup {
  private static readonly NAME: string = "Cycling Dynamics";

  constructor(stats: Stat<any>[]) {
    super(CyclingDynamicsStatsGroup.NAME, stats);
  }

  public static readonly DEFAULT: CyclingDynamicsStatsGroup = new CyclingDynamicsStatsGroup([
    StatsDef.Dynamics.Cycling.balanceLeft,
    StatsDef.Dynamics.Cycling.balanceRight,
    StatsDef.Dynamics.Cycling.torqueEffectivenessLeft,
    StatsDef.Dynamics.Cycling.torqueEffectivenessRight,
    StatsDef.Dynamics.Cycling.pedalSmoothnessLeft,
    StatsDef.Dynamics.Cycling.pedalSmoothnessRight,
    StatsDef.Dynamics.Cycling.standingTime,
    StatsDef.Dynamics.Cycling.seatedTime
  ]);
}

export class RunningDynamicsStatsGroup extends DynamicsStatsGroup {
  private static readonly NAME: string = "Running Dynamics";

  constructor(stats: Stat<any>[]) {
    super(RunningDynamicsStatsGroup.NAME, stats);
  }

  public static readonly DEFAULT: RunningDynamicsStatsGroup = new RunningDynamicsStatsGroup([
    StatsDef.Dynamics.Running.stanceTimeBalanceLeft,
    StatsDef.Dynamics.Running.stanceTimeBalanceRight,
    StatsDef.Dynamics.Running.stanceTime,
    StatsDef.Dynamics.Running.verticalOscillation,
    StatsDef.Dynamics.Running.verticalRatio,
    StatsDef.Dynamics.Running.avgStrideLength
  ]);
}
