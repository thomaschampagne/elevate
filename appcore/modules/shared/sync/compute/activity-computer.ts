import _ from "lodash";
import { RunningPowerEstimator } from "./running-power-estimator";
import { CaloriesEstimator } from "./calories-estimator";
import { ProcessStreamMode, StreamProcessor } from "./stream-processor";
import { AthleteSnapshot } from "../../models/athlete/athlete-snapshot.model";
import {
  SlopeProfileCadences,
  SlopeProfileDistances,
  SlopeProfileDurations,
  SlopeProfileSpeeds
} from "../../models/activity-data/abstract-slope-profile.model";
import {
  Activity,
  ActivityStats,
  CadenceStats,
  ElevationStats,
  GradeStats,
  HeartRateStats,
  MoveStats,
  PaceStats,
  Peak,
  PowerStats,
  Scores,
  SlopeProfile,
  SlopeStats,
  SpeedStats
} from "../../models/sync/activity.model";
import { ActivityEssentials } from "../../models/activity-data/activity-essentials.model";
import { WarningException } from "../../exceptions/warning.exception";
import { Constant } from "../../constants/constant";
import { Gender } from "../../models/athlete/gender.enum";
import { ZoneType } from "../../enums/zone-type.enum";
import { ZoneModel } from "../../models/zone.model";
import { ElevateSport } from "../../enums/elevate-sport.enum";
import { UserZonesModel } from "../../models/user-settings/user-zones.model";
import { Streams } from "../../models/activity-data/streams.model";
import { TimePeaksCalculator } from "./time-peaks-calculator";
import { AthleteSettings } from "../../models/athlete/athlete-settings/athlete-settings.model";
import { Movement } from "../../tools/movement";
import { percentile } from "../../tools/percentile";
import { UserSettings } from "../../models/user-settings/user-settings.namespace";
import { ElevateException } from "../../exceptions/elevate.exception";
import { SplitCalculator } from "./split-calculator";
import BaseUserSettings = UserSettings.BaseUserSettings;

export class ActivityComputer {
  constructor(
    private readonly activityType: ElevateSport,
    private readonly userSettings: BaseUserSettings,
    private readonly athleteSnapshot: AthleteSnapshot,
    private readonly isOwner: boolean,
    private readonly hasPowerMeter: boolean,
    private readonly isSwimPool: boolean,
    private streams: Streams,
    private readonly bounds: number[],
    private readonly returnPeaks: boolean,
    private readonly returnZones: boolean,
    private readonly activityEssentials: ActivityEssentials
  ) {
    // We work on a streams copy to avoid integrity changes from the given source
    // Indeed some new streams calculation & shaping will be applied in compute method of this class
    this.streams = _.cloneDeep(streams);
    this.isMoving = ActivityComputer.getIsMovingFunction(this.activityType);
    this.isActiveCadence = ActivityComputer.getIsActiveCadenceFunction(this.activityType);
  }

  public static readonly DEFAULT_LTHR_KARVONEN_HRR_FACTOR: number = 0.85;
  public static readonly RND: number = 3;

  private static readonly IS_MOVING_SPORTS = new Map<ElevateSport, (...params) => boolean>([
    [ElevateSport.Ride, ActivityComputer.isMovingCycling],
    [ElevateSport.VirtualRide, ActivityComputer.isMovingCycling],
    [ElevateSport.Run, ActivityComputer.isMovingRunning],
    [ElevateSport.VirtualRun, ActivityComputer.isMovingRunning],
    [ElevateSport.Swim, ActivityComputer.isMovingSwimming]
  ]);

  private static readonly IS_ACTIVE_CADENCE_SPORTS = new Map<ElevateSport, (...params) => boolean>([
    [ElevateSport.Ride, ActivityComputer.isActiveCadenceCycling],
    [ElevateSport.VirtualRide, ActivityComputer.isActiveCadenceCycling],
    [ElevateSport.Run, ActivityComputer.isActiveCadenceRunning],
    [ElevateSport.VirtualRun, ActivityComputer.isActiveCadenceRunning],
    [ElevateSport.Swim, ActivityComputer.isActiveCadenceSwimming]
  ]);

  private static readonly DEFAULT_THRESHOLD_KPH: number = 0.3; // Kph
  private static readonly CYCLING_THRESHOLD_KPH: number = 4; // Kph
  private static readonly RUNNING_THRESHOLD_KPH: number = 1.5; // Kph
  private static readonly SWIMMING_THRESHOLD_KPH: number = 0.5; // Kph

  private static readonly CYCLING_CADENCE_THRESHOLD: number = 30; // revolutions per min
  private static readonly DEFAULT_CADENCE_THRESHOLD: number = 1;
  private static readonly RUNNING_CADENCE_THRESHOLD: number = 50; // strides per min (1 leg)
  private static readonly SWIMMING_CADENCE_THRESHOLD: number = 10; // strokes per min

  public static readonly ELEVATION_DELTA_THRESHOLD_METERS: number = 2;
  public static readonly GRADE_CLIMBING_LIMIT: number = 1.5;
  public static readonly GRADE_DOWNHILL_LIMIT: number = -1 * ActivityComputer.GRADE_CLIMBING_LIMIT;
  private static readonly GRADE_FLAT_PROFILE_THRESHOLD: number = 60;
  private static readonly WEIGHTED_WATTS_TIME_BUFFER: number = 30; // Seconds

  // Elevation

  private readonly isMoving: (speed: number) => boolean;
  private readonly isActiveCadence: (cadence: number) => boolean;

  private static getIsMovingFunction(sport: ElevateSport): (grade: number) => boolean {
    const thresholdFunction = ActivityComputer.IS_MOVING_SPORTS.get(sport);
    return thresholdFunction ? thresholdFunction : ActivityComputer.isMovingDefault;
  }

  private static isMovingDefault(speed: number): boolean {
    return speed > ActivityComputer.DEFAULT_THRESHOLD_KPH;
  }

  private static isMovingRunning(speed: number): boolean {
    return speed > ActivityComputer.RUNNING_THRESHOLD_KPH;
  }

  private static isMovingSwimming(speed: number): boolean {
    return speed > ActivityComputer.SWIMMING_THRESHOLD_KPH;
  }

  private static isMovingCycling(speed: number): boolean {
    return speed > ActivityComputer.CYCLING_THRESHOLD_KPH;
  }

  private static getIsActiveCadenceFunction(sport: ElevateSport): (grade: number) => boolean {
    const thresholdFunction = ActivityComputer.IS_ACTIVE_CADENCE_SPORTS.get(sport);
    return thresholdFunction ? thresholdFunction : ActivityComputer.isActiveCadenceDefault;
  }

  private static isActiveCadenceDefault(cadence: number): boolean {
    return cadence > ActivityComputer.DEFAULT_CADENCE_THRESHOLD;
  }

  private static isActiveCadenceRunning(cadence: number): boolean {
    return cadence > ActivityComputer.RUNNING_CADENCE_THRESHOLD;
  }

  private static isActiveCadenceCycling(cadence: number): boolean {
    return cadence > ActivityComputer.CYCLING_CADENCE_THRESHOLD;
  }

  private static isActiveCadenceSwimming(cadence: number): boolean {
    return cadence > ActivityComputer.SWIMMING_CADENCE_THRESHOLD;
  }

