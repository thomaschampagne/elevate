import _ from "lodash";
import { RunningPowerEstimator } from "./running-power-estimator";
import { CyclingPower } from "./cycling-power-estimator";
import { ElevateSport } from "../../enums/elevate-sport.enum";
import { LowPassFilter } from "../../tools/data-smoothing/low-pass-filter";
import { meanWindowSmoothing } from "../../tools/data-smoothing/mean-window-smoothing";
import { KalmanFilter } from "../../tools/data-smoothing/kalman";
import { WarningException } from "../../exceptions/warning.exception";
import { Activity } from "../../models/sync/activity.model";
import { AthleteSnapshot } from "../../models/athlete/athlete-snapshot.model";
import { InconsistentParametersException } from "../../exceptions/inconsistent-parameters.exception";
import { Streams } from "../../models/activity-data/streams.model";
import { medianFilter } from "../../tools/data-smoothing/median-filter";

export enum ProcessStreamMode {
  COMPUTE,
  DISPLAY
}

export interface StreamProcessorParams {
  type: ElevateSport;
  hasPowerMeter: boolean;
  isSwimPool: boolean;
  athleteSnapshot: AthleteSnapshot;
}

export class StreamProcessor {
  public static handle(processMode: ProcessStreamMode, params: StreamProcessorParams, streams: Streams): Streams {
    if (!streams) {
      return null;
    }

    if (processMode === ProcessStreamMode.COMPUTE) {
      return this.streamsComputeHandler(streams, params);
    } else if (processMode === ProcessStreamMode.DISPLAY) {
      return this.streamsDisplayHandler(streams, params);
    }

    return null;
  }

  private static streamsComputeHandler(streams: Streams, params: StreamProcessorParams): Streams {
    return this.shapeStreams(streams, params);
  }

  private static streamsDisplayHandler(streams: Streams, params: StreamProcessorParams): Streams {
    return this.shapeStreams(streams, params);
  }

  /**
   * Note: currently both compute & display process mode use same computation
   */
  private static shapeStreams(streams: Streams, params: StreamProcessorParams): Streams {
    streams = this.smoothAltitude(streams);
    streams = this.computeShapeGrade(streams); // We re-compute grade and smooth it ourselves
    streams = this.smoothVelocity(streams, params);
    streams = this.shapePacedVelocities(streams, params);
    streams = this.computeGradeAdjustedSpeed(streams, params); // We re-compute grade adjusted speed
    streams = this.computeEstimatedPower(streams, params);
    streams = this.shapePower(streams, params); // Both real and estimated power
    streams = this.shapeHeartRate(streams);
    streams = this.shapeCadence(streams);
    streams = this.computeAscentSpeed(streams);
    return streams;
  }

  /**
   * Remove some unusual spikes & smooth stream
   */
  private static smoothAltitude(streams: Streams): Streams {
    const ALTITUDE_SPIKES_MEDIAN_FILTER_WINDOW = 3;

    if (streams.altitude?.length > 0) {
      streams.altitude = medianFilter(streams.altitude, ALTITUDE_SPIKES_MEDIAN_FILTER_WINDOW);
      streams.altitude = LowPassFilter.smooth(streams.altitude);
    }
    return streams;
  }

  /**
   * Remove some unusual spikes
   */
  private static smoothVelocity(streams: Streams, params: StreamProcessorParams): Streams {
    // We intend to remove velocity stream for every activities not performed in a swim pool :)
    if (streams.velocity_smooth?.length > 0 && !params.isSwimPool) {
      streams.velocity_smooth = meanWindowSmoothing(streams.velocity_smooth);
    }
    return streams;
  }

  /**
   * Clamp to maximum possible human power
   */
  private static shapePower(streams: Streams, params: StreamProcessorParams): Streams {
    if (streams.watts?.length > 0) {
      const MAX_WATT_PER_KG = 30;
      streams.watts = streams.watts.map(power =>
        _.clamp(power, MAX_WATT_PER_KG * params.athleteSnapshot.athleteSettings.weight)
      );
    }
    return streams;
  }

  /**
   * Clamp to maximum possible human heart-rate, remove some unusual spikes & smooth stream
   */
  private static shapeHeartRate(streams: Streams): Streams {
    if (streams.heartrate?.length > 0) {
      // Clamp as human heart rate
      const MAX_HUMAN_HR = 250;
      streams.heartrate = streams.heartrate.map(hr => _.clamp(hr, MAX_HUMAN_HR));

      // Remove spikes
      streams.heartrate = medianFilter(streams.heartrate);

      // Smooth HR signal
      streams.heartrate = meanWindowSmoothing(streams.heartrate);
    }
    return streams;
  }

