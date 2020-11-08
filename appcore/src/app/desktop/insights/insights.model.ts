import { AthleteSnapshotModel, SyncedActivityModel } from "@elevate/shared/models";
import { RuntimeInfo } from "@elevate/shared/electron";
import { ConnectorType, StravaAccount } from "@elevate/shared/sync";
import { ElevateSport } from "@elevate/shared/enums";

export namespace Insights {
  export interface Document {
    id: string;
  }

  export class Machine implements Document {
    public id: string;

    constructor(
      machineId: string,
      public version: string,
      public runtimeInfo: RuntimeInfo,
      // TODO Add latestAthleteSnapshot: AthleteSnapshotModel OR athleteModel: AthleteModel
      public stravaAccount: StravaAccount = null
    ) {
      this.id = machineId;
    }
  }

  export class Activity implements Document {
    public id: string;
    public machineId: string;

    public name: string;
    public type: ElevateSport;
    public startTime: string;
    public endTime: string;
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
    public minHr?: number;
    public maxHr?: number;
    public avgHr?: number;
    public hrss?: number;
    public lthr?: number;
    public avgWatts?: number;
    public avgKgWatts?: number;
    public normWatts?: number;
    public ftpWatts?: number;
    public pss?: number;
    public profile?: string;

    constructor(machineId: string, public syncedActivityModel: SyncedActivityModel) {
      this.id = syncedActivityModel.hash;
      this.machineId = machineId;

      // Common
      this.name = syncedActivityModel.name;
      this.type = syncedActivityModel.type;
      this.startTime = syncedActivityModel.start_time;
      this.endTime = syncedActivityModel.end_time;
      this.distance = syncedActivityModel.distance_raw;
      this.movingTime = syncedActivityModel.moving_time_raw;
      this.elapsedTime = syncedActivityModel.elapsed_time_raw;
      this.elevationGain = syncedActivityModel.elevation_gain_raw;
      this.powerMeter = syncedActivityModel.hasPowerMeter;
      this.trainer = syncedActivityModel.trainer;
      this.commute = syncedActivityModel.commute;
      this.calories = syncedActivityModel.calories;
      this.connector = syncedActivityModel.sourceConnectorType;
      this.latLngCenter = syncedActivityModel.latLngCenter;
      this.athleteSnapshot = syncedActivityModel.athleteSnapshot;

      const extendedStats = syncedActivityModel?.extendedStats;

      if (extendedStats) {
        // Movement
        if (extendedStats.speedData?.genuineAvgSpeed) {
          this.avgSpeed = extendedStats?.speedData?.genuineAvgSpeed;
        }
        if (extendedStats.speedData?.maxSpeed) {
          this.maxSpeed = extendedStats?.speedData?.maxSpeed;
        }
        if (extendedStats.speedData?.best20min) {
          this.ftpSpeed = extendedStats?.speedData?.best20min;
        }
        if (extendedStats.paceData?.avgPace) {
          this.avgPace = extendedStats?.paceData?.avgPace;
        }
        if (extendedStats.paceData?.runningStressScore) {
          this.rss = extendedStats?.paceData?.runningStressScore;
        }
        if (extendedStats.paceData?.swimStressScore) {
          this.sss = extendedStats?.paceData?.swimStressScore;
        }

        // Cadence
        if (extendedStats.cadenceData?.averageCadenceMoving) {
          this.avgCad = extendedStats?.cadenceData?.averageCadenceMoving;
        }
        if (extendedStats.cadenceData?.maxCadence) {
          this.maxCad = extendedStats?.cadenceData?.maxCadence;
        }

        // Heartrate
        if (extendedStats.heartRateData?.minHeartRate) {
          this.minHr = extendedStats?.heartRateData?.minHeartRate;
        }
        if (extendedStats.heartRateData?.maxHeartRate) {
          this.maxHr = extendedStats?.heartRateData?.maxHeartRate;
        }
        if (extendedStats.heartRateData?.averageHeartRate) {
          this.avgHr = extendedStats?.heartRateData?.averageHeartRate;
        }
        if (extendedStats.heartRateData?.HRSS) {
          this.hrss = extendedStats?.heartRateData?.HRSS;
        }
        if (extendedStats.heartRateData?.best20min) {
          this.lthr = extendedStats?.heartRateData?.best20min;
        }

        // Power
        if (extendedStats.powerData?.avgWatts) {
          this.avgWatts = extendedStats?.powerData?.avgWatts;
        }
        if (extendedStats.powerData?.avgWattsPerKg) {
          this.avgKgWatts = extendedStats?.powerData?.avgWattsPerKg;
        }
        if (extendedStats.powerData?.weightedPower) {
          this.normWatts = extendedStats?.powerData?.weightedPower;
        }
        if (extendedStats.powerData?.best20min) {
          this.ftpWatts = extendedStats?.powerData?.best20min;
        }
        if (extendedStats.powerData?.powerStressScore) {
          this.pss = extendedStats?.powerData?.powerStressScore;
        }

        // Others
        if (extendedStats.gradeData?.gradeProfile) {
          this.profile = extendedStats?.gradeData?.gradeProfile;
        }
      }
    }
  }
}
