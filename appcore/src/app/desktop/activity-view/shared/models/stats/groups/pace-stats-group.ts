import { StatsGroup } from "../stat-group.model";
import { Stat } from "../stat.model";
import { PaceDataModel, SyncedActivityModel } from "@elevate/shared/models";
import { PaceSensor, SwimmingPaceSensor } from "../../sensors/move.sensor";
import { StatsDef } from "../stats-def.namespace";

export class RunningPaceStatsGroup extends StatsGroup {
  public static getDefault(activity: SyncedActivityModel): RunningPaceStatsGroup {
    return new RunningPaceStatsGroup(activity);
  }

  private static getStats(activity: SyncedActivityModel): Stat<PaceDataModel>[] {
    return [
      StatsDef.Pace.Running.avg,
      StatsDef.Pace.Running.fullAvg,
      StatsDef.Pace.Running.gap,
      StatsDef.Pace.Running.max,
      StatsDef.Pace.Running.threshold,
      StatsDef.Pace.Running.q25,
      StatsDef.Pace.Running.q50,
      StatsDef.Pace.Running.q75,
      StatsDef.Pace.Running.stdDeviation,
      StatsDef.Pace.Running.runningStressScore(activity.start_time),
      StatsDef.Pace.Running.runningStressScorePerHour(activity.start_time)
    ];
  }

  constructor(activity: SyncedActivityModel) {
    super(PaceSensor.DEFAULT.name, RunningPaceStatsGroup.getStats(activity), PaceSensor.DEFAULT.color);
  }
}

export class SwimmingPaceStatsGroup extends StatsGroup {
  public static getDefault(activity: SyncedActivityModel): SwimmingPaceStatsGroup {
    return new SwimmingPaceStatsGroup(activity);
  }

  private static getStats(activity: SyncedActivityModel): Stat<PaceDataModel>[] {
    return [
      StatsDef.Pace.Swimming.avg,
      StatsDef.Pace.Swimming.max,
      StatsDef.Pace.Swimming.threshold,
      StatsDef.Pace.Swimming.q25,
      StatsDef.Pace.Swimming.q50,
      StatsDef.Pace.Swimming.q75,
      StatsDef.Pace.Swimming.stdDeviation,
      StatsDef.Pace.Swimming.swimStressScore(activity.start_time),
      StatsDef.Pace.Swimming.swimStressScorePerHour(activity.start_time)
    ];
  }

  constructor(activity: SyncedActivityModel) {
    super(SwimmingPaceSensor.DEFAULT.name, SwimmingPaceStatsGroup.getStats(activity), SwimmingPaceSensor.DEFAULT.color);
  }
}
