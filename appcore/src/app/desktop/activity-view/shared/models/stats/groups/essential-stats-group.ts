import { StatsGroup } from "../stat-group.model";
import { Stat } from "../stat.model";
import { StatsDef } from "../stats-def.namespace";
import _ from "lodash";
import { ActivityStats, Scores, StressScores } from "@elevate/shared/models/sync/activity.model";

export abstract class EssentialStatsGroup extends StatsGroup {
  private static readonly NAME: string = "Essential";
  protected static readonly BASE_STATS: Stat<ActivityStats & Scores & StressScores>[] = [
    StatsDef.Generic.movingTime,
    StatsDef.Generic.elapsedTime,
    StatsDef.Generic.moveRatio,
    StatsDef.Scores.efficiency,
    StatsDef.Scores.powerHr,
    StatsDef.Generic.calories,
    StatsDef.Generic.caloriesPerHour,
    StatsDef.Scores.Stress.aerobicTrainingEffect,
    StatsDef.Scores.Stress.anaerobicTrainingEffect
  ];

  protected constructor(stats: Stat<any>[]) {
    super(EssentialStatsGroup.NAME, stats);
  }
}

export class DefaultEssentialStatsGroup extends EssentialStatsGroup {
  public static readonly DEFAULT: DefaultEssentialStatsGroup = new DefaultEssentialStatsGroup(
    _.union([StatsDef.Distance.distance, StatsDef.Generic.ascentGain], EssentialStatsGroup.BASE_STATS)
  );

  constructor(stats: Stat<any>[]) {
    super(stats);
  }
}

export class RunningEssentialStatsGroup extends EssentialStatsGroup {
  public static readonly DEFAULT: RunningEssentialStatsGroup = new RunningEssentialStatsGroup(
    _.union([StatsDef.Distance.Running.distance, StatsDef.Generic.ascentGain], EssentialStatsGroup.BASE_STATS, [
      StatsDef.Scores.Running.runningRating
    ])
  );

  constructor(stats: Stat<any>[]) {
    super(stats);
  }
}

export class SwimmingEssentialStatsGroup extends EssentialStatsGroup {
  public static readonly DEFAULT: SwimmingEssentialStatsGroup = new SwimmingEssentialStatsGroup(
    _.union([StatsDef.Distance.Swimming.distance], EssentialStatsGroup.BASE_STATS, [
      StatsDef.Scores.Swimming.swolf25,
      StatsDef.Scores.Swimming.swolf50
    ])
  );

  constructor(stats: Stat<any>[]) {
    super(stats);
  }
}