  public static compute(
    activity: Partial<Activity>,
    athleteSnapshot: AthleteSnapshot,
    userSettings: BaseUserSettings,
    streams: Streams,
    returnPeaks: boolean = false,
    returnZones: boolean = false,
    bounds: number[] = null,
    isOwner: boolean = true,
    activityEssentials: ActivityEssentials = null
  ): ActivityStats {
    return new ActivityComputer(
      activity.type,
      userSettings,
      athleteSnapshot,
      isOwner,
      activity.hasPowerMeter,
      activity.isSwimPool,
      streams,
      bounds,
      returnPeaks,
      returnZones,
      activityEssentials
    ).compute();
  }

  public static trainingImpulse(seconds: number, hrrPercent: number, gender: Gender): number {
    const factor = gender === Gender.MEN ? 1.92 : 1.67;
    const hrrRatio = hrrPercent / 100;
    return (seconds / 60) * hrrRatio * 0.64 * Math.exp(factor * hrrRatio);
  }

  public static heartRateReserveRatio(hr: number, maxHr: number, restHr: number): number {
    return Math.max((hr - restHr) / (maxHr - restHr), 0);
  }

  /**
   * Compute Heart Rate Stress Score (HRSS)
   */
  public static computeHeartRateStressScore(
    userGender: Gender,
    userMaxHr: number,
    userMinHr: number,
    lactateThreshold: number,
    activityTrainingImpulse: number
  ): number {
    const lactateThresholdReserve = (lactateThreshold - userMinHr) / (userMaxHr - userMinHr);
    const TRIMPGenderFactor: number = userGender === Gender.MEN ? 1.92 : 1.67;
    const lactateThresholdTrainingImpulse =
      60 * lactateThresholdReserve * 0.64 * Math.exp(TRIMPGenderFactor * lactateThresholdReserve);
    return (activityTrainingImpulse / lactateThresholdTrainingImpulse) * 100 || null;
  }

  public static computePowerStressScore(movingTime: number, weightedPower: number, thresholdPower: number): number {
    if (!_.isNumber(thresholdPower) || thresholdPower <= 0) {
      return null;
    }

    const intensity = weightedPower / thresholdPower;
    return ((movingTime * weightedPower * intensity) / (thresholdPower * Constant.SEC_HOUR_FACTOR)) * 100;
  }

  /**
   * Computes equivalent Polar running index
   * https://support.polar.com/en/support/tips/Running_Index_feature
   * https://www.polar.com/en/smart_coaching/features/running_index/chart
   */
  public static runningRating(
    athleteSnapshot: AthleteSnapshot,
    stats: ActivityStats,
    timeArray: number[],
    distanceArray: number[],
    velocityArray: number[]
  ): number {
    if (
      !stats.movingTime ||
      !stats?.heartRate?.avg ||
      !stats?.pace?.gapAvg ||
      !athleteSnapshot?.athleteSettings?.maxHr ||
      _.isEmpty(timeArray) ||
      _.isEmpty(distanceArray) ||
      _.isEmpty(velocityArray)
    ) {
      return null;
    }

    // Verify running rating requirements
    const COOPER_KPH_THRESHOLD = 6;
    const MAX_ASCENT_SPEED = 2200;

    // Verify legit ascent speed to get proper grade adjusted distance value
    if (Number.isFinite(stats?.elevation?.ascentSpeed) && stats?.elevation?.ascentSpeed > MAX_ASCENT_SPEED) {
      return null;
    }

    // Verify avg heart-rate against athlete current max hr. Should not be higher!
    if (Number.isFinite(stats?.heartRate?.avg) && stats?.heartRate?.avg > athleteSnapshot.athleteSettings.maxHr) {
      return null;
    }

    // Verify standard deviation. Missing variation means heart rate problem
    if (Number.isFinite(stats?.heartRate?.stdDev) && stats?.heartRate?.stdDev === 0) {
      return null;
    }

    // Ensure to have legit hr effort using HRR%
    if (
      (Number.isFinite(stats?.heartRate?.avgReserve) && stats.heartRate.avgReserve < 52) ||
      stats.heartRate.avgReserve > 98
    ) {
      return null;
    }

    // Verify that athlete ran at least 12 minutes over 6 kph. If not, no running performance index
    const bestCooperSpeed =
      ActivityComputer.computeTimeSplit(velocityArray, timeArray, 60 * 12) * Constant.MPS_KPH_FACTOR;
    if (bestCooperSpeed < COOPER_KPH_THRESHOLD) {
      return null;
    }

    // Compute the grade adjusted speed in meters per seconds
    const gradeAdjustedMetersPerSec = Movement.paceToSpeed(stats.pace.gapAvg) / Constant.MPS_KPH_FACTOR;

    // Keep the greatest adjusted distance
    const gradeAdjustedDistance = Math.max(gradeAdjustedMetersPerSec * stats.movingTime, _.last(distanceArray));

    // Now compute the running performance index
    const distanceRate: number = (213.9 / (stats.movingTime / 60)) * (gradeAdjustedDistance / 1000) ** 1.06 + 3.5;
    const intensity: number = Math.min((stats.heartRate.avg / athleteSnapshot.athleteSettings.maxHr) * 1.45 - 0.3, 1);
    return _.round(distanceRate / intensity, ActivityComputer.RND) || null;
  }

  public static computeRunningStressScore(
    movingTime: number,
    gradeAdjustedAvgPace: number,
    runningThresholdPace: number
  ): number {
    // Convert pace to speed (km/s)
    const gradeAdjustedAvgSpeed = 1 / gradeAdjustedAvgPace;
    const runningThresholdSpeed = 1 / runningThresholdPace;
    const intensityFactor = gradeAdjustedAvgSpeed / runningThresholdSpeed;
    return (
      ((movingTime * gradeAdjustedAvgSpeed * intensityFactor) / (runningThresholdSpeed * Constant.SEC_HOUR_FACTOR)) *
      100
    );
  }

  public static computeSwimStressScore(
    distance: number,
    movingTime: number,
    elapsedTime: number,
    swimFtp: number
  ): number {
    const normalizedSwimSpeed = distance / (movingTime / 60); // Normalized_Swim_Speed (m/min) = distance(m) / timeInMinutesNoRest
    const swimIntensity = normalizedSwimSpeed / swimFtp; // Intensity = Normalized_Swim_Speed / Swim FTP
    return Math.pow(swimIntensity, 3) * (elapsedTime / Constant.SEC_HOUR_FACTOR) * 100; // Swim Stress Score = Intensity^3 * TotalTimeInHours * 100
  }

  public static resolveLTHR(activityType: ElevateSport, athleteSettingsModel: AthleteSettings): number {
    if (athleteSettingsModel.lthr) {
      if (Activity.isRide(activityType, true)) {
        if (_.isNumber(athleteSettingsModel.lthr.cycling)) {
          return athleteSettingsModel.lthr.cycling;
        }
      }

      if (Activity.isRun(activityType)) {
        if (_.isNumber(athleteSettingsModel.lthr.running)) {
          return athleteSettingsModel.lthr.running;
        }
      }

      if (_.isNumber(athleteSettingsModel.lthr.default)) {
        return athleteSettingsModel.lthr.default;
      }
    }

    return (
      athleteSettingsModel.restHr +
      ActivityComputer.DEFAULT_LTHR_KARVONEN_HRR_FACTOR * (athleteSettingsModel.maxHr - athleteSettingsModel.restHr)
    );
  }

