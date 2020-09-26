import { StatsGroup } from "../stat-group.model";
import { Stat } from "../stat.model";
import { CadenceDataModel } from "@elevate/shared/models";
import { CyclingCadenceSensor, RunningCadenceSensor, SwimmingCadenceSensor } from "../../sensors/cadence.sensor";
import { StatsDef } from "../stats-def.namespace";

export abstract class CadenceStatsGroup extends StatsGroup {
  protected constructor(name: string, stats: Stat<any>[], color: string) {
    super(name, stats, color);
  }
}

export class CyclingCadenceStatsGroup extends CadenceStatsGroup {
  private static readonly STATS: Stat<CadenceDataModel>[] = [
    StatsDef.Cadence.Cycling.activeAvg,
    StatsDef.Cadence.Cycling.avg,
    StatsDef.Cadence.Cycling.max,
    StatsDef.Cadence.Cycling.pedalingTime,
    StatsDef.Cadence.Cycling.pedalingRatio,
    StatsDef.Cadence.Cycling.avgClimb,
    StatsDef.Cadence.Cycling.avgFlat,
    StatsDef.Cadence.Cycling.avgDown,
    StatsDef.Cadence.Cycling.totalOccurrences,
    StatsDef.Cadence.Cycling.stdDeviation,
    StatsDef.Cadence.Cycling.q25,
    StatsDef.Cadence.Cycling.q50,
    StatsDef.Cadence.Cycling.q75,
    StatsDef.Cadence.Cycling.avgDistPerRev
  ];

  public static readonly DEFAULT: CyclingCadenceStatsGroup = new CyclingCadenceStatsGroup(
    CyclingCadenceSensor.DEFAULT.name,
    CyclingCadenceStatsGroup.STATS,
    CyclingCadenceSensor.DEFAULT.color
  );

  constructor(name: string, stats: Stat<any>[], color: string) {
    super(name, stats, color);
  }
}

export class RunningCadenceStatsGroup extends CadenceStatsGroup {
  private static readonly STATS: Stat<CadenceDataModel>[] = [
    StatsDef.Cadence.Running.activeAvg,
    StatsDef.Cadence.Running.avg,
    StatsDef.Cadence.Running.max,
    StatsDef.Cadence.Running.avgClimb,
    StatsDef.Cadence.Running.avgFlat,
    StatsDef.Cadence.Running.avgDown,
    StatsDef.Cadence.Running.totalOccurrences,
    StatsDef.Cadence.Running.stdDeviation,
    StatsDef.Cadence.Running.q25,
    StatsDef.Cadence.Running.q50,
    StatsDef.Cadence.Running.q75,
    StatsDef.Cadence.Running.avgDistPerStride
  ];

  public static readonly DEFAULT: RunningCadenceStatsGroup = new RunningCadenceStatsGroup(
    RunningCadenceSensor.DEFAULT.name,
    RunningCadenceStatsGroup.STATS,
    RunningCadenceSensor.DEFAULT.color
  );

  constructor(name: string, stats: Stat<any>[], color: string) {
    super(name, stats, color);
  }
}

export class SwimmingCadenceStatsGroup extends CadenceStatsGroup {
  private static readonly STATS: Stat<CadenceDataModel>[] = [
    StatsDef.Cadence.Swimming.activeAvg,
    StatsDef.Cadence.Swimming.avg,
    StatsDef.Cadence.Swimming.max,
    StatsDef.Cadence.Swimming.totalOccurrences,
    StatsDef.Cadence.Swimming.stdDeviation,
    StatsDef.Cadence.Swimming.q25,
    StatsDef.Cadence.Swimming.q50,
    StatsDef.Cadence.Swimming.q75,
    StatsDef.Cadence.Swimming.avgDistPerStroke
  ];

  public static readonly DEFAULT: SwimmingCadenceStatsGroup = new SwimmingCadenceStatsGroup(
    SwimmingCadenceSensor.DEFAULT.name,
    SwimmingCadenceStatsGroup.STATS,
    SwimmingCadenceSensor.DEFAULT.color
  );

  constructor(name: string, stats: Stat<any>[], color: string) {
    super(name, stats, color);
  }
}
