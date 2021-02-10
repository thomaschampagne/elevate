import { AthleteSnapshotModel, Streams, SyncedActivityModel } from "../../models";
import { meanWindowSmoothing, medianFilter, medianSelfFilter, percentile } from "../../tools";
import _ from "lodash";
import { ElevateSport } from "../../enums";
import { WarningException } from "../../exceptions";
import { RunningPowerEstimator } from "./running-power-estimator";
import { CyclingPower } from "./cycling-power-estimator";

export class StreamProcessor {
  private static readonly DEFAULT_MEAN_FILTER_WINDOW = 5;
  private static readonly ALTITUDE_MEAN_FILTER_WINDOW = 7;
  private static readonly GRADE_MEAN_FILTER_WINDOW = 7;
  private static readonly DEFAULT_MEDIAN_PERCENTAGE_WINDOW = 0.15;
  private static readonly PACED_MEDIAN_PERCENTAGE_WINDOW = 1.75;
  private static readonly EST_POWER_MEDIAN_PERCENTAGE_WINDOW = 1;
  private static readonly LOW_MEAN_FILTER_WINDOW = 2;
  private static readonly HUMAN_MAX_HR = 220;

  public static handle(
    activityParams: {
      type: ElevateSport;
      hasPowerMeter: boolean;
      athleteSnapshot: AthleteSnapshotModel;
    },
    streams: Streams,
    errorCallback: (err: Error) => void
  ): Streams {
    if (!streams) {
      return null;
    }

    // Estimate run or ride power stream if no power available
    // It's done on the fly because we can't store the power stream from this computation.
    // Indeed it's "weight" dependent and weight can be changed on specific periods
    if (
      !activityParams.hasPowerMeter &&
      (SyncedActivityModel.isRide(activityParams.type) || SyncedActivityModel.isRun(activityParams.type))
    ) {
      const estimatedPowerStream = this.estimatedPowerStream(activityParams, streams, errorCallback);

      if (estimatedPowerStream) {
        streams.watts = estimatedPowerStream;
      }
    }

    return this.smoothStreams(streams, activityParams);
  }

  private static smoothStreams(
    streams: Streams,
    activityParams: { type: ElevateSport; hasPowerMeter: boolean; athleteSnapshot: AthleteSnapshotModel }
  ): Streams {
    // Smooth altitude
    if (streams.altitude?.length > 0) {
      streams.altitude = medianSelfFilter(streams.altitude, StreamProcessor.DEFAULT_MEDIAN_PERCENTAGE_WINDOW);
      streams.altitude = meanWindowSmoothing(streams.altitude, this.ALTITUDE_MEAN_FILTER_WINDOW); // Seems good
    }

    // Smooth velocity
    if (streams.velocity_smooth?.length > 0) {
      if (SyncedActivityModel.isPaced(activityParams.type)) {
        // Remove speed pikes before
        streams.velocity_smooth = medianSelfFilter(
          streams.velocity_smooth,
          StreamProcessor.PACED_MEDIAN_PERCENTAGE_WINDOW
        );

        // If activity is paced (run, swim, ..) remove unwanted artifacts such as infinite pace when speed if zero
        // For this we take 1% and 99% percentiles values on which we will clamp the stream
        const lowHighPercentiles = this.lowHighPercentiles(streams.velocity_smooth, 1);
        streams.velocity_smooth = this.clampStream(
          streams.velocity_smooth,
          lowHighPercentiles[0],
          lowHighPercentiles[1]
        );
      } else {
        // If not paced, also remove speed pikes
        streams.velocity_smooth = medianSelfFilter(
          streams.velocity_smooth,
          StreamProcessor.DEFAULT_MEDIAN_PERCENTAGE_WINDOW
        );
      }

      // Smoothing
      streams.velocity_smooth = meanWindowSmoothing(streams.velocity_smooth, this.DEFAULT_MEAN_FILTER_WINDOW);
    }

    // Smooth Heart rate
    if (streams.heartrate?.length > 0) {
      // Getting low value percentile to clamp heart rate stream
      // between this low hr and maximum human possible HR.
      const lowHighPercentiles = this.lowHighPercentiles(streams.heartrate, 1);
      streams.heartrate = this.clampStream(streams.heartrate, lowHighPercentiles[0], this.HUMAN_MAX_HR);
      streams.heartrate = medianSelfFilter(streams.heartrate, StreamProcessor.DEFAULT_MEDIAN_PERCENTAGE_WINDOW);
      streams.heartrate = meanWindowSmoothing(streams.heartrate, StreamProcessor.LOW_MEAN_FILTER_WINDOW);
    }

    // Smooth cadence
    if (streams.cadence?.length > 0) {
      // Remove cadence pikes before
      streams.cadence = medianSelfFilter(streams.cadence, StreamProcessor.DEFAULT_MEDIAN_PERCENTAGE_WINDOW);
      streams.cadence = meanWindowSmoothing(streams.cadence, StreamProcessor.LOW_MEAN_FILTER_WINDOW);
    }

    // Smooth grade
    if (streams.grade_smooth?.length > 0) {
      // Remove speed pikes before
      streams.grade_smooth = medianFilter(streams.grade_smooth, StreamProcessor.DEFAULT_MEDIAN_PERCENTAGE_WINDOW);

      // Clamp
      const lowHighPercentiles = this.lowHighPercentiles(streams.grade_smooth, 2);
      streams.grade_smooth = this.clampStream(streams.grade_smooth, lowHighPercentiles[0], lowHighPercentiles[1]);

      // Last smoothing
      streams.grade_smooth = meanWindowSmoothing(streams.grade_smooth, this.GRADE_MEAN_FILTER_WINDOW);
    }

    return streams;
  }