  /**
   * Andrew Coggan weighted power compute method
   * 1) starting at the 30s mark, calculate a rolling 30 s average (of the preceding time points, obviously).
   * 2) raise all the values obtained in step #1 to the 4th power.
   * 3) take the average of all of the values obtained in step #2.
   * 4) take the 4th root of the value obtained in step #3.
   * (And when you get tired of exporting every file to, e.g., Excel to perform such calculations, help develop a program
   * like WKO+ to do the work for you <g>.)
   */
  public static computeNormalizedPower(powerArray: number[], timeArray: number[]): number {
    const poweredWeightedWatts = [];

    let accumulatedTimeInBuffer = 0; // seconds
    let wattsInBuffer = [];

    for (const [index, current] of timeArray.entries()) {
      if (index === 0) {
        continue;
      }

      wattsInBuffer.push(powerArray[index]);

      if (accumulatedTimeInBuffer >= ActivityComputer.WEIGHTED_WATTS_TIME_BUFFER) {
        const meanWatts = _.mean(wattsInBuffer);

        if (Number.isFinite(meanWatts)) {
          poweredWeightedWatts.push(Math.pow(meanWatts, 4));
        }

        // Reset
        accumulatedTimeInBuffer = 0;
        wattsInBuffer = [];
      }

      accumulatedTimeInBuffer += current - timeArray[index - 1];
    }

    return Math.sqrt(Math.sqrt(_.mean(poweredWeightedWatts)));
  }

  public static computeSwimSwolf(secondsPer100m: number, avgStrokesPerMin: number, poolLength: number): number {
    const minutesPer100m = secondsPer100m / 60;
    const avgStrokePer100m = avgStrokesPerMin * minutesPer100m;
    const strokesPerMeter = avgStrokePer100m / 100;
    const secondsPerMeter = secondsPer100m / 100;
    return _.round((secondsPerMeter + strokesPerMeter) * poolLength, 1);
  }

  public static computeStandardDeviation(stream: number[], avg: number): number {
    const variance = _.mean(stream.map(value => Math.pow(value, 2))) - Math.pow(avg, 2);
    return variance > 0 ? Math.sqrt(variance) : 0;
  }

  public static hasAthleteSettingsLacks(
    distance: number,
    movingTime: number,
    elapsedTime: number,
    sportType: ElevateSport,
    stats: ActivityStats,
    athleteSetting: AthleteSettings
  ): boolean {
    const isCycling = Activity.isRide(sportType);
    const isRunning = Activity.isRun(sportType);
    const isSwimming = Activity.isSwim(sportType);

    if (!isCycling && !isRunning && !isSwimming) {
      return false;
    }

    const hasHeartRateStressScore = stats?.scores?.stress?.trimp && stats?.scores?.stress?.hrss;
    if (hasHeartRateStressScore) {
      return false;
    }

    if (isCycling && stats.power?.avg && !athleteSetting.cyclingFtp) {
      return true;
    }

    if (isRunning && stats.pace?.gapAvg && !athleteSetting.runningFtp) {
      return true;
    }

    if (isSwimming && distance > 0 && movingTime > 0 && elapsedTime > 0 && !athleteSetting.swimFtp) {
      return true;
    }

    return false;
  }

  private static computeElevationAscentStats(
    altitudeArray: number[],
    timeArray: number[],
    elevationDeltaThresholdMeters: number
  ): { ascentGain: number; ascentTime: number } {
    let startClimbIndex = 0;
    const ascentElevations = [];
    const ascentTimes = [];
    altitudeArray.reduce((previousAltitude: number, currentAltitude: number, index: number) => {
      // Get altitude difference between previous records and current one
      const deltaAltitude = currentAltitude - previousAltitude;

      // If delta greater than threshold
      if (elevationDeltaThresholdMeters <= deltaAltitude) {
        // Then track ascent gain
        ascentElevations.push(deltaAltitude);

        // And track ascent time
        ascentTimes.push(timeArray[index] - timeArray[startClimbIndex]);

        startClimbIndex = index; // reset climb index for next climb section
        return currentAltitude;
      }
      // If current altitude remains above previous one, keep previous altitude as comparison value for next record
      if (previousAltitude < currentAltitude) {
        return previousAltitude;
      }

      // Else (e.g. lower alt) skip record by returning current value as comparison value for next record
      startClimbIndex = index; // reset climb index for next climb section
      return currentAltitude;
    });

    const ascentGain = _.round(_.sum(ascentElevations), ActivityComputer.RND);
    const ascentTime = _.round(_.sum(ascentTimes), ActivityComputer.RND);
    return { ascentGain, ascentTime };
  }

  private static computeElevationDescentStats(
    altitudeArray: number[],
    timeArray: number[],
    elevationDeltaThresholdMeters: number
  ): { descentGain: number; descentTime: number } {
    let startDescentIndex = 0;
    const descentElevations = [];
    const descentTimes = [];
    altitudeArray.reduce((previousAltitude: number, currentAltitude: number, index: number) => {
      // Get altitude difference between previous records and current one
      const deltaAltitude = currentAltitude - previousAltitude;

      // If delta lower than threshold
      if (deltaAltitude <= -1 * elevationDeltaThresholdMeters) {
        // Then track descent gain
        descentElevations.push(deltaAltitude);

        // And track descent time
        descentTimes.push(timeArray[index] - timeArray[startDescentIndex]);

        startDescentIndex = index; // reset descent index for next climb section
        return currentAltitude;
      }
      // If current altitude remains below previous one, keep previous altitude as comparison value for next record
      if (previousAltitude > currentAltitude) {
        return previousAltitude;
      }

      // Else (e.g. higher alt) skip record by returning current value as comparison value for next record
      startDescentIndex = index; // reset descent index for next climb section
      return currentAltitude;
    });

    const descentGain = _.round(Math.abs(_.sum(descentElevations)), ActivityComputer.RND);
    const descentTime = _.round(_.sum(descentTimes), ActivityComputer.RND);
    return { descentGain, descentTime };
  }

  private static computeTimeSplit(values: number[], timeScale: number[], rangeSeconds: number): number {
    let bestSplitResult = null;
    try {
      const splitCalculator = new SplitCalculator(timeScale, values);
      const result = splitCalculator.compute(rangeSeconds);
      return _.round(result.value, ActivityComputer.RND);
    } catch (err) {
      if (!(err instanceof WarningException)) {
        throw err;
      }
    }
    return bestSplitResult;
  }

  private static getZoneOfValue(zones: ZoneModel[], value: number): ZoneModel {
    let matchingZone = null;

    for (const zone of zones) {
      if (value <= zone.to) {
        matchingZone = zone;
        break;
      }
    }

    return matchingZone;
  }

  private static quartiles(data: number[]): number[] {
    const sortedArrayAsc = _.cloneDeep(data).sort((a, b) => a - b);
    return [percentile(sortedArrayAsc, 0.25), percentile(sortedArrayAsc, 0.5), percentile(sortedArrayAsc, 0.75)];
  }

