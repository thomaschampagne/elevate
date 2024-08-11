/* eslint-disable max-len */
/* eslint-disable @typescript-eslint/no-empty-interface */
import _ from "lodash";
import moment from "moment";
import {
  Activity,
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
  SlopeStats,
  SpeedStats,
  StressScores,
  TrainingEffect
} from "@elevate/shared/models/sync/activity.model";
import { Constant } from "@elevate/shared/constants/constant";
import { Time } from "@elevate/shared/tools/time";
import { BuildTarget } from "@elevate/shared/enums/build-target.enum";

type StatPath = (
  | keyof Activity
  | keyof ActivityStats
  | keyof PowerStats
  | keyof DynamicsStats
  | keyof CyclingDynamicsStats
  | keyof RunningDynamicsStats
  | keyof LeftRightPercent
  | keyof HeartRateStats
  | keyof SpeedStats
  | keyof PaceStats
  | keyof CadenceStats
  | keyof GradeStats
  | keyof ElevationStats
  | keyof Scores
  | keyof StressScores
  | keyof TrainingEffect
  | keyof SlopeStats
  | string
)[];

export namespace ActivityColumns {
  export interface SpecificUnits {}

  export class SystemUnits implements SpecificUnits {
    public metric: string;
    public imperial: string;

    constructor(metric: string, imperial: string) {
      this.metric = metric;
      this.imperial = imperial;
    }
  }

  export class CadenceUnits implements SpecificUnits {
    constructor(public cycling: string, public running: string, public swimming: string) {}
  }

  export enum ColumnType {
    DATE,
    TEXT,
    NUMBER,
    ATHLETE_SETTINGS,
    ACTIVITY_LINK,
    ACTIVITY_DELETE
  }

  /**
   * Column attributes base
   */
  export abstract class Column {
    public id: string;
    public path: StatPath;
    public header: string;
    public category: string;
    public description: string;
    public buildTarget: BuildTarget;

    public width = "115px"; // Default column width
    public isDefault = false; // Column is not default

    public abstract type: ColumnType;
    public abstract print: (...args: any[]) => string;

    protected constructor(category: string, path: StatPath, header?: string, description?: string) {
      this.path = path;
      this.id = this.path.join(".");
      this.category = category;
      this.header = header ? header : _.upperFirst(_.last(this.path) as string);
      this.description = description;
    }

    public setHeader(header: string): Column {
      this.header = header;
      return this;
    }

    public setDescription(description: string): Column {
      this.description = description;
      return this;
    }

    public setWidth(width: string): Column {
      this.width = width;
      return this;
    }

    public setDefault(value: boolean): Column {
      this.isDefault = value;
      return this;
    }

    public setBuildTarget(value: BuildTarget): Column {
      this.buildTarget = value;
      return this;
    }
  }

  /**
   * Text based column
   */
  export class TextColumn extends Column {
    public type: ColumnType = ColumnType.TEXT;
    public print: (activity: Activity, path?: string) => string;

    constructor(
      category: string,
      path: StatPath,
      print?: (activity: Activity, path?: string) => string,
      header?: string,
      description?: string
    ) {
      super(category, path, header, description);
      this.print = print ? print : Print.field;
    }
  }

  /**
   * Date based column
   */
  export class DateColumn extends TextColumn {
    public type: ColumnType = ColumnType.DATE;

    constructor(category: string, path: StatPath, header?: string, description?: string) {
      super(category, path, Print.date, header, description);
    }
  }

  /**
   * Link based column
   */
  export class ActivityLinkColumn extends TextColumn {
    public type: ColumnType = ColumnType.ACTIVITY_LINK;

    constructor(
      category: string,
      path: StatPath,
      print?: (activity: Activity, path?: string) => string,
      header?: string,
      description?: string
    ) {
      super(category, path, print, header, description);
    }
  }

  /**
   * Settings based column
   */
  export class AthleteSettingsColumn extends TextColumn {
    public type: ColumnType = ColumnType.ATHLETE_SETTINGS;

    constructor(category: string) {
      super(
        category,
        ["athleteSettings"],
        null,
        "Athlete Settings",
        "Display athlete settings which have been used to compute stats that day"
      );
    }
  }

  /**
   * Delete based column
   */
  export class ActivityDeleteColumn extends TextColumn {
    public type: ColumnType = ColumnType.ACTIVITY_DELETE;

    constructor(category: string) {
      super(category, ["deleteActivity"], null, "Delete");
    }
  }

  /**
   * Number based column
   */
  export class NumberColumn extends Column {
    public type: ColumnType = ColumnType.NUMBER;
    public print: (
      activity: Activity,
      units: string | SpecificUnits,
      precision: number,
      factor: number,
      isImperial: boolean,
      imperialFactor: number,
      path?: StatPath
    ) => string;
    public units: string | SpecificUnits;
    public precision: number;
    public factor: number;
    public imperialFactor: number;

