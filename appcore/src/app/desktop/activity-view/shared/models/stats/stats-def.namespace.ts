/* eslint-disable @typescript-eslint/no-shadow */
import { Stat } from "./stat.model";
import { TimeSensor } from "../sensors/time.sensor";
import { DistanceSensor, RunningDistanceSensor, SwimDistanceSensor } from "../sensors/distance.sensor";
import { VoidSensor } from "../sensors/void.sensor";
import { PaceSensor, SpeedSensor, SwimmingPaceSensor } from "../sensors/move.sensor";
import { HeartRateSensor } from "../sensors/heart-rate.sensor";
import { ElevationAscentSpeedSensor, ElevationSensor } from "../sensors/elevation.sensor";
import { CyclingCadenceSensor, RunningCadenceSensor, SwimmingCadenceSensor } from "../sensors/cadence.sensor";
import { PowerSensor } from "../sensors/power.sensor";
import moment from "moment";
import { GradeSensor } from "../sensors/grade.sensor";
import { ActivityComputer } from "@elevate/shared/sync/compute/activity-computer";
import {
  ActivityStats,
  CadenceStats,
  CyclingDynamicsStats,
  DynamicsStats,
  ElevationStats,
  GradeStats,
  HeartRateStats,
  LeftRightPercent,
  PaceStats,
  PowerStats,
  RunningDynamicsStats,
  Scores,
  SpeedStats,
  StressScores,
  TrainingEffect
} from "@elevate/shared/models/sync/activity.model";

export namespace StatsDef {
  const emptyThreshold20MinMessage = `Empty because activity under 20 min`;

  const missingFtpMessage = (sport: string, dataType: string, activityStartTime: string): string => {
    return `⚠️ ${sport} threshold ${dataType} required on ${moment(activityStartTime).format("MMM Do YYYY")}`;
  };

  const missingCyclingFtpMessage = (activityStartTime: string): string => {
    return missingFtpMessage("Cycling", "power", activityStartTime);
  };

  const missingRunningFtpMessage = (activityStartTime: string): string => {
    return missingFtpMessage("Running", "pace", activityStartTime);
  };

  const missingSwimmingFtpMessage = (activityStartTime: string): string => {
    return missingFtpMessage("Swimming", "pace", activityStartTime);
  };

  export namespace Generic {
    export const movingTime = Stat.create<ActivityStats>(TimeSensor.DEFAULT, "Moving Time", ["stats", "movingTime"]);
    export const elapsedTime = Stat.create<ActivityStats>(TimeSensor.DEFAULT, "Elapsed Time", ["stats", "elapsedTime"]);

    export const calories = Stat.create<ActivityStats>(VoidSensor.DEFAULT, "Calories", ["stats", "calories"]);

    export const caloriesPerHour = Stat.create<ActivityStats>(VoidSensor.DEFAULT, "Calories / Hour", [
      "stats",
      "caloriesPerHour"
    ]);

    export const moveRatio = Stat.create<ActivityStats>(
      VoidSensor.DEFAULT,
      "Move Ratio",
      ["stats", "moveRatio"],
      "Moving / Elapsed time ratio",
      2
    );

    export const ascentGain = Stat.create<ActivityStats>(ElevationSensor.DEFAULT, "Ascent Gain", [
      "stats",
      "elevationGain"
    ]);
  }

  export namespace Distance {
    export const distance = Stat.create<ActivityStats>(DistanceSensor.DEFAULT, "Distance", ["stats", "distance"]);

    export namespace Running {
      export const distance = Stat.create<ActivityStats>(RunningDistanceSensor.DEFAULT, "Distance", [
        "stats",
        "distance"
      ]);
    }

    export namespace Swimming {
      export const distance = Stat.create<ActivityStats>(SwimDistanceSensor.DEFAULT, "Distance", ["stats", "distance"]);
    }
  }

  export namespace Speed {
    export const avg = Stat.create<SpeedStats>(
      SpeedSensor.DEFAULT,
      "Average",
      ["stats", "speed", "avg"],
      "Average speed"
    );

    export const max = Stat.create<SpeedStats>(SpeedSensor.DEFAULT, "Max", ["stats", "speed", "max"]);

    export const threshold = Stat.create<SpeedStats>(
      SpeedSensor.DEFAULT,
      "Threshold",
      ["stats", "speed", "best20min"],
      "Best speed held during 20 min"
    )
      .asForceDisplay()
      .setMissingMessage(emptyThreshold20MinMessage);

    export const avgPace = Stat.create<SpeedStats>(PaceSensor.DEFAULT, "Average Pace", ["stats", "pace", "avg"]);

    export const q25 = Stat.create<SpeedStats>(SpeedSensor.DEFAULT, "25% Quartile", ["stats", "speed", "lowQ"]);

    export const q50 = Stat.create<SpeedStats>(
      SpeedSensor.DEFAULT,
      "50% Quartile",
      ["stats", "speed", "median"],
      "Equals to median"
    );

    export const q75 = Stat.create<SpeedStats>(SpeedSensor.DEFAULT, "75% Quartile", ["stats", "speed", "upperQ"]);

    export const stdDeviation = Stat.create<SpeedStats>(
      SpeedSensor.DEFAULT,
      "Std Deviation σ",
      ["stats", "speed", "stdDev"],
      "Standard deviation"
    );
  }

