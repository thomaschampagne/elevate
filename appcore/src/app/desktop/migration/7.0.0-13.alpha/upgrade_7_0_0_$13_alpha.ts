import { DesktopMigration } from "../desktop-migrations.model";
import { Injector } from "@angular/core";
import _ from "lodash";
import { extension } from "@elevate/shared/tools/extension";
import { Activity, ActivityStats } from "@elevate/shared/models/sync/activity.model";
import { ActivityFileType } from "@elevate/shared/sync/connectors/activity-file-type.enum";

export class Upgrade_7_0_0_$13_alpha extends DesktopMigration {
  public version = "7.0.0-13.alpha";

  public description = "Migrate to new activity model";

  public requiresRecalculation = true;

  public upgrade(db: LokiConstructor, injector: Injector): Promise<void> {
    const oldActivityCollection = db.getCollection("syncedActivities");
    const activityCollection = db.addCollection("activities");

    if (oldActivityCollection) {
      const oldActivities = oldActivityCollection.find();

      if (oldActivities?.length) {
        // Migrate old activities to the new model
        const activities = oldActivities.map(oldActivity => {
          delete oldActivity.$loki;
          delete oldActivity.meta;
          return this.convertLegacyActivityToNewModel(oldActivity);
        });

        // Insert in database
        activityCollection.insert(activities);

        // Drop old collection
        db.removeCollection("syncedActivities");
      }
    }

    return this.saveDatabase(db);
  }