  /**
   * Clamp to maximum possible human cadence, remove some unusual spikes & smooth stream
   */
  private static shapeCadence(streams: Streams): Streams {
    if (streams.cadence?.length > 0) {
      // Clamp as human cadence
      const MAX_HUMAN_CAD = 250;
      streams.cadence = streams.cadence.map(cad => _.clamp(cad, MAX_HUMAN_CAD));

      // Remove spikes
      streams.cadence = medianFilter(streams.cadence);

      // Smooth HR signal
      streams.cadence = meanWindowSmoothing(streams.cadence);
    }
    return streams;
  }

  /**
   * Compute and shape grade stream
   */
  private static computeShapeGrade(streams: Streams): Streams {
    const GRADE_CLAMP = 50;
    const DISTANCE_AHEAD_MIN_METERS = 10;
    const GRADE_KALMAN_SMOOTHING = {
      R: 0.01, // Grade model is stable
      Q: 0.5 // Measures grades errors expected
    };

    if (streams.distance?.length > 0 && streams.altitude?.length > 0) {
      streams.grade_smooth = [];

      let indexNow = 0;
      do {
        // Remove first index of distances & altitudes stream at every loop
        const aheadDistances = streams.distance.slice(indexNow);
        const aheadAltitudes = streams.altitude.slice(indexNow);

        // Take our current distance travelled & altitude
        const distanceNow = aheadDistances[0];
        const altitudeNow = aheadAltitudes[0];

        // Find ahead index matching minimal distance travelled
        let aheadIndex = aheadDistances.findIndex(dist => distanceNow + DISTANCE_AHEAD_MIN_METERS <= dist);

        // Validate we find an index with distance ahead for sure, else use last index of ahead distances
        aheadIndex = aheadIndex >= 0 ? aheadIndex : aheadDistances.length - 1;

        // Compute deltas & grade
        const aheadDeltaDistance = aheadDistances[aheadIndex] - distanceNow;
        const aheadDeltaAltitude = aheadAltitudes[aheadIndex] - altitudeNow;

        const aheadGrade =
          aheadDeltaDistance > 0
            ? _.clamp(_.round((aheadDeltaAltitude / aheadDeltaDistance) * 100, 2), -GRADE_CLAMP, GRADE_CLAMP)
            : 0;

        streams.grade_smooth.push(aheadGrade);

        indexNow++;
      } while (indexNow < streams.distance.length);

      // Fix potentials grade errors and smooth out grade signal
      streams.grade_smooth = KalmanFilter.apply(streams.grade_smooth, GRADE_KALMAN_SMOOTHING);
    }

    return streams;
  }

  /**
   * Shape velocities when they are base paced (Run, Swim, ...)
   */
  private static shapePacedVelocities(streams: Streams, params: StreamProcessorParams): Streams {
    if (!streams.velocity_smooth?.length) {
      return streams;
    }

    if (!Activity.isPaced(params.type)) {
      return streams;
    }

    // Ensure first paced stream dont start with 0 (it's common...)
    // Keeping it means infinity and bad looking results
    if (!streams.velocity_smooth[0]) {
      const firstKnownValue = streams.velocity_smooth.find(v => (v as number) > 0);
      streams.velocity_smooth[0] = firstKnownValue ? firstKnownValue : streams.velocity_smooth[0];
    }

    if (Activity.isByFoot(params.type)) {
      const DEFAULT_MAX_SPEED_THRESHOLD = 34 / 3.6; // 3kph = 01:45/km
      const DEFAULT_LOWER_SPEED_THRESHOLD = 2 / 3.6; // 2kph = 0.55 m/s = 30:00/km
      const RUN_LOWER_SPEED_THRESHOLD = 3 / 3.6; // 3kph = 0.83 m/s = 20:00/km
      const BY_FOOT_PACE_KALMAN_SMOOTHING = {
        R: 0.01, // Speed model is stable
        Q: 1 / 3.6 // 1 kph possible measurements errors
      };

      // Clamp low speed along activity type to avoid infinite paces
      const minSpeedThreshold = Activity.isRun(params.type) ? RUN_LOWER_SPEED_THRESHOLD : DEFAULT_LOWER_SPEED_THRESHOLD;
      streams.velocity_smooth = this.clampStream(
        streams.velocity_smooth,
        minSpeedThreshold,
        DEFAULT_MAX_SPEED_THRESHOLD
      );

      // Fix potentials pace errors for foot activities and smooth out pace signal
      streams.velocity_smooth = KalmanFilter.apply(streams.velocity_smooth, BY_FOOT_PACE_KALMAN_SMOOTHING);
    }

    if (Activity.isSwim(params.type) && !params.isSwimPool) {
      const SWIM_MAX_SPEED_THRESHOLD = 8.5 / 3.6;
      const SWIM_LOWER_SPEED_THRESHOLD = 0.3;
      streams.velocity_smooth = this.clampStream(
        streams.velocity_smooth,
        SWIM_LOWER_SPEED_THRESHOLD,
        SWIM_MAX_SPEED_THRESHOLD
      );
    }

    return streams;
  }

