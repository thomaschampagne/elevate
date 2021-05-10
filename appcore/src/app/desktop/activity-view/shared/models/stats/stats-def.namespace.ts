// tslint:disable:no-shadowed-variable
import { Stat } from "./stat.model";
import {
  AnalysisDataModel,
  CadenceDataModel,
  ElevationDataModel,
  GradeDataModel,
  HeartRateDataModel,
  PaceDataModel,
  PowerDataModel,
  SpeedDataModel
} from "@elevate/shared/models";
import { TimeSensor } from "../sensors/time.sensor";
import { DistanceSensor } from "../sensors/distance.sensor";
import { VoidSensor } from "../sensors/void.sensor";
import { PaceSensor, SpeedSensor, SwimmingPaceSensor } from "../sensors/move.sensor";
import { HeartRateSensor } from "../sensors/heart-rate.sensor";
import { ElevationAscentSpeedSensor, ElevationSensor } from "../sensors/elevation.sensor";
import { CyclingCadenceSensor, RunningCadenceSensor, SwimmingCadenceSensor } from "../sensors/cadence.sensor";
import { PowerSensor } from "../sensors/power.sensor";
import moment from "moment";
import { Time } from "@elevate/shared/tools";
import { GradeSensor } from "../sensors/grade.sensor";
import { ActivityComputer } from "@elevate/shared/sync";

export namespace StatsDef {
  const emptyThreshold20MinMessage = "Empty because activity under 20 min";

  export namespace Generic {
    export const movingTime = Stat.create<AnalysisDataModel>(TimeSensor.DEFAULT, "Moving Time", ["moving_time_raw"]);
    export const elapsedTime = Stat.create<AnalysisDataModel>(TimeSensor.DEFAULT, "Elapsed Time", ["elapsed_time_raw"]);
    export const distance = Stat.create<AnalysisDataModel>(
      DistanceSensor.DEFAULT,
      "Distance",
      ["distance_raw"],
      null,
      2
    );
    export const accurateDistance = Stat.create<AnalysisDataModel>(
      DistanceSensor.DEFAULT,
      "Distance",
      ["distance_raw"],
      null,
      3
    );
    export const calories = Stat.create<AnalysisDataModel>(VoidSensor.DEFAULT, "Calories", [
      "extendedStats",
      "calories"
    ]);

    export const caloriesPerHour = Stat.create<AnalysisDataModel>(VoidSensor.DEFAULT, "Calories / Hour", [
      "extendedStats",
      "caloriesPerHour"
    ]);

    export const moveRatio = Stat.create<AnalysisDataModel>(
      VoidSensor.DEFAULT,
      "Move Ratio",
      ["extendedStats", "moveRatio"],
      "Moving / Elapsed time ratio",
      2
    );

    export const ascentGain = Stat.create<AnalysisDataModel>(ElevationSensor.DEFAULT, "Ascent Gain", [
      "elevation_gain_raw"
    ]);

    export namespace Running {
      export const performanceIndex = Stat.create<AnalysisDataModel>(
        VoidSensor.DEFAULT,
        "Perf. Index",
        ["extendedStats", "runningPerformanceIndex"],
        "Running Performance Index from Polar company."
      );
    }

    export namespace Swimming {
      export const swolf = Stat.create<AnalysisDataModel>(
        VoidSensor.DEFAULT,
        "SWOLF",
        ["extendedStats", "swimSwolf"],
        "Swimming efficiency normalized to a 25 meters pool"
      );
    }
  }

  export namespace Speed {
    export const avg = Stat.create<SpeedDataModel>(
      SpeedSensor.DEFAULT,
      "Average",
      ["extendedStats", "speedData", "genuineAvgSpeed"],
      "Average speed while moving"
    );

    export const fullAvg = Stat.create<SpeedDataModel>(
      SpeedSensor.DEFAULT,
      "Full Average",
      ["extendedStats", "speedData", "totalAvgSpeed"],
      "Average speed including pause time"
    );

    export const max = Stat.create<SpeedDataModel>(SpeedSensor.DEFAULT, "Max", [
      "extendedStats",
      "speedData",
      "maxSpeed"
    ]);

    export const threshold = Stat.create<SpeedDataModel>(
      SpeedSensor.DEFAULT,
      "Threshold",
      ["extendedStats", "speedData", "best20min"],
      "Best speed held during 20 min"
    ).setMissingMessage(emptyThreshold20MinMessage);

    export const avgPace = Stat.create<SpeedDataModel>(PaceSensor.DEFAULT, "Average Pace", [
      "extendedStats",
      "speedData",
      "avgPace"
    ]);

    export const q25 = Stat.create<SpeedDataModel>(SpeedSensor.DEFAULT, "25% Quartile", [
      "extendedStats",
      "speedData",
      "lowerQuartileSpeed"
    ]);