  private static sliceStreamFromBounds(streams: Streams, bounds: number[]): void {
    // Slices array if activity bounds given. It's mainly used for segment effort extended stats
    if (bounds && bounds[0] && bounds[1]) {
      if (!_.isEmpty(streams.velocity_smooth)) {
        streams.velocity_smooth = streams.velocity_smooth.slice(bounds[0], bounds[1]);
      }

      if (!_.isEmpty(streams.time)) {
        streams.time = streams.time.slice(bounds[0], bounds[1]);
      }

      if (!_.isEmpty(streams.latlng)) {
        streams.latlng = streams.latlng.slice(bounds[0], bounds[1]);
      }

      if (!_.isEmpty(streams.heartrate)) {
        streams.heartrate = streams.heartrate.slice(bounds[0], bounds[1]);
      }

      if (!_.isEmpty(streams.watts)) {
        streams.watts = streams.watts.slice(bounds[0], bounds[1]);
      }

      if (!_.isEmpty(streams.watts_calc)) {
        streams.watts_calc = streams.watts_calc.slice(bounds[0], bounds[1]);
      }

      if (!_.isEmpty(streams.cadence)) {
        streams.cadence = streams.cadence.slice(bounds[0], bounds[1]);
      }

      if (!_.isEmpty(streams.grade_smooth)) {
        streams.grade_smooth = streams.grade_smooth.slice(bounds[0], bounds[1]);
      }

      if (!_.isEmpty(streams.altitude)) {
        streams.altitude = streams.altitude.slice(bounds[0], bounds[1]);
      }

      if (!_.isEmpty(streams.distance)) {
        streams.distance = streams.distance.slice(bounds[0], bounds[1]);
      }

      if (!_.isEmpty(streams.grade_adjusted_speed)) {
        streams.grade_adjusted_speed = streams.grade_adjusted_speed.slice(bounds[0], bounds[1]);
      }
    }
  }

  private static computeTimePeaks(values: number[], timeScale: number[]): Peak[] {
    let peaks: Peak[] = null;
    try {
      peaks = TimePeaksCalculator.compute(timeScale, values);
    } catch (err) {
      if (!(err instanceof WarningException)) {
        throw err;
      }
    }
    return peaks;
  }

  private static moveStatsEstimate(movingTime: number, distance: number): MoveStats {
    if (!movingTime || !distance) {
      return null;
    }

    const avgSpeed = (distance / movingTime) * Constant.MPS_KPH_FACTOR;
    const avgPace = _.round(Movement.speedToPace(avgSpeed), 3);

    const speedStats: SpeedStats = {
      avg: avgSpeed,
      max: null,
      best20min: null,
      lowQ: null,
      median: null,
      upperQ: null,
      stdDev: null,
      zones: null,
      peaks: null
    };

    const paceStats: PaceStats = {
      avg: avgPace,
      gapAvg: avgPace,
      max: null,
      best20min: null,
      lowQ: null,
      median: null,
      upperQ: null,
      stdDev: null,
      zones: null
    };

    return {
      movingTime: movingTime,
      speed: speedStats,
      pace: paceStats
    };
  }

  private compute(): ActivityStats {
    if (!_.isEmpty(this.streams)) {
      this.streams = StreamProcessor.handle(
        ProcessStreamMode.COMPUTE,
        {
          type: this.activityType,
          hasPowerMeter: this.hasPowerMeter,
          isSwimPool: this.isSwimPool,
          athleteSnapshot: this.athleteSnapshot
        },
        this.streams
      );

      // Slices array stream if activity bounds are given.
      // It's mainly used for segment effort extended stats
      ActivityComputer.sliceStreamFromBounds(this.streams, this.bounds);
    }

    const stats = this.computeStats();

    if (
      !stats.distance &&
      !stats.elevationGain &&
      !stats.elapsedTime &&
      !stats.movingTime &&
      !stats.pauseTime &&
      !stats.moveRatio &&
      !stats.calories &&
      !stats.caloriesPerHour &&
      !stats.scores &&
      !stats.speed &&
      !stats.pace &&
      !stats.power &&
      !stats.heartRate &&
      !stats.cadence &&
      !stats.grade &&
      !stats.elevation
    ) {
      return null;
    }

    return stats;
  }

  private computeStats(): ActivityStats {
    let elapsedTime: number = null;
    let movingTime: number = null;
    let pauseTime: number = null;
    let moveRatio: number = null;

    const isCycling = Activity.isRide(this.activityType);
    const isRunning = Activity.isRun(this.activityType);
    const isSwimming = Activity.isSwim(this.activityType);

    // Include speed and pace
    if (this.streams && this.streams.time && this.streams.time.length > 0) {
      elapsedTime = _.last(this.streams.time);
    }

    // Grade
    const gradeStats: GradeStats =
      !_.isEmpty(this.streams) && !isSwimming
        ? this.gradeStats(
            this.streams.time,
            this.streams.grade_smooth,
            this.streams.velocity_smooth,
            this.streams.cadence
          )
        : null;

    // Prepare move data model along stream or activityEssentials
    let moveStats = this.streams
      ? this.moveStats(
          this.streams.time,
          this.streams.distance,
          this.streams.velocity_smooth,
          this.streams.grade_adjusted_speed
        )
      : null;

    const isMoveStatsComputed = !!moveStats;

    // Try to estimate some move data if no move data have been computed
    if (!isMoveStatsComputed && this.activityEssentials) {
      moveStats = ActivityComputer.moveStatsEstimate(
        this.activityEssentials.movingTime,
        this.activityEssentials.distance
      );
    }

    // Assign moving time
    if (moveStats && moveStats.movingTime > 0) {
      movingTime = moveStats.movingTime;
    }

    // Final time setup
    if (elapsedTime > 0 && !movingTime) {
      movingTime = elapsedTime;
    }

    if (!elapsedTime && movingTime > 0) {
      elapsedTime = movingTime;
    }

    if (elapsedTime > 0 && movingTime > 0) {
      pauseTime = elapsedTime - movingTime;
      moveRatio = movingTime / elapsedTime;
    }

    // Speed
    const speedStats: SpeedStats = moveStats && moveStats.speed ? moveStats.speed : null;

    // Pace
    const paceStats: PaceStats = moveStats && moveStats.pace ? moveStats.pace : null;

    // Find total distance
    let totalDistance;
    if (this.streams && !_.isEmpty(this.streams.distance)) {
      totalDistance = _.last(this.streams.distance);
    } else if (this.activityEssentials && this.activityEssentials.distance > 0) {
      totalDistance = this.activityEssentials.distance;
    } else {
      totalDistance = null;
    }

    // Power
    let powerStats: PowerStats = null;
    if (this.streams) {
      const hasWattsStream = !_.isEmpty(this.streams.watts);
      if (isCycling) {
        powerStats = this.cyclingPowerStats(
          this.streams.time,
          this.streams.watts,
          this.athleteSnapshot.athleteSettings.weight,
          this.athleteSnapshot.athleteSettings.cyclingFtp,
          movingTime
        );
      } else if (isRunning && hasWattsStream) {
        powerStats = this.runningPowerStats(
          this.streams.time,
          this.streams.watts,
          this.athleteSnapshot.athleteSettings.weight,
          null, // No running power threshold yet,
          movingTime
        );
      } else if (isRunning && !hasWattsStream && this.isOwner) {
        powerStats = this.estimatedRunningPower(
          this.streams,
          this.athleteSnapshot.athleteSettings.weight,
          null, // No running power threshold yet,
          movingTime
        );
      } else {
        powerStats = this.powerStats(
          this.streams.time,
          this.streams.watts,
          this.athleteSnapshot.athleteSettings.weight,
          null,
          movingTime,
          null
        );
      }
    }

    // Heart-rate
    const heartRateStats: HeartRateStats = !_.isEmpty(this.streams)
      ? this.heartRateStats(this.streams.time, this.streams.heartrate, this.athleteSnapshot)
      : null;

    // Cadence
    let cadenceStats: CadenceStats = null;
    if (this.streams && !_.isEmpty(this.streams.cadence)) {
      if (isCycling) {
        cadenceStats = this.cadenceStats(
          this.streams.time,
          this.streams.distance,
          this.streams.cadence,
          movingTime,
          ZoneType.CYCLING_CADENCE
        );
      } else if (isRunning) {
        cadenceStats = this.cadenceStats(
          this.streams.time,
          this.streams.distance,
          this.streams.cadence,
          movingTime,
          ZoneType.RUNNING_CADENCE
        );
      } else {
        cadenceStats = this.cadenceStats(
          this.streams.time,
          this.streams.distance,
          this.streams.cadence,
          movingTime,
          null
        );
      }
    }

    // ... if exists cadenceStats then append cadence pace (climbing, flat & downhill) if she has been previously provided by "gradeStats"
    if (cadenceStats && gradeStats && gradeStats.slopeCadence) {
      cadenceStats.slope = gradeStats.slopeCadence;
    }

    // Elevation
    let elevationStats: ElevationStats = null;
    if (this.streams) {
      elevationStats = this.elevationStats(this.streams.time, this.streams.distance, this.streams.altitude);
    }

    // Compute calories
    const calories = CaloriesEstimator.calc(
      this.activityType,
      movingTime,
      this.athleteSnapshot.athleteSettings.weight,
      this.athleteSnapshot.age,
      this.athleteSnapshot.gender,
      powerStats?.avg || null,
      heartRateStats?.avg || null
    );
    const caloriesPerHour = calories !== null ? (calories / elapsedTime) * Constant.SEC_HOUR_FACTOR : null;

    const stats: Partial<ActivityStats> = {
      distance: totalDistance,
      elevationGain: elevationStats?.ascent || null,
      moveRatio: _.round(moveRatio, ActivityComputer.RND),
      elapsedTime: elapsedTime,
      movingTime: movingTime,
      pauseTime: pauseTime,
      calories: _.round(calories),
      caloriesPerHour: _.round(caloriesPerHour, ActivityComputer.RND),
      speed: speedStats,
      pace: paceStats,
      power: powerStats,
      heartRate: heartRateStats,
      cadence: cadenceStats,
      grade: gradeStats,
      elevation: elevationStats
    };

    // Finally compute scores
    stats.scores = this.computeScores(this.activityType, stats, this.athleteSnapshot);

    return stats as ActivityStats;
  }