  export namespace Pace {
    export namespace Running {
      export const avg = Stat.create<PaceStats>(
        PaceSensor.DEFAULT,
        "Average",
        ["stats", "pace", "avg"],
        "Average pace"
      );

      export const max = Stat.create<PaceStats>(PaceSensor.DEFAULT, "Fastest", ["stats", "pace", "max"]);

      export const threshold = Stat.create<PaceStats>(
        PaceSensor.DEFAULT,
        "Threshold",
        ["stats", "pace", "best20min"],
        "Best pace held during 20 min"
      )
        .asForceDisplay()
        .setMissingMessage(emptyThreshold20MinMessage);

      export const gap = Stat.create<PaceStats>(
        PaceSensor.DEFAULT,
        "Grade Adj. Pace",
        ["stats", "pace", "gapAvg"],
        "Equals your avg pace performed on a flat slope"
      );

      export const q25 = Stat.create<PaceStats>(PaceSensor.DEFAULT, "25% Quartile", ["stats", "pace", "lowQ"]);

      export const q50 = Stat.create<PaceStats>(
        PaceSensor.DEFAULT,
        "50% Quartile",
        ["stats", "pace", "median"],
        "Equals to median"
      );

      export const q75 = Stat.create<PaceStats>(PaceSensor.DEFAULT, "75% Quartile", ["stats", "pace", "upperQ"]);

      export const stdDeviation = Stat.create<PaceStats>(
        SpeedSensor.DEFAULT,
        "Std Deviation σ",
        ["stats", "speed", "stdDev"],
        "Standard deviation"
      );
    }

    export namespace Swimming {
      export const avg = Stat.create<PaceStats>(
        SwimmingPaceSensor.DEFAULT,
        "Average",
        ["stats", "pace", "avg"],
        "Average time / hundred meters or yards"
      );

      export const max = Stat.create<PaceStats>(
        SwimmingPaceSensor.DEFAULT,
        "Fastest",
        ["stats", "pace", "max"],
        "Fastest time / hundred meters or yards"
      );

      export const threshold = Stat.create<PaceStats>(
        SwimmingPaceSensor.DEFAULT,
        "Threshold",
        ["stats", "pace", "best20min"],
        "Best pace held during 20 min"
      )
        .asForceDisplay()
        .setMissingMessage(emptyThreshold20MinMessage);

      export const q25 = Stat.create<PaceStats>(
        SwimmingPaceSensor.DEFAULT,
        "25% Quartile",
        ["stats", "pace", "lowQ"],
        "Lower quartile time / hundred meters or yards"
      );

      export const q50 = Stat.create<PaceStats>(
        SwimmingPaceSensor.DEFAULT,
        "50% Quartile",
        ["stats", "pace", "median"],
        "Median time / hundred meters or yards"
      );

      export const q75 = Stat.create<PaceStats>(
        SwimmingPaceSensor.DEFAULT,
        "75% Quartile",
        ["stats", "pace", "upperQ"],
        "Upper quartile time / hundred meters or yards"
      );
    }
  }

  export namespace HeartRate {
    export const avg = Stat.create<HeartRateStats>(HeartRateSensor.DEFAULT, "Average", ["stats", "heartRate", "avg"]);

    export const max = Stat.create<HeartRateStats>(HeartRateSensor.DEFAULT, "Max", ["stats", "heartRate", "max"]);

    export const threshold = Stat.create<HeartRateStats>(
      HeartRateSensor.DEFAULT,
      "Threshold",
      ["stats", "heartRate", "best20min"],
      "Best heart rate held during 20 min (LTHR)"
    )
      .asForceDisplay()
      .setMissingMessage(emptyThreshold20MinMessage);

    export const thresholdHour = Stat.create<HeartRateStats>(
      HeartRateSensor.DEFAULT,
      "Threshold 60 min",
      ["stats", "heartRate", "best60min"],
      "Best heart rate held during 60 min"
    )
      .asForceDisplay()
      .setMissingMessage(`Empty because activity under 60 min`);

    export const hrr = Stat.create<HeartRateStats>(
      HeartRateSensor.DEFAULT,
      "HRR",
      ["stats", "heartRate", "avgReserve"],
      "Heart Rate Reserve"
    ).setUnit("%");

    export const maxHrr = Stat.create<HeartRateStats>(
      HeartRateSensor.DEFAULT,
      "Max HRR",
      ["stats", "heartRate", "maxReserve"],
      "Max Heart Rate Reserve reached"
    ).setUnit("%");

    export const q25 = Stat.create<HeartRateStats>(HeartRateSensor.DEFAULT, "25% Quartile", [
      "stats",
      "heartRate",
      "lowQ"
    ]);

    export const q50 = Stat.create<HeartRateStats>(
      HeartRateSensor.DEFAULT,
      "50% Quartile",
      ["stats", "heartRate", "median"],
      "Equals to median"
    );

    export const q75 = Stat.create<HeartRateStats>(HeartRateSensor.DEFAULT, "75% Quartile", [
      "stats",
      "heartRate",
      "upperQ"
    ]);