  private static computeGradeAdjustedSpeed(streams: Streams, params: StreamProcessorParams): Streams {
    if (Activity.isRun(params.type) && streams.velocity_smooth?.length > 0 && streams.grade_smooth?.length > 0) {
      streams.grade_adjusted_speed = [];

      for (const [index, mps] of streams.velocity_smooth.entries()) {
        const grade = streams.grade_smooth[index];
        const adjustedMps = mps * this.runningGradeAdjustedSpeedFactor(grade);
        streams.grade_adjusted_speed.push(_.round(adjustedMps, 2));
      }
    }

    return streams;
  }

  private static computeAscentSpeed(streams: Streams): Streams {
    const AS_KALMAN_SMOOTHING = {
      R: 0.001, // Grade model is stable
      Q: 10 // Measures altitude errors expected
    };

    streams.ascent_speed = [];

    var previous = null;
    for (const [index, altitude] of streams.altitude.entries()) {
      if (previous === null) {
        previous = [index, altitude];
      }
      const ascent = altitude - previous[1];
      const time = streams.time[index] - streams.time[previous[0]];
      const ascentSpeed = (ascent * 3600) / time; // m/h
      previous = [index, altitude];
      streams.ascent_speed.push(_.round(ascentSpeed > 0 ? ascentSpeed : 0, 2));
    }

    // Fix potentials ascent errors and smooth out ascent speed signal
    streams.ascent_speed = KalmanFilter.apply(streams.ascent_speed, AS_KALMAN_SMOOTHING);

    return streams;
  }

  /**
   * Estimate run or ride power stream if no power available
   * It's done on the fly because we can't store the power stream from this computation.
   * Indeed it's "weight" dependent and weight can be changed on specific periods
   * If no GPS data available (activity not performed outside OR not virtually outside), then don't estimate watts.
   * Indeed this kind of activities could provide wrong distances and/or elevations (=> wrong grades), and thus wrong watts estimation.
   */
  private static computeEstimatedPower(streams: Streams, params: StreamProcessorParams): Streams {
    if (!params.hasPowerMeter && streams.latlng?.length > 0) {
      streams.watts = this.estimatedPowerStream(streams, params);
    }

    // (Debug purpose) Generates estimated power stream even if real power data is available
    if (
      params.hasPowerMeter &&
      streams.latlng?.length > 0 &&
      typeof localStorage !== "undefined" &&
      localStorage.getItem("DEBUG_EST_VS_REAL_WATTS") === "true"
    ) {
      const estimatedPowerStream = this.estimatedPowerStream(streams, params);
      if (estimatedPowerStream) {
        streams.watts_calc = estimatedPowerStream;
      }
    }

    return streams;
  }