    export const q50 = Stat.create<SpeedDataModel>(
      SpeedSensor.DEFAULT,
      "50% Quartile",
      ["extendedStats", "speedData", "medianSpeed"],
      "Equals to median"
    );

    export const q75 = Stat.create<SpeedDataModel>(SpeedSensor.DEFAULT, "75% Quartile", [
      "extendedStats",
      "speedData",
      "upperQuartileSpeed"
    ]);

    export const stdDeviation = Stat.create<SpeedDataModel>(
      SpeedSensor.DEFAULT,
      "Std Deviation σ",
      ["extendedStats", "speedData", "standardDeviationSpeed"],
      "Standard deviation"
    );
  }

  export namespace Pace {
    export namespace Running {
      function missingFtpMessage(activityStartTime: string): string {
        return `⚠️ Running threshold pace required on ${moment(activityStartTime).format("MMM Do YYYY")}`;
      }

      export const avg = Stat.create<PaceDataModel>(PaceSensor.DEFAULT, "Average", [
        "extendedStats",
        "paceData",
        "avgPace"
      ]);

      export const fullAvg = Stat.create<PaceDataModel>(
        PaceSensor.DEFAULT,
        "Full Average",
        ["extendedStats", "paceData", "totalAvgPace"],
        "Average pace including pause time"
      );

      export const max = Stat.create<PaceDataModel>(PaceSensor.DEFAULT, "Fastest", [
        "extendedStats",
        "paceData",
        "maxPace"
      ]);

      export const threshold = Stat.create<PaceDataModel>(
        PaceSensor.DEFAULT,
        "Threshold",
        ["extendedStats", "paceData", "best20min"],
        "Best pace held during 20 min"
      ).setMissingMessage(emptyThreshold20MinMessage);

      export const gap = Stat.create<PaceDataModel>(
        PaceSensor.DEFAULT,
        "Grade Adj. Pace",
        ["extendedStats", "paceData", "genuineGradeAdjustedAvgPace"],
        "Equals your avg pace performed on a flat slope"
      );

      export const q25 = Stat.create<PaceDataModel>(PaceSensor.DEFAULT, "25% Quartile", [
        "extendedStats",
        "paceData",
        "lowerQuartilePace"
      ]);

      export const q50 = Stat.create<PaceDataModel>(
        PaceSensor.DEFAULT,
        "50% Quartile",
        ["extendedStats", "paceData", "medianPace"],
        "Equals to median"
      );

      export const q75 = Stat.create<PaceDataModel>(PaceSensor.DEFAULT, "75% Quartile", [
        "extendedStats",
        "paceData",
        "upperQuartilePace"
      ]);

      export function runningStressScore(activityStartTime: string): Stat<PaceDataModel> {
        return Stat.create<PaceDataModel>(
          VoidSensor.DEFAULT,
          "RSS",
          ["extendedStats", "paceData", "runningStressScore"],
          "Running Stress Score"
        ).setMissingMessage(missingFtpMessage(activityStartTime));
      }

      export function runningStressScorePerHour(activityStartTime: string): Stat<PaceDataModel> {
        return Stat.create<PaceDataModel>(
          VoidSensor.DEFAULT,
          "RSS / Hour",
          ["extendedStats", "paceData", "runningStressScorePerHour"],
          "Running Stress Score / Hour"
        ).setMissingMessage(missingFtpMessage(activityStartTime));
      }
    }

    export namespace Swimming {
      function missingFtpMessage(activityStartTime: string): string {
        return `⚠️ Swim threshold pace required on ${moment(activityStartTime).format("MMM Do YYYY")}`;
      }

      export const avg = Stat.create<PaceDataModel>(
        SwimmingPaceSensor.DEFAULT,
        "Average",
        ["extendedStats", "paceData", "avgPace"],
        "Average time / hundred meters or yards"
      );

      export const max = Stat.create<PaceDataModel>(
        SwimmingPaceSensor.DEFAULT,
        "Fastest",
        ["extendedStats", "paceData", "maxPace"],
        "Fastest time / hundred meters or yards"
      );

      export const threshold = Stat.create<PaceDataModel>(
        SwimmingPaceSensor.DEFAULT,
        "Threshold",
        ["extendedStats", "paceData", "best20min"],
        "Best pace held during 20 min"
      ).setMissingMessage(emptyThreshold20MinMessage);

      export const q25 = Stat.create<PaceDataModel>(
        SwimmingPaceSensor.DEFAULT,
        "25% Quartile",
        ["extendedStats", "paceData", "lowerQuartilePace"],
        "Lower quartile time / hundred meters or yards"
      );

      export const q50 = Stat.create<PaceDataModel>(
        SwimmingPaceSensor.DEFAULT,
        "50% Quartile",
        ["extendedStats", "paceData", "medianPace"],
        "Median time / hundred meters or yards"
      );

