import { Activity, ActivityFlag, ActivityStats } from "@elevate/shared/models/sync/activity.model";
import { Streams } from "@elevate/shared/models/activity-data/streams.model";
import _ from "lodash";
import { ElevateSport } from "@elevate/shared/enums/elevate-sport.enum";
import { Constant } from "@elevate/shared/constants/constant";
import { ActivityComputer } from "@elevate/shared/sync/compute/activity-computer";

export class ActivityFlagsProcessor {
  public static readonly REASONS_MAP = new Map<ActivityFlag, string>([
    // Time
    [ActivityFlag.MOVING_TIME_GREATER_THAN_ELAPSED, "Moving time greater than elapsed time"],

    // Speed
    [ActivityFlag.SPEED_AVG_ABNORMAL, "Abnormal average speed"],
    [ActivityFlag.SPEED_STD_DEV_ABNORMAL, "Abnormal speed behavior"],

    // Pace
    [ActivityFlag.PACE_AVG_FASTER_THAN_GAP, "average pace is faster than grade adjusted pace"],

    // Power
    [ActivityFlag.POWER_AVG_KG_ABNORMAL, "Abnormal average watts/kg"],
    [ActivityFlag.POWER_THRESHOLD_ABNORMAL, "Abnormal power behavior"],

    // Heart-rate
    [ActivityFlag.HR_AVG_ABNORMAL, "Abnormal average heart rate"],

    // Scores
    [ActivityFlag.SCORE_HRSS_PER_HOUR_ABNORMAL, "Abnormal Heart Rate Stress Score (HRSS)"],
    [ActivityFlag.SCORE_PSS_PER_HOUR_ABNORMAL, "Abnormal Power Stress Score (PSS)"],
    [ActivityFlag.SCORE_RSS_PER_HOUR_ABNORMAL, "Abnormal Running Stress Score (RSS)"],
    [ActivityFlag.SCORE_SSS_PER_HOUR_ABNORMAL, "Abnormal Swimming Stress Score (SSS)"]
  ]);

  // Speed
  private static readonly SPEED_AVG_THRESHOLD_MAP = new Map<ElevateSport, number>([
    [ElevateSport.Ride, 60], // Kph
    [ElevateSport.VirtualRide, 60], // Kph
    [ElevateSport.Run, 22], // Kph
    [ElevateSport.VirtualRun, 22], // Kph
    [ElevateSport.Swim, 8.5] // Kph
  ]);

  public static readonly SPEED_STREAM_STD_DEV_THRESHOLD_DEFAULT = 25 / Constant.MPS_KPH_FACTOR; // Kph to mps
  static readonly SPEED_STREAM_STD_DEV_THRESHOLD_MAP = new Map<ElevateSport, number>([
    [ElevateSport.Ride, 27 / Constant.MPS_KPH_FACTOR], // Kph to mps
    [ElevateSport.VirtualRide, 27 / Constant.MPS_KPH_FACTOR], // Kph to mps
    [ElevateSport.Run, 15 / Constant.MPS_KPH_FACTOR], // Kph to mps
    [ElevateSport.VirtualRun, 15 / Constant.MPS_KPH_FACTOR], // Kph to mps
    [ElevateSport.Swim, 5 / Constant.MPS_KPH_FACTOR] // Kph to mps
  ]);

  // Heart-rate
  private static readonly HR_AVG_THRESHOLD = 195;

  // Power
  private static readonly POWER_AVG_KG_THRESHOLD = 7;
  private static readonly POWER_BEST_20MIN_THRESHOLD = 550;

  // Scores
  private static readonly SCORE_DEFAULT_PER_HOUR_THRESHOLD = 225;
  private static readonly SCORE_HRSS_PER_HOUR_THRESHOLD = ActivityFlagsProcessor.SCORE_DEFAULT_PER_HOUR_THRESHOLD;
  private static readonly SCORE_PSS_PER_HOUR_THRESHOLD = ActivityFlagsProcessor.SCORE_DEFAULT_PER_HOUR_THRESHOLD;
  private static readonly SCORE_RSS_PER_HOUR_THRESHOLD = ActivityFlagsProcessor.SCORE_DEFAULT_PER_HOUR_THRESHOLD;
  private static readonly SCORE_SSS_PER_HOUR_THRESHOLD = ActivityFlagsProcessor.SCORE_DEFAULT_PER_HOUR_THRESHOLD;

  public static verify(activity: Activity, streams: Streams): ActivityFlag[] {
    // If user remove flags with a null value, don't verify for flags. Return same value
    if (activity.flags === null) {
      return null;
    }

    return _.union(this.verifyStreams(activity.type, streams), this.verifyStats(activity));
  }

