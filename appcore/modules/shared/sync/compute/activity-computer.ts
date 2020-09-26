import _ from "lodash";
import {
  ActivitySourceDataModel,
  ActivityStreamsModel,
  AnalysisDataModel,
  AthleteSettingsModel,
  AthleteSnapshotModel,
  BareActivityModel,
  CadenceDataModel,
  ElevationDataModel,
  Gender,
  GradeDataModel,
  HeartRateDataModel,
  MoveDataModel,
  PaceDataModel,
  PeakModel,
  PowerDataModel,
  SlopeProfileCadences,
  SlopeProfileDistances,
  SlopeProfileDurations,
  SlopeProfileSpeeds,
  SpeedDataModel,
  SyncedActivityModel,
  UpFlatDownModel,
  UserSettings,
  UserZonesModel,
  ZoneModel
} from "../../models";
import { RunningPowerEstimator } from "./running-power-estimator";
import { SplitCalculator } from "./split-calculator";
import { ElevateSport, GradeProfile, ZoneType } from "../../enums";
import { Movement, percentile } from "../../tools";
import { PeaksCalculator } from "./peaks-calculator";
import { WarningException } from "../../exceptions";
import { Constant } from "../../constants";
import { CaloriesEstimator } from "./calories-estimator";
import { StreamShaper } from "./stream-shaper";
import UserSettingsModel = UserSettings.UserSettingsModel;

export class ActivityComputer {
  private constructor(
    private readonly activityType: ElevateSport,
    private readonly isTrainer: boolean,
    private readonly userSettings: UserSettings.UserSettingsModel,
    private readonly athleteSnapshot: AthleteSnapshotModel,
    private readonly isOwner: boolean,
    private readonly hasPowerMeter: boolean,
    private activityStream: ActivityStreamsModel,
    private readonly bounds: number[],
    private readonly returnZones: boolean,
    private readonly activitySourceData: ActivitySourceDataModel
  ) {
    this.activityType = activityType;
    this.isTrainer = isTrainer;
    this.userSettings = userSettings;
    this.athleteSnapshot = athleteSnapshot;
    this.isOwner = isOwner;
    this.hasPowerMeter = hasPowerMeter;

    // We work on a streams copy to avoid integrity changes from the given source
    // Indeed some shaping will be applied (e.g. data smoothing)
    this.activityStream = _.cloneDeep(activityStream);
    this.bounds = bounds;
    this.returnZones = returnZones;
    this.activitySourceData = activitySourceData;
    this.isMoving = ActivityComputer.getIsMovingFunction(this.activityType);
    this.isActiveCadence = ActivityComputer.getIsActiveCadenceFunction(this.activityType);
  }

  public static readonly DEFAULT_LTHR_KARVONEN_HRR_FACTOR: number = 0.85;

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

  private static readonly DEFAULT_THRESHOLD_KPH: number = 2; // Kph
  private static readonly CYCLING_THRESHOLD_KPH: number = 4; // Kph
  private static readonly RUNNING_THRESHOLD_KPH: number = 2.75; // Kph
  private static readonly SWIMMING_THRESHOLD_KPH: number = 1.75; // Kph
  private static readonly MOVING_DETECTION_SAMPLES_BUFFER: number = 12;

  private static readonly DEFAULT_CADENCE_THRESHOLD: number = 1;
  private static readonly CYCLING_CADENCE_THRESHOLD: number = 45; // revolutions per min
  private static readonly RUNNING_CADENCE_THRESHOLD: number = 50; // strides per min (1 leg)
  private static readonly SWIMMING_CADENCE_THRESHOLD: number = 10; // strokes per min

  private static readonly GRADE_CLIMBING_LIMIT: number = 1.5;
  private static readonly GRADE_DOWNHILL_LIMIT: number = -1 * ActivityComputer.GRADE_CLIMBING_LIMIT;
  private static readonly GRADE_FLAT_PROFILE_THRESHOLD: number = 60;
  private static readonly WEIGHTED_WATTS_TIME_BUFFER: number = 30; // Seconds
  private static readonly SPLIT_MAX_SCALE_TIME_GAP_THRESHOLD: number = 60 * 60 * 12; // 12 hours
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

  /**
   * Return grade adjusted speed factor (not pace) for a given grade value
   */
  private static runningGradeAdjustedSpeedFactor(grade: number): number {
    const kA = 0.9944001227713231;
    const kB = 0.029290920646623777;
    const kC = 0.0018083953212790634;
    const kD = 4.0662425671715924e-7;
    const kE = -3.686186584867523e-7;
    const kF = -2.6628107325930747e-9;
    return (
      kA +
      kB * grade +
      kC * Math.pow(grade, 2) +
      kD * Math.pow(grade, 3) +
      kE * Math.pow(grade, 4) +
      kF * Math.pow(grade, 5)
    );
  }

  public static calculate(
    bareActivityModel: Partial<BareActivityModel>,
    athleteSnapshotModel: AthleteSnapshotModel,
    userSettingsModel: UserSettingsModel,
    streams: ActivityStreamsModel,
    returnZones: boolean = false,
    bounds: number[] = null,
    isOwner: boolean = true,
    activitySourceData: ActivitySourceDataModel = null
  ): AnalysisDataModel {
    return new ActivityComputer(
      bareActivityModel.type,
      bareActivityModel.trainer,
      userSettingsModel,
      athleteSnapshotModel,
      isOwner,
      bareActivityModel.hasPowerMeter,
      streams,
      bounds,
      returnZones,
      activitySourceData
    ).compute();
  }

  private static trainingImpulse(seconds: number, hrr: number, gender: Gender): number {
    const factor = gender === Gender.MEN ? 1.92 : 1.67;
    return (seconds / 60) * hrr * 0.64 * Math.exp(factor * hrr);
  }

  private static heartRateReserveFromHeartRate(hr: number, maxHr: number, restHr: number): number {
    return (hr - restHr) / (maxHr - restHr);
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
    return (activityTrainingImpulse / lactateThresholdTrainingImpulse) * 100;
  }