    export const stdDeviation = Stat.create<HeartRateStats>(HeartRateSensor.DEFAULT, "Std Deviation σ", [
      "stats",
      "heartRate",
      "stdDev"
    ]);
  }

  export namespace Power {
    export function avg(powerSensor: PowerSensor): Stat<PowerStats> {
      return Stat.create<PowerStats>(powerSensor, "Average", ["stats", "power", "avg"]);
    }

    export function avgPerKg(powerSensor: PowerSensor): Stat<PowerStats> {
      return Stat.create<PowerStats>(
        powerSensor,
        "Average /kg",
        ["stats", "power", "avgKg"],
        "Average watts / kilograms",
        2
      );
    }

    export function avgWeighted(powerSensor: PowerSensor): Stat<PowerStats> {
      return Stat.create<PowerStats>(powerSensor, "Avg NP®", ["stats", "power", "weighted"], "Avg Normalized Power®");
    }

    export function avgWeightedPerKg(powerSensor: PowerSensor): Stat<PowerStats> {
      return Stat.create<PowerStats>(
        powerSensor,
        "Avg NP® /kg",
        ["stats", "power", "weightedKg"],
        "Avg Normalized Power® / kilograms",
        2
      );
    }

    export function max(powerSensor: PowerSensor): Stat<PowerStats> {
      return Stat.create<PowerStats>(powerSensor, "Max", ["stats", "power", "max"]);
    }

    export function work(powerSensor: PowerSensor): Stat<PowerStats> {
      return Stat.create<PowerStats>(powerSensor, "Work", ["stats", "power", "work"], "Work in Kilojoules").setUnit(
        "Kj"
      );
    }

    export function threshold(powerSensor: PowerSensor): Stat<PowerStats> {
      return Stat.create<PowerStats>(
        powerSensor,
        "Threshold",
        ["stats", "power", "best20min"],
        "Best power held during 20 min"
      )
        .asForceDisplay()
        .setMissingMessage(emptyThreshold20MinMessage);
    }

    export function variabilityIndex(powerSensor: PowerSensor) {
      return Stat.create<PowerStats>(
        powerSensor,
        "VI",
        ["stats", "power", "variabilityIndex"],
        "Variability Index or activity pace (Normalized Power® / Average Power)",
        2
      ).asEmptyUnit();
    }

    export function q25(powerSensor: PowerSensor) {
      return Stat.create<PowerStats>(powerSensor, "25% Quartile", ["stats", "power", "lowQ"]);
    }

    export function q50(powerSensor: PowerSensor) {
      return Stat.create<PowerStats>(powerSensor, "50% Quartile", ["stats", "power", "median"], "Equals to median");
    }

    export function q75(powerSensor: PowerSensor) {
      return Stat.create<PowerStats>(powerSensor, "75% Quartile", ["stats", "power", "upperQ"]);
    }

    export function stdDeviation(powerSensor: PowerSensor) {
      return Stat.create<PowerStats>(powerSensor, "Std Deviation σ", ["stats", "power", "stdDev"]);
    }

    export namespace Cycling {
      export function intensity(powerSensor: PowerSensor, activityStartTime: string) {
        return Stat.create<PowerStats>(
          powerSensor,
          "IF®",
          ["stats", "power", "intensityFactor"],
          "Intensity Factor® (Normalized Power® / Functional Power Threshold)",
          2
        )
          .asEmptyUnit()
          .asForceDisplay()
          .setMissingMessage(missingCyclingFtpMessage(activityStartTime));
      }
    }
  }

  export namespace Cadence {
    export namespace Cycling {
      export const avg = Stat.create<CadenceStats>(
        CyclingCadenceSensor.DEFAULT,
        "Average",
        ["stats", "cadence", "avg"],
        "Average cadence inc. freewheeling"
      );

      export const activeAvg = Stat.create<CadenceStats>(
        CyclingCadenceSensor.DEFAULT,
        "Active Average",
        ["stats", "cadence", "avgActive"],
        "Average cadence with legs moving"
      );

      export const max = Stat.create<CadenceStats>(CyclingCadenceSensor.DEFAULT, "Max", ["stats", "cadence", "max"]);

      export const pedalingTime = Stat.create<CadenceStats>(
        TimeSensor.DEFAULT,
        "Pedaling Time",
        ["stats", "cadence", "activeTime"],
        "Active pedaling time"
      );

      export const pedalingRatio = Stat.create<CadenceStats>(
        CyclingCadenceSensor.DEFAULT,
        "Pedaling Ratio",
        ["stats", "cadence", "activeRatio"],
        "Pedaling VS Freewheel ratio",
        2
      ).asEmptyUnit();

      export const avgClimb = Stat.create<CadenceStats>(CyclingCadenceSensor.DEFAULT, "Avg Climbing", [
        "stats",
        "cadence",
        "slope",
        "up"
      ]);

      export const avgFlat = Stat.create<CadenceStats>(CyclingCadenceSensor.DEFAULT, "Avg Flat", [
        "stats",
        "cadence",
        "slope",
        "flat"
      ]);

      export const avgDown = Stat.create<CadenceStats>(CyclingCadenceSensor.DEFAULT, "Avg Downhill", [
        "stats",
        "cadence",
        "slope",
        "down"
      ]);