  /**
   * Converts legacy activity model to new the one
   */
  private convertLegacyActivityToNewModel(legacyActivity: any): Activity {
    const startTimestamp = Math.floor(new Date(legacyActivity?.start_time).getTime() / 1000);
    const endTimestamp = startTimestamp + legacyActivity?.elapsed_time_raw;

    const activity: Activity = {
      id: legacyActivity?.id,
      name: legacyActivity?.name || null,
      type: legacyActivity?.type || null,
      startTime: legacyActivity?.start_time,
      endTime: new Date(endTimestamp * 1000).toISOString(),
      startTimestamp: startTimestamp,
      endTimestamp: endTimestamp,
      hasPowerMeter: legacyActivity?.hasPowerMeter,
      trainer: legacyActivity?.trainer,
      commute: legacyActivity?.commute || false,
      srcStats: {} as ActivityStats,
      stats: {} as ActivityStats,
      laps: null,
      athleteSnapshot: legacyActivity?.athleteSnapshot || null,
      connector: legacyActivity?.sourceConnectorType || null,
      latLngCenter: legacyActivity?.latLngCenter || null,
      hash: legacyActivity?.hash || null,
      settingsLack: legacyActivity?.settingsLack || null,
      creationTime: new Date().toISOString(),
      lastEditTime: new Date().toISOString(),
      device: null,
      autoDetectedType: false,
      manual: null,
      notes: null,
      extras: {}
    };

    // Handle root stats
    activity.stats = {
      distance: legacyActivity?.distance_raw,
      elevationGain: legacyActivity?.elevation_gain_raw,
      elapsedTime: legacyActivity?.elapsed_time_raw,
      movingTime: legacyActivity?.moving_time_raw,
      pauseTime:
        legacyActivity?.elapsed_time_raw && legacyActivity?.moving_time_raw
          ? legacyActivity?.elapsed_time_raw - legacyActivity?.moving_time_raw
          : 0,
      moveRatio: _.isNumber(legacyActivity?.extendedStats?.moveRatio)
        ? _.round(legacyActivity?.extendedStats?.moveRatio, 2)
        : 1,
      calories: legacyActivity?.extendedStats?.calories,
      caloriesPerHour: legacyActivity?.extendedStats?.caloriesPerHour
    } as ActivityStats;

    // Handle score
    activity.stats.scores = {
      stress: {
        hrss: (legacyActivity?.extendedStats?.heartRateData?.HRSS as number) || null,
        hrssPerHour: (legacyActivity?.extendedStats?.heartRateData?.HRSSPerHour as number) || null,
        trimp: (legacyActivity?.extendedStats?.heartRateData?.TRIMP as number) || null,
        trimpPerHour: (legacyActivity?.extendedStats?.heartRateData?.TRIMPPerHour as number) || null,
        rss: (legacyActivity?.extendedStats?.paceData?.runningStressScore as number) || null,
        rssPerHour: (legacyActivity?.extendedStats?.paceData?.runningStressScorePerHour as number) || null,
        sss: (legacyActivity?.extendedStats?.paceData?.swimStressScore as number) || null,
        sssPerHour: (legacyActivity?.extendedStats?.paceData?.swimStressScorePerHour as number) || null,
        pss: (legacyActivity?.extendedStats?.powerData?.powerStressScore as number) || null,
        pssPerHour: (legacyActivity?.extendedStats?.powerData?.powerStressScorePerHour as number) || null
      },
      runPerfIndex: (legacyActivity?.extendedStats?.runningPerformanceIndex as number) || null,
      swolf: {
        25: (legacyActivity?.extendedStats?.swimSwolf as number) || null,
        50: null
      }
    };

    // Handle speed
    activity.stats.speed = {
      avg: legacyActivity?.extendedStats?.speedData?.genuineAvgSpeed || null,
      max: legacyActivity?.extendedStats?.speedData?.maxSpeed || null,
      best20min: legacyActivity?.extendedStats?.speedData?.best20min || null,
      lowQ: legacyActivity?.extendedStats?.speedData?.lowerQuartileSpeed || null,
      median: legacyActivity?.extendedStats?.speedData?.medianSpeed || null,
      upperQ: legacyActivity?.extendedStats?.speedData?.upperQuartileSpeed || null,
      stdDev: legacyActivity?.extendedStats?.speedData?.standardDeviationSpeed || null,
      zones: legacyActivity?.extendedStats?.speedData?.speedZones || null,
      peaks: legacyActivity?.extendedStats?.speedData?.peaks
    };

    // Handle pace
    activity.stats.pace = {
      avg: legacyActivity?.extendedStats?.paceData?.avgPace || null,
      gapAvg: legacyActivity?.extendedStats?.paceData?.genuineGradeAdjustedAvgPace || null,
      max: legacyActivity?.extendedStats?.paceData?.maxPace || null,
      best20min: legacyActivity?.extendedStats?.paceData?.best20min || null,
      lowQ: legacyActivity?.extendedStats?.paceData?.lowerQuartilePace || null,
      median: legacyActivity?.extendedStats?.paceData?.medianPace || null,
      upperQ: legacyActivity?.extendedStats?.paceData?.upperQuartilePace || null,
      stdDev: legacyActivity?.extendedStats?.paceData?.standardDeviationPace || null,
      zones: legacyActivity?.extendedStats?.paceData?.paceZones || null
    };

    // Handle power
    activity.stats.power = {
      avg: legacyActivity?.extendedStats?.powerData?.avgWatts || null,
      avgKg: legacyActivity?.extendedStats?.powerData?.avgWattsPerKg || null,
      weighted: legacyActivity?.extendedStats?.powerData?.weightedPower || null,
      weightedKg: legacyActivity?.extendedStats?.powerData?.weightedWattsPerKg || null,
      max: legacyActivity?.extendedStats?.powerData?.maxPower || null,
      work: null,
      best20min: legacyActivity?.extendedStats?.powerData?.best20min || null,
      variabilityIndex: legacyActivity?.extendedStats?.powerData?.variabilityIndex || null,
      intensityFactor: legacyActivity?.extendedStats?.powerData?.punchFactor || null,
      lowQ: legacyActivity?.extendedStats?.powerData?.lowerQuartileWatts || null,
      median: legacyActivity?.extendedStats?.powerData?.medianWatts || null,
      upperQ: legacyActivity?.extendedStats?.powerData?.upperQuartileWatts || null,
      stdDev: null,
      zones: legacyActivity?.extendedStats?.powerData?.powerZones || null,
      peaks: legacyActivity?.extendedStats?.powerData?.peaks || null
    };

    // Handle heartRate
    activity.stats.heartRate = {
      avg: legacyActivity?.extendedStats?.heartRateData?.averageHeartRate || null,
      max: legacyActivity?.extendedStats?.heartRateData?.maxHeartRate || null,
      avgReserve: legacyActivity?.extendedStats?.heartRateData?.activityHeartRateReserve || null,
      maxReserve: legacyActivity?.extendedStats?.heartRateData?.activityHeartRateReserveMax || null,
      best20min: legacyActivity?.extendedStats?.heartRateData?.best20min || null,
      best60min: legacyActivity?.extendedStats?.heartRateData?.best60min || null,
      lowQ: legacyActivity?.extendedStats?.heartRateData?.lowerQuartileHeartRate || null,
      median: legacyActivity?.extendedStats?.heartRateData?.medianHeartRate || null,
      upperQ: legacyActivity?.extendedStats?.heartRateData?.upperQuartileHeartRate || null,
      stdDev: null,
      zones: legacyActivity?.extendedStats?.heartRateData?.heartRateZones || null,
      peaks: legacyActivity?.extendedStats?.heartRateData?.peaks || null
    };

    // Handle cadence
    activity.stats.cadence = {
      avg: legacyActivity?.extendedStats?.cadenceData?.averageCadence || null,
      max: legacyActivity?.extendedStats?.cadenceData?.maxCadence || null,
      avgActive: legacyActivity?.extendedStats?.cadenceData?.averageActiveCadence || null,
      activeRatio: _.round(legacyActivity?.extendedStats?.cadenceData?.cadenceActivePercentage, 2) / 100 || null,
      activeTime: legacyActivity?.extendedStats?.cadenceData?.cadenceActiveTime || null,
      cycles: legacyActivity?.extendedStats?.cadenceData?.totalOccurrences || null,
      distPerCycle: legacyActivity?.extendedStats?.cadenceData?.averageDistancePerOccurrence || null,
      lowQ: legacyActivity?.extendedStats?.cadenceData?.lowerQuartileCadence || null,
      median: legacyActivity?.extendedStats?.cadenceData?.medianCadence || null,
      upperQ: legacyActivity?.extendedStats?.cadenceData?.upperQuartileCadence || null,
      slope: {
        up: legacyActivity?.extendedStats?.cadenceData?.upFlatDownCadencePaceData?.up,
        flat: legacyActivity?.extendedStats?.cadenceData?.upFlatDownCadencePaceData?.flat,
        down: legacyActivity?.extendedStats?.cadenceData?.upFlatDownCadencePaceData?.down,
        total: legacyActivity?.extendedStats?.cadenceData?.upFlatDownCadencePaceData?.total
      },
      stdDev: legacyActivity?.extendedStats?.cadenceData?.standardDeviationCadence || null,
      zones: legacyActivity?.extendedStats?.cadenceData?.cadenceZones || null,
      peaks: legacyActivity?.extendedStats?.cadenceData?.peaks || null
    };

    // Handle grade
    activity.stats.grade = {
      avg: legacyActivity?.extendedStats?.gradeData?.avgGrade || null,
      max: legacyActivity?.extendedStats?.gradeData?.avgMaxGrade || null,
      min: legacyActivity?.extendedStats?.gradeData?.avgMinGrade || null,
      lowQ: legacyActivity?.extendedStats?.gradeData?.lowerQuartileGrade || null,
      median: legacyActivity?.extendedStats?.gradeData?.medianGrade || null,
      upperQ: legacyActivity?.extendedStats?.gradeData?.upperQuartileGrade || null,
      stdDev: null,
      slopeTime: {
        up: legacyActivity?.extendedStats?.gradeData?.upFlatDownInSeconds?.up,
        flat: legacyActivity?.extendedStats?.gradeData?.upFlatDownInSeconds?.flat,
        down: legacyActivity?.extendedStats?.gradeData?.upFlatDownInSeconds?.down,
        total: legacyActivity?.extendedStats?.gradeData?.upFlatDownInSeconds?.total
      },
      slopeSpeed: {
        up: legacyActivity?.extendedStats?.gradeData?.upFlatDownMoveData?.up,
        flat: legacyActivity?.extendedStats?.gradeData?.upFlatDownMoveData?.flat,
        down: legacyActivity?.extendedStats?.gradeData?.upFlatDownMoveData?.down,
        total: legacyActivity?.extendedStats?.gradeData?.upFlatDownMoveData?.total
      },
      slopeDistance: {
        up: legacyActivity?.extendedStats?.gradeData?.upFlatDownDistanceData?.up,
        flat: legacyActivity?.extendedStats?.gradeData?.upFlatDownDistanceData?.flat,
        down: legacyActivity?.extendedStats?.gradeData?.upFlatDownDistanceData?.down,
        total: legacyActivity?.extendedStats?.gradeData?.upFlatDownDistanceData?.total
      },
      slopeCadence: {
        up: legacyActivity?.extendedStats?.gradeData?.upFlatDownCadencePaceData?.up,
        flat: legacyActivity?.extendedStats?.gradeData?.upFlatDownCadencePaceData?.flat,
        down: legacyActivity?.extendedStats?.gradeData?.upFlatDownCadencePaceData?.down,
        total: legacyActivity?.extendedStats?.gradeData?.upFlatDownCadencePaceData?.total
      },

      slopeProfile: (legacyActivity?.extendedStats?.gradeData?.gradeProfile as any) || null,
      zones: legacyActivity?.extendedStats?.gradeData?.gradeZones || null,
      peaks: legacyActivity?.extendedStats?.gradeData?.peaks || null
    };

    // Handle elevation
    activity.stats.elevation = {
      avg: legacyActivity?.extendedStats?.elevationData?.avgElevation || null,
      max: legacyActivity?.extendedStats?.elevationData?.maxElevation || null,
      min: legacyActivity?.extendedStats?.elevationData?.minElevation || null,
      ascent: legacyActivity?.extendedStats?.elevationData?.accumulatedElevationAscent || null,
      descent: legacyActivity?.extendedStats?.elevationData?.accumulatedElevationDescent || null,
      ascentSpeed: legacyActivity?.extendedStats?.elevationData?.ascentSpeed?.avg || null,
      lowQ: legacyActivity?.extendedStats?.elevationData?.lowerQuartileElevation || null,
      median: legacyActivity?.extendedStats?.elevationData?.medianElevation || null,
      upperQ: legacyActivity?.extendedStats?.elevationData?.upperQuartileElevation || null,
      stdDev: null,
      elevationZones: legacyActivity?.extendedStats?.elevationData?.elevationZones || null
    };

    // Handle extras if exists
    if (legacyActivity?.extras?.strava_activity_id) {
      activity.extras = {
        strava: {
          activityId: legacyActivity?.extras?.strava_activity_id
        }
      };
    }

    if (legacyActivity?.extras?.fs_activity_location?.path) {
      activity.extras = {
        file: {
          path: legacyActivity?.extras?.fs_activity_location?.path,
          type: extension(legacyActivity?.extras?.fs_activity_location?.path) as ActivityFileType
        }
      };
    }

    // Handle LOKIJS fields if exists
    if ((legacyActivity as any).$loki) {
      (activity as any).$loki = (legacyActivity as any).$loki;
    }

    if ((legacyActivity as any).meta) {
      (activity as any).meta = (legacyActivity as any).meta;
    }

    return activity;
  }
}