  private static estimatedPowerStream(
    activityParams: { type: ElevateSport; hasPowerMeter: boolean; athleteSnapshot: AthleteSnapshotModel },
    streams: Streams,
    errorCallback: (err: Error) => void
  ): number[] {
    let powerStream = null;

    try {
      if (SyncedActivityModel.isRide(activityParams.type)) {
        powerStream = this.estimateCyclingPowerStream(
          activityParams.type,
          streams.velocity_smooth,
          streams.grade_smooth,
          activityParams.athleteSnapshot.athleteSettings.weight
        );
      }

      if (SyncedActivityModel.isRun(activityParams.type)) {
        powerStream = this.estimateRunningPowerStream(
          activityParams.type,
          streams.time,
          streams.distance,
          streams.altitude,
          activityParams.athleteSnapshot.athleteSettings.weight
        );
      }
    } catch (err) {
      errorCallback(err);
      powerStream = null;
    }

    // Smooth power stream on th fly
    if (powerStream && powerStream.length > 0) {
      // Remove watts pikes before
      const lowHighPercentiles = this.lowHighPercentiles(powerStream, 1);
      powerStream = this.clampStream(powerStream, lowHighPercentiles[0], lowHighPercentiles[1]);
      powerStream = medianSelfFilter(powerStream, StreamProcessor.EST_POWER_MEDIAN_PERCENTAGE_WINDOW);
      powerStream = meanWindowSmoothing(powerStream, this.DEFAULT_MEAN_FILTER_WINDOW);
    }

    return powerStream;
  }

  public static estimateCyclingPowerStream(
    type: ElevateSport,
    velocityStream: number[],
    gradeStream: number[],
    athleteWeight: number
  ): number[] {
    if (_.isEmpty(velocityStream)) {
      throw new WarningException("Velocity stream cannot be empty to calculate power stream");
    }

    if (_.isEmpty(gradeStream)) {
      throw new WarningException("Grade stream cannot be empty to calculate power stream");
    }

    if (!SyncedActivityModel.isRide(type)) {
      throw new WarningException(
        `Cannot compute estimated cycling power data on activity type: ${type}. Must be done with a bike.`
      );
    }

    if (!athleteWeight || athleteWeight < 0) {
      throw new WarningException(`Cannot compute estimated cycling power with a athlete weight of ${athleteWeight}`);
    }

    const powerEstimatorParams: Partial<CyclingPower.Params> = {
      riderWeightKg: athleteWeight
    };

    const estimatedPowerStream = [];

    for (let i = 0; i < velocityStream.length; i++) {
      const kph = velocityStream[i] * 3.6;
      powerEstimatorParams.gradePercentage = gradeStream[i];
      const power = CyclingPower.Estimator.calc(kph, powerEstimatorParams);
      estimatedPowerStream.push(power);
    }

    return estimatedPowerStream;
  }

  public static estimateRunningPowerStream(
    type: ElevateSport,
    timeArray: number[],
    distanceArray: number[],
    altitudeArray: number[],
    athleteWeight: number
  ): number[] {
    if (_.isEmpty(timeArray)) {
      throw new WarningException("Time stream cannot be empty to calculate power stream");
    }

    if (_.isEmpty(distanceArray)) {
      throw new WarningException("Distance stream cannot be empty to calculate power stream");
    }

    if (_.isEmpty(altitudeArray)) {
      throw new WarningException("Distance stream cannot be empty to calculate power stream");
    }

    if (!SyncedActivityModel.isRun(type)) {
      throw new WarningException(
        `Cannot compute estimated cycling power data on activity type: ${type}. Must be done with a bike.`
      );
    }

    if (!athleteWeight || athleteWeight < 0) {
      throw new WarningException(`Cannot compute estimated running power with a athlete weight of ${athleteWeight}`);
    }

    return RunningPowerEstimator.createRunningPowerEstimationStream(
      athleteWeight,
      distanceArray,
      timeArray,
      altitudeArray
    );
  }

  /**
   * Return by default very low and very high percentiles (1%)
   */
  private static lowHighPercentiles(stream: number[], percentage: number = 1): number[] {
    const pRatio = percentage / 100;
    const sortedArrayAsc = _.cloneDeep(stream).sort((a, b) => a - b);
    return [percentile(sortedArrayAsc, pRatio), percentile(sortedArrayAsc, 1 - pRatio)];
  }

  private static clampStream(stream: number[], lowValue: number, highValue: number): number[] {
    return stream.map(value => {
      return _.clamp(value, lowValue, highValue);
    });
  }
}