      export const q75 = Stat.create<PaceDataModel>(
        SwimmingPaceSensor.DEFAULT,
        "75% Quartile",
        ["extendedStats", "paceData", "upperQuartilePace"],
        "Upper quartile time / hundred meters or yards"
      );

      export function swimStressScore(activityStartTime: string): Stat<PaceDataModel> {
        return Stat.create<PaceDataModel>(
          VoidSensor.DEFAULT,
          "SSS",
          ["extendedStats", "paceData", "swimStressScore"],
          "Swimming Stress Score"
        ).setMissingMessage(missingFtpMessage(activityStartTime));
      }

      export function swimStressScorePerHour(activityStartTime: string): Stat<PaceDataModel> {
        return Stat.create<PaceDataModel>(
          VoidSensor.DEFAULT,
          "SSS / Hour",
          ["extendedStats", "paceData", "swimStressScorePerHour"],
          "Swimming Stress Score / Hour"
        ).setMissingMessage(missingFtpMessage(activityStartTime));
      }
    }
  }

  export namespace HeartRate {
    export const avg = Stat.create<HeartRateDataModel>(HeartRateSensor.DEFAULT, "Average", [
      "extendedStats",
      "heartRateData",
      "averageHeartRate"
    ]);

    export const max = Stat.create<HeartRateDataModel>(HeartRateSensor.DEFAULT, "Max", [
      "extendedStats",
      "heartRateData",
      "maxHeartRate"
    ]);

    export const hrss = Stat.create<HeartRateDataModel>(
      HeartRateSensor.DEFAULT,
      "HRSS",
      ["extendedStats", "heartRateData", "HRSS"],
      "Heart Rate Stress Score"
    ).asEmptyUnit();

    export const hrssPerHour = Stat.create<HeartRateDataModel>(
      HeartRateSensor.DEFAULT,
      "HRSS / Hour",
      ["extendedStats", "heartRateData", "HRSSPerHour"],
      "Heart Rate Stress Score / Hour"
    ).asEmptyUnit();

    export const trimp = Stat.create<HeartRateDataModel>(
      HeartRateSensor.DEFAULT,
      "TRIMP",
      ["extendedStats", "heartRateData", "TRIMP"],
      "TRaining IMPulse"
    ).asEmptyUnit();

    export const trimpPerHour = Stat.create<HeartRateDataModel>(
      HeartRateSensor.DEFAULT,
      "TRIMP / Hour",
      ["extendedStats", "heartRateData", "TRIMPPerHour"],
      "TRaining IMPulse / Hour"
    ).asEmptyUnit();

    export const threshold = Stat.create<HeartRateDataModel>(
      HeartRateSensor.DEFAULT,
      "Threshold",
      ["extendedStats", "heartRateData", "best20min"],
      "Best heart rate held during 20 min"
    ).setMissingMessage(emptyThreshold20MinMessage);

    export const thresholdHour = Stat.create<HeartRateDataModel>(
      HeartRateSensor.DEFAULT,
      "Threshold 60 min",
      ["extendedStats", "heartRateData", "best60min"],
      "Best heart rate held during 60 min"
    ).setMissingMessage("Empty because activity under 60 min");

    export const hrr = Stat.create<HeartRateDataModel>(
      HeartRateSensor.DEFAULT,
      "HRR",
      ["extendedStats", "heartRateData", "activityHeartRateReserve"],
      "Heart Rate Reserve"
    ).forceUnit("%");

    export const maxHrr = Stat.create<HeartRateDataModel>(
      HeartRateSensor.DEFAULT,
      "Max HRR",
      ["extendedStats", "heartRateData", "activityHeartRateReserveMax"],
      "Max Heart Rate Reserve reached"
    ).forceUnit("%");

    export const q25 = Stat.create<HeartRateDataModel>(HeartRateSensor.DEFAULT, "25% Quartile", [
      "extendedStats",
      "heartRateData",
      "lowerQuartileHeartRate"
    ]);

    export const q50 = Stat.create<HeartRateDataModel>(
      HeartRateSensor.DEFAULT,
      "50% Quartile",
      ["extendedStats", "heartRateData", "medianHeartRate"],
      "Equals to median"
    );

    export const q75 = Stat.create<HeartRateDataModel>(HeartRateSensor.DEFAULT, "75% Quartile", [
      "extendedStats",
      "heartRateData",
      "upperQuartileHeartRate"
    ]);
  }

  export namespace Power {
    export function avg(powerSensor: PowerSensor): Stat<PowerDataModel> {
      return Stat.create<PowerDataModel>(powerSensor, "Average", ["extendedStats", "powerData", "avgWatts"]);
    }