  private computeScores(
    type: ElevateSport,
    stats: Partial<ActivityStats>,
    athleteSnapshot: AthleteSnapshot /*isMoveStatsComputed: boolean, isRunning: boolean,*/
  ): Scores {
    const scores: Scores = {
      stress: {
        hrss: null,
        hrssPerHour: null,
        trimp: null,
        trimpPerHour: null,
        rss: null,
        rssPerHour: null,
        sss: null,
        sssPerHour: null,
        pss: null,
        pssPerHour: null
      }
    };

    // Training impulse (+ per hour)
    scores.stress.trimp = stats?.heartRate?.avgReserve
      ? ActivityComputer.trainingImpulse(stats.movingTime, stats.heartRate.avgReserve, this.athleteSnapshot.gender)
      : null;
    scores.stress.trimpPerHour = scores.stress.trimp
      ? (scores.stress.trimp / stats.movingTime) * Constant.SEC_HOUR_FACTOR
      : null;

    // Heart rate stress score (HRSS) (+ per hour)
    const lactateThreshold: number = ActivityComputer.resolveLTHR(type, athleteSnapshot.athleteSettings);
    scores.stress.hrss = ActivityComputer.computeHeartRateStressScore(
      athleteSnapshot.gender,
      athleteSnapshot.athleteSettings.maxHr,
      athleteSnapshot.athleteSettings.restHr,
      lactateThreshold,
      scores.stress.trimp
    );

    scores.stress.hrssPerHour = scores.stress.hrss
      ? (scores.stress.hrss / stats.movingTime) * Constant.SEC_HOUR_FACTOR
      : null;

    // Running stress score
    scores.stress.rss =
      stats.pace?.gapAvg && athleteSnapshot.athleteSettings?.runningFtp
        ? _.round(
            ActivityComputer.computeRunningStressScore(
              stats.movingTime,
              stats.pace.gapAvg,
              athleteSnapshot.athleteSettings.runningFtp
            ),
            ActivityComputer.RND
          )
        : null;
    scores.stress.rssPerHour = scores.stress.rss
      ? _.round((scores.stress.rss / stats.movingTime) * 60 * 60, ActivityComputer.RND)
      : null;

    // Swimming stress score
    scores.stress.sss =
      Activity.isSwim(type) && stats.distance && stats.movingTime && athleteSnapshot.athleteSettings?.swimFtp
        ? _.round(
            ActivityComputer.computeSwimStressScore(
              stats.distance,
              stats.movingTime,
              stats.elapsedTime,
              athleteSnapshot.athleteSettings.swimFtp
            ),
            ActivityComputer.RND
          )
        : null;
    scores.stress.sssPerHour = scores.stress.sss
      ? _.round((scores.stress.sss / stats.movingTime) * Constant.SEC_HOUR_FACTOR, ActivityComputer.RND)
      : null;

    // Power stress score
    scores.stress.pss =
      Activity.isRide(type) && stats.movingTime && stats.power?.weighted && athleteSnapshot.athleteSettings.cyclingFtp
        ? _.round(
            ActivityComputer.computePowerStressScore(
              stats.movingTime,
              stats.power.weighted,
              athleteSnapshot.athleteSettings.cyclingFtp
            ),
            ActivityComputer.RND
          )
        : null;
    scores.stress.pssPerHour = scores.stress.pss
      ? _.round((scores.stress.pss / stats.movingTime) * Constant.SEC_HOUR_FACTOR, ActivityComputer.RND)
      : null;

    // Running Rating
    scores.runningRating =
      Activity.isRun(type) &&
      this.streams &&
      this.streams.time?.length &&
      this.streams.distance?.length &&
      this.streams.velocity_smooth?.length
        ? ActivityComputer.runningRating(
            this.athleteSnapshot,
            stats as ActivityStats,
            this.streams.time,
            this.streams.distance,
            this.streams.velocity_smooth
          )
        : null;

    // Efficiency
    scores.efficiency =
      stats?.power?.weighted && stats?.heartRate?.avg
        ? _.round(stats?.power?.weighted / stats?.heartRate?.avg, ActivityComputer.RND)
        : null;

    // Power/HR
    scores.powerHr =
      stats?.power?.avg && stats?.heartRate?.avg
        ? _.round(stats?.power?.avg / stats?.heartRate?.avg, ActivityComputer.RND)
        : null;

    // Swim SWOLF
    if (Activity.isSwim(type) && stats?.speed?.avg && stats?.cadence?.avgActive) {
      const secondsPer100m = Movement.speedToSwimPace(stats.speed.avg);
      scores.swolf = {
        25: ActivityComputer.computeSwimSwolf(secondsPer100m, stats.cadence.avgActive, 25),
        50: ActivityComputer.computeSwimSwolf(secondsPer100m, stats.cadence.avgActive, 50)
      };
    } else {
      scores.swolf = null;
    }

    return scores;
  }