  public static computePowerStressScore(movingTime: number, weightedPower: number, thresholdPower: number): number {
    if (!_.isNumber(thresholdPower) || thresholdPower <= 0) {
      return null;
    }

    const intensity = weightedPower / thresholdPower;
    return ((movingTime * weightedPower * intensity) / (thresholdPower * Constant.SEC_HOUR_FACTOR)) * 100;
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

  public static resolveLTHR(activityType: ElevateSport, athleteSettingsModel: AthleteSettingsModel): number {
    if (athleteSettingsModel.lthr) {
      if (SyncedActivityModel.isRide(activityType, true)) {
        if (_.isNumber(athleteSettingsModel.lthr.cycling)) {
          return athleteSettingsModel.lthr.cycling;
        }
      }

      if (SyncedActivityModel.isRun(activityType)) {
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
   * 1) starting at the 30s mark, calculate a rolling 30 s average (of the preceeding time points, obviously).
   * 2) raise all the values obtained in step #1 to the 4th power.
   * 3) take the average of all of the values obtained in step #2.
   * 4) take the 4th root of the value obtained in step #3.
   * (And when you get tired of exporting every file to, e.g., Excel to perform such calculations, help develop a program
   * like WKO+ to do the work for you <g>.)
   */
  private static computeWeightedPower(powerArray: number[], timeArray: number[]): number {
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

  public static hasAthleteSettingsLacks(
    distance: number,
    movingTime: number,
    elapsedTime: number,
    sportType: ElevateSport,
    analysisDataModel: AnalysisDataModel,
    athleteSettingsModel: AthleteSettingsModel,
    activityStreamsModel: ActivityStreamsModel
  ): boolean {
    const isCycling = SyncedActivityModel.isRide(sportType);
    const isRunning = SyncedActivityModel.isRun(sportType);
    const isSwimming = SyncedActivityModel.isSwim(sportType);

    if (!isCycling && !isRunning && !isSwimming) {
      return false;
    }

    const hasHeartRateStressScore =
      analysisDataModel &&
      analysisDataModel.heartRateData &&
      analysisDataModel.heartRateData.TRIMP &&
      analysisDataModel.heartRateData.HRSS;
    if (hasHeartRateStressScore) {
      return false;
    }

    if (
      isCycling &&
      activityStreamsModel &&
      activityStreamsModel.watts &&
      activityStreamsModel.watts.length > 0 &&
      !(athleteSettingsModel.cyclingFtp > 0)
    ) {
      return true;
    }

    if (
      isRunning &&
      activityStreamsModel &&
      activityStreamsModel.grade_adjusted_speed &&
      activityStreamsModel.grade_adjusted_speed.length > 0 &&
      (!(movingTime > 0) || !(athleteSettingsModel.runningFtp > 0))
    ) {
      return true;
    }

    if (isSwimming && distance > 0 && movingTime > 0 && elapsedTime > 0 && !(athleteSettingsModel.swimFtp > 0)) {
      return true;
    }

    return false;
  }

  private compute(): AnalysisDataModel {
    if (!_.isEmpty(this.activityStream)) {
      this.activityStream = StreamShaper.sculpt(
        this.activityStream,
        SyncedActivityModel.isPaced(this.activityType),
        this.hasPowerMeter
      );

      // Slices array stream if activity bounds are given.
      // It's mainly used for segment effort extended stats
      this.sliceStreamFromBounds(this.activityStream, this.bounds);
    }

    const analysisDataModel = this.computeAnalysisData();

    if (
      !analysisDataModel.speedData &&
      !analysisDataModel.paceData &&
      !analysisDataModel.powerData &&
      !analysisDataModel.heartRateData &&
      !analysisDataModel.cadenceData &&
      !analysisDataModel.gradeData &&
      !analysisDataModel.elevationData
    ) {
      return null;
    }

    return analysisDataModel;
  }

  private sliceStreamFromBounds(activityStream: ActivityStreamsModel, bounds: number[]): void {
    // Slices array if activity bounds given. It's mainly used for segment effort extended stats
    if (bounds && bounds[0] && bounds[1]) {
      if (!_.isEmpty(activityStream.velocity_smooth)) {
        activityStream.velocity_smooth = activityStream.velocity_smooth.slice(bounds[0], bounds[1]);
      }

      if (!_.isEmpty(activityStream.time)) {
        activityStream.time = activityStream.time.slice(bounds[0], bounds[1]);
      }

      if (!_.isEmpty(activityStream.latlng)) {
        activityStream.latlng = activityStream.latlng.slice(bounds[0], bounds[1]);
      }

      if (!_.isEmpty(activityStream.heartrate)) {
        activityStream.heartrate = activityStream.heartrate.slice(bounds[0], bounds[1]);
      }

      if (!_.isEmpty(activityStream.watts)) {
        activityStream.watts = activityStream.watts.slice(bounds[0], bounds[1]);
      }

      if (!_.isEmpty(activityStream.watts_calc)) {
        activityStream.watts_calc = activityStream.watts_calc.slice(bounds[0], bounds[1]);
      }

      if (!_.isEmpty(activityStream.cadence)) {
        activityStream.cadence = activityStream.cadence.slice(bounds[0], bounds[1]);
      }

      if (!_.isEmpty(activityStream.grade_smooth)) {
        activityStream.grade_smooth = activityStream.grade_smooth.slice(bounds[0], bounds[1]);
      }

      if (!_.isEmpty(activityStream.altitude)) {
        activityStream.altitude = activityStream.altitude.slice(bounds[0], bounds[1]);
      }

      if (!_.isEmpty(activityStream.distance)) {
        activityStream.distance = activityStream.distance.slice(bounds[0], bounds[1]);
      }

      if (!_.isEmpty(activityStream.grade_adjusted_speed)) {
        activityStream.grade_adjusted_speed = activityStream.grade_adjusted_speed.slice(bounds[0], bounds[1]);
      }
    }
  }

  private computeAnalysisData(): AnalysisDataModel {
    let elapsedTime: number = null;
    let movingTime: number = null;
    let pauseTime: number = null;
    let moveRatio: number = null;

    const isCycling = SyncedActivityModel.isRide(this.activityType);
    const isRunning = SyncedActivityModel.isRun(this.activityType);
    const isSwimming = SyncedActivityModel.isSwim(this.activityType);

    // Include speed and pace
    if (this.activityStream && this.activityStream.time && this.activityStream.time.length > 0) {
      elapsedTime = _.last(this.activityStream.time) - _.first(this.activityStream.time);
    }

    // Prepare move data model along stream or activitySourceData
    let moveDataModel = this.activityStream
      ? this.moveData(
          this.activityStream.time,
          this.activityStream.distance,
          this.activityStream.velocity_smooth,
          this.activityStream.altitude
        )
      : null;

    const isMoveDataComputed = !!moveDataModel;

    // Try to estimate some move data if no move data have been computed
    if (!isMoveDataComputed && this.activitySourceData) {
      moveDataModel = this.moveDataEstimate(this.activitySourceData.movingTime, this.activitySourceData.distance);
    }

    // Assign moving time
    if (moveDataModel && moveDataModel.movingTime > 0) {
      movingTime = moveDataModel.movingTime;
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

    // If no velocity stream available, try to estimate running stress score  (goal is to get RSS computation for manual activities)
    if (
      !isMoveDataComputed &&
      isRunning &&
      movingTime &&
      moveDataModel?.pace?.genuineGradeAdjustedAvgPace &&
      this.athleteSnapshot.athleteSettings.runningFtp
    ) {
      const runningStressScore = ActivityComputer.computeRunningStressScore(
        movingTime,
        moveDataModel.pace.genuineGradeAdjustedAvgPace,
        this.athleteSnapshot.athleteSettings.runningFtp
      );

      moveDataModel.pace.runningStressScore = runningStressScore;
      moveDataModel.pace.runningStressScorePerHour = runningStressScore
        ? (runningStressScore / movingTime) * Constant.SEC_HOUR_FACTOR
        : null;
    }

    // Speed
    const speedData: SpeedDataModel = moveDataModel && moveDataModel.speed ? moveDataModel.speed : null;

    // Pace
    const paceData: PaceDataModel = moveDataModel && moveDataModel.pace ? moveDataModel.pace : null;

    // Find total distance
    let totalDistance;
    if (this.activityStream && !_.isEmpty(this.activityStream.distance)) {
      totalDistance = _.last(this.activityStream.distance);
    } else if (this.activitySourceData && this.activitySourceData.distance > 0) {
      totalDistance = this.activitySourceData.distance;
    } else {
      totalDistance = null;
    }

    // If real/manual swimming activity, compute swimming stress score
    if (
      SyncedActivityModel.isSwim(this.activityType) &&
      totalDistance &&
      movingTime &&
      this.athleteSnapshot.athleteSettings.swimFtp &&
      moveDataModel?.pace
    ) {
      const swimStressScore = ActivityComputer.computeSwimStressScore(
        totalDistance,
        movingTime,
        elapsedTime,
        this.athleteSnapshot.athleteSettings.swimFtp
      );

      moveDataModel.pace.swimStressScore = swimStressScore;
      moveDataModel.pace.swimStressScorePerHour = swimStressScore ? (swimStressScore / movingTime) * 60 * 60 : null;
    }

    // Power
    let powerData: PowerDataModel = null;
    if (this.activityStream) {
      const hasWattsStream = !_.isEmpty(this.activityStream.watts);
      if (isCycling) {
        powerData = this.cyclingPowerData(
          this.activityStream.time,
          this.activityStream.watts,
          movingTime,
          this.hasPowerMeter,
          this.athleteSnapshot.athleteSettings.weight,
          this.athleteSnapshot.athleteSettings.cyclingFtp
        );
      } else if (isRunning && hasWattsStream) {
        powerData = this.runningPowerData(
          this.activityStream.time,
          this.activityStream.watts,
          movingTime,
          this.hasPowerMeter,
          this.athleteSnapshot.athleteSettings.weight,
          null // No running power threshold yet
        );
      } else if (isRunning && !hasWattsStream && this.isOwner) {
        powerData = this.estimatedRunningPower(
          this.activityStream,
          movingTime,
          this.athleteSnapshot.athleteSettings.weight,
          null // No running power threshold yet
        );
      } else {
        powerData = this.powerData(
          this.activityStream.time,
          this.activityStream.watts,
          movingTime,
          this.hasPowerMeter,
          this.athleteSnapshot.athleteSettings.weight,
          null,
          null
        );
      }
    }

    // Heart-rate
    const heartRateData: HeartRateDataModel = !_.isEmpty(this.activityStream)
      ? this.heartRateData(this.activityStream.time, this.activityStream.heartrate, this.athleteSnapshot)
      : null;

    // Grade
    const gradeData: GradeDataModel = !_.isEmpty(this.activityStream)
      ? this.gradeData(
          this.activityStream.time,
          this.activityStream.distance,
          this.activityStream.altitude,
          this.activityStream.grade_smooth,
          this.activityStream.cadence
        )
      : null;

    // Cadence
    let cadenceData: CadenceDataModel = null;
    if (this.activityStream && !_.isEmpty(this.activityStream.cadence)) {
      if (isCycling) {
        cadenceData = this.cadenceData(
          this.activityStream.time,
          this.activityStream.distance,
          this.activityStream.cadence,
          movingTime,
          ZoneType.CYCLING_CADENCE
        );
      } else if (isRunning) {
        cadenceData = this.cadenceData(
          this.activityStream.time,
          this.activityStream.distance,
          this.activityStream.cadence,
          movingTime,
          ZoneType.RUNNING_CADENCE
        );
      } else {
        cadenceData = this.cadenceData(
          this.activityStream.time,
          this.activityStream.distance,
          this.activityStream.cadence,
          movingTime,
          null
        );
      }
    }

    // ... if exists cadenceData then append cadence pace (climbing, flat & downhill) if she has been previously provided by "gradeData"
    if (cadenceData && gradeData && gradeData.upFlatDownCadencePaceData) {
      cadenceData.upFlatDownCadencePaceData = gradeData.upFlatDownCadencePaceData;
    }

    // Elevation
    let elevationData: ElevationDataModel = null;
    if (this.activityStream) {
      elevationData = this.elevationData(
        this.activityStream.time,
        this.activityStream.distance,
        this.activityStream.altitude
      );
    }

    // Compute calories
    const calories = CaloriesEstimator.calc(this.activityType, movingTime, this.athleteSnapshot.athleteSettings.weight);
    const caloriesPerHour = calories !== null ? (calories / elapsedTime) * Constant.SEC_HOUR_FACTOR : null;

    const analysisResult: AnalysisDataModel = {
      moveRatio: moveRatio,
      elapsedTime: elapsedTime,
      movingTime: movingTime,
      pauseTime: pauseTime,
      calories: calories,
      caloriesPerHour: caloriesPerHour,
      speedData: speedData,
      paceData: paceData,
      powerData: powerData,
      heartRateData: heartRateData,
      cadenceData: cadenceData,
      gradeData: gradeData,
      elevationData: elevationData
    };

    // Calculating running index if possible
    if (isRunning && totalDistance && movingTime && !_.isEmpty(elevationData) && !_.isEmpty(heartRateData)) {
      analysisResult.runningPerformanceIndex = this.runningPerformanceIndex(
        this.athleteSnapshot,
        totalDistance,
        movingTime,
        elevationData,
        heartRateData
      );
    }

    // Calculating swim swolf if possible
    if (isSwimming && analysisResult?.speedData?.genuineAvgSpeed && analysisResult?.cadenceData?.averageActiveCadence) {
      const secondsPer100m = Movement.speedToSwimPace(analysisResult.speedData.genuineAvgSpeed);
      const avgStrokesPerMin = analysisResult.cadenceData.averageActiveCadence;
      analysisResult.swimSwolf = ActivityComputer.computeSwimSwolf(secondsPer100m, avgStrokesPerMin, 25);
    }

    return analysisResult;
  }

  private estimatedRunningPower(
    activityStream: ActivityStreamsModel,
    movingSeconds: number,
    athleteWeight: number,
    runningFtp: number
  ): PowerDataModel {
    if (_.isEmpty(activityStream) || _.isEmpty(activityStream.distance)) {
      // return null if activityStream is basically empty (i.e. a manual run activity)
      return null;
    }

    try {
      activityStream.watts = RunningPowerEstimator.createRunningPowerEstimationStream(
        athleteWeight,
        activityStream.distance,
        activityStream.time,
        activityStream.altitude
      );
    } catch (err) {
      console.error(err);
    }

    return this.runningPowerData(
      activityStream.time,
      activityStream.watts,
      movingSeconds,
      false, // Estimated !
      athleteWeight,
      runningFtp
    );
  }

  /**
   * Computes Polar running index (https://support.polar.com/en/support/tips/Running_Index_feature)
   */
  private runningPerformanceIndex(
    athleteSnapshot: AthleteSnapshotModel,
    distance: number,
    movingSeconds: number,
    elevationData: ElevationDataModel,
    heartRateData: HeartRateDataModel
  ): number {
    const averageHeartRate: number = heartRateData.averageHeartRate;
    const runIntensity: number =
      Math.round(((averageHeartRate / athleteSnapshot.athleteSettings.maxHr) * 1.45 - 0.3) * 100) / 100; // Calculate the run intensity; this is rounded to 2 decimal points
    const gradeAdjustedDistance =
      distance + elevationData.accumulatedElevationAscent * 6 - elevationData.accumulatedElevationDescent * 4;
    const distanceRate: number = (213.9 / (movingSeconds / 60)) * (gradeAdjustedDistance / 1000) ** 1.06 + 3.5;
    return distanceRate / runIntensity;
  }

  private moveDataEstimate(movingTime: number, distance: number): MoveDataModel {
    if (!movingTime || !distance) {
      return null;
    }

    const averageSpeed = (distance / movingTime) * Constant.MPS_KPH_FACTOR;
    const averagePace = _.round(Movement.speedToPace(averageSpeed), 3);

    const speedData: SpeedDataModel = {
      genuineAvgSpeed: averageSpeed,
      totalAvgSpeed: averageSpeed,
      maxSpeed: null,
      best20min: null,
      avgPace: averagePace, // send in seconds
      lowerQuartileSpeed: null,
      medianSpeed: null,
      upperQuartileSpeed: null,
      standardDeviationSpeed: 0,
      speedZones: null,
      peaks: null
    };

    const paceData: PaceDataModel = {
      avgPace: averagePace, // send in seconds
      totalAvgPace: averagePace, // send in seconds
      best20min: null,
      maxPace: null,
      lowerQuartilePace: null,
      medianPace: null,
      upperQuartilePace: null,
      standardDeviationPace: null,
      genuineGradeAdjustedAvgPace: averagePace,
      paceZones: null,
      runningStressScore: null,
      runningStressScorePerHour: null,
      swimStressScore: null,
      swimStressScorePerHour: null
    };

    return {
      movingTime: movingTime,
      speed: speedData,
      pace: paceData
    };
  }

  private moveData(
    timeArray: number[],
    distanceArray: number[],
    velocityArray: number[],
    altitudeArray: number[]
  ): MoveDataModel {
    if (_.isEmpty(timeArray) || _.isEmpty(distanceArray) || _.isEmpty(velocityArray)) {
      return null;
    }

    if (_.isEmpty(altitudeArray)) {
      altitudeArray = _.fill(Array(timeArray.length), 0);
    }

    const isRunning = SyncedActivityModel.isRun(this.activityType);

    const movingSpeeds: number[] = [];
    const movingDurations: number[] = [];
    const runningGradeAdjSpeed: number[] = [];

    const SAMPLES_TIME_BUFFER = ActivityComputer.MOVING_DETECTION_SAMPLES_BUFFER;

    let index = SAMPLES_TIME_BUFFER;
    do {
      const { seconds, speed, grade } = this.getBufferAnalytics(
        SAMPLES_TIME_BUFFER,
        index,
        timeArray,
        distanceArray,
        altitudeArray
      );

      if (this.isMoving(speed)) {
        movingSpeeds.push(speed);
        movingDurations.push(seconds);

        if (isRunning) runningGradeAdjSpeed.push(speed * ActivityComputer.runningGradeAdjustedSpeedFactor(grade));
      }

      index = index + SAMPLES_TIME_BUFFER;
    } while (index <= timeArray.length - 1);

    // Distance and Times
    const totalDistance = _.last(distanceArray);
    const movingTime = _.sum(movingDurations);
    const elapsedTime = _.last(timeArray);

    // Calculate speed data
    const movingAvgSpeed = _.mean(movingSpeeds);
    const totalAvgSpeed = distanceArray.length > 0 ? (totalDistance / elapsedTime) * Constant.MPS_KPH_FACTOR : null;
    const varianceSpeed = _.mean(movingSpeeds.map(speed => Math.pow(speed, 2))) - Math.pow(movingAvgSpeed, 2);
    const standardDeviationSpeed = varianceSpeed > 0 ? Math.sqrt(varianceSpeed) : 0;
    const [q25, q50, q75] = this.quartiles(movingSpeeds);
    const speedPeaks = this.computePeaks(velocityArray, timeArray);
    const best20min = this.computeSplit(velocityArray, timeArray, 60 * 20) * Constant.MPS_KPH_FACTOR || null;
    const avgPace = Movement.speedToPace(movingAvgSpeed);
    const velocityKphArray = velocityArray.map(v => v * Constant.MPS_KPH_FACTOR);

    // Prepare SpeedDataModel
    const speedData: SpeedDataModel = {
      genuineAvgSpeed: movingAvgSpeed,
      totalAvgSpeed: totalAvgSpeed,
      maxSpeed: _.max(velocityArray) * Constant.MPS_KPH_FACTOR,
      best20min: best20min,
      avgPace: Math.floor(avgPace), // send in seconds
      lowerQuartileSpeed: q25,
      medianSpeed: q50,
      upperQuartileSpeed: q75,
      standardDeviationSpeed: standardDeviationSpeed,
      speedZones: this.returnZones
        ? this.computeZones(velocityKphArray, timeArray, this.userSettings.zones, ZoneType.SPEED)
        : null,
      peaks: speedPeaks
    };

    // Calculate pace data
    const totalAvgPace = Movement.speedToPace(totalAvgSpeed);
    const standardDeviationPace = Movement.speedToPace(standardDeviationSpeed);
    const runningGradeAdjustedPace = isRunning ? Movement.speedToPace(_.mean(runningGradeAdjSpeed)) : null;

    const runningStressScore =
      runningGradeAdjustedPace && this.athleteSnapshot.athleteSettings.runningFtp
        ? ActivityComputer.computeRunningStressScore(
            movingTime,
            runningGradeAdjustedPace,
            this.athleteSnapshot.athleteSettings.runningFtp
          )
        : null;

    const paceData: PaceDataModel = {
      avgPace: Math.floor(avgPace), // send in seconds
      totalAvgPace: totalAvgPace, // send in seconds
      best20min: best20min ? Math.floor(Movement.speedToPace(best20min)) : null,
      maxPace: Math.floor(Movement.speedToPace(speedData.maxSpeed)),
      lowerQuartilePace: Movement.speedToPace(speedData.lowerQuartileSpeed),
      medianPace: Movement.speedToPace(speedData.medianSpeed),
      upperQuartilePace: Movement.speedToPace(speedData.upperQuartileSpeed),
      standardDeviationPace: standardDeviationPace !== -1 ? standardDeviationPace : null,
      genuineGradeAdjustedAvgPace: runningGradeAdjustedPace,
      paceZones: this.returnZones
        ? this.computeZones(
            velocityKphArray.map(speed => Movement.speedToPace(speed)),
            timeArray,
            this.userSettings.zones,
            ZoneType.PACE
          )
        : null,
      runningStressScore: runningStressScore,
      runningStressScorePerHour: runningStressScore ? (runningStressScore / movingTime) * 60 * 60 : null,
      swimStressScore: null, // Will be set later if activity type is swimming
      swimStressScorePerHour: null // Will be set later if activity type is swimming,
    };

    return {
      movingTime: movingTime,
      speed: speedData,
      pace: paceData
    };
  }

  private powerData(
    timeArray: number[],
    powerArray: number[],
    movingSeconds: number,
    hasPowerMeter: boolean,
    athleteWeight: number,
    thresholdPower: number,
    powerZoneType: ZoneType
  ): PowerDataModel {
    if (_.isEmpty(powerArray) || _.isEmpty(timeArray) || _.mean(powerArray) === 0) {
      return null;
    }

    const totalTime = _.last(timeArray);
    const maxWatts = _.max(powerArray);
    const avgWatts = _.mean(powerArray);
    const avgWattsPerKg = avgWatts / athleteWeight;
    const weightedPower = ActivityComputer.computeWeightedPower(powerArray, timeArray);
    const weightedWattsPerKg = weightedPower / athleteWeight;
    const variabilityIndex = weightedPower / avgWatts;
    const intensity = _.isNumber(thresholdPower) && thresholdPower > 0 ? weightedPower / thresholdPower : null;
    const powerStressScore = ActivityComputer.computePowerStressScore(movingSeconds, weightedPower, thresholdPower);
    const powerStressScorePerHour = powerStressScore
      ? (powerStressScore / movingSeconds) * Constant.SEC_HOUR_FACTOR
      : null;

    const [q25, q50, q75]: number[] = this.quartiles(powerArray);

    return {
      hasPowerMeter: hasPowerMeter,
      avgWatts: avgWatts,
      maxPower: maxWatts,
      avgWattsPerKg: avgWattsPerKg,
      weightedPower: weightedPower,
      weightedWattsPerKg: weightedWattsPerKg,
      best20min: this.computeSplit(powerArray, timeArray, 60 * 20),
      bestEightyPercent: this.computeSplit(powerArray, timeArray, _.floor(totalTime * 0.8)),
      variabilityIndex: variabilityIndex,
      punchFactor: intensity,
      powerStressScore: powerStressScore,
      powerStressScorePerHour: powerStressScorePerHour,
      lowerQuartileWatts: q25,
      medianWatts: q50,
      upperQuartileWatts: q75,
      powerZones:
        this.returnZones && powerZoneType
          ? this.computeZones(powerArray, timeArray, this.userSettings.zones, powerZoneType)
          : null,
      peaks: this.computePeaks(powerArray, timeArray)
    };
  }

  private cyclingPowerData(
    timeArray: number[],
    powerArray: number[],
    movingSeconds: number,
    hasPowerMeter: boolean,
    athleteWeight: number,
    cyclingFtp: number
  ): PowerDataModel {
    return this.powerData(
      timeArray,
      powerArray,
      movingSeconds,
      hasPowerMeter,
      athleteWeight,
      cyclingFtp,
      ZoneType.POWER
    );
  }

  private runningPowerData(
    timeArray: number[],
    powerArray: number[],
    movingSeconds: number,
    hasPowerMeter: boolean,
    athleteWeight: number,
    runningFtp: number
  ): PowerDataModel {
    return this.powerData(
      timeArray,
      powerArray,
      movingSeconds,
      hasPowerMeter,
      athleteWeight,
      runningFtp,
      ZoneType.RUNNING_POWER
    );
  }

  private heartRateData(
    timeArray: number[],
    heartRateArray: number[],
    athleteSnapshot: AthleteSnapshotModel
  ): HeartRateDataModel {
    if (_.isEmpty(timeArray) || _.isEmpty(heartRateArray) || _.mean(heartRateArray) === 0) {
      return null;
    }

    const totalTime = _.last(timeArray);
    const avgHeartRate = _.mean(heartRateArray);
    const maxHeartRate = _.max(heartRateArray);

    const activityHeartRateReserve = ActivityComputer.heartRateReserveFromHeartRate(
      avgHeartRate,
      athleteSnapshot.athleteSettings.maxHr,
      athleteSnapshot.athleteSettings.restHr
    );

    const activityHeartRateReserveMax = ActivityComputer.heartRateReserveFromHeartRate(
      maxHeartRate,
      athleteSnapshot.athleteSettings.maxHr,
      athleteSnapshot.athleteSettings.restHr
    );

    const [q25, q50, q75]: number[] = this.quartiles(heartRateArray);

    // Calculate training impulse
    const trainingImpulse = ActivityComputer.trainingImpulse(
      totalTime,
      activityHeartRateReserve,
      this.athleteSnapshot.gender
    );

    const trainingImpulsePerHour = (trainingImpulse / totalTime) * Constant.SEC_HOUR_FACTOR;

    // Calculate heart rate stress score
    const lactateThreshold: number = ActivityComputer.resolveLTHR(this.activityType, athleteSnapshot.athleteSettings);
    const heartRateStressScore = ActivityComputer.computeHeartRateStressScore(
      athleteSnapshot.gender,
      athleteSnapshot.athleteSettings.maxHr,
      athleteSnapshot.athleteSettings.restHr,
      lactateThreshold,
      trainingImpulse
    );
    const heartRateStressScorePerHour = (heartRateStressScore / totalTime) * Constant.SEC_HOUR_FACTOR;

    return {
      averageHeartRate: avgHeartRate,
      maxHeartRate: maxHeartRate,
      activityHeartRateReserve: activityHeartRateReserve * 100,
      activityHeartRateReserveMax: activityHeartRateReserveMax * 100,
      lowerQuartileHeartRate: q25,
      medianHeartRate: q50,
      upperQuartileHeartRate: q75,
      best20min: this.computeSplit(heartRateArray, timeArray, 60 * 20),
      best60min: this.computeSplit(heartRateArray, timeArray, 60 * 60),
      TRIMP: trainingImpulse,
      TRIMPPerHour: trainingImpulsePerHour,
      HRSS: heartRateStressScore,
      HRSSPerHour: heartRateStressScorePerHour,
      peaks: this.computePeaks(heartRateArray, timeArray),
      heartRateZones: this.returnZones
        ? this.computeZones(heartRateArray, timeArray, this.userSettings.zones, ZoneType.HEART_RATE)
        : null
    };
  }

  private cadenceData(
    timeArray: number[],
    distanceArray: number[],
    cadenceArray: number[],
    movingSeconds: number,
    cadenceZoneType: ZoneType
  ): CadenceDataModel {
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

    const totalTime = _.last(timeArray);
    const maxCadence = _.max(cadenceArray);
    const avgCadence = _.mean(cadenceArray);
    const averageActiveCadence = _.mean(activeCadences);
    const activeCadenceDuration = Math.min(_.sum(activeCadenceDurations), movingSeconds);
    const activeCadenceRatio = activeCadenceDuration / movingSeconds;
    const totalOccurrences = (avgCadence * totalTime) / 60;

    const varianceCadence = _.mean(activeCadences.map(cad => Math.pow(cad, 2))) - Math.pow(averageActiveCadence, 2);
    const standardDeviationCadence = varianceCadence > 0 ? Math.sqrt(varianceCadence) : 0;

    const [q25, q50, q75] = this.quartiles(activeCadences);

    const cadenceFactor = cadenceZoneType === ZoneType.RUNNING_CADENCE ? 2 : 1;
    const averageDistancePerOccurrence = _.last(distanceArray) / totalOccurrences / cadenceFactor;

    return {
      maxCadence: maxCadence,
      averageCadence: avgCadence,
      averageActiveCadence: averageActiveCadence,
      cadenceActiveTime: activeCadenceDuration,
      cadenceActivePercentage: activeCadenceRatio * 100,
      standardDeviationCadence: _.round(standardDeviationCadence, 2),
      totalOccurrences: totalOccurrences,
      lowerQuartileCadence: q25,
      medianCadence: q50,
      upperQuartileCadence: q75,
      averageDistancePerOccurrence: averageDistancePerOccurrence,
      peaks: this.computePeaks(cadenceArray, timeArray),
      cadenceZones: this.returnZones
        ? this.computeZones(cadenceArray, timeArray, this.userSettings.zones, cadenceZoneType)
        : null
    };
  }

  private gradeData(
    timeArray: number[],
    distanceArray: number[],
    altitudeArray: number[],
    gradeArray: number[],
    cadenceArray: number[]
  ): GradeDataModel {
    if (_.isEmpty(timeArray) || _.isEmpty(distanceArray) || _.isEmpty(altitudeArray)) {
      return null;
    }

    const hasGradeData = !_.isEmpty(gradeArray);
    const hasCadenceData = !_.isEmpty(cadenceArray);

    const slopeProfileDurations = new SlopeProfileDurations();
    const slopeProfileDistances = new SlopeProfileDistances();
    const slopeProfileSpeeds = new SlopeProfileSpeeds();
    const slopeProfileCadences = new SlopeProfileCadences();

    const grades = [];
    const SAMPLES_TIME_BUFFER = ActivityComputer.MOVING_DETECTION_SAMPLES_BUFFER;

    let index = SAMPLES_TIME_BUFFER;
    do {
      const { seconds, meters, speed, grade } = this.getBufferAnalytics(
        SAMPLES_TIME_BUFFER,
        index,
        timeArray,
        distanceArray,
        altitudeArray
      );

      grades.push(grade);

      const avgCadence = hasCadenceData
        ? _.mean(cadenceArray.slice(index - SAMPLES_TIME_BUFFER, index).filter(cad => this.isActiveCadence(cad)))
        : null;

      const isActiveCadence = Number.isFinite(avgCadence) && this.isActiveCadence(avgCadence);

      // Compute slope profile data
      if (grade > ActivityComputer.GRADE_CLIMBING_LIMIT) {
        // UPHILL
        slopeProfileDurations.up.push(seconds);

        if (Number.isFinite(meters)) {
          slopeProfileDistances.up.push(meters);
        }

        if (Number.isFinite(speed)) {
          slopeProfileSpeeds.up.push(speed);
        }

        if (isActiveCadence) {
          slopeProfileCadences.up.push(avgCadence);
        }
      } else if (grade < ActivityComputer.GRADE_DOWNHILL_LIMIT) {
        // DOWNHILL
        slopeProfileDurations.down.push(seconds);

        if (Number.isFinite(meters)) {
          slopeProfileDistances.down.push(meters);
        }

        if (Number.isFinite(speed)) {
          slopeProfileSpeeds.down.push(speed);
        }

        if (isActiveCadence) {
          slopeProfileCadences.down.push(avgCadence);
        }
      } else {
        // FLAT
        slopeProfileDurations.flat.push(seconds);

        if (Number.isFinite(meters)) {
          slopeProfileDistances.flat.push(meters);
        }

        if (Number.isFinite(speed)) {
          slopeProfileSpeeds.flat.push(speed);
        }

        if (isActiveCadence) {
          slopeProfileCadences.flat.push(avgCadence);
        }
      }
      index = index + SAMPLES_TIME_BUFFER;
    } while (index <= timeArray.length - 1);

    const totalTime = _.last(timeArray);
    const avgMaxGrade = _.max(grades);
    const avgMinGrade = _.min(grades);
    const avgGrade = _.mean(grades);

    const [q25, q50, q75] = this.quartiles(grades);

    const upFlatDownSeconds: UpFlatDownModel = {
      up: _.sum(slopeProfileDurations.up),
      flat: _.sum(slopeProfileDurations.flat),
      down: _.sum(slopeProfileDurations.down),
      total: totalTime
    };

    const upFlatDownDistance: UpFlatDownModel = {
      up: !_.isEmpty(slopeProfileDistances.up) ? _.sum(slopeProfileDistances.up) / 1000 : null,
      flat: !_.isEmpty(slopeProfileDistances.flat) ? _.sum(slopeProfileDistances.flat) / 1000 : null,
      down: !_.isEmpty(slopeProfileDistances.down) ? _.sum(slopeProfileDistances.down) / 1000 : null
    };

    const upFlatDownMoveData: UpFlatDownModel = {
      up: _.mean(slopeProfileSpeeds.up),
      flat: _.mean(slopeProfileSpeeds.flat),
      down: _.mean(slopeProfileSpeeds.down)
    };

    const upFlatDownCadence: UpFlatDownModel = {
      up: !_.isEmpty(slopeProfileCadences.up) ? _.mean(slopeProfileCadences.up) : null,
      flat: !_.isEmpty(slopeProfileCadences.flat) ? _.mean(slopeProfileCadences.flat) : null,
      down: !_.isEmpty(slopeProfileCadences.down) ? _.mean(slopeProfileCadences.down) : null
    };

    const gradeProfile =
      (upFlatDownSeconds.flat / totalTime) * 100 >= ActivityComputer.GRADE_FLAT_PROFILE_THRESHOLD
        ? GradeProfile.FLAT
        : GradeProfile.HILLY;

    return {
      avgGrade: avgGrade,
      avgMaxGrade: avgMaxGrade,
      avgMinGrade: avgMinGrade,
      lowerQuartileGrade: _.round(q25, 2),
      medianGrade: _.round(q50, 2),
      upperQuartileGrade: _.round(q75, 2),
      upFlatDownInSeconds: upFlatDownSeconds,
      upFlatDownDistanceData: upFlatDownDistance,
      upFlatDownMoveData: upFlatDownMoveData,
      upFlatDownCadencePaceData: upFlatDownCadence,
      gradeProfile: gradeProfile,
      gradeZones:
        this.returnZones && hasGradeData
          ? this.computeZones(gradeArray, timeArray, this.userSettings.zones, ZoneType.GRADE)
          : null
    };
  }

  private elevationData(timeArray: number[], distanceArray: number[], altitudeArray: number[]): ElevationDataModel {
    if (_.isEmpty(timeArray) || _.isEmpty(distanceArray) || _.isEmpty(altitudeArray)) {
      return null;
    }

    const ascentElevations = [];
    const descentElevations = [];
    const ascentData = { time: [], speeds: [] };

    const SAMPLES_DISTANCE_BUFFER = 5;

    let index = SAMPLES_DISTANCE_BUFFER;
    do {
      const { seconds, elevation } = this.getBufferAnalytics(
        SAMPLES_DISTANCE_BUFFER,
        index,
        timeArray,
        distanceArray,
        altitudeArray
      );

      if (elevation > 0) {
        ascentElevations.push(elevation);

        // Compute vertical speeds (vert. meters / hour)
        const verticalMetersPerHour = (elevation / seconds) * Constant.SEC_HOUR_FACTOR;

        if (verticalMetersPerHour > 0) {
          ascentData.time.push((_.last(ascentData.time) || 0) + seconds);
          ascentData.speeds.push(verticalMetersPerHour);
        }
      } else if (elevation < 0) {
        descentElevations.push(elevation);
      }

      index = index + SAMPLES_DISTANCE_BUFFER;
    } while (index <= distanceArray.length - 1);

    const avgElevation = _.mean(altitudeArray);
    const minElevation = _.min(altitudeArray);
    const maxElevation = _.max(altitudeArray);
    const [q25, q50, q75] = this.quartiles(altitudeArray);

    const avgAscentSpeed = _.mean(ascentData.speeds);
    const [ascentSpeedQ25, ascentSpeedQ50, ascentSpeedQ75] = this.quartiles(ascentData.speeds);

    return {
      avgElevation: Math.round(avgElevation),
      minElevation: minElevation,
      maxElevation: maxElevation,
      accumulatedElevationAscent: _.sum(ascentElevations),
      accumulatedElevationDescent: Math.abs(_.sum(descentElevations)),
      lowerQuartileElevation: q25,
      medianElevation: q50,
      upperQuartileElevation: q75,
      elevationZones: this.returnZones
        ? this.computeZones(altitudeArray, timeArray, this.userSettings.zones, ZoneType.ELEVATION)
        : null,
      ascentSpeedZones: this.returnZones
        ? this.computeZones(ascentData.speeds, ascentData.time, this.userSettings.zones, ZoneType.ASCENT)
        : null,
      ascentSpeed: {
        avg: Number.isFinite(avgAscentSpeed) ? Math.round(avgAscentSpeed) : null,
        lowerQuartile: Number.isFinite(ascentSpeedQ25) ? Math.round(ascentSpeedQ25) : null,
        median: Number.isFinite(ascentSpeedQ50) ? Math.round(ascentSpeedQ50) : null,
        upperQuartile: Number.isFinite(ascentSpeedQ75) ? Math.round(ascentSpeedQ75) : null
      }
    };
  }

  private getBufferAnalytics(
    buffer: number,
    currentIndex: number,
    timeArray: number[],
    distanceArray: number[],
    altitudeArray: number[] = null
  ): { seconds: number; meters: number; elevation: number; speed: number; grade: number } {
    const seconds = timeArray[currentIndex] - timeArray[currentIndex - buffer];
    const meters = distanceArray[currentIndex] - distanceArray[currentIndex - buffer];
    const elevation = altitudeArray ? altitudeArray[currentIndex] - altitudeArray[currentIndex - buffer] : null;
    const speed = (meters / seconds) * Constant.MPS_KPH_FACTOR;
    const grade = Number.isFinite(elevation) ? (elevation / meters) * 100 : null;
    return { seconds: seconds, meters: meters, elevation: elevation, speed: speed, grade: grade };
  }

  private computePeaks(values: number[], timeScale: number[]): PeakModel[] {
    let peaks: PeakModel[] = null;
    try {
      peaks = PeaksCalculator.compute(timeScale, values);
    } catch (err) {
      if (!(err instanceof WarningException)) {
        throw err;
      }
    }
    return peaks;
  }

  private computeSplit(values: number[], timeScale: number[], rangeSeconds: number): number {
    let bestSplitResult = null;
    try {
      const splitCalculator = new SplitCalculator(
        timeScale,
        values,
        ActivityComputer.SPLIT_MAX_SCALE_TIME_GAP_THRESHOLD
      );
      bestSplitResult = splitCalculator.getBestSplit(rangeSeconds);
    } catch (err) {
      if (!(err instanceof WarningException)) {
        throw err;
      }
    }
    return bestSplitResult;
  }

  private getZoneOfValue(zones: ZoneModel[], value: number): ZoneModel {
    let matchingZone = null;

    for (const zone of zones) {
      if (value <= zone.to) {
        matchingZone = zone;
        break;
      }
    }

    return matchingZone;
  }

  private computeZones(
    values: number[],
    timeArray: number[],
    userZonesModel: UserZonesModel,
    zoneType: ZoneType
  ): ZoneModel[] {
    if (values.length !== timeArray.length) {
      throw new Error(`Values length ${values.length} must match time array length ${timeArray.length}`);
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

      const matchingZone = this.getZoneOfValue(userZones, values[index]);

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

  private quartiles(data: number[]): number[] {
    const sortedArrayAsc = _.cloneDeep(data).sort((a, b) => a - b);
    return [percentile(sortedArrayAsc, 0.25), percentile(sortedArrayAsc, 0.5), percentile(sortedArrayAsc, 0.75)];
  }
}