      export const stdDeviation = Stat.create<CadenceStats>(CyclingCadenceSensor.DEFAULT, "Std Deviation σ", [
        "stats",
        "cadence",
        "stdDev"
      ]);

      export const totalOccurrences = Stat.create<CadenceStats>(
        VoidSensor.DEFAULT,
        "Rev. Count",
        ["stats", "cadence", "cycles"],
        "Crankset revolutions count"
      ).asEmptyUnit();

      export const q25 = Stat.create<CadenceStats>(CyclingCadenceSensor.DEFAULT, "25% Quartile", [
        "stats",
        "cadence",
        "lowQ"
      ]);

      export const q50 = Stat.create<CadenceStats>(
        CyclingCadenceSensor.DEFAULT,
        "50% Quartile",
        ["stats", "cadence", "median"],
        "Equals to median"
      );

      export const q75 = Stat.create<CadenceStats>(CyclingCadenceSensor.DEFAULT, "75% Quartile", [
        "stats",
        "cadence",
        "upperQ"
      ]);

      export const avgDistPerRev = Stat.create<CadenceStats>(
        VoidSensor.DEFAULT,
        "Avg Dist. / Rev.",
        ["stats", "cadence", "distPerCycle"],
        "Average distance / crankset revolution",
        2
      ).setUnit("m");
    }

    export namespace Running {
      export const avg = Stat.create<CadenceStats>(
        RunningCadenceSensor.DEFAULT,
        "Average",
        ["stats", "cadence", "avg"],
        "Average strides inc. walking & pauses (2 legs)"
      );

      export const activeAvg = Stat.create<CadenceStats>(
        RunningCadenceSensor.DEFAULT,
        "Active Average",
        ["stats", "cadence", "avgActive"],
        "Average strides while running (2 legs)"
      );

      export const max = Stat.create<CadenceStats>(
        RunningCadenceSensor.DEFAULT,
        "Max",
        ["stats", "cadence", "max"],
        "Max strides (2 legs)"
      );

      export const avgClimb = Stat.create<CadenceStats>(
        RunningCadenceSensor.DEFAULT,
        "Avg Climbing",
        ["stats", "cadence", "slope", "up"],
        "Average strides while climbing (2 legs)"
      );

      export const avgFlat = Stat.create<CadenceStats>(
        RunningCadenceSensor.DEFAULT,
        "Avg Flat",
        ["stats", "cadence", "slope", "flat"],
        "Average strides on flat (2 legs)"
      );

      export const avgDown = Stat.create<CadenceStats>(
        RunningCadenceSensor.DEFAULT,
        "Avg Downhill",
        ["stats", "cadence", "slope", "down"],
        "Average strides on downhills (2 legs)"
      );

      export const stdDeviation = Stat.create<CadenceStats>(
        RunningCadenceSensor.DEFAULT,
        "Std Deviation σ",
        ["stats", "cadence", "stdDev"],
        "Standard deviation (2 legs)"
      );

      export const totalOccurrences = Stat.create<CadenceStats>(
        VoidSensor.DEFAULT,
        "Strides Count",
        ["stats", "cadence", "cycles"],
        "Single strides count"
      ).asEmptyUnit();

      export const q25 = Stat.create<CadenceStats>(
        RunningCadenceSensor.DEFAULT,
        "25% Quartile",
        ["stats", "cadence", "lowQ"],
        "25% quartile (2 legs)"
      );

      export const q50 = Stat.create<CadenceStats>(
        RunningCadenceSensor.DEFAULT,
        "50% Quartile",
        ["stats", "cadence", "median"],
        "50% quartile or median (2 legs)"
      );

      export const q75 = Stat.create<CadenceStats>(
        RunningCadenceSensor.DEFAULT,
        "75% Quartile",
        ["stats", "cadence", "upperQ"],
        "75% quartile (2 legs)"
      );

      export const avgDistPerStride = Stat.create<CadenceStats>(
        VoidSensor.DEFAULT,
        "Avg Dist. / Stride",
        ["stats", "cadence", "distPerCycle"],
        "Average distance per single stride",
        2
      ).setUnit("m");
    }

    export namespace Swimming {
      export const activeAvg = Stat.create<CadenceStats>(
        SwimmingCadenceSensor.DEFAULT,
        "Average",
        ["stats", "cadence", "avgActive"],
        "Average strokes per minutes"
      );

      export const avg = Stat.create<CadenceStats>(
        SwimmingCadenceSensor.DEFAULT,
        "Average",
        ["stats", "cadence", "avg"],
        "Average strokes per minutes inc. pauses"
      );

      export const max = Stat.create<CadenceStats>(
        SwimmingCadenceSensor.DEFAULT,
        "Max",
        ["stats", "cadence", "max"],
        "Max strokes"
      );

      export const stdDeviation = Stat.create<CadenceStats>(
        SwimmingCadenceSensor.DEFAULT,
        "Std Deviation σ",
        ["stats", "cadence", "stdDev"],
        "Standard deviation"
      );

      export const totalOccurrences = Stat.create<CadenceStats>(
        VoidSensor.DEFAULT,
        "Strokes Count",
        ["stats", "cadence", "cycles"],
        "Strokes count"
      ).asEmptyUnit();