  private estimatedRunningPower(
    streams: Streams,
    athleteWeight: number,
    runningFtp: number,
    movingTime: number
  ): PowerStats {
    if (_.isEmpty(streams) || _.isEmpty(streams.grade_adjusted_speed)) {
      // return null if streams is basically empty (i.e. a manual run activity)
      return null;
    }

    try {
      streams.watts = RunningPowerEstimator.createRunningPowerEstimationStream(
        athleteWeight,
        streams.grade_adjusted_speed
      );
    } catch (err) {
      console.error(err);
    }

    return this.runningPowerStats(streams.time, streams.watts, athleteWeight, runningFtp, movingTime);
  }

  private moveStats(
    timeArray: number[],
    distanceArray: number[],
    velocityArray: number[],
    gradeAdjSpeeds: number[]
  ): MoveStats {
    if (_.isEmpty(timeArray) || _.isEmpty(distanceArray) || _.isEmpty(velocityArray)) {
      return null;
    }

    // Work on a kph velocity stream array
    const velocityKphArray = velocityArray.map(v => v * Constant.MPS_KPH_FACTOR);

    // Compute avg speed
    const avgSpeed = _.mean(velocityKphArray);

    // Compute avg moving speed
    const avgMovingSpeed = _.mean(velocityKphArray.filter(speed => this.isMoving(speed)));

    // Then compute moving time using avg moving speed. Keep the lower value between moving time & elapsed time (case movingTime > elapsedTime)
    const movingTime = Math.min(_.last(distanceArray) / (avgMovingSpeed / Constant.MPS_KPH_FACTOR), _.last(timeArray));

    // const avgSpeed = _.mean(velocityKphArray);
    const standardDeviation = ActivityComputer.computeStandardDeviation(velocityKphArray, avgSpeed);
    const [q25, q50, q75] = ActivityComputer.quartiles(velocityKphArray);
    const best20min =
      ActivityComputer.computeTimeSplit(velocityArray, timeArray, 60 * 20) * Constant.MPS_KPH_FACTOR || null;

    // Prepare stats results
    const speedStats: SpeedStats = {
      avg: _.round(avgSpeed, ActivityComputer.RND),
      max: _.round(_.max(velocityArray) * Constant.MPS_KPH_FACTOR, ActivityComputer.RND),
      best20min: Number.isFinite(best20min) ? _.round(best20min, ActivityComputer.RND) : null,
      lowQ: _.round(q25, ActivityComputer.RND),
      median: _.round(q50, ActivityComputer.RND),
      upperQ: _.round(q75, ActivityComputer.RND),
      stdDev: _.round(standardDeviation, ActivityComputer.RND),
      zones: this.returnZones
        ? this.computeZones(velocityKphArray, timeArray, this.userSettings.zones, ZoneType.SPEED)
        : null,
      peaks: this.returnPeaks ? ActivityComputer.computeTimePeaks(velocityArray, timeArray) : null
    };

    // Calculate pace data
    const standardDeviationPace = Movement.speedToPace(standardDeviation);

    // Compute running grade adjusted pace
    const gradeAdjustedPace = (() => {
      if (gradeAdjSpeeds?.length > 0) {
        const gradeAdjustedSpeed = _.mean(gradeAdjSpeeds) * Constant.MPS_KPH_FACTOR;
        return _.round(Movement.speedToPace(gradeAdjustedSpeed > avgSpeed ? gradeAdjustedSpeed : avgSpeed));
      }
      return null;
    })();

    const avgPace = Movement.speedToPace(avgSpeed);

    const paceStats: PaceStats = {
      avg: _.round(avgPace),
      gapAvg: gradeAdjustedPace,
      max: _.round(Movement.speedToPace(speedStats.max)),
      best20min: best20min ? _.round(Movement.speedToPace(best20min)) : null,
      lowQ: _.round(Movement.speedToPace(speedStats.lowQ)),
      median: _.round(Movement.speedToPace(speedStats.median)),
      upperQ: _.round(Movement.speedToPace(speedStats.upperQ)),
      stdDev: standardDeviationPace ? _.round(standardDeviationPace) : null,
      zones: this.returnZones
        ? this.computeZones(
            velocityKphArray.map(speed => Movement.speedToPace(speed)),
            timeArray,
            this.userSettings.zones,
            ZoneType.PACE
          )
        : null
    };

    return {
      movingTime: movingTime,
      speed: speedStats,
      pace: paceStats
    };
  }

  private powerStats(
    timeArray: number[],
    powerArray: number[],
    athleteWeight: number,
    thresholdPower: number,
    movingTime: number,
    powerZoneType: ZoneType
  ): PowerStats {
    if (_.isEmpty(powerArray) || _.isEmpty(timeArray) || _.mean(powerArray) === 0) {
      return null;
    }

    const maxWatts = _.max(powerArray);
    const avgWatts = _.mean(powerArray);
    const avgWattsPerKg = avgWatts / athleteWeight;
    const weightedPower = ActivityComputer.computeNormalizedPower(powerArray, timeArray);
    const weightedWattsPerKg = weightedPower / athleteWeight;
    const variabilityIndex = weightedPower / avgWatts;
    const totalWork = movingTime > 0 ? Math.round((avgWatts * movingTime) / 1000) : null;
    const intensityFactor = _.isNumber(thresholdPower) && thresholdPower > 0 ? weightedPower / thresholdPower : null;
    const standardDeviation = ActivityComputer.computeStandardDeviation(powerArray, avgWatts);
    const [q25, q50, q75]: number[] = ActivityComputer.quartiles(powerArray);

    const best20min = ActivityComputer.computeTimeSplit(powerArray, timeArray, 60 * 20) || null;

    return {
      avg: _.round(avgWatts, ActivityComputer.RND),
      avgKg: _.round(avgWattsPerKg, ActivityComputer.RND),
      weighted: _.round(weightedPower, ActivityComputer.RND),
      weightedKg: _.round(weightedWattsPerKg, ActivityComputer.RND),
      max: _.isNumber(maxWatts) ? _.round(maxWatts, ActivityComputer.RND) : 0,
      work: totalWork,
      best20min: Number.isFinite(best20min) ? _.round(best20min, ActivityComputer.RND) : null,
      variabilityIndex: _.round(variabilityIndex, ActivityComputer.RND),
      intensityFactor: intensityFactor ? _.round(intensityFactor, ActivityComputer.RND) : null,
      lowQ: _.round(q25, ActivityComputer.RND),
      median: _.round(q50, ActivityComputer.RND),
      upperQ: _.round(q75, ActivityComputer.RND),
      stdDev: _.round(standardDeviation, ActivityComputer.RND),
      zones:
        this.returnZones && powerZoneType
          ? this.computeZones(powerArray, timeArray, this.userSettings.zones, powerZoneType)
          : null,
      peaks: this.returnPeaks ? ActivityComputer.computeTimePeaks(powerArray, timeArray) : null
    };
  }