  public static verifyStreams(sport: ElevateSport, streams: Streams): ActivityFlag[] {
    const flags: ActivityFlag[] = [];

    const stdDevSpeedThreshold =
      this.SPEED_STREAM_STD_DEV_THRESHOLD_MAP.get(sport) || this.SPEED_STREAM_STD_DEV_THRESHOLD_DEFAULT;
    if (streams?.velocity_smooth?.length) {
      const standardDeviation = ActivityComputer.computeStandardDeviation(
        streams.velocity_smooth,
        _.mean(streams.velocity_smooth)
      );

      if (standardDeviation > stdDevSpeedThreshold) {
        flags.push(ActivityFlag.SPEED_STD_DEV_ABNORMAL);
      }
    }

    return flags;
  }

  public static verifyStats(activity: Activity): ActivityFlag[] {
    if (!activity.stats) {
      return [];
    }
    return _.union(
      this.verifyTime(activity.stats),
      this.verifyAverages(activity.type, activity.stats),
      this.verifyThresholds(activity.stats),
      this.verifyStressScores(activity.stats),
      this.verifyPace(activity.type, activity.stats)
    );
  }

  private static verifyStressScores(stats: ActivityStats): ActivityFlag[] {
    const flags: ActivityFlag[] = [];
    // Test hrss/h
    if (
      Number.isFinite(stats?.scores?.stress?.hrssPerHour) &&
      stats?.scores?.stress?.hrssPerHour > ActivityFlagsProcessor.SCORE_HRSS_PER_HOUR_THRESHOLD
    ) {
      flags.push(ActivityFlag.SCORE_HRSS_PER_HOUR_ABNORMAL);
    }

    // Test pss/h
    if (
      Number.isFinite(stats?.scores?.stress?.pssPerHour) &&
      stats?.scores?.stress?.pssPerHour > ActivityFlagsProcessor.SCORE_PSS_PER_HOUR_THRESHOLD
    ) {
      flags.push(ActivityFlag.SCORE_PSS_PER_HOUR_ABNORMAL);
    }

    // Test rss/h
    if (
      Number.isFinite(stats?.scores?.stress?.rssPerHour) &&
      stats?.scores?.stress?.rssPerHour > ActivityFlagsProcessor.SCORE_RSS_PER_HOUR_THRESHOLD
    ) {
      flags.push(ActivityFlag.SCORE_RSS_PER_HOUR_ABNORMAL);
    }

    // Test sss/h
    if (
      Number.isFinite(stats?.scores?.stress?.sssPerHour) &&
      stats?.scores?.stress?.sssPerHour > ActivityFlagsProcessor.SCORE_SSS_PER_HOUR_THRESHOLD
    ) {
      flags.push(ActivityFlag.SCORE_SSS_PER_HOUR_ABNORMAL);
    }

    return flags;
  }

  private static verifyAverages(sport: ElevateSport, stats: ActivityStats): ActivityFlag[] {
    const flags: ActivityFlag[] = [];

    // Speed
    const avgSpeedThreshold = this.SPEED_AVG_THRESHOLD_MAP.get(sport) || null;
    if (
      Number.isFinite(avgSpeedThreshold) &&
      Number.isFinite(stats?.speed?.avg) &&
      stats?.speed?.avg > avgSpeedThreshold
    ) {
      flags.push(ActivityFlag.SPEED_AVG_ABNORMAL);
    }

    // Heart rate
    if (Number.isFinite(stats?.heartRate?.avg) && stats?.heartRate?.avg > this.HR_AVG_THRESHOLD) {
      flags.push(ActivityFlag.HR_AVG_ABNORMAL);
    }

    // Avg watts/kg
    if (Number.isFinite(stats?.power?.avgKg) && stats?.power?.avgKg > this.POWER_AVG_KG_THRESHOLD) {
      flags.push(ActivityFlag.POWER_AVG_KG_ABNORMAL);
    }

    return flags;
  }

  private static verifyThresholds(stats: ActivityStats): ActivityFlag[] {
    const flags: ActivityFlag[] = [];
    if (Number.isFinite(stats?.power?.best20min) && stats?.power?.best20min > this.POWER_BEST_20MIN_THRESHOLD) {
      flags.push(ActivityFlag.POWER_THRESHOLD_ABNORMAL);
    }
    return flags;
  }

  private static verifyPace(sport: ElevateSport, stats: ActivityStats): ActivityFlag[] {
    const flags: ActivityFlag[] = [];

    if (Activity.isRun(sport) && Number.isFinite(stats?.pace?.avg) && Number.isFinite(stats?.pace?.gapAvg)) {
      if (stats?.pace?.avg < stats?.pace?.gapAvg) {
        flags.push(ActivityFlag.PACE_AVG_FASTER_THAN_GAP);
      }
    }

    return flags;
  }

  private static verifyTime(stats: ActivityStats): ActivityFlag[] {
    const flags: ActivityFlag[] = [];

    if (Number.isFinite(stats?.movingTime) && Number.isFinite(stats?.elapsedTime)) {
      if (stats?.movingTime > stats?.elapsedTime) {
        flags.push(ActivityFlag.MOVING_TIME_GREATER_THAN_ELAPSED);
      }
    }

    return flags;
  }
}
