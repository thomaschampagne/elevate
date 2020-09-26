import { Injectable } from "@angular/core";
import { SyncedActivityModel } from "@elevate/shared/models";
import { ElevateSport, MeasureSystem } from "@elevate/shared/enums";
import _ from "lodash";
import { CyclingSummaryStatsGroup } from "./models/stats/groups/summary/cycling-summary-stats-group";
import { StatsGroup } from "./models/stats/stat-group.model";
import { StatGroupsDisplay } from "./models/stats/display/stat-group-display.model";
import { StatDisplay } from "./models/stats/display/stat-display.model";
import { CyclingPowerStatsGroup, RunningPowerStatsGroup } from "./models/stats/groups/power-stats-group";
import { SpeedStatsGroup } from "./models/stats/groups/speed-stats-group";
import { HearRateStatsGroup } from "./models/stats/groups/heartrate-stats-group";
import {
  CyclingCadenceStatsGroup,
  RunningCadenceStatsGroup,
  SwimmingCadenceStatsGroup
} from "./models/stats/groups/cadence-stats-group";
import { ElevationStatsGroup } from "./models/stats/groups/elevation-stats-group";
import { RunningSummaryStatsGroup } from "./models/stats/groups/summary/running-summary-stats-group";
import { RunningPaceStatsGroup, SwimmingPaceStatsGroup } from "./models/stats/groups/pace-stats-group";
import { SwimmingSummaryStatsGroup } from "./models/stats/groups/summary/swimming-summary-stats-group";
import {
  EssentialStatsGroup,
  RunningEssentialStatsGroup,
  SwimmingEssentialStatsGroup
} from "./models/stats/groups/essential-stats-group";
import { DefaultSummaryStatsGroup } from "./models/stats/groups/summary/default-summary-stats-group";

@Injectable()
export class ActivityStatsService {
  constructor() {}

  private static readonly SPORT_STATS_GROUP_MAP = new Map<
    ElevateSport,
    (activity: SyncedActivityModel) => StatsGroup[]
  >([
    [ElevateSport.Ride, ActivityStatsService.cyclingStatsGroupsFromActivity],
    [ElevateSport.VirtualRide, ActivityStatsService.cyclingStatsGroupsFromActivity],
    [ElevateSport.Run, ActivityStatsService.runningStatsGroupsFromActivity],
    [ElevateSport.VirtualRun, ActivityStatsService.runningStatsGroupsFromActivity],
    [ElevateSport.Hike, ActivityStatsService.runningStatsGroupsFromActivity],
    [ElevateSport.Swim, ActivityStatsService.swimmingStatsGroupsFromActivity]
  ]);

  private static readonly SPORT_SUMMARY_GROUP_MAP = new Map<
    ElevateSport,
    (activity: SyncedActivityModel) => StatsGroup
  >([
    [ElevateSport.Ride, CyclingSummaryStatsGroup.fromActivity],
    [ElevateSport.VirtualRide, CyclingSummaryStatsGroup.fromActivity],
    [ElevateSport.Run, RunningSummaryStatsGroup.fromActivity],
    [ElevateSport.VirtualRun, RunningSummaryStatsGroup.fromActivity],
    [ElevateSport.Hike, RunningSummaryStatsGroup.fromActivity],
    [ElevateSport.Swim, SwimmingSummaryStatsGroup.fromActivity]
  ]);

  private static cyclingStatsGroupsFromActivity(activity: SyncedActivityModel): StatsGroup[] {
    return [
      EssentialStatsGroup.DEFAULT,
      SpeedStatsGroup.DEFAULT,
      HearRateStatsGroup.DEFAULT,
      CyclingPowerStatsGroup.getDefault(activity),
      CyclingCadenceStatsGroup.DEFAULT,
      ElevationStatsGroup.DEFAULT
    ];
  }

  private static runningStatsGroupsFromActivity(activity: SyncedActivityModel): StatsGroup[] {
    return [
      RunningEssentialStatsGroup.DEFAULT,
      RunningPaceStatsGroup.getDefault(activity),
      HearRateStatsGroup.DEFAULT,
      RunningPowerStatsGroup.getDefault(activity),
      RunningCadenceStatsGroup.DEFAULT,
      ElevationStatsGroup.DEFAULT
    ];
  }

  private static swimmingStatsGroupsFromActivity(activity: SyncedActivityModel): StatsGroup[] {
    return [
      SwimmingEssentialStatsGroup.DEFAULT,
      SwimmingPaceStatsGroup.getDefault(activity),
      HearRateStatsGroup.DEFAULT,
      SwimmingCadenceStatsGroup.DEFAULT
    ];
  }

  private defaultStatsGroups(): StatsGroup[] {
    return [
      EssentialStatsGroup.DEFAULT,
      SpeedStatsGroup.DEFAULT,
      HearRateStatsGroup.DEFAULT,
      ElevationStatsGroup.DEFAULT
    ];
  }

  private findSummaryStatsGroupsFromActivity(activity: SyncedActivityModel): StatsGroup {
    // Get function which return stat group per sport type
    const summaryStatsGroupFunc = ActivityStatsService.SPORT_SUMMARY_GROUP_MAP.get(activity.type);

    // Return found or default group
    return summaryStatsGroupFunc ? summaryStatsGroupFunc(activity) : DefaultSummaryStatsGroup.getDefault(activity);
  }

  private findStatsGroupsFromActivity(activity: SyncedActivityModel): StatsGroup[] {
    // Get function which return summary stat group per sport type
    const statsGroupFunc = ActivityStatsService.SPORT_STATS_GROUP_MAP.get(activity.type);
    // Return found or default group
    return statsGroupFunc ? statsGroupFunc(activity) : this.defaultStatsGroups();
  }

  private generateStatsDisplaysOfStatsGroup(
    activity: SyncedActivityModel,
    measureSystem: MeasureSystem,
    statsGroup: StatsGroup,
    allowEmptyStatDisplay: boolean = true
  ): StatDisplay[] {
    let emptyStatsGroup = true; // We consider values of stats in group to be missing
    const statDisplays: StatDisplay[] = [];
    for (const stat of statsGroup.stats) {
      const statValue: number | string = stat ? _.get(activity, stat.path) : null;
      const statExists = Number.isFinite(statValue);
      if (statExists) {
        emptyStatsGroup = false;
      }
      if (statExists || allowEmptyStatDisplay) {
        statDisplays.push(StatDisplay.create(stat, statValue, measureSystem));
      }
    }
    return emptyStatsGroup ? [] : statDisplays;
  }

  public getStatsGroupsDisplays(activity: SyncedActivityModel, measureSystem: MeasureSystem): StatGroupsDisplay[] {
    const activityStatsGroups = this.findStatsGroupsFromActivity(activity);

    const statGroupsDisplays: StatGroupsDisplay[] = [];
    for (const statsGroup of activityStatsGroups) {
      const statsGroupDisplay: StatGroupsDisplay = {
        name: statsGroup.name,
        color: statsGroup.color,
        statDisplays: this.generateStatsDisplaysOfStatsGroup(activity, measureSystem, statsGroup)
      };

      if (statsGroupDisplay.statDisplays.length > 0) {
        statGroupsDisplays.push(statsGroupDisplay);
      }
    }

    return statGroupsDisplays;
  }

  public getSummaryStats(activity: SyncedActivityModel, measureSystem: MeasureSystem): StatDisplay[] {
    const summaryStatsGroup = this.findSummaryStatsGroupsFromActivity(activity);
    return this.generateStatsDisplaysOfStatsGroup(activity, measureSystem, summaryStatsGroup, false);
  }
}