    constructor(
      category: string,
      path: StatPath,
      units?: string | SpecificUnits,
      header?: string,
      print?: (
        activity: Activity,
        units: string | SpecificUnits,
        precision: number,
        factor: number,
        isImperial: boolean,
        imperialFactor: number,
        path?: StatPath
      ) => string,
      precision?: number,
      factor?: number,
      imperialFactor?: number,
      description?: string
    ) {
      super(category, path, header, description);
      this.print = print ? print : Print.number;
      this.units = units ? units : null;
      this.precision = _.isNumber(precision) ? precision : 0;
      this.factor = _.isNumber(factor) ? factor : 1;
      this.imperialFactor = _.isNumber(imperialFactor) ? imperialFactor : 1;
    }
  }

  /**
   *
   */
  export class Category {
    public static readonly COMMON: string = "Common";
    public static readonly SPEED: string = "Speed";
    public static readonly PACE: string = "Pace";
    public static readonly ELEVATION: string = "Elevation";
    public static readonly HEART_RATE: string = "Heart rate";
    public static readonly CADENCE: string = "Cadence";
    public static readonly POWER: string = "Power";
    public static readonly CYCLING_DYNAMICS: string = "Cycling Dynamics";
    public static readonly RUNNING_DYNAMICS: string = "Running Dynamics";
    public static readonly GRADE: string = "Grade";
    public static readonly OTHERS: string = "Others";
    // public static readonly STRESS_SCORES: string = "Stress Scores";

    public label: string;
    public columns: Column[];

    constructor(categoryLabel: string, columns: Column[]) {
      this.label = categoryLabel;
      this.columns = columns;
    }
  }

  /**
   *
   */
  class Print {
    public static readonly NO_DATA: string = "-";

    public static number(
      activity: Activity,
      units: string | SpecificUnits,
      precision: number,
      factor: number,
      isImperial: boolean,
      imperialFactor: number,
      path?: StatPath
    ): string {
      const value = Print.getConvertValueAtPath(path, activity, precision, factor, isImperial, imperialFactor);

      if (units && units instanceof SystemUnits) {
        units = isImperial ? units.imperial : units.metric;
      }

      if (units && units instanceof CadenceUnits) {
        if (Activity.isRun(activity.type)) {
          units = units.running;
        } else if (Activity.isSwim(activity.type)) {
          units = units.swimming;
        } else if (Activity.isRide(activity.type, true)) {
          units = units.cycling;
        } else {
          units = "rpm";
        }
      }

      return _.isNumber(value) && !_.isNaN(value) ? (units ? value + " " + units : `${value}`) : Print.NO_DATA;
    }

    public static pace(
      activity: Activity,
      units: string | SpecificUnits,
      precision: number,
      factor: number,
      isImperial: boolean,
      imperialFactor: number,
      path?: StatPath
    ): string {
      const value = Print.getConvertValueAtPath(path, activity, precision, factor, isImperial, imperialFactor);

      if (units && units instanceof SystemUnits) {
        units = isImperial ? units.imperial : units.metric;
      }

      return Number.isFinite(value) ? Time.secToMilitary(value) + (units ? " " + units : "") : Print.NO_DATA;
    }

    public static time(
      activity: Activity,
      units: string | SpecificUnits,
      precision: number,
      factor?: number,
      isImperial?: boolean,
      imperialFactor?: number,
      path?: StatPath
    ): string {
      const value = Print.getConvertValueAtPath(path, activity, precision, factor, isImperial, imperialFactor);
      return _.isNumber(value) && !_.isNaN(value) ? Time.secToMilitary(value) : Print.NO_DATA;
    }

    public static boolean(activity: Activity, path: string): string {
      let value: any = _.get(activity as any, path);

      if (_.isArray(value)) {
        value = !!(value as any[]).length;
      }

      return value ? "Yes" : "No";
    }

    public static field(activity: Activity, path: string): string {
      return _.get(activity, path) || Print.NO_DATA;
    }

    public static count(
      activity: Activity,
      units: string | SpecificUnits,
      precision: number,
      factor?: number,
      isImperial?: boolean,
      imperialFactor?: number,
      path?: StatPath
    ): string {
      let count = Print.NO_DATA;
      const property = _.get(activity, path);

      if (property?.length > 0) {
        count = property?.length;
      }

      return `${count}`;
    }

    public static date(activity: Activity, path?: string): string {
      const value = Print.getConvertValueAtPath(path, activity);
      return value ? `${moment(value).format("ddd, MMM DD, YYYY")}` : null;
    }