  /**
   * Return grade adjusted speed factor (not pace) for a given grade value
   * Get Real Strava Premium Grade Adjusted Pace on every strava activities using:
   * https://gist.github.com/thomaschampagne/2781dce212d12cd048728e70ae791a30
   * ---------------------------------------------------------------------------------
   * 5th order curve fitted equation based on Strava GAP model described by below data
   * [{ grade: -34, speedFactor: 1.7 }, { grade: -32, speedFactor: 1.6 }, { grade: -30, speedFactor: 1.5 },
   * { grade: -28, speedFactor: 1.4 }, { grade: -26, speedFactor: 1.3 }, { grade: -24, speedFactor: 1.235 },
   * { grade: -22, speedFactor: 1.15 }, { grade: -20, speedFactor: 1.09 }, { grade: -18, speedFactor: 1.02 },
   * { grade: -16, speedFactor: 0.95 }, { grade: -14, speedFactor: 0.91 }, { grade: -12, speedFactor: 0.89 },
   * { grade: -10, speedFactor: 0.88 }, { grade: -8, speedFactor: 0.88 }, { grade: -6, speedFactor: 0.89 },
   * { grade: -4, speedFactor: 0.91 }, { grade: -2, speedFactor: 0.95 }, { grade: 0, speedFactor: 1 },
   * { grade: 2, speedFactor: 1.05 }, { grade: 4, speedFactor: 1.14 }, { grade: 6, speedFactor: 1.24 },
   * { grade: 8, speedFactor: 1.34 }, { grade: 10, speedFactor: 1.47 }, { grade: 12, speedFactor: 1.5 },
   * { grade: 14, speedFactor: 1.76 }, { grade: 16, speedFactor: 1.94 }, { grade: 18, speedFactor: 2.11 },
   * { grade: 20, speedFactor: 2.3 }, { grade: 22, speedFactor: 2.4 }, { grade: 24, speedFactor: 2.48 },
   * { grade: 26, speedFactor: 2.81 }, { grade: 28, speedFactor: 3 }, { grade: 30, speedFactor: 3.16 },
   * { grade: 32, speedFactor: 3.31 }, { grade: 34, speedFactor: 3.49 } ]
   */
  public static runningGradeAdjustedSpeedFactor(grade: number): number {
    const kA = 1;
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

  private static runningGradeAdjustedSpeedFactorMinetti(grade: number): number {
    const kA = 0.00108716;
    const kB = 0.0464835;
    const kC = 1.0167;
    return kA * Math.pow(grade, 2) + kB * grade + kC;
  }

  public static estimatedPowerStream(streams: Streams, params: StreamProcessorParams): number[] {
    let powerStream;

    try {
      if (Activity.isRide(params.type)) {
        powerStream = this.estimateCyclingPowerStream(
          params.type,
          streams.velocity_smooth,
          streams.grade_smooth,
          streams.cadence,
          params.athleteSnapshot.athleteSettings.weight
        );
      } else if (Activity.isRun(params.type)) {
        powerStream = this.estimateRunningPowerStream(
          params.type,
          params.athleteSnapshot.athleteSettings.weight,
          streams.grade_adjusted_speed
        );
      } else {
        powerStream = null;
      }
    } catch (err) {
      if (err instanceof WarningException || err instanceof InconsistentParametersException) {
        powerStream = null;
      } else {
        throw err;
      }
    }

    return powerStream;
  }

  public static estimateCyclingPowerStream(
    type: ElevateSport,
    velocityStream: number[],
    gradeStream: number[],
    cadenceStream: number[],
    athleteWeight: number
  ): number[] {
    const ZERO_POWER_CADENCE_THRESHOLD = 30;

    if (_.isEmpty(velocityStream)) {
      throw new WarningException("Velocity stream cannot be empty to calculate power stream");
    }

    if (_.isEmpty(gradeStream)) {
      throw new WarningException("Grade stream cannot be empty to calculate power stream");
    }

    if (!Activity.isRide(type)) {
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

    const hasCadenceData = cadenceStream?.length > 0;

    const estimatedPowerStream = [];

    for (let i = 0; i < velocityStream.length; i++) {
      const kph = velocityStream[i] * 3.6;
      powerEstimatorParams.gradePercentage = gradeStream[i];
      let estPower = CyclingPower.Estimator.calc(kph, powerEstimatorParams);

      // If cadence stream is provided and rider is not pedaling, then estimated power is ZERO!
      if (hasCadenceData && cadenceStream[i] < ZERO_POWER_CADENCE_THRESHOLD) {
        estPower = 0;
      }

      estimatedPowerStream.push(estPower);
    }

    return estimatedPowerStream;
  }

  public static estimateRunningPowerStream(
    type: ElevateSport,
    athleteWeight: number,
    gradeAdjustedSpeedArray: number[]
  ): number[] {
    if (_.isEmpty(gradeAdjustedSpeedArray)) {
      throw new WarningException("Grade adj speed stream cannot be empty to calculate power stream");
    }

    if (!athleteWeight || athleteWeight < 0) {
      throw new WarningException(`Cannot compute estimated running power with a athlete weight of ${athleteWeight}`);
    }

    return RunningPowerEstimator.createRunningPowerEstimationStream(athleteWeight, gradeAdjustedSpeedArray);
  }

  private static clampStream(stream: number[], minValue: number, maxValue: number = null): number[] {
    const highValue: number = Number.isFinite(maxValue) ? maxValue : _.max(stream);
    return stream.map(value => {
      return _.clamp(value, minValue, highValue);
    });
  }
}