  private cyclingPowerStats(
    timeArray: number[],
    powerArray: number[],
    athleteWeight: number,
    cyclingFtp: number,
    movingTime: number
  ): PowerStats {
    return this.powerStats(timeArray, powerArray, athleteWeight, cyclingFtp, movingTime, ZoneType.POWER);
  }

  private runningPowerStats(
    timeArray: number[],
    powerArray: number[],
    athleteWeight: number,
    runningFtp: number,
    movingTime: number
  ): PowerStats {
    return this.powerStats(timeArray, powerArray, athleteWeight, runningFtp, movingTime, ZoneType.RUNNING_POWER);
  }

  private heartRateStats(
    timeArray: number[],
    heartRateArray: number[],
    athleteSnapshot: AthleteSnapshot
  ): HeartRateStats {
    if (_.isEmpty(timeArray) || _.isEmpty(heartRateArray) || _.mean(heartRateArray) === 0) {
      return null;
    }

    const avgHeartRate: number = _.mean(heartRateArray);
    const maxHeartRate: number = _.max(heartRateArray);

    const hrrRatio = ActivityComputer.heartRateReserveRatio(
      avgHeartRate,
      athleteSnapshot.athleteSettings.maxHr,
      athleteSnapshot.athleteSettings.restHr
    );

    const hrrMaxRatio = ActivityComputer.heartRateReserveRatio(
      maxHeartRate,
      athleteSnapshot.athleteSettings.maxHr,
      athleteSnapshot.athleteSettings.restHr
    );

    const [q25, q50, q75]: number[] = ActivityComputer.quartiles(heartRateArray);
    const standardDeviation = ActivityComputer.computeStandardDeviation(heartRateArray, avgHeartRate);
    const best20min = ActivityComputer.computeTimeSplit(heartRateArray, timeArray, 60 * 20) || null;
    const best60min = ActivityComputer.computeTimeSplit(heartRateArray, timeArray, 60 * 60) || null;

    return {
      avg: _.round(avgHeartRate),
      max: _.round(maxHeartRate),
      avgReserve: _.round(hrrRatio * 100, ActivityComputer.RND),
      maxReserve: _.round(hrrMaxRatio * 100, ActivityComputer.RND),
      best20min: Number.isFinite(best20min) ? _.round(best20min, ActivityComputer.RND) : null,
      best60min: Number.isFinite(best60min) ? _.round(best60min, ActivityComputer.RND) : null,
      lowQ: _.round(q25, ActivityComputer.RND),
      median: _.round(q50, ActivityComputer.RND),
      upperQ: _.round(q75, ActivityComputer.RND),
      stdDev: _.round(standardDeviation, ActivityComputer.RND),
      zones: this.returnZones
        ? this.computeZones(heartRateArray, timeArray, this.userSettings.zones, ZoneType.HEART_RATE)
        : null,
      peaks: this.returnPeaks ? ActivityComputer.computeTimePeaks(heartRateArray, timeArray) : null
    };
  }

  private cadenceStats(
    timeArray: number[],
    distanceArray: number[],
    cadenceArray: number[],
    movingSeconds: number,
    cadenceZoneType: ZoneType
  ): CadenceStats {
    if (_.isEmpty(cadenceArray) || _.isEmpty(timeArray) || _.mean(cadenceArray) === 0) {
      return null;
    }
    const activeCadences = [];
    const activeCadenceDurations = [];

    for (const [index, cadence] of cadenceArray.entries()) {
      if (index === 0) {
        continue;
      }

      const seconds = timeArray[index] - timeArray[index - 1];

      // Is active cadence?
      if (this.isActiveCadence(cadence)) {
        activeCadences.push(cadence);
        activeCadenceDurations.push(seconds);
      }
    }

    const maxCadence = _.max(cadenceArray) as number;
    const avgCadence = _.mean(cadenceArray);
    const averageActive = _.mean(activeCadences);
    const activeDuration = Math.min(_.sum(activeCadenceDurations), movingSeconds);
    const activeRatio = activeDuration / movingSeconds;
    const cycles = (averageActive * activeDuration) / 60;
    const [q25, q50, q75] = ActivityComputer.quartiles(activeCadences);
    const standardDeviation = ActivityComputer.computeStandardDeviation(activeCadences, averageActive);
    const cadenceFactor = cadenceZoneType === ZoneType.RUNNING_CADENCE ? 2 : 1;
    const distPerCycle = _.last(distanceArray) / cycles / cadenceFactor;

    return {
      avg: _.round(avgCadence, ActivityComputer.RND),
      max: maxCadence,
      avgActive: _.round(averageActive, ActivityComputer.RND),
      activeRatio: _.round(activeRatio, ActivityComputer.RND),
      activeTime: _.round(activeDuration, ActivityComputer.RND),
      cycles: _.round(cycles),
      distPerCycle: _.round(distPerCycle, ActivityComputer.RND),
      lowQ: _.round(q25, ActivityComputer.RND),
      median: _.round(q50, ActivityComputer.RND),
      upperQ: _.round(q75, ActivityComputer.RND),
      slope: null,
      stdDev: _.round(standardDeviation, ActivityComputer.RND),
      zones: this.returnZones
        ? this.computeZones(cadenceArray, timeArray, this.userSettings.zones, cadenceZoneType)
        : null,
      peaks: this.returnPeaks ? ActivityComputer.computeTimePeaks(cadenceArray, timeArray) : null
    };
  }