    private static getConvertValueAtPath(
      path: string | string[],
      activity: Activity,
      precision: number = 0,
      factor?: number,
      isImperial?: boolean,
      imperialFactor?: number
    ): number {
      let value = null;

      if (path) {
        value = _.get(activity, path);
      }

      if (_.isNumber(value)) {
        if (_.isNumber(factor)) {
          value = value * factor;
        }

        if (isImperial === true && _.isNumber(imperialFactor)) {
          value = value * imperialFactor;
        }

        if (_.isNumber(precision)) {
          value = _.round(value, precision);
        }
      }

      return value;
    }
  }

  /**
   *
   */
  export class Definition {
    public static readonly LONG_DISTANCE_SYSTEM_UNITS: SystemUnits = new SystemUnits("km", "mi");
    public static readonly LONG_PACE_SYSTEM_UNITS: SystemUnits = new SystemUnits("/km", "/mi");
    public static readonly SHORT_DISTANCE_SYSTEM_UNITS: SystemUnits = new SystemUnits("m", "ft");
    public static readonly ELEVATION_SYSTEM_UNITS: SystemUnits = new SystemUnits("m", "ft");
    public static readonly VERTICAL_ASCENT_SYSTEM_UNITS: SystemUnits = new SystemUnits("vm/h", "vft/h");
    public static readonly SPEED_SYSTEM_UNITS: SystemUnits = new SystemUnits("kph", "mph");
    public static readonly CADENCE_UNITS: CadenceUnits = new CadenceUnits("rpm", "spm", "spm");
    public static readonly GRADE_UNITS = "%";