    export function avgPerKg(powerSensor: PowerSensor): Stat<PowerDataModel> {
      return Stat.create<PowerDataModel>(
        powerSensor,
        "Average /kg",
        ["extendedStats", "powerData", "avgWattsPerKg"],
        "Average watts / kilograms",
        2
      );
    }

    export function avgWeighted(powerSensor: PowerSensor): Stat<PowerDataModel> {
      return Stat.create<PowerDataModel>(
        powerSensor,
        "Avg Wtd",
        ["extendedStats", "powerData", "weightedPower"],
        "Avg Weighted watts"
      );
    }

    export function avgWeightedPerKg(powerSensor: PowerSensor): Stat<PowerDataModel> {
      return Stat.create<PowerDataModel>(
        powerSensor,
        "Avg Wtd. /kg",
        ["extendedStats", "powerData", "weightedWattsPerKg"],
        "Avg Weighted watts / kilograms",
        2
      );
    }

    export function max(powerSensor: PowerSensor): Stat<PowerDataModel> {
      return Stat.create<PowerDataModel>(powerSensor, "Max", ["extendedStats", "powerData", "maxPower"]);
    }

    export function threshold(powerSensor: PowerSensor): Stat<PowerDataModel> {
      return Stat.create<PowerDataModel>(
        powerSensor,
        "Threshold",
        ["extendedStats", "powerData", "best20min"],
        "Best power held during 20 min"
      ).setMissingMessage(emptyThreshold20MinMessage);
    }

    export function threshold80Percent(powerSensor: PowerSensor, movingTime: number) {
      const bestEightyPercentTime = Time.secToMilitary(movingTime * 0.8);

      return Stat.create<PowerDataModel>(
        powerSensor,
        "Threshold 80%",
        ["extendedStats", "powerData", "bestEightyPercent"],
        `Best power held during 80% of moving time = ${bestEightyPercentTime}`
      );
    }

    export function variabilityIndex(powerSensor: PowerSensor) {
      return Stat.create<PowerDataModel>(
        powerSensor,
        "Variability Index",
        ["extendedStats", "powerData", "variabilityIndex"],
        "Represents activity pace (Weighted Power / Average Power)",
        2
      ).asEmptyUnit();
    }

    export function q25(powerSensor: PowerSensor) {
      return Stat.create<PowerDataModel>(powerSensor, "25% Quartile", [
        "extendedStats",
        "powerData",
        "lowerQuartileWatts"
      ]);
    }

    export function q50(powerSensor: PowerSensor) {
      return Stat.create<PowerDataModel>(
        powerSensor,
        "50% Quartile",
        ["extendedStats", "powerData", "medianWatts"],
        "Equals to median"
      );
    }

    export function q75(powerSensor: PowerSensor) {
      return Stat.create<PowerDataModel>(powerSensor, "75% Quartile", [
        "extendedStats",
        "powerData",
        "upperQuartileWatts"
      ]);
    }

    export namespace Cycling {
      function missingFtpMessage(activityStartTime: string): string {
        return `⚠️ Cycling threshold power required on ${moment(activityStartTime).format("MMM Do YYYY")}`;
      }

      export function pss(powerSensor: PowerSensor, activityStartTime: string): Stat<PowerDataModel> {
        return Stat.create<PowerDataModel>(
          powerSensor,
          "PSS",
          ["extendedStats", "powerData", "powerStressScore"],
          "Power Stress Score"
        )
          .asEmptyUnit()
          .setMissingMessage(missingFtpMessage(activityStartTime));
      }

      export function pssPerHour(powerSensor: PowerSensor, activityStartTime: string) {
        return Stat.create<PowerDataModel>(
          powerSensor,
          "PSS / Hour",
          ["extendedStats", "powerData", "powerStressScorePerHour"],
          "Power Stress Score / Hour"
        )
          .asEmptyUnit()
          .setMissingMessage(missingFtpMessage(activityStartTime));
      }

      export function intensity(powerSensor: PowerSensor, activityStartTime: string) {
        return Stat.create<PowerDataModel>(
          powerSensor,
          "Intensity",
          ["extendedStats", "powerData", "punchFactor"],
          "Represents activity intensity (Weighted Power / Athlete Threshold)",
          2
        )
          .asEmptyUnit()
          .setMissingMessage(missingFtpMessage(activityStartTime));
      }
    }
  }

  export namespace Cadence {
    export namespace Cycling {
      export const avg = Stat.create<CadenceDataModel>(
        CyclingCadenceSensor.DEFAULT,
        "Average",
        ["extendedStats", "cadenceData", "averageCadence"],
        "Average cadence inc. freewheeling & pauses"
      );

      export const activeAvg = Stat.create<CadenceDataModel>(
        CyclingCadenceSensor.DEFAULT,
        "Active Average",
        ["extendedStats", "cadenceData", "averageActiveCadence"],
        "Average cadence with legs moving"
      );