      export const q25 = Stat.create<CadenceStats>(
        SwimmingCadenceSensor.DEFAULT,
        "25% Quartile",
        ["stats", "cadence", "lowQ"],
        "25% quartile"
      );

      export const q50 = Stat.create<CadenceStats>(
        SwimmingCadenceSensor.DEFAULT,
        "50% Quartile",
        ["stats", "cadence", "median"],
        "50% quartile or median"
      );

      export const q75 = Stat.create<CadenceStats>(
        SwimmingCadenceSensor.DEFAULT,
        "75% Quartile",
        ["stats", "cadence", "upperQ"],
        "75% quartile"
      );

      export const avgDistPerStroke = Stat.create<CadenceStats>(
        VoidSensor.DEFAULT,
        "Avg Dist. / Stroke",
        ["stats", "cadence", "distPerCycle"],
        "Average distance per stroke",
        2
      ).setUnit("m");
    }
  }

  export namespace Elevation {
    export const ascentGain = Stat.create<ElevationStats>(ElevationSensor.DEFAULT, "Ascent Gain", [
      "stats",
      "elevation",
      "ascent"
    ]);

    export const descentGain = Stat.create<ElevationStats>(ElevationSensor.DEFAULT, "Descent Gain", [
      "stats",
      "elevation",
      "descent"
    ]);

    export const max = Stat.create<ElevationStats>(ElevationSensor.DEFAULT, "Max", ["stats", "elevation", "max"]);

    export const min = Stat.create<ElevationStats>(ElevationSensor.DEFAULT, "Min", ["stats", "elevation", "min"]);

    export const avgVertSpeed = Stat.create<ElevationStats>(
      ElevationAscentSpeedSensor.DEFAULT,
      "Avg Ascend Speed",
      ["stats", "elevation", "ascentSpeed"],
      "Average vertical climbed meters or feet / hour"
    );

    export const q25 = Stat.create<ElevationStats>(ElevationSensor.DEFAULT, "25% Quartile", [
      "stats",
      "elevation",
      "lowQ"
    ]);

    export const q50 = Stat.create<ElevationStats>(
      ElevationSensor.DEFAULT,
      "50% Quartile",
      ["stats", "elevation", "median"],
      "Equals to median"
    );

    export const q75 = Stat.create<ElevationStats>(ElevationSensor.DEFAULT, "75% Quartile", [
      "stats",
      "elevation",
      "upperQ"
    ]);
  }

  export namespace Grade {
    export const profile = Stat.create<GradeStats>(GradeSensor.DEFAULT, "Profile", [
      "stats",
      "grade",
      "slopeProfile"
    ]).asEmptyUnit();

    export const avg = Stat.create<GradeStats>(GradeSensor.DEFAULT, "Average", ["stats", "grade", "avg"]);

    export const max = Stat.create<GradeStats>(GradeSensor.DEFAULT, "Max", ["stats", "grade", "max"]);

    export const min = Stat.create<GradeStats>(GradeSensor.DEFAULT, "Min", ["stats", "grade", "min"]);

    export const timeUp = Stat.create<GradeStats>(
      TimeSensor.DEFAULT,
      "Climbing Time",
      ["stats", "grade", "slopeTime", "up"],
      `Climbing time over ${ActivityComputer.GRADE_CLIMBING_LIMIT}% grade`
    );

    export const timeFlat = Stat.create<GradeStats>(
      TimeSensor.DEFAULT,
      "Flat Time",
      ["stats", "grade", "slopeTime", "flat"],
      `Time on flat between ${ActivityComputer.GRADE_DOWNHILL_LIMIT}% and ${ActivityComputer.GRADE_CLIMBING_LIMIT}% grade`
    );

    export const timeDown = Stat.create<GradeStats>(
      TimeSensor.DEFAULT,
      "Downhill Time",
      ["stats", "grade", "slopeTime", "down"],
      `Time in downhills under ${ActivityComputer.GRADE_DOWNHILL_LIMIT}% grade`
    );

    export const distUp = Stat.create<GradeStats>(
      DistanceSensor.DEFAULT,
      "Climbing Distance",
      ["stats", "grade", "slopeDistance", "up"],
      `Climbing distance over ${ActivityComputer.GRADE_CLIMBING_LIMIT}% grade`
    );

    export const distFlat = Stat.create<GradeStats>(
      DistanceSensor.DEFAULT,
      "Flat Distance",
      ["stats", "grade", "slopeDistance", "flat"],
      `Distance on flat between ${ActivityComputer.GRADE_DOWNHILL_LIMIT}% and ${ActivityComputer.GRADE_CLIMBING_LIMIT}% grade`
    );

    export const distDown = Stat.create<GradeStats>(
      DistanceSensor.DEFAULT,
      "Downhill Distance",
      ["stats", "grade", "slopeDistance", "down"],
      `Distance in downhills under ${ActivityComputer.GRADE_DOWNHILL_LIMIT}% grade`
    );

    export const speedUp = Stat.create<GradeStats>(
      SpeedSensor.DEFAULT,
      "Climbing Speed",
      ["stats", "grade", "slopeSpeed", "up"],
      `Climbing speed over ${ActivityComputer.GRADE_CLIMBING_LIMIT}% grade`
    );