  private gradeStats(
    timeArray: number[],
    gradeArray: number[],
    velocityArray: number[],
    cadenceArray: number[]
  ): GradeStats {
    if (_.isEmpty(timeArray) || _.isEmpty(gradeArray) || _.isEmpty(velocityArray)) {
      return null;
    }

    const slopeProfileDurations = new SlopeProfileDurations();
    const slopeProfileDistances = new SlopeProfileDistances();
    const slopeProfileSpeeds = new SlopeProfileSpeeds();
    const slopeProfileCadences = new SlopeProfileCadences();

    const hasCadenceData = !_.isEmpty(cadenceArray);

    for (const [index, grade] of gradeArray.entries()) {
      if (index === 0) {
        continue;
      }

      const seconds = timeArray[index] - timeArray[index - 1];
      const speedMps = velocityArray[index];
      const speedKph = speedMps * Constant.MPS_KPH_FACTOR;
      const meters = speedMps * seconds;

      const cadence = hasCadenceData ? cadenceArray[index] : null;
      const isActiveCadence = Number.isFinite(cadence) && this.isActiveCadence(cadence);

      if (grade > ActivityComputer.GRADE_CLIMBING_LIMIT) {
        // UPHILL
        slopeProfileDurations.up.push(seconds);

        if (Number.isFinite(meters)) {
          slopeProfileDistances.up.push(meters);
        }

        if (Number.isFinite(speedKph)) {
          slopeProfileSpeeds.up.push(speedKph);
        }

        if (isActiveCadence) {
          slopeProfileCadences.up.push(cadence);
        }
      } else if (grade < ActivityComputer.GRADE_DOWNHILL_LIMIT) {
        // DOWNHILL
        slopeProfileDurations.down.push(seconds);

        if (Number.isFinite(meters)) {
          slopeProfileDistances.down.push(meters);
        }

        if (Number.isFinite(speedKph)) {
          slopeProfileSpeeds.down.push(speedKph);
        }

        if (isActiveCadence) {
          slopeProfileCadences.down.push(cadence);
        }
      } else {
        // FLAT
        slopeProfileDurations.flat.push(seconds);

        if (Number.isFinite(meters)) {
          slopeProfileDistances.flat.push(meters);
        }

        if (Number.isFinite(speedKph)) {
          slopeProfileSpeeds.flat.push(speedKph);
        }

        if (isActiveCadence) {
          slopeProfileCadences.flat.push(cadence);
        }
      }
    }

    const totalTime: number = _.last(timeArray);
    const minGrade: number = _.min(gradeArray);
    const maxGrade: number = _.max(gradeArray);
    const avgGrade: number = _.mean(gradeArray);

    const [q25, q50, q75] = ActivityComputer.quartiles(gradeArray);

    const standardDeviation = ActivityComputer.computeStandardDeviation(gradeArray, avgGrade);

    const slopeTime: SlopeStats = {
      up: _.round(_.sum(slopeProfileDurations.up), ActivityComputer.RND),
      flat: _.round(_.sum(slopeProfileDurations.flat), ActivityComputer.RND),
      down: _.round(_.sum(slopeProfileDurations.down), ActivityComputer.RND),
      total: totalTime
    };

    const slopeDistance: SlopeStats = {
      up: !_.isEmpty(slopeProfileDistances.up) ? _.round(_.sum(slopeProfileDistances.up), ActivityComputer.RND) : null,
      flat: !_.isEmpty(slopeProfileDistances.flat)
        ? _.round(_.sum(slopeProfileDistances.flat), ActivityComputer.RND)
        : null,
      down: !_.isEmpty(slopeProfileDistances.down)
        ? _.round(_.sum(slopeProfileDistances.down), ActivityComputer.RND)
        : null
    };

    const slopeSpeed: SlopeStats = {
      up: _.round(_.mean(slopeProfileSpeeds.up), ActivityComputer.RND),
      flat: _.round(_.mean(slopeProfileSpeeds.flat), ActivityComputer.RND),
      down: _.round(_.mean(slopeProfileSpeeds.down), ActivityComputer.RND)
    };

    const slopePace: SlopeStats = {
      up: _.round(Movement.speedToPace(slopeSpeed.up)),
      flat: _.round(Movement.speedToPace(slopeSpeed.flat)),
      down: _.round(Movement.speedToPace(slopeSpeed.down))
    };

    const slopeCadence: SlopeStats = {
      up: !_.isEmpty(slopeProfileCadences.up) ? _.round(_.mean(slopeProfileCadences.up), ActivityComputer.RND) : null,
      flat: !_.isEmpty(slopeProfileCadences.flat)
        ? _.round(_.mean(slopeProfileCadences.flat), ActivityComputer.RND)
        : null,
      down: !_.isEmpty(slopeProfileCadences.down)
        ? _.round(_.mean(slopeProfileCadences.down), ActivityComputer.RND)
        : null
    };

    const slopeProfile =
      (slopeTime.flat / totalTime) * 100 >= ActivityComputer.GRADE_FLAT_PROFILE_THRESHOLD
        ? SlopeProfile.FLAT
        : SlopeProfile.HILLY;

    return {
      avg: _.round(avgGrade, ActivityComputer.RND),
      max: maxGrade,
      min: minGrade,
      lowQ: _.round(q25, ActivityComputer.RND),
      median: _.round(q50, ActivityComputer.RND),
      upperQ: _.round(q75, ActivityComputer.RND),
      stdDev: _.round(standardDeviation, ActivityComputer.RND),
      slopeTime: slopeTime,
      slopeSpeed: slopeSpeed,
      slopePace: slopePace,
      slopeDistance: slopeDistance,
      slopeCadence: slopeCadence,
      slopeProfile: slopeProfile,
      zones: this.returnZones ? this.computeZones(gradeArray, timeArray, this.userSettings.zones, ZoneType.GRADE) : null
    };
  }

  private elevationStats(timeArray: number[], distanceArray: number[], altitudeArray: number[]): ElevationStats {
    if (_.isEmpty(timeArray) || _.isEmpty(distanceArray) || _.isEmpty(altitudeArray)) {
      return null;
    }

    // Compute ascent gain stats, then ascent speed
    const { ascentGain, ascentTime } = ActivityComputer.computeElevationAscentStats(
      altitudeArray,
      timeArray,
      ActivityComputer.ELEVATION_DELTA_THRESHOLD_METERS
    );

    const ascentSpeed = (ascentGain / ascentTime) * Constant.SEC_HOUR_FACTOR;

    // Compute descent gain stats
    const { descentGain } = ActivityComputer.computeElevationDescentStats(
      altitudeArray,
      timeArray,
      ActivityComputer.ELEVATION_DELTA_THRESHOLD_METERS
    );

    const avgElevation = _.mean(altitudeArray);
    const minElevation = _.min(altitudeArray) || 0;
    const maxElevation = _.max(altitudeArray) || 0;
    const [q25, q50, q75] = ActivityComputer.quartiles(altitudeArray);
    const standardDeviation = ActivityComputer.computeStandardDeviation(altitudeArray, avgElevation);

    return {
      avg: _.round(avgElevation),
      max: _.round(maxElevation, ActivityComputer.RND),
      min: _.round(minElevation, ActivityComputer.RND),
      ascent: _.round(ascentGain, ActivityComputer.RND),
      descent: _.round(descentGain, ActivityComputer.RND),
      ascentSpeed: _.round(ascentSpeed, ActivityComputer.RND),
      lowQ: _.round(q25, ActivityComputer.RND),
      median: _.round(q50, ActivityComputer.RND),
      upperQ: _.round(q75, ActivityComputer.RND),
      stdDev: _.round(standardDeviation, ActivityComputer.RND),
      elevationZones: this.returnZones
        ? this.computeZones(altitudeArray, timeArray, this.userSettings.zones, ZoneType.ELEVATION)
        : null
    };
  }

  private computeZones(
    values: number[],
    timeArray: number[],
    userZonesModel: UserZonesModel,
    zoneType: ZoneType
  ): ZoneModel[] {
    if (values.length !== timeArray.length) {
      throw new ElevateException(`Values length ${values.length} must match time array length ${timeArray.length}`);
    }

    // Find out user zones on which we will loop and prepare for computation
    let userZones = UserZonesModel.fromZoneType(userZonesModel, zoneType);
    if (_.isEmpty(userZones)) {
      return null;
    }
    userZones = userZones.map((zone: ZoneModel) => {
      zone.s = 0;
      return zone;
    });

    // Loop
    for (const [index, current] of timeArray.entries()) {
      if (index === 0) {
        continue;
      }

      const duration = current - timeArray[index - 1];

      const matchingZone = ActivityComputer.getZoneOfValue(userZones, values[index]);

      if (matchingZone) {
        matchingZone.s += duration;
      }
    }

    // Get total duration for percentage
    const totalSeconds = _.last(timeArray);

    // Append percents
    return userZones.map((zone: ZoneModel) => {
      zone.percent = (zone.s / totalSeconds) * 100;
      return zone;
    });
  }
}