      export const max = Stat.create<CadenceDataModel>(CyclingCadenceSensor.DEFAULT, "Max", [
        "extendedStats",
        "cadenceData",
        "maxCadence"
      ]);

      export const pedalingTime = Stat.create<CadenceDataModel>(
        TimeSensor.DEFAULT,
        "Pedaling Time",
        ["extendedStats", "cadenceData", "cadenceActiveTime"],
        "Active pedaling time"
      );

      export const pedalingRatio = Stat.create<CadenceDataModel>(
        CyclingCadenceSensor.DEFAULT,
        "Pedaling Ratio",
        ["extendedStats", "cadenceData", "cadenceActivePercentage"],
        "Pedaling VS Freewheel ratio"
      ).forceUnit("%");

      export const avgClimb = Stat.create<CadenceDataModel>(CyclingCadenceSensor.DEFAULT, "Avg Climbing", [
        "extendedStats",
        "cadenceData",
        "upFlatDownCadencePaceData",
        "up"
      ]);

      export const avgFlat = Stat.create<CadenceDataModel>(CyclingCadenceSensor.DEFAULT, "Avg Flat", [
        "extendedStats",
        "cadenceData",
        "upFlatDownCadencePaceData",
        "flat"
      ]);

      export const avgDown = Stat.create<CadenceDataModel>(CyclingCadenceSensor.DEFAULT, "Avg Downhill", [
        "extendedStats",
        "cadenceData",
        "upFlatDownCadencePaceData",
        "down"
      ]);

      export const stdDeviation = Stat.create<CadenceDataModel>(CyclingCadenceSensor.DEFAULT, "Std Deviation σ", [
        "extendedStats",
        "cadenceData",
        "standardDeviationCadence"
      ]);

      export const totalOccurrences = Stat.create<CadenceDataModel>(
        VoidSensor.DEFAULT,
        "Rev. Count",
        ["extendedStats", "cadenceData", "totalOccurrences"],
        "Crankset revolutions count"
      ).asEmptyUnit();

      export const q25 = Stat.create<CadenceDataModel>(CyclingCadenceSensor.DEFAULT, "25% Quartile", [
        "extendedStats",
        "cadenceData",
        "lowerQuartileCadence"
      ]);

      export const q50 = Stat.create<CadenceDataModel>(
        CyclingCadenceSensor.DEFAULT,
        "50% Quartile",
        ["extendedStats", "cadenceData", "medianCadence"],
        "Equals to median"
      );

      export const q75 = Stat.create<CadenceDataModel>(CyclingCadenceSensor.DEFAULT, "75% Quartile", [
        "extendedStats",
        "cadenceData",
        "upperQuartileCadence"
      ]);

      export const avgDistPerRev = Stat.create<CadenceDataModel>(
        VoidSensor.DEFAULT,
        "Avg Dist. / Rev.",
        ["extendedStats", "cadenceData", "averageDistancePerOccurrence"],
        "Average distance / crankset revolution",
        2
      ).forceUnit("m");
    }

    export namespace Running {
      export const avg = Stat.create<CadenceDataModel>(
        RunningCadenceSensor.DEFAULT,
        "Average",
        ["extendedStats", "cadenceData", "averageCadence"],
        "Average strides inc. walking & pauses (2 legs)"
      );

      export const activeAvg = Stat.create<CadenceDataModel>(
        RunningCadenceSensor.DEFAULT,
        "Active Average",
        ["extendedStats", "cadenceData", "averageActiveCadence"],
        "Average strides while running (2 legs)"
      );

      export const max = Stat.create<CadenceDataModel>(
        RunningCadenceSensor.DEFAULT,
        "Max",
        ["extendedStats", "cadenceData", "maxCadence"],
        "Max strides (2 legs)"
      );

      export const avgClimb = Stat.create<CadenceDataModel>(
        RunningCadenceSensor.DEFAULT,
        "Avg Climbing",
        ["extendedStats", "cadenceData", "upFlatDownCadencePaceData", "up"],
        "Average strides while climbing (2 legs)"
      );

      export const avgFlat = Stat.create<CadenceDataModel>(
        RunningCadenceSensor.DEFAULT,
        "Avg Flat",
        ["extendedStats", "cadenceData", "upFlatDownCadencePaceData", "flat"],
        "Average strides on flat (2 legs)"
      );

      export const avgDown = Stat.create<CadenceDataModel>(
        RunningCadenceSensor.DEFAULT,
        "Avg Downhill",
        ["extendedStats", "cadenceData", "upFlatDownCadencePaceData", "down"],
        "Average strides on downhills (2 legs)"
      );

      export const stdDeviation = Stat.create<CadenceDataModel>(
        RunningCadenceSensor.DEFAULT,
        "Std Deviation σ",
        ["extendedStats", "cadenceData", "standardDeviationCadence"],
        "Standard deviation (2 legs)"
      );

