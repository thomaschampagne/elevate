import { StatsGroup } from "../stat-group.model";
import { Stat } from "../stat.model";
import { StatsDef } from "../stats-def.namespace";
import { GradeSensor } from "../../sensors/grade.sensor";

export class GradeStatsGroup extends StatsGroup {
  protected constructor(stats: Stat<any>[]) {
    super(GradeSensor.DEFAULT.name, stats, GradeSensor.DEFAULT.color);
  }

  public static readonly DEFAULT: GradeStatsGroup = new GradeStatsGroup([
    StatsDef.Grade.profile,
    StatsDef.Grade.timeUp,
    StatsDef.Grade.timeFlat,
    StatsDef.Grade.timeDown,
    StatsDef.Grade.distUp,
    StatsDef.Grade.distFlat,
    StatsDef.Grade.distDown,
    StatsDef.Grade.speedUp,
    StatsDef.Grade.speedFlat,
    StatsDef.Grade.speedDown,
    StatsDef.Grade.cadenceUp,
    StatsDef.Grade.cadenceFlat,
    StatsDef.Grade.cadenceDown,
    StatsDef.Grade.avg,
    StatsDef.Grade.max,
    StatsDef.Grade.min,
    StatsDef.Grade.q25,
    StatsDef.Grade.q50,
    StatsDef.Grade.q75,
    StatsDef.Grade.stdDeviation
  ]);
}

export class CyclingGradeStatsGroup extends GradeStatsGroup {
  public static readonly DEFAULT: CyclingGradeStatsGroup = GradeStatsGroup.DEFAULT;

  constructor(stats: Stat<any>[]) {
    super(stats);
  }
}

export class RunningGradeStatsGroup extends GradeStatsGroup {
  public static readonly DEFAULT: RunningGradeStatsGroup = new RunningGradeStatsGroup([
    StatsDef.Grade.profile,
    StatsDef.Grade.timeUp,
    StatsDef.Grade.timeFlat,
    StatsDef.Grade.timeDown,
    StatsDef.Grade.distUp,
    StatsDef.Grade.distFlat,
    StatsDef.Grade.distDown,
    StatsDef.Grade.Running.paceUp,
    StatsDef.Grade.Running.paceFlat,
    StatsDef.Grade.Running.paceDown,
    StatsDef.Grade.Running.cadenceUp,
    StatsDef.Grade.Running.cadenceFlat,
    StatsDef.Grade.Running.cadenceDown,
    StatsDef.Grade.avg,
    StatsDef.Grade.max,
    StatsDef.Grade.min,
    StatsDef.Grade.q25,
    StatsDef.Grade.q50,
    StatsDef.Grade.q75,
    StatsDef.Grade.stdDeviation
  ]);

  constructor(stats: Stat<any>[]) {
    super(stats);
  }
}
