import { StatsGroup } from "../stat-group.model";
import { Stat } from "../stat.model";
import { PaceSensor, SwimmingPaceSensor } from "../../sensors/move.sensor";
import { StatsDef } from "../stats-def.namespace";
import { Activity, PaceStats, StressScores } from "@elevate/shared/models/sync/activity.model";

export class RunningPaceStatsGroup extends StatsGroup {
  public static getDefault(activity: Activity): RunningPaceStatsGroup {
    return new RunningPaceStatsGroup(activity);
  }

  private static getStats(activity: Activity): Stat<PaceStats & StressScores>[] {
    return [
      StatsDef.Pace.Running.avg,
      StatsDef.Pace.Running.gap,
      StatsDef.Pace.Running.max,
      StatsDef.Pace.Running.threshold,
      StatsDef.Pace.Running.q25,
      StatsDef.Pace.Running.q50,
      StatsDef.Pace.Running.q75,
      StatsDef.Pace.Running.stdDeviation,
      StatsDef.Scores.Stress.Running.runningStressScore(activity.startTime),
      StatsDef.Scores.Stress.Running.runningStressScorePerHour(activity.startTime)
    ];
  }

  constructor(activity: Activity) {
    super(PaceSensor.DEFAULT.name, RunningPaceStatsGroup.getStats(activity), PaceSensor.DEFAULT.color);
  }
}

export class SwimmingPaceStatsGroup extends StatsGroup {
  public static getDefault(activity: Activity): SwimmingPaceStatsGroup {
    return new SwimmingPaceStatsGroup(activity);
  }

  private static getStats(activity: Activity): Stat<PaceStats & StressScores>[] {
    return [
      StatsDef.Pace.Swimming.avg,
      StatsDef.Pace.Swimming.max,
      StatsDef.Pace.Swimming.threshold,
      StatsDef.Pace.Swimming.q25,
      StatsDef.Pace.Swimming.q50,
      StatsDef.Pace.Swimming.q75,
      StatsDef.Scores.Stress.Swimming.swimStressScore(activity.startTime),
      StatsDef.Scores.Stress.Swimming.swimStressScorePerHour(activity.startTime)
    ];
  }

  constructor(activity: Activity) {
    super(SwimmingPaceSensor.DEFAULT.name, SwimmingPaceStatsGroup.getStats(activity), SwimmingPaceSensor.DEFAULT.color);
  }
}
