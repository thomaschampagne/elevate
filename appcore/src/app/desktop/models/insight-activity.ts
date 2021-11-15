import { NoSqlDoc } from "./nosql-doc";
import _ from "lodash";
import { ElevateSport } from "@elevate/shared/enums/elevate-sport.enum";
import { ConnectorType } from "@elevate/shared/sync/connectors/connector-type.enum";
import { AthleteSnapshot } from "@elevate/shared/models/athlete/athlete-snapshot.model";
import { Activity, SlopeProfile } from "@elevate/shared/models/sync/activity.model";

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
  public athleteSnapshot: AthleteSnapshot;
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
  public profile?: SlopeProfile;
  public extras: { stravaId: number };

  constructor(machineId: string, activity: Activity) {
    this.id = activity.hash;
    this.machineId = machineId;

    // Common
    this.type = activity.type;
    this.startTime = new Date(activity.startTime);
    this.endTime = new Date(activity.endTime);
    this.connector = activity.connector;
    this.athleteSnapshot = activity.athleteSnapshot;

    if (_.isNumber(activity.stats.distance)) {
      this.distance = activity.stats.distance;
    }

    if (_.isNumber(activity.stats.movingTime)) {
      this.movingTime = activity.stats.movingTime;
    }

    if (_.isNumber(activity.stats.elapsedTime)) {
      this.elapsedTime = activity.stats.elapsedTime;
    }

    if (_.isNumber(activity.stats.elevationGain)) {
      this.elevationGain = activity.stats.elevationGain;
    }

    if (_.isBoolean(activity.hasPowerMeter)) {
      this.powerMeter = activity.hasPowerMeter;
    }

    if (_.isBoolean(activity.trainer)) {
      this.trainer = activity.trainer;
    }

    if (_.isBoolean(activity.commute)) {
      this.commute = activity.commute;
    }

    if (activity.stats && _.isNumber(activity.stats.calories)) {
      this.calories = activity.stats.calories;
    }

    if (_.isArray(activity.latLngCenter) && activity.latLngCenter.length > 0) {
      this.latLngCenter = activity.latLngCenter;
    }

    if (activity?.extras?.strava?.activityId) {
      this.extras = {
        stravaId: activity.extras.strava.activityId
      };
    }

    const stats = activity?.stats;

    if (stats) {
      // Movement
      if (stats?.speed?.avg) {
        this.avgSpeed = _.round(stats.speed.avg, 2);
      }
      if (stats?.speed?.max) {
        this.maxSpeed = _.round(stats.speed.max, 2);
      }
      if (stats?.speed?.best20min) {
        this.ftpSpeed = _.round(stats.speed.best20min, 2);
      }
      if (stats?.pace?.avg) {
        this.avgPace = _.round(stats.pace.avg, 2);
      }
      if (stats?.scores?.stress?.rss) {
        this.rss = _.round(stats.scores.stress?.rss, 2);
      }
      if (stats?.scores?.stress?.sss) {
        this.sss = _.round(stats.scores.stress.sss, 2);
      }

      // Cadence
      if (stats?.cadence?.avgActive) {
        this.avgCad = _.round(stats.cadence.avgActive, 2);
      }
      if (stats?.cadence?.max) {
        this.maxCad = _.round(stats.cadence.max, 2);
      }

      // Heartrate
      if (stats?.heartRate?.max) {
        this.maxHr = _.round(stats.heartRate.max, 2);
      }
      if (stats?.heartRate?.avg) {
        this.avgHr = _.round(stats.heartRate.avg, 2);
      }
      if (stats?.scores?.stress.hrss) {
        this.hrss = _.round(stats.scores.stress.hrss, 2);
      }
      if (stats?.heartRate?.best20min) {
        this.lthr = _.round(stats.heartRate.best20min, 2);
      }

      // Power
      if (stats?.power?.avg) {
        this.avgWatts = _.round(stats.power.avg, 2);
      }
      if (stats?.power?.avgKg) {
        this.avgKgWatts = _.round(stats.power.avgKg, 2);
      }
      if (stats?.power?.weighted) {
        this.normWatts = _.round(stats.power.weighted, 2);
      }
      if (stats?.power?.best20min) {
        this.ftpWatts = _.round(stats.power.best20min, 2);
      }
      if (stats?.scores?.stress?.pss) {
        this.pss = _.round(stats.scores.stress.pss, 2);
      }

      // Others
      if (stats?.grade?.slopeProfile) {
        this.profile = stats?.grade?.slopeProfile;
      }
    }
  }
}