      export const totalOccurrences = Stat.create<CadenceDataModel>(
        VoidSensor.DEFAULT,
        "Strides Count",
        ["extendedStats", "cadenceData", "totalOccurrences"],
        "Single strides count"
      ).asEmptyUnit();

      export const q25 = Stat.create<CadenceDataModel>(
        RunningCadenceSensor.DEFAULT,
        "25% Quartile",
        ["extendedStats", "cadenceData", "lowerQuartileCadence"],
        "25% quartile (2 legs)"
      );

      export const q50 = Stat.create<CadenceDataModel>(
        RunningCadenceSensor.DEFAULT,
        "50% Quartile",
        ["extendedStats", "cadenceData", "medianCadence"],
        "50% quartile or median (2 legs)"
      );

      export const q75 = Stat.create<CadenceDataModel>(
        RunningCadenceSensor.DEFAULT,
        "75% Quartile",
        ["extendedStats", "cadenceData", "upperQuartileCadence"],
        "75% quartile (2 legs)"
      );

      export const avgDistPerStride = Stat.create<CadenceDataModel>(
        VoidSensor.DEFAULT,
        "Avg Dist. / Stride",
        ["extendedStats", "cadenceData", "averageDistancePerOccurrence"],
        "Average distance per single stride",
        2
      ).forceUnit("m");
    }

    export namespace Swimming {
      export const activeAvg = Stat.create<CadenceDataModel>(
        SwimmingCadenceSensor.DEFAULT,
        "Average",
        ["extendedStats", "cadenceData", "averageActiveCadence"],
        "Average strokes per minutes"
      );

      export const avg = Stat.create<CadenceDataModel>(
        SwimmingCadenceSensor.DEFAULT,
        "Average",
        ["extendedStats", "cadenceData", "averageCadence"],
        "Average strokes per minutes inc. pauses"
      );

      export const max = Stat.create<CadenceDataModel>(
        SwimmingCadenceSensor.DEFAULT,
        "Max",
        ["extendedStats", "cadenceData", "maxCadence"],
        "Max strokes"
      );

      export const stdDeviation = Stat.create<CadenceDataModel>(
        SwimmingCadenceSensor.DEFAULT,
        "Std Deviation σ",
        ["extendedStats", "cadenceData", "standardDeviationCadence"],
        "Standard deviation"
      );

      export const totalOccurrences = Stat.create<CadenceDataModel>(
        VoidSensor.DEFAULT,
        "Strokes Count",
        ["extendedStats", "cadenceData", "totalOccurrences"],
        "Strokes count"
      ).asEmptyUnit();

      export const q25 = Stat.create<CadenceDataModel>(
        SwimmingCadenceSensor.DEFAULT,
        "25% Quartile",
        ["extendedStats", "cadenceData", "lowerQuartileCadence"],
        "25% quartile"
      );

      export const q50 = Stat.create<CadenceDataModel>(
        SwimmingCadenceSensor.DEFAULT,
        "50% Quartile",
        ["extendedStats", "cadenceData", "medianCadence"],
        "50% quartile or median"
      );

      export const q75 = Stat.create<CadenceDataModel>(
        SwimmingCadenceSensor.DEFAULT,
        "75% Quartile",
        ["extendedStats", "cadenceData", "upperQuartileCadence"],
        "75% quartile"
      );

      export const avgDistPerStroke = Stat.create<CadenceDataModel>(
        VoidSensor.DEFAULT,
        "Avg Dist. / Stroke",
        ["extendedStats", "cadenceData", "averageDistancePerOccurrence"],
        "Average distance per stroke",
        2
      ).forceUnit("m");
    }
  }

  export namespace Elevation {
    export const ascentGain = Stat.create<ElevationDataModel>(ElevationSensor.DEFAULT, "Ascent Gain", [
      "extendedStats",
      "elevationData",
      "accumulatedElevationAscent"
    ]);

    export const descentGain = Stat.create<ElevationDataModel>(ElevationSensor.DEFAULT, "Descent Gain", [
      "extendedStats",
      "elevationData",
      "accumulatedElevationDescent"
    ]);

    export const max = Stat.create<ElevationDataModel>(ElevationSensor.DEFAULT, "Max", [
      "extendedStats",
      "elevationData",
      "maxElevation"
    ]);

    export const min = Stat.create<ElevationDataModel>(ElevationSensor.DEFAULT, "Min", [
      "extendedStats",
      "elevationData",
      "minElevation"
    ]);

    export const avgVertSpeed = Stat.create<ElevationDataModel>(
      ElevationAscentSpeedSensor.DEFAULT,
      "Avg Ascend Speed",
      ["extendedStats", "elevationData", "ascentSpeed", "avg"],
      "Average vertical climbed meters or feet / hour"
    );