    export const speedFlat = Stat.create<GradeStats>(
      SpeedSensor.DEFAULT,
      "Flat Speed",
      ["stats", "grade", "slopeSpeed", "flat"],
      `Speed on flat between ${ActivityComputer.GRADE_DOWNHILL_LIMIT}% and ${ActivityComputer.GRADE_CLIMBING_LIMIT}% grade`
    );

    export const speedDown = Stat.create<GradeStats>(
      SpeedSensor.DEFAULT,
      "Downhill Speed",
      ["stats", "grade", "slopeSpeed", "down"],
      `Speed in downhills under ${ActivityComputer.GRADE_DOWNHILL_LIMIT}% grade`
    );

    export const cadenceUp = Stat.create<GradeStats>(
      CyclingCadenceSensor.DEFAULT,
      "Climbing Cadence",
      ["stats", "grade", "slopeCadence", "up"],
      `Climbing cadence over ${ActivityComputer.GRADE_CLIMBING_LIMIT}% grade`
    );

    export const cadenceFlat = Stat.create<GradeStats>(
      CyclingCadenceSensor.DEFAULT,
      "Flat Cadence",
      ["stats", "grade", "slopeCadence", "flat"],
      `Cadence on flat between ${ActivityComputer.GRADE_DOWNHILL_LIMIT}% and ${ActivityComputer.GRADE_CLIMBING_LIMIT}% grade`
    );

    export const cadenceDown = Stat.create<GradeStats>(
      CyclingCadenceSensor.DEFAULT,
      "Downhill Cadence",
      ["stats", "grade", "slopeCadence", "down"],
      `Cadence in downhills under ${ActivityComputer.GRADE_DOWNHILL_LIMIT}% grade`
    );

    export const q25 = Stat.create<GradeStats>(
      GradeSensor.DEFAULT,
      "25% Quartile",
      ["stats", "grade", "lowQ"],
      "25% quartile"
    );

    export const q50 = Stat.create<GradeStats>(
      GradeSensor.DEFAULT,
      "50% Quartile",
      ["stats", "grade", "median"],
      "50% quartile or median"
    );

    export const q75 = Stat.create<GradeStats>(
      GradeSensor.DEFAULT,
      "75% Quartile",
      ["stats", "grade", "upperQ"],
      "75% quartile"
    );

    export const stdDeviation = Stat.create<GradeStats>(
      GradeSensor.DEFAULT,
      "Std Deviation σ",
      ["stats", "grade", "stdDev"],
      "Standard deviation"
    );

    export namespace Running {
      export const paceUp = Stat.create<GradeStats>(
        PaceSensor.DEFAULT,
        "Climbing Pace",
        ["stats", "grade", "slopePace", "up"],
        `Climbing pace over ${ActivityComputer.GRADE_CLIMBING_LIMIT}% grade`
      );

      export const paceFlat = Stat.create<GradeStats>(
        PaceSensor.DEFAULT,
        "Flat Pace",
        ["stats", "grade", "slopePace", "flat"],
        `Pace on flat between ${ActivityComputer.GRADE_DOWNHILL_LIMIT}% and ${ActivityComputer.GRADE_CLIMBING_LIMIT}% grade`
      );

      export const paceDown = Stat.create<GradeStats>(
        PaceSensor.DEFAULT,
        "Downhill Pace",
        ["stats", "grade", "slopePace", "down"],
        `Pace in downhills under ${ActivityComputer.GRADE_DOWNHILL_LIMIT}% grade`
      );

      export const cadenceUp = Stat.create<GradeStats>(
        RunningCadenceSensor.DEFAULT,
        "Climbing Cadence",
        ["stats", "grade", "slopeCadence", "up"],
        `Climbing cadence over ${ActivityComputer.GRADE_CLIMBING_LIMIT}% grade`
      );

      export const cadenceFlat = Stat.create<GradeStats>(
        RunningCadenceSensor.DEFAULT,
        "Flat Cadence",
        ["stats", "grade", "slopeCadence", "flat"],
        `Cadence on flat between ${ActivityComputer.GRADE_DOWNHILL_LIMIT}% and ${ActivityComputer.GRADE_CLIMBING_LIMIT}% grade`
      );

      export const cadenceDown = Stat.create<GradeStats>(
        RunningCadenceSensor.DEFAULT,
        "Downhill Cadence",
        ["stats", "grade", "slopeCadence", "down"],
        `Cadence in downhills under ${ActivityComputer.GRADE_DOWNHILL_LIMIT}% grade`
      );
    }
  }

  export namespace Scores {
    export const efficiency = Stat.create<Scores>(
      VoidSensor.DEFAULT,
      "Efficiency Factor",
      ["stats", "scores", "efficiency"],
      'Efficiency Factor is your "Normalized Power® / Average Heart rate" ("Input Power / Output HR"). Higher value means better aerobic fit.',
      2
    ).asEmptyUnit();

    export const powerHr = Stat.create<Scores>(
      VoidSensor.DEFAULT,
      "Power/Hr",
      ["stats", "scores", "powerHr"],
      "Avg power over avg heart rate. A higher value means you produced more power for a given heart rate.",
      2
    ).asEmptyUnit();