    public static readonly ALL: Column[] = [
      /**
       * Common
       */
      new DateColumn(Category.COMMON, ["startTime"], "Date").setWidth("150px").setDefault(true),
      new ActivityLinkColumn(Category.COMMON, ["name"]).setWidth("285px").setDefault(true),
      new TextColumn(Category.COMMON, ["type"]).setDefault(true),
      new NumberColumn(Category.COMMON, ["stats", "movingTime"], null, "Moving Time", Print.time).setDefault(true),
      new NumberColumn(Category.COMMON, ["stats", "elapsedTime"], null, "Total Time", Print.time),
      new NumberColumn(
        Category.COMMON,
        ["stats", "distance"],
        Definition.LONG_DISTANCE_SYSTEM_UNITS,
        "Distance",
        Print.number,
        1,
        0.001,
        Constant.KM_TO_MILE_FACTOR
      ).setDefault(true),
      new NumberColumn(
        Category.COMMON,
        ["stats", "elevationGain"],
        Definition.ELEVATION_SYSTEM_UNITS,
        "Elevation Gain",
        Print.number,
        1,
        1,
        Constant.METER_TO_FEET_FACTOR
      ).setDefault(true),
      new NumberColumn(
        Category.COMMON,
        ["stats", "speed", "avg"],
        Definition.SPEED_SYSTEM_UNITS,
        "Avg Speed",
        Print.number,
        1,
        1,
        Constant.KM_TO_MILE_FACTOR
      ).setDefault(true),
      new NumberColumn(
        Category.COMMON,
        ["stats", "pace", "avg"],
        Definition.LONG_PACE_SYSTEM_UNITS,
        "Avg Pace",
        Print.pace,
        null,
        null,
        1 / Constant.KM_TO_MILE_FACTOR
      ).setDefault(true),
      new NumberColumn(
        Category.COMMON,
        ["stats", "scores", "runningRating"],
        null,
        "Running Rating",
        Print.number,
        1
      ).setDescription('"Running Rating" is an equivalent of "Running Index" from Polar'),
      new NumberColumn(
        Category.COMMON,
        ["stats", "scores", "efficiency"],
        null,
        "Efficiency Factor",
        Print.number,
        2
      ).setDescription(
        'Efficiency Factor (EF) is your "Normalized Power® (Input)/ Average Heart rate (Output)". Higher value means better aerobic fit.'
      ),
      new NumberColumn(
        Category.COMMON,
        ["stats", "scores", "powerHr"],
        null,
        "Power/Hr",
        Print.number,
        2
      ).setDescription(
        "Avg power over avg heart rate. A higher value means you produced more power for a given heart rate."
      ),
      new NumberColumn(Category.COMMON, ["stats", "calories"], null, "Calories", Print.number),
      new NumberColumn(Category.COMMON, ["stats", "caloriesPerHour"], null, "Calories / Hour", Print.number),
      new NumberColumn(Category.COMMON, ["stats", "moveRatio"], null, "Move Ratio", Print.number, 2),
      new NumberColumn(
        Category.COMMON,
        ["stats", "grade", "slopeTime", "up"],
        Definition.GRADE_UNITS,
        "Climbing Time",
        Print.time
      ),
      new NumberColumn(
        Category.COMMON,
        ["stats", "grade", "slopeTime", "flat"],
        Definition.GRADE_UNITS,
        "Flat Time",
        Print.time
      ),
      new NumberColumn(
        Category.COMMON,
        ["stats", "grade", "slopeTime", "down"],
        Definition.GRADE_UNITS,
        "Downhill Time",
        Print.time
      ),
      new NumberColumn(
        Category.COMMON,
        ["stats", "grade", "slopeDistance", "up"],
        Definition.LONG_DISTANCE_SYSTEM_UNITS,
        "Climbing Distance",
        Print.number,
        1,
        0.001,
        Constant.KM_TO_MILE_FACTOR
      ),
      new NumberColumn(
        Category.COMMON,
        ["stats", "grade", "slopeDistance", "flat"],
        Definition.LONG_DISTANCE_SYSTEM_UNITS,
        "Flat Distance",
        Print.number,
        1,
        0.001,
        Constant.KM_TO_MILE_FACTOR
      ),
      new NumberColumn(
        Category.COMMON,
        ["stats", "grade", "slopeDistance", "down"],
        Definition.LONG_DISTANCE_SYSTEM_UNITS,
        "Downhill Distance",
        Print.number,
        1,
        0.001,
        Constant.KM_TO_MILE_FACTOR
      ),

      /**
       * Speed
       */
      new NumberColumn(
        Category.SPEED,
        ["stats", "speed", "max"],
        Definition.SPEED_SYSTEM_UNITS,
        "Max Speed",
        Print.number,
        1,
        1,
        Constant.KM_TO_MILE_FACTOR
      ),
      new NumberColumn(
        Category.SPEED,
        ["stats", "speed", "best20min"],
        Definition.SPEED_SYSTEM_UNITS,
        "Best 20min Speed",
        Print.number,
        1,
        1,
        Constant.KM_TO_MILE_FACTOR
      ),
      new NumberColumn(
        Category.SPEED,
        ["stats", "grade", "slopeSpeed", "up"],
        Definition.SPEED_SYSTEM_UNITS,
        "Climbing Speed",
        Print.number,
        1,
        1,
        Constant.KM_TO_MILE_FACTOR
      ),
      new NumberColumn(
        Category.SPEED,
        ["stats", "grade", "slopeSpeed", "flat"],
        Definition.SPEED_SYSTEM_UNITS,
        "Flat Speed",
        Print.number,
        1,
        1,
        Constant.KM_TO_MILE_FACTOR
      ),
      new NumberColumn(
        Category.SPEED,
        ["stats", "grade", "slopeSpeed", "down"],
        Definition.SPEED_SYSTEM_UNITS,
        "Downhill Speed",
        Print.number,
        1,
        1,
        Constant.KM_TO_MILE_FACTOR
      ),
      new NumberColumn(
        Category.SPEED,
        ["stats", "speed", "lowQ"],
        Definition.SPEED_SYSTEM_UNITS,
        "25% Speed",
        Print.number,
        1,
        1,
        Constant.KM_TO_MILE_FACTOR
      ),
      new NumberColumn(
        Category.SPEED,
        ["stats", "speed", "median"],
        Definition.SPEED_SYSTEM_UNITS,
        "50% Speed",
        Print.number,
        1,
        1,
        Constant.KM_TO_MILE_FACTOR
      ),
      new NumberColumn(
        Category.SPEED,
        ["stats", "speed", "upperQ"],
        Definition.SPEED_SYSTEM_UNITS,
        "75% Speed",
        Print.number,
        1,
        1,
        Constant.KM_TO_MILE_FACTOR
      ),
      new NumberColumn(
        Category.SPEED,
        ["stats", "speed", "stdDev"],
        Definition.SPEED_SYSTEM_UNITS,
        "σ Speed",
        Print.number,
        1,
        1,
        Constant.KM_TO_MILE_FACTOR,
        "Standard Deviation Speed"
      ),

      /**
       * Pace
       */
      new NumberColumn(
        Category.PACE,
        ["stats", "pace", "gapAvg"],
        Definition.LONG_PACE_SYSTEM_UNITS,
        "Grade Adj. Pace",
        Print.pace,
        null,
        null,
        1 / Constant.KM_TO_MILE_FACTOR
      ).setDescription("Grade Adjusted Pace"),
      new NumberColumn(
        Category.PACE,
        ["stats", "pace", "best20min"],
        Definition.LONG_PACE_SYSTEM_UNITS,
        "Best 20min Pace",
        Print.pace,
        null,
        null,
        1 / Constant.KM_TO_MILE_FACTOR
      ),
      new NumberColumn(
        Category.PACE,
        ["stats", "pace", "lowQ"],
        Definition.LONG_PACE_SYSTEM_UNITS,
        "25% Pace",
        Print.pace,
        null,
        null,
        1 / Constant.KM_TO_MILE_FACTOR
      ),
      new NumberColumn(
        Category.PACE,
        ["stats", "pace", "median"],
        Definition.LONG_PACE_SYSTEM_UNITS,
        "50% Pace",
        Print.pace,
        null,
        null,
        1 / Constant.KM_TO_MILE_FACTOR
      ),
      new NumberColumn(
        Category.PACE,
        ["stats", "pace", "upperQ"],
        Definition.LONG_PACE_SYSTEM_UNITS,
        "75% Pace",
        Print.pace,
        null,
        null,
        1 / Constant.KM_TO_MILE_FACTOR
      ),
      new NumberColumn(Category.PACE, ["stats", "scores", "stress", "rss"])
        .setHeader("Running Stress Score")
        .setDefault(true),
      new NumberColumn(Category.PACE, ["stats", "scores", "stress", "rssPerHour"]).setHeader(
        "Running Stress Score / h"
      ),
      new NumberColumn(Category.PACE, ["stats", "scores", "stress", "sss"]).setHeader("Swimming Stress Score"),
      new NumberColumn(Category.PACE, ["stats", "scores", "stress", "sssPerHour"]).setHeader(
        "Swimming Stress Score / h"
      ),

      /**
       * Heart rate
       */
      new NumberColumn(Category.HEART_RATE, ["stats", "heartRate", "avg"], "bpm", "Avg HR").setDefault(true),
      new NumberColumn(Category.HEART_RATE, ["stats", "heartRate", "max"], "bpm", "Max HR"),
      new NumberColumn(Category.HEART_RATE, ["stats", "heartRate", "avgReserve"], "%", "Avg HRR").setDescription(
        "Average Heart Rate Reserve"
      ),
      new NumberColumn(Category.HEART_RATE, ["stats", "heartRate", "maxReserve"], "%", "Max HRR").setDescription(
        "Max Heart Rate Reserve"
      ),
      new NumberColumn(Category.HEART_RATE, ["stats", "scores", "stress", "hrss"])
        .setDescription("Heart Rate Stress Score")
        .setDefault(true),
      new NumberColumn(Category.HEART_RATE, ["stats", "scores", "stress", "hrssPerHour"])
        .setHeader("HRSS / h")
        .setDescription("Heart Rate Stress Score / h"),
      new NumberColumn(Category.HEART_RATE, ["stats", "scores", "stress", "trimp"]).setDescription(
        "Training Impulse Score"
      ),
      new NumberColumn(Category.HEART_RATE, ["stats", "scores", "stress", "trimpPerHour"])
        .setHeader("TRIMP / h")
        .setDescription("Training Impulse Score / h"),
      new NumberColumn(Category.HEART_RATE, ["stats", "heartRate", "best20min"], "bpm", "Best 20min HR"),
      new NumberColumn(Category.HEART_RATE, ["stats", "heartRate", "best60min"], "bpm", "Best 60min HR"),
      new NumberColumn(Category.HEART_RATE, ["stats", "heartRate", "lowQ"], "bpm", "25% HR").setDescription(
        "Lower Quartile Bpm"
      ),
      new NumberColumn(Category.HEART_RATE, ["stats", "heartRate", "median"], "bpm", "50% HR").setDescription(
        "Median Bpm"
      ),
      new NumberColumn(Category.HEART_RATE, ["stats", "heartRate", "upperQ"], "bpm", "75% HR").setDescription(
        "Upper Quartile Bpm"
      ),
      new NumberColumn(Category.HEART_RATE, ["stats", "heartRate", "stdDev"], "bpm", "σ HR").setDescription(
        "Standard Deviation Bpm"
      ),
      /**
       * Cadence
       */
      new NumberColumn(
        Category.CADENCE,
        ["stats", "cadence", "avgActive"],
        Definition.CADENCE_UNITS,
        "Avg Active Cadence"
      )
        .setDescription("Average cadence when active")
        .setDefault(true),
      new NumberColumn(
        Category.CADENCE,
        ["stats", "cadence", "avg"],
        Definition.CADENCE_UNITS,
        "Avg Cadence"
      ).setDescription("Cadence Average inc. pause time"),
      new NumberColumn(
        Category.CADENCE,
        ["stats", "cadence", "activeRatio"],
        null,
        "Active Cadence Ratio",
        Print.number,
        2
      ).setDescription("Active cadence ratio"),
      new NumberColumn(Category.CADENCE, ["stats", "cadence", "max"], Definition.CADENCE_UNITS, "Max Cadence"),
      new NumberColumn(
        Category.CADENCE,
        ["stats", "cadence", "activeTime"],
        null,
        "Active Cadence Time",
        Print.time
      ).setDescription("Active cadence time"),
      new NumberColumn(
        Category.CADENCE,
        ["stats", "cadence", "stdDev"],
        Definition.CADENCE_UNITS,
        "σ Cadence"
      ).setDescription("Standard Deviation Cadence"),
      new NumberColumn(Category.CADENCE, ["stats", "cadence", "cycles"])
        .setHeader("Cadence Count")
        .setDescription("Total Crank Revolutions for cycling and Steps for running"),
      new NumberColumn(Category.CADENCE, ["stats", "cadence", "lowQ"], Definition.CADENCE_UNITS, "25% Cadence"),
      new NumberColumn(Category.CADENCE, ["stats", "cadence", "median"], Definition.CADENCE_UNITS, "50% Cadence"),
      new NumberColumn(Category.CADENCE, ["stats", "cadence", "upperQ"], Definition.CADENCE_UNITS, "75% Cadence"),
      new NumberColumn(
        Category.CADENCE,
        ["stats", "grade", "slopeCadence", "up"],
        Definition.CADENCE_UNITS,
        "Avg Climbing Cadence"
      ),
      new NumberColumn(
        Category.CADENCE,
        ["stats", "grade", "slopeCadence", "flat"],
        Definition.CADENCE_UNITS,
        "Avg Flat Cadence"
      ),
      new NumberColumn(
        Category.CADENCE,
        ["stats", "grade", "slopeCadence", "down"],
        Definition.CADENCE_UNITS,
        "Avg Downhill Cadence"
      ),
      new NumberColumn(
        Category.CADENCE,
        ["stats", "cadence", "distPerCycle"],
        Definition.SHORT_DISTANCE_SYSTEM_UNITS,
        "Distance / Revolution",
        Print.number,
        2,
        1,
        Constant.METER_TO_FEET_FACTOR
      ),

      /**
       * Power
       */
      new TextColumn(Category.POWER, ["hasPowerMeter"], Print.boolean, "Power Meter"),
      new NumberColumn(Category.POWER, ["stats", "power", "avg"], "w", "Avg Watts").setDefault(true),
      new NumberColumn(
        Category.POWER,
        ["stats", "power", "avgKg"],
        "w/kg",
        "Avg W / Kg",
        Print.number,
        2
      ).setDescription("Avg Watts / Kilograms"),
      new NumberColumn(Category.POWER, ["stats", "power", "weighted"], "w", "Normalized Power®"),
      new NumberColumn(
        Category.POWER,
        ["stats", "power", "weightedKg"],
        "w/kg",
        "NP® / Kg",
        Print.number,
        2
      ).setDescription("Normalized Power® / Kilograms"),
      new NumberColumn(Category.POWER, ["stats", "power", "max"], "w", "Max Power"),
      new NumberColumn(Category.POWER, ["stats", "power", "best20min"], "w", "Best 20min Power"),
      new NumberColumn(
        Category.POWER,
        ["stats", "power", "variabilityIndex"],
        null,
        "Variability Index",
        Print.number,
        2
      ),
      new NumberColumn(
        Category.POWER,
        ["stats", "power", "intensityFactor"],
        null,
        "Intensity Factor®",
        Print.number,
        2
      ),
      new NumberColumn(Category.POWER, ["stats", "scores", "stress", "pss"], null, "Power Stress Score").setDefault(
        true
      ),
      new NumberColumn(Category.POWER, ["stats", "scores", "stress", "pssPerHour"], null, "Power Stress Score / h"),
      new NumberColumn(Category.POWER, ["stats", "power", "stdDev"], "w", "σ Power").setDescription(
        "Standard Deviation Power"
      ),
      new NumberColumn(Category.POWER, ["stats", "power", "lowQ"], "w", "25% Watts").setDescription(
        "Lower Quartile Watts"
      ),
      new NumberColumn(Category.POWER, ["stats", "power", "median"], "w", "50% Watts").setDescription("Median Watts"),
      new NumberColumn(Category.POWER, ["stats", "power", "upperQ"], "w", "75% Watts").setDescription(
        "Upper Quartile Watts"
      ),

      /**
       * Cycling Dynamics
       */
      new NumberColumn(
        Category.CYCLING_DYNAMICS,
        ["stats", "dynamics", "cycling", "balance", "left"],
        "%",
        "L Balance",
        Print.number,
        1
      ).setDescription("Left Pedal Balance"),
      new NumberColumn(
        Category.CYCLING_DYNAMICS,
        ["stats", "dynamics", "cycling", "balance", "right"],
        "%",
        "R Balance",
        Print.number,
        1
      ).setDescription("Right Pedal Balance"),
      new NumberColumn(
        Category.CYCLING_DYNAMICS,
        ["stats", "dynamics", "cycling", "pedalSmoothness", "left"],
        "%",
        "L Smooth.",
        Print.number,
        1
      ).setDescription("Left Pedal Smoothness"),
      new NumberColumn(
        Category.CYCLING_DYNAMICS,
        ["stats", "dynamics", "cycling", "pedalSmoothness", "right"],
        "%",
        "R Smooth.",
        Print.number,
        1
      ).setDescription("Right Pedal Smoothness"),
      new NumberColumn(
        Category.CYCLING_DYNAMICS,
        ["stats", "dynamics", "cycling", "torqueEffectiveness", "left"],
        "%",
        "L Torque Eff.",
        Print.number,
        1
      ).setDescription("Left Torque Effectiveness"),
      new NumberColumn(
        Category.CYCLING_DYNAMICS,
        ["stats", "dynamics", "cycling", "torqueEffectiveness", "right"],
        "%",
        "R Torque Eff.",
        Print.number,
        1
      ).setDescription("Right Torque Effectiveness"),
      new NumberColumn(
        Category.CYCLING_DYNAMICS,
        ["stats", "dynamics", "cycling", "standingTime"],
        null,
        "Standing Time",
        Print.time
      ).setDescription("Time standing on bike pedals"),
      new NumberColumn(
        Category.CYCLING_DYNAMICS,
        ["stats", "dynamics", "cycling", "seatedTime"],
        null,
        "Seated Time",
        Print.time
      ).setDescription("Time seated on bike saddle"),

      /**
       * Running Dynamics
       */
      new NumberColumn(
        Category.RUNNING_DYNAMICS,
        ["stats", "dynamics", "running", "stanceTimeBalance", "left"],
        "%",
        "L GCT Balance",
        Print.number,
        1
      ).setDescription('Left "Ground Contact Time" balance'),
      new NumberColumn(
        Category.RUNNING_DYNAMICS,
        ["stats", "dynamics", "running", "stanceTimeBalance", "right"],
        "%",
        "R GCT Balance",
        Print.number,
        1
      ).setDescription('Right "Ground Contact Time" balance'),
      new NumberColumn(
        Category.RUNNING_DYNAMICS,
        ["stats", "dynamics", "running", "stanceTime"],
        null,
        "Avg Stance Time",
        Print.time
      ).setDescription('Average "Ground Contact Time" spent on the ground'),
      new NumberColumn(
        Category.RUNNING_DYNAMICS,
        ["stats", "dynamics", "running", "verticalOscillation"],
        "cm",
        "Avg Vert. Oscillation",
        Print.number,
        1,
        100 // From meters to centimeters
      ).setDescription("Average vertical motion of your torso measured in centimeters for each step"),
      new NumberColumn(
        Category.RUNNING_DYNAMICS,
        ["stats", "dynamics", "running", "verticalRatio"],
        "%",
        "Avg Vert. Ratio",
        Print.number,
        1
      ).setDescription(
        "Ratio of your vertical oscillation over your stride length. A lower number indicates a better running form. (Avg Vertical Ratio does not include zeros from time spent standing)"
      ),
      new NumberColumn(
        Category.RUNNING_DYNAMICS,
        ["stats", "dynamics", "running", "avgStrideLength"],
        "m",
        "Avg Stride Length",
        Print.number,
        2
      ),

      /**
       * Elevation
       */
      new NumberColumn(
        Category.ELEVATION,
        ["stats", "elevation", "avg"],
        Definition.ELEVATION_SYSTEM_UNITS,
        "Avg Elevation",
        Print.number,
        0,
        1,
        Constant.METER_TO_FEET_FACTOR
      ),
      new NumberColumn(
        Category.ELEVATION,
        ["stats", "elevation", "descent"],
        Definition.ELEVATION_SYSTEM_UNITS,
        "Elevation Descent",
        Print.number,
        0,
        1,
        Constant.METER_TO_FEET_FACTOR
      ),
      new NumberColumn(
        Category.ELEVATION,
        ["stats", "elevation", "lowQ"],
        Definition.ELEVATION_SYSTEM_UNITS,
        "25% Elevation",
        Print.number,
        0,
        1,
        Constant.METER_TO_FEET_FACTOR,
        "Lower Quartile Elevation"
      ),
      new NumberColumn(
        Category.ELEVATION,
        ["stats", "elevation", "median"],
        Definition.ELEVATION_SYSTEM_UNITS,
        "50% Elevation",
        Print.number,
        0,
        1,
        Constant.METER_TO_FEET_FACTOR,
        "Median Elevation"
      ),
      new NumberColumn(
        Category.ELEVATION,
        ["stats", "elevation", "upperQ"],
        Definition.ELEVATION_SYSTEM_UNITS,
        "75% Elevation",
        Print.number,
        0,
        1,
        Constant.METER_TO_FEET_FACTOR,
        "Upper Quartile Elevation"
      ),
      new NumberColumn(
        Category.ELEVATION,
        ["stats", "elevation", "ascentSpeed"],
        Definition.VERTICAL_ASCENT_SYSTEM_UNITS,
        "Avg Ascent Speed",
        Print.number,
        0,
        1,
        Constant.METER_TO_FEET_FACTOR
      ),

      /**
       * Grade
       */
      new NumberColumn(
        Category.GRADE,
        ["stats", "grade", "avg"],
        Definition.GRADE_UNITS,
        "Avg Grade",
        Print.number,
        1,
        1
      ),
      new NumberColumn(
        Category.GRADE,
        ["stats", "grade", "min"],
        Definition.GRADE_UNITS,
        "Min Grade",
        Print.number,
        1,
        1
      ),
      new NumberColumn(
        Category.GRADE,
        ["stats", "grade", "max"],
        Definition.GRADE_UNITS,
        "Max Grade",
        Print.number,
        1,
        1
      ),
      new TextColumn(Category.GRADE, ["stats", "grade", "slopeProfile"], Print.field, "Slope Profile"),
      new NumberColumn(
        Category.GRADE,
        ["stats", "grade", "lowQ"],
        Definition.GRADE_UNITS,
        "25% Grade",
        Print.number,
        1,
        1
      ),
      new NumberColumn(
        Category.GRADE,
        ["stats", "grade", "median"],
        Definition.GRADE_UNITS,
        "50% Grade",
        Print.number,
        1,
        1
      ),
      new NumberColumn(Category.GRADE, ["stats", "grade", "upperQ"], Definition.GRADE_UNITS, "75% Grade"),
      new NumberColumn(
        Category.GRADE,
        ["stats", "grade", "stdDev"],
        Definition.GRADE_UNITS,
        "Standard Deviation Grade"
      ),

      /**
       * Others
       */
      new NumberColumn(
        Category.OTHERS,
        ["stats", "scores", "stress", "trainingEffect", "aerobic"],
        null,
        "Aerobic Train. Effect",
        Print.number,
        1
      ).setDescription("Aerobic Training Effect"),
      new NumberColumn(
        Category.OTHERS,
        ["stats", "scores", "stress", "trainingEffect", "anaerobic"],
        null,
        "Anaerobic Train. Effect",
        Print.number,
        1
      ).setDescription("Anaerobic Training Effect"),
      new TextColumn(Category.OTHERS, ["manual"], Print.boolean, "Manual"),
      new TextColumn(Category.OTHERS, ["trainer"], Print.boolean, "Indoor"),
      new TextColumn(Category.OTHERS, ["isSwimPool"], Print.boolean, "Swim Pool").setBuildTarget(BuildTarget.DESKTOP),
      new TextColumn(Category.OTHERS, ["device"], Print.field, "Device")
        .setBuildTarget(BuildTarget.DESKTOP)
        .setWidth("150px"),
      new TextColumn(Category.OTHERS, ["flags"], Print.boolean, "Flagged").setBuildTarget(BuildTarget.DESKTOP),
      new TextColumn(Category.OTHERS, ["connector"], Print.field, "Connector").setBuildTarget(BuildTarget.DESKTOP),
      new TextColumn(Category.OTHERS, ["extras", "file", "type"], Print.field, "File Type").setBuildTarget(
        BuildTarget.DESKTOP
      ),
      new NumberColumn(Category.OTHERS, ["laps"], null, "Intervals Count", Print.count).setBuildTarget(
        BuildTarget.DESKTOP
      ),
      new DateColumn(Category.OTHERS, ["creationTime"], "Created Time").setWidth("150px"),
      new DateColumn(Category.OTHERS, ["lastEditTime"], "Last Edited Time").setWidth("150px"),
      new TextColumn(Category.OTHERS, ["id"], Print.field, "Identifier").setWidth("200px"),
      new TextColumn(Category.OTHERS, ["hash"], Print.field, "Hash").setWidth("200px"),
      new AthleteSettingsColumn(Category.OTHERS).setDefault(true),
      new ActivityDeleteColumn(Category.OTHERS).setDefault(true)
    ];
  }
}