    export const q25AvgVertSpeed = Stat.create<ElevationDataModel>(
      ElevationAscentSpeedSensor.DEFAULT,
      "25% Ascend Speed",
      ["extendedStats", "elevationData", "ascentSpeed", "lowerQuartile"],
      "25% quartile vertical climbed meters or feet / hour"
    );

    export const q50AvgVertSpeed = Stat.create<ElevationDataModel>(
      ElevationAscentSpeedSensor.DEFAULT,
      "50% Ascend Speed",
      ["extendedStats", "elevationData", "ascentSpeed", "median"],
      "50% quartile vertical climbed meters or feet / hour"
    );

    export const q75AvgVertSpeed = Stat.create<ElevationDataModel>(
      ElevationAscentSpeedSensor.DEFAULT,
      "75% Ascend Speed",
      ["extendedStats", "elevationData", "ascentSpeed", "upperQuartile"],
      "75% quartile vertical climbed meters or feet / hour"
    );

    export const q25 = Stat.create<ElevationDataModel>(ElevationSensor.DEFAULT, "25% Quartile", [
      "extendedStats",
      "elevationData",
      "lowerQuartileElevation"
    ]);

    export const q50 = Stat.create<ElevationDataModel>(
      ElevationSensor.DEFAULT,
      "50% Quartile",
      ["extendedStats", "elevationData", "medianElevation"],
      "Equals to median"
    );

    export const q75 = Stat.create<ElevationDataModel>(ElevationSensor.DEFAULT, "75% Quartile", [
      "extendedStats",
      "elevationData",
      "upperQuartileElevation"
    ]);
  }

  export namespace Grade {
    export const profile = Stat.create<GradeDataModel>(GradeSensor.DEFAULT, "Profile", [
      "extendedStats",
      "gradeData",
      "gradeProfile"
    ]).asEmptyUnit();

    export const avg = Stat.create<GradeDataModel>(GradeSensor.DEFAULT, "Average", [
      "extendedStats",
      "gradeData",
      "avgGrade"
    ]);

    export const max = Stat.create<GradeDataModel>(GradeSensor.DEFAULT, "Max", [
      "extendedStats",
      "gradeData",
      "avgMaxGrade"
    ]);

    export const min = Stat.create<GradeDataModel>(GradeSensor.DEFAULT, "Min", [
      "extendedStats",
      "gradeData",
      "avgMinGrade"
    ]);

    export const timeUp = Stat.create<GradeDataModel>(
      TimeSensor.DEFAULT,
      "Climbing Time",
      ["extendedStats", "gradeData", "upFlatDownInSeconds", "up"],
      `Climbing time over ${ActivityComputer.GRADE_CLIMBING_LIMIT}% grade`
    );

    export const timeFlat = Stat.create<GradeDataModel>(
      TimeSensor.DEFAULT,
      "Flat Time",
      ["extendedStats", "gradeData", "upFlatDownInSeconds", "flat"],
      `Time on flat between ${ActivityComputer.GRADE_DOWNHILL_LIMIT}% and ${ActivityComputer.GRADE_CLIMBING_LIMIT}% grade`
    );

    export const timeDown = Stat.create<GradeDataModel>(
      TimeSensor.DEFAULT,
      "Downhill Time",
      ["extendedStats", "gradeData", "upFlatDownInSeconds", "down"],
      `Time in downhills under ${ActivityComputer.GRADE_DOWNHILL_LIMIT}% grade`
    );

    export const distUp = Stat.create<GradeDataModel>(
      DistanceSensor.DEFAULT,
      "Climbing Distance",
      ["extendedStats", "gradeData", "upFlatDownDistanceData", "up"],
      `Climbing distance over ${ActivityComputer.GRADE_CLIMBING_LIMIT}% grade`
    );

    export const distFlat = Stat.create<GradeDataModel>(
      DistanceSensor.DEFAULT,
      "Flat Distance",
      ["extendedStats", "gradeData", "upFlatDownDistanceData", "flat"],
      `Distance on flat between ${ActivityComputer.GRADE_DOWNHILL_LIMIT}% and ${ActivityComputer.GRADE_CLIMBING_LIMIT}% grade`
    );

    export const distDown = Stat.create<GradeDataModel>(
      DistanceSensor.DEFAULT,
      "Downhill Distance",
      ["extendedStats", "gradeData", "upFlatDownDistanceData", "down"],
      `Distance in downhills under ${ActivityComputer.GRADE_DOWNHILL_LIMIT}% grade`
    );

    export const speedUp = Stat.create<GradeDataModel>(
      SpeedSensor.DEFAULT,
      "Climbing Speed",
      ["extendedStats", "gradeData", "upFlatDownMoveData", "up"],
      `Climbing speed over ${ActivityComputer.GRADE_CLIMBING_LIMIT}% grade`
    );