    export namespace Stress {
      const trainingEffectLabel = (value: number) => {
        if (value <= 0.9) {
          return "No Effect";
        } else if (value <= 1.9) {
          return "Minor Effect";
        } else if (value <= 2.9) {
          return "Maintaining";
        } else if (value <= 3.9) {
          return "Improving";
        } else if (value <= 4.9) {
          return "Highly Improving";
        } else if (value >= 5) {
          return "Overloading";
        } else {
          return null;
        }
      };

      export const hrss = Stat.create<StressScores>(
        HeartRateSensor.DEFAULT,
        "HRSS",
        ["stats", "scores", "stress", "hrss"],
        "Heart Rate Stress Score"
      ).asEmptyUnit();

      export const hrssPerHour = Stat.create<StressScores>(
        HeartRateSensor.DEFAULT,
        "HRSS / Hour",
        ["stats", "scores", "stress", "hrssPerHour"],
        "Heart Rate Stress Score / Hour"
      ).asEmptyUnit();

      export const trimp = Stat.create<StressScores>(
        HeartRateSensor.DEFAULT,
        "TRIMP",
        ["stats", "scores", "stress", "trimp"],
        "TRaining IMPulse"
      ).asEmptyUnit();

      export const trimpPerHour = Stat.create<StressScores>(
        HeartRateSensor.DEFAULT,
        "TRIMP / Hour",
        ["stats", "scores", "stress", "trimpPerHour"],
        "TRaining IMPulse / Hour"
      ).asEmptyUnit();

      export const aerobicTrainingEffect = Stat.create<StressScores & TrainingEffect>(
        VoidSensor.DEFAULT,
        "Aerobic TE.",
        ["stats", "scores", "stress", "trainingEffect", "aerobic"],
        "Aerobic Training Effect",
        1,
        (te: number) => (Number.isFinite(te) ? `= ${trainingEffectLabel(te)}` : null)
      ).asEmptyUnit();

      export const anaerobicTrainingEffect = Stat.create<StressScores & TrainingEffect>(
        VoidSensor.DEFAULT,
        "Anaerobic TE.",
        ["stats", "scores", "stress", "trainingEffect", "anaerobic"],
        "Anaerobic Training Effect",
        1,
        (te: number) => (Number.isFinite(te) ? `= ${trainingEffectLabel(te)}` : null)
      ).asEmptyUnit();

      export namespace Cycling {
        export function pss(powerSensor: PowerSensor, activityStartTime: string): Stat<StressScores> {
          return Stat.create<StressScores>(
            powerSensor,
            "PSS",
            ["stats", "scores", "stress", "pss"],
            "Power Stress Score"
          )
            .asEmptyUnit()
            .asForceDisplay()
            .setMissingMessage(missingCyclingFtpMessage(activityStartTime));
        }

        export function pssPerHour(powerSensor: PowerSensor, activityStartTime: string) {
          return Stat.create<StressScores>(
            powerSensor,
            "PSS / Hour",
            ["stats", "scores", "stress", "pssPerHour"],
            "Power Stress Score / Hour"
          )
            .asEmptyUnit()
            .asForceDisplay()
            .setMissingMessage(missingCyclingFtpMessage(activityStartTime));
        }
      }

      export namespace Running {
        export function runningStressScore(activityStartTime: string): Stat<StressScores> {
          return Stat.create<StressScores>(
            VoidSensor.DEFAULT,
            "RSS",
            ["stats", "scores", "stress", "rss"],
            "Running Stress Score"
          )
            .asForceDisplay()
            .setMissingMessage(missingRunningFtpMessage(activityStartTime));
        }

        export function runningStressScorePerHour(activityStartTime: string): Stat<StressScores> {
          return Stat.create<StressScores>(
            VoidSensor.DEFAULT,
            "RSS / Hour",
            ["stats", "scores", "stress", "rssPerHour"],
            "Running Stress Score / Hour"
          )
            .asForceDisplay()
            .setMissingMessage(missingRunningFtpMessage(activityStartTime));
        }
      }

      export namespace Swimming {
        export function swimStressScore(activityStartTime: string): Stat<StressScores> {
          return Stat.create<StressScores>(
            VoidSensor.DEFAULT,
            "SSS",
            ["stats", "scores", "stress", "sss"],
            "Swimming Stress Score"
          )
            .asForceDisplay()
            .setMissingMessage(missingSwimmingFtpMessage(activityStartTime));
        }

        export function swimStressScorePerHour(activityStartTime: string): Stat<StressScores> {
          return Stat.create<StressScores>(
            VoidSensor.DEFAULT,
            "SSS / Hour",
            ["stats", "scores", "stress", "sssPerHour"],
            "Swimming Stress Score / Hour"
          )
            .asForceDisplay()
            .setMissingMessage(missingSwimmingFtpMessage(activityStartTime));
        }
      }
    }

    export namespace Cycling {}

    export namespace Running {
      export const runningRating = Stat.create<Scores>(
        VoidSensor.DEFAULT,
        "Running Rating",
        ["stats", "scores", "runningRating"],
        '"Running Rating" is an equivalent of "Running Index" from Polar',
        1
      )
        .asForceDisplay()
        .setMissingMessage("Activity don't match requirements to compute Running Rating");
    }

