import { AthleteSnapshotModel, SyncedActivityModel } from "@elevate/shared/models";
import { ConnectorType } from "@elevate/shared/sync";
import { ElevateSport, GradeProfile } from "@elevate/shared/enums";
import { NoSqlDoc } from "./nosql-doc";
import _ from "lodash";

export class InsightActivity implements NoSqlDoc {
  public id: string;
  public machineId: string;

  public type: ElevateSport;
  public startTime: Date;
  public endTime: Date;
  public distance: number;
  public movingTime: number;
  public elapsedTime: number;
  public elevationGain: number;
  public powerMeter: boolean;
  public trainer: boolean;
  public commute: boolean;
  public calories: number;
  public connector: ConnectorType;
  public latLngCenter?: number[];
  public athleteSnapshot: AthleteSnapshotModel;
  public avgPace?: number;
  public rss?: number;
  public sss?: number;
  public avgSpeed?: number;
  public maxSpeed?: number;
  public ftpSpeed?: number;
  public avgCad?: number;
  public maxCad?: number;
  public maxHr?: number;
  public avgHr?: number;
  public hrss?: number;
  public lthr?: number;
  public avgWatts?: number;
  public avgKgWatts?: number;
  public normWatts?: number;
  public ftpWatts?: number;
  public pss?: number;
  public profile?: GradeProfile;
  public extras: { stravaId: number };

  constructor(machineId: string, syncedActivityModel: SyncedActivityModel) {
    this.id = syncedActivityModel.hash;
    this.machineId = machineId;

    // Common
    this.type = syncedActivityModel.type;
    this.startTime = new Date(syncedActivityModel.start_time);
    this.endTime = new Date(syncedActivityModel.end_time);
    this.connector = syncedActivityModel.sourceConnectorType;
    this.athleteSnapshot = syncedActivityModel.athleteSnapshot;

    if (_.isNumber(syncedActivityModel.distance_raw)) {
      this.distance = syncedActivityModel.distance_raw;
    }

    if (_.isNumber(syncedActivityModel.moving_time_raw)) {
      this.movingTime = syncedActivityModel.moving_time_raw;
    }

    if (_.isNumber(syncedActivityModel.elapsed_time_raw)) {
      this.elapsedTime = syncedActivityModel.elapsed_time_raw;
    }

    if (_.isNumber(syncedActivityModel.elevation_gain_raw)) {
      this.elevationGain = syncedActivityModel.elevation_gain_raw;
    }

    if (_.isBoolean(syncedActivityModel.hasPowerMeter)) {
      this.powerMeter = syncedActivityModel.hasPowerMeter;
    }

    if (_.isBoolean(syncedActivityModel.trainer)) {
      this.trainer = syncedActivityModel.trainer;
    }

    if (_.isBoolean(syncedActivityModel.commute)) {
      this.commute = syncedActivityModel.commute;
    }

    if (syncedActivityModel.extendedStats && _.isNumber(syncedActivityModel.extendedStats.calories)) {
      this.calories = syncedActivityModel.extendedStats.calories;
    }

    if (_.isArray(syncedActivityModel.latLngCenter) && syncedActivityModel.latLngCenter.length > 0) {
      this.latLngCenter = syncedActivityModel.latLngCenter;
    }

    if (syncedActivityModel.extras && syncedActivityModel.extras.strava_activity_id) {
      this.extras = {
        stravaId: syncedActivityModel.extras.strava_activity_id
      };
    }

    const extendedStats = syncedActivityModel?.extendedStats;

    if (extendedStats) {
      // Movement
      if (extendedStats.speedData?.genuineAvgSpeed) {
        this.avgSpeed = _.round(extendedStats?.speedData?.genuineAvgSpeed, 2);
      }
      if (extendedStats.speedData?.maxSpeed) {
        this.maxSpeed = _.round(extendedStats?.speedData?.maxSpeed, 2);
      }
      if (extendedStats.speedData?.best20min) {
        this.ftpSpeed = _.round(extendedStats?.speedData?.best20min, 2);
      }
      if (extendedStats.paceData?.avgPace) {
        this.avgPace = _.round(extendedStats?.paceData?.avgPace, 2);
      }
      if (extendedStats.paceData?.runningStressScore) {
        this.rss = _.round(extendedStats?.paceData?.runningStressScore, 2);
      }
      if (extendedStats.paceData?.swimStressScore) {
        this.sss = _.round(extendedStats?.paceData?.swimStressScore, 2);
      }

      // Cadence
      if (extendedStats.cadenceData?.averageActiveCadence) {
        this.avgCad = _.round(extendedStats?.cadenceData?.averageActiveCadence, 2);
      }
      if (extendedStats.cadenceData?.maxCadence) {
        this.maxCad = _.round(extendedStats?.cadenceData?.maxCadence, 2);
      }

      // Heartrate
      if (extendedStats.heartRateData?.maxHeartRate) {
        this.maxHr = _.round(extendedStats?.heartRateData?.maxHeartRate, 2);
      }
      if (extendedStats.heartRateData?.averageHeartRate) {
        this.avgHr = _.round(extendedStats?.heartRateData?.averageHeartRate, 2);
      }
      if (extendedStats.heartRateData?.HRSS) {
        this.hrss = _.round(extendedStats?.heartRateData?.HRSS, 2);
      }
      if (extendedStats.heartRateData?.best20min) {
        this.lthr = _.round(extendedStats?.heartRateData?.best20min, 2);
      }

      // Power
      if (extendedStats.powerData?.avgWatts) {
        this.avgWatts = _.round(extendedStats?.powerData?.avgWatts, 2);
      }
      if (extendedStats.powerData?.avgWattsPerKg) {
        this.avgKgWatts = _.round(extendedStats?.powerData?.avgWattsPerKg, 2);
      }
      if (extendedStats.powerData?.weightedPower) {
        this.normWatts = _.round(extendedStats?.powerData?.weightedPower, 2);
      }
      if (extendedStats.powerData?.best20min) {
        this.ftpWatts = _.round(extendedStats?.powerData?.best20min, 2);
      }
      if (extendedStats.powerData?.powerStressScore) {
        this.pss = _.round(extendedStats?.powerData?.powerStressScore, 2);
      }

      // Others
      if (extendedStats.gradeData?.gradeProfile) {
        this.profile = extendedStats?.gradeData?.gradeProfile;
      }
    }
  }
}