    export const speedFlat = Stat.create<GradeDataModel>(
      SpeedSensor.DEFAULT,
      "Flat Speed",
      ["extendedStats", "gradeData", "upFlatDownMoveData", "flat"],
      `Speed on flat between ${ActivityComputer.GRADE_DOWNHILL_LIMIT}% and ${ActivityComputer.GRADE_CLIMBING_LIMIT}% grade`
    );

    export const speedDown = Stat.create<GradeDataModel>(
      SpeedSensor.DEFAULT,
      "Downhill Speed",
      ["extendedStats", "gradeData", "upFlatDownMoveData", "down"],
      `Speed in downhills under ${ActivityComputer.GRADE_DOWNHILL_LIMIT}% grade`
    );

    export const cadenceUp = Stat.create<GradeDataModel>(
      CyclingCadenceSensor.DEFAULT,
      "Climbing Cadence",
      ["extendedStats", "gradeData", "upFlatDownCadencePaceData", "up"],
      `Climbing cadence over ${ActivityComputer.GRADE_CLIMBING_LIMIT}% grade`
    );

    export const cadenceFlat = Stat.create<GradeDataModel>(
      CyclingCadenceSensor.DEFAULT,
      "Flat Cadence",
      ["extendedStats", "gradeData", "upFlatDownCadencePaceData", "flat"],
      `Cadence on flat between ${ActivityComputer.GRADE_DOWNHILL_LIMIT}% and ${ActivityComputer.GRADE_CLIMBING_LIMIT}% grade`
    );

    export const cadenceDown = Stat.create<GradeDataModel>(
      CyclingCadenceSensor.DEFAULT,
      "Downhill Cadence",
      ["extendedStats", "gradeData", "upFlatDownCadencePaceData", "down"],
      `Cadence in downhills under ${ActivityComputer.GRADE_DOWNHILL_LIMIT}% grade`
    );

    export const q25 = Stat.create<GradeDataModel>(
      GradeSensor.DEFAULT,
      "25% Quartile",
      ["extendedStats", "gradeData", "lowerQuartileGrade"],
      "25% quartile"
    );

    export const q50 = Stat.create<GradeDataModel>(
      GradeSensor.DEFAULT,
      "50% Quartile",
      ["extendedStats", "gradeData", "medianGrade"],
      "50% quartile or median"
    );

    export const q75 = Stat.create<GradeDataModel>(
      GradeSensor.DEFAULT,
      "75% Quartile",
      ["extendedStats", "gradeData", "upperQuartileGrade"],
      "75% quartile"
    );

    export namespace Running {
      export const paceUp = Stat.create<GradeDataModel>(
        PaceSensor.DEFAULT,
        "Climbing Pace",
        ["extendedStats", "gradeData", "upFlatDownMoveData", "up"],
        `Climbing pace over ${ActivityComputer.GRADE_CLIMBING_LIMIT}% grade`
      );

      export const paceFlat = Stat.create<GradeDataModel>(
        PaceSensor.DEFAULT,
        "Flat Pace",
        ["extendedStats", "gradeData", "upFlatDownMoveData", "flat"],
        `Pace on flat between ${ActivityComputer.GRADE_DOWNHILL_LIMIT}% and ${ActivityComputer.GRADE_CLIMBING_LIMIT}% grade`
      );

      export const paceDown = Stat.create<GradeDataModel>(
        PaceSensor.DEFAULT,
        "Downhill Pace",
        ["extendedStats", "gradeData", "upFlatDownMoveData", "down"],
        `Pace in downhills under ${ActivityComputer.GRADE_DOWNHILL_LIMIT}% grade`
      );

      export const cadenceUp = Stat.create<GradeDataModel>(
        RunningCadenceSensor.DEFAULT,
        "Climbing Cadence",
        ["extendedStats", "gradeData", "upFlatDownCadencePaceData", "up"],
        `Climbing cadence over ${ActivityComputer.GRADE_CLIMBING_LIMIT}% grade`
      );

      export const cadenceFlat = Stat.create<GradeDataModel>(
        RunningCadenceSensor.DEFAULT,
        "Flat Cadence",
        ["extendedStats", "gradeData", "upFlatDownCadencePaceData", "flat"],
        `Cadence on flat between ${ActivityComputer.GRADE_DOWNHILL_LIMIT}% and ${ActivityComputer.GRADE_CLIMBING_LIMIT}% grade`
      );

      export const cadenceDown = Stat.create<GradeDataModel>(
        RunningCadenceSensor.DEFAULT,
        "Downhill Cadence",
        ["extendedStats", "gradeData", "upFlatDownCadencePaceData", "down"],
        `Cadence in downhills under ${ActivityComputer.GRADE_DOWNHILL_LIMIT}% grade`
      );
    }
  }
}