    export namespace Swimming {
      export const swolf25 = Stat.create<Scores>(
        VoidSensor.DEFAULT,
        "SWOLF 25m",
        ["stats", "scores", "swolf", "25"],
        "Swimming efficiency normalized to a 25 meters pool"
      );

      export const swolf50 = Stat.create<Scores>(
        VoidSensor.DEFAULT,
        "SWOLF 50m",
        ["stats", "scores", "swolf", "50"],
        "Swimming efficiency normalized to a 50 meters pool"
      );
    }
  }

  export namespace Dynamics {
    export namespace Cycling {
      export const balanceLeft = Stat.create<DynamicsStats & CyclingDynamicsStats & LeftRightPercent>(
        VoidSensor.DEFAULT,
        "Left Balance",
        ["stats", "dynamics", "cycling", "balance", "left"],
        null,
        2
      ).setUnit("%");

      export const balanceRight = Stat.create<DynamicsStats & CyclingDynamicsStats & LeftRightPercent>(
        VoidSensor.DEFAULT,
        "Right Balance",
        ["stats", "dynamics", "cycling", "balance", "right"],
        null,
        2
      ).setUnit("%");

      export const pedalSmoothnessLeft = Stat.create<DynamicsStats & CyclingDynamicsStats & LeftRightPercent>(
        VoidSensor.DEFAULT,
        "Left Pedal Smth.",
        ["stats", "dynamics", "cycling", "pedalSmoothness", "left"],
        "Left Pedaling Smoothness",
        1
      ).setUnit("%");

      export const pedalSmoothnessRight = Stat.create<DynamicsStats & CyclingDynamicsStats & LeftRightPercent>(
        VoidSensor.DEFAULT,
        "Right Pedal Smth.",
        ["stats", "dynamics", "cycling", "pedalSmoothness", "right"],
        "Right Pedaling Smoothness",
        1
      ).setUnit("%");

      export const torqueEffectivenessLeft = Stat.create<DynamicsStats & CyclingDynamicsStats & LeftRightPercent>(
        VoidSensor.DEFAULT,
        "Left Torque Eff.",
        ["stats", "dynamics", "cycling", "torqueEffectiveness", "left"],
        "Left Torque Effectiveness",
        1
      ).setUnit("%");

      export const torqueEffectivenessRight = Stat.create<DynamicsStats & CyclingDynamicsStats & LeftRightPercent>(
        VoidSensor.DEFAULT,
        "Right Torque Eff.",
        ["stats", "dynamics", "cycling", "torqueEffectiveness", "right"],
        "Right Torque Effectiveness",
        1
      ).setUnit("%");

      export const standingTime = Stat.create<DynamicsStats & CyclingDynamicsStats>(
        TimeSensor.DEFAULT,
        "Standing Time",
        ["stats", "dynamics", "cycling", "standingTime"]
      );
      export const seatedTime = Stat.create<DynamicsStats & CyclingDynamicsStats>(TimeSensor.DEFAULT, "Seated Time", [
        "stats",
        "dynamics",
        "cycling",
        "seatedTime"
      ]);
    }

    export namespace Running {
      export const stanceTimeBalanceLeft = Stat.create<DynamicsStats & RunningDynamicsStats & LeftRightPercent>(
        VoidSensor.DEFAULT,
        "Left GCT Balance",
        ["stats", "dynamics", "running", "stanceTimeBalance", "left"],
        'Left "Ground Contact Time" balance',
        1
      ).setUnit("%");

      export const stanceTimeBalanceRight = Stat.create<DynamicsStats & RunningDynamicsStats & LeftRightPercent>(
        VoidSensor.DEFAULT,
        "Right GCT Balance",
        ["stats", "dynamics", "running", "stanceTimeBalance", "right"],
        'Right "Ground Contact Time" balance',
        1
      ).setUnit("%");

      export const stanceTime = Stat.create<DynamicsStats & RunningDynamicsStats>(
        VoidSensor.DEFAULT,
        "Avg Stance Time",
        ["stats", "dynamics", "running", "stanceTime"],
        'Average "Ground Contact Time" spent on the ground'
      ).setUnit("ms");

      export const verticalOscillation = Stat.create<DynamicsStats & RunningDynamicsStats>(
        VoidSensor.DEFAULT,
        "Avg Vert. Oscillation",
        ["stats", "dynamics", "running", "verticalOscillation"],
        "Average vertical motion of your torso measured in centimeters for each step",
        1
      )
        .setFactor(100) // From meters to centimeters
        .setUnit("cm");

      export const verticalRatio = Stat.create<DynamicsStats & RunningDynamicsStats>(
        VoidSensor.DEFAULT,
        "Avg Vert. Ratio",
        ["stats", "dynamics", "running", "verticalRatio"],
        "Ratio of your vertical oscillation over your stride length. A lower number indicates a better running form. (Avg Vertical Ratio does not include zeros from time spent standing)",
        1
      ).setUnit("%");

      export const avgStrideLength = Stat.create<DynamicsStats & RunningDynamicsStats>(
        VoidSensor.DEFAULT,
        "Avg Stride Length",
        ["stats", "dynamics", "running", "avgStrideLength"],
        "Average length of strides from one footfall to the next",
        2
      ).setUnit("m");
    }
  }
}
