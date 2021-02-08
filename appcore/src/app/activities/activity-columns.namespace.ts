// tslint:disable:max-line-length
// tslint:disable:no-empty-interface
import { SyncedActivityModel } from "@elevate/shared/models";
import _ from "lodash";
import moment from "moment";
import { Constant } from "@elevate/shared/constants";
import { Time } from "@elevate/shared/tools";

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
  export abstract class Column<T> {
    public id: string;
    public header: string;
    public category: string;
    public description: string;
    public path: string[];

    public width = "115px"; // Default column width
    public isDefault = false; // Column is not default

    public abstract type: ColumnType;
    public abstract print: (...args: any[]) => string;

    protected constructor(category: string, id: string, header?: string, description?: string) {
      this.category = category;
      this.id = id;
      this.path = this.id.split(".");
      this.header = header ? header : _.upperFirst(_.last(this.path));
      this.description = description;
    }

    public setHeader(header: string): Column<T> {
      this.header = header;
      return this;
    }

    public setDescription(description: string): Column<T> {
      this.description = description;
      return this;
    }

    public setWidth(width: string): Column<T> {
      this.width = width;
      return this;
    }

    public setDefault(value: boolean): Column<T> {
      this.isDefault = value;
      return this;
    }
  }

  /**
   * Text based column
   */
  export class TextColumn<T> extends Column<T> {
    public type: ColumnType = ColumnType.TEXT;
    public print: (activity: SyncedActivityModel, path?: string) => string;

    constructor(
      category: string,
      id: string,
      print?: (activity: SyncedActivityModel, path?: string) => string,
      header?: string,
      description?: string
    ) {
      super(category, id, header, description);
      this.print = print ? print : Print.field;
    }
  }

  /**
   * Date based column
   */
  export class DateColumn<T> extends TextColumn<T> {
    public type: ColumnType = ColumnType.DATE;

    constructor(category: string, id: string, header?: string, description?: string) {
      super(category, id, Print.startDate, header, description);
    }
  }

  /**
   * Link based column
   */
  export class ActivityLinkColumn<T> extends TextColumn<T> {
    public type: ColumnType = ColumnType.ACTIVITY_LINK;

    constructor(
      category: string,
      id: string,
      print?: (activity: SyncedActivityModel, path?: string) => string,
      header?: string,
      description?: string
    ) {
      super(category, id, print, header, description);
    }
  }

  /**
   * Settings based column
   */
  export class AthleteSettingsColumn<T> extends TextColumn<T> {
    public type: ColumnType = ColumnType.ATHLETE_SETTINGS;

    constructor(category: string) {
      super(
        category,
        "athleteSettings",
        null,
        "Athlete Settings",
        "Display athlete settings which have been used to compute stats that day"
      );
    }
  }

  /**
   * Delete based column
   */
  export class ActivityDeleteColumn<T> extends TextColumn<T> {
    public type: ColumnType = ColumnType.ACTIVITY_DELETE;

    constructor(category: string) {
      super(category, "deleteActivity", null, "Delete");
    }
  }

  /**
   * Number based column
   */
  export class NumberColumn<T> extends Column<T> {
    public type: ColumnType = ColumnType.NUMBER;
    public print: (
      activity: SyncedActivityModel,
      units: string | SpecificUnits,
      precision: number,
      factor: number,
      isImperial: boolean,
      imperialFactor: number,
      path?: string
    ) => string;
    public units: string | SpecificUnits;
    public precision: number;
    public factor: number;
    public imperialFactor: number;

    constructor(
      category: string,
      id: string,
      units?: string | SpecificUnits,
      header?: string,
      print?: (
        activity: SyncedActivityModel,
        units: string | SpecificUnits,
        precision: number,
        factor: number,
        isImperial: boolean,
        imperialFactor: number,
        path?: string
      ) => string,
      precision?: number,
      factor?: number,
      imperialFactor?: number,
      description?: string
    ) {
      super(category, id, header, description);
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
    public static readonly GRADE: string = "Grade";
    public static readonly OTHERS: string = "Others";
    // public static readonly STRESS_SCORES: string = "Stress Scores";

    public label: string;
    public columns: Column<SyncedActivityModel>[];

    constructor(categoryLabel: string, columns: Column<SyncedActivityModel>[]) {
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
      activity: SyncedActivityModel,
      units: string | SpecificUnits,
      precision: number,
      factor: number,
      isImperial: boolean,
      imperialFactor: number,
      path?: string
    ): string {
      const value = Print.getConvertValueAtPath(path, activity, precision, factor, isImperial, imperialFactor);

      if (units && units instanceof SystemUnits) {
        units = isImperial ? units.imperial : units.metric;
      }

      if (units && units instanceof CadenceUnits) {
        if (SyncedActivityModel.isRun(activity.type)) {
          units = units.running;
        } else if (SyncedActivityModel.isSwim(activity.type)) {
          units = units.swimming;
        } else if (SyncedActivityModel.isRide(activity.type, true)) {
          units = units.cycling;
        } else {
          units = "rpm";
        }
      }

      return _.isNumber(value) && !_.isNaN(value) ? (units ? value + " " + units : value.toString()) : Print.NO_DATA;
    }

    public static pace(
      activity: SyncedActivityModel,
      units: string | SpecificUnits,
      precision: number,
      factor: number,
      isImperial: boolean,
      imperialFactor: number,
      path?: string
    ): string {
      const value = Print.getConvertValueAtPath(path, activity, precision, factor, isImperial, imperialFactor);

      if (units && units instanceof SystemUnits) {
        units = isImperial ? units.imperial : units.metric;
      }

      return _.isNumber(value) && !_.isNaN(value)
        ? Time.secToMilitary(value) + (units ? " " + units : "")
        : Print.NO_DATA;
    }

    public static time(
      activity: SyncedActivityModel,
      units: string | SpecificUnits,
      precision: number,
      factor?: number,
      isImperial?: boolean,
      imperialFactor?: number,
      path?: string
    ): string {
      const value = Print.getConvertValueAtPath(path, activity, precision, factor, isImperial, imperialFactor);

      return _.isNumber(value) && !_.isNaN(value) ? Time.secToMilitary(value) : Print.NO_DATA;
    }

    public static boolean(activity: SyncedActivityModel, path: string): string {
      return _.first(_.at(activity as any, path)) ? "Yes" : "No";
    }

    public static field(activity: SyncedActivityModel, path: string): string {
      return _.get(activity, path);
    }

    public static startDate(activity: SyncedActivityModel): string {
      return `${moment(activity.start_time).format("ddd, MMM DD, YYYY")}`;
    }

    public static movingTime(activity: SyncedActivityModel): string {
      return _.isNumber(activity.moving_time_raw) ? Time.secToMilitary(activity.moving_time_raw) : Print.NO_DATA;
    }

    public static elapsedTime(activity: SyncedActivityModel): string {
      return _.isNumber(activity.elapsed_time_raw) ? Time.secToMilitary(activity.elapsed_time_raw) : Print.NO_DATA;
    }

    private static getConvertValueAtPath(
      path: string | string[],
      activity: SyncedActivityModel,
      precision: number,
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

    public static readonly ALL: Column<SyncedActivityModel>[] = [
      /**
       * Common
       */
      new DateColumn(Category.COMMON, "start_time", "Date").setWidth("150px").setDefault(true),
      new ActivityLinkColumn(Category.COMMON, "name").setWidth("285px").setDefault(true),
      new TextColumn(Category.COMMON, "type").setDefault(true),
      new TextColumn(Category.COMMON, "moving_time_raw", Print.movingTime, "Moving Time").setDefault(true),
      new TextColumn(Category.COMMON, "elapsed_time_raw", Print.elapsedTime, "Total Time"),
      new NumberColumn(
        Category.COMMON,
        "distance_raw",
        Definition.LONG_DISTANCE_SYSTEM_UNITS,
        "Distance",
        Print.number,
        1,
        0.001,
        Constant.KM_TO_MILE_FACTOR
      ).setDefault(true),
      new NumberColumn(
        Category.COMMON,
        "elevation_gain_raw",
        Definition.ELEVATION_SYSTEM_UNITS,
        "Elevation Gain",
        Print.number,
        1,
        1,
        Constant.METER_TO_FEET_FACTOR
      ).setDefault(true),
      new NumberColumn(
        Category.COMMON,
        "extendedStats.speedData.genuineAvgSpeed",
        Definition.SPEED_SYSTEM_UNITS,
        "Avg Moving Speed",
        Print.number,
        1,
        1,
        Constant.KM_TO_MILE_FACTOR
      ).setDefault(true),
      new NumberColumn(
        Category.COMMON,
        "extendedStats.paceData.avgPace",
        Definition.LONG_PACE_SYSTEM_UNITS,
        "Avg Pace",
        Print.pace,
        null,
        null,
        1 / Constant.KM_TO_MILE_FACTOR
      ).setDefault(true),
      new NumberColumn(
        Category.COMMON,
        "extendedStats.runningPerformanceIndex",
        null,
        "Run Perf. Index",
        Print.number,
        2
      ).setDescription("Running Performance Index from Polar company."),
      new NumberColumn(Category.COMMON, "extendedStats.calories", null, "Calories", Print.number),
      new NumberColumn(Category.COMMON, "extendedStats.caloriesPerHour", null, "Calories / Hour", Print.number),
      new NumberColumn(Category.COMMON, "extendedStats.moveRatio", null, "Move Ratio", Print.number, 2),
      new NumberColumn(
        Category.COMMON,
        "extendedStats.gradeData.upFlatDownInSeconds.up",
        Definition.GRADE_UNITS,
        "Climbing Time",
        Print.time
      ),
      new NumberColumn(
        Category.COMMON,
        "extendedStats.gradeData.upFlatDownInSeconds.flat",
        Definition.GRADE_UNITS,
        "Flat Time",
        Print.time
      ),
      new NumberColumn(
        Category.COMMON,
        "extendedStats.gradeData.upFlatDownInSeconds.down",
        Definition.GRADE_UNITS,
        "Downhill Time",
        Print.time
      ),
      new NumberColumn(
        Category.COMMON,
        "extendedStats.gradeData.upFlatDownDistanceData.up",
        Definition.LONG_DISTANCE_SYSTEM_UNITS,
        "Climbing Distance",
        Print.number,
        1,
        0.001,
        Constant.KM_TO_MILE_FACTOR
      ),
      new NumberColumn(
        Category.COMMON,
        "extendedStats.gradeData.upFlatDownDistanceData.flat",
        Definition.LONG_DISTANCE_SYSTEM_UNITS,
        "Flat Distance",
        Print.number,
        1,
        0.001,
        Constant.KM_TO_MILE_FACTOR
      ),
      new NumberColumn(
        Category.COMMON,
        "extendedStats.gradeData.upFlatDownDistanceData.down",
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
        "extendedStats.speedData.totalAvgSpeed",
        Definition.SPEED_SYSTEM_UNITS,
        "Avg Total Speed",
        Print.number,
        1,
        1,
        Constant.KM_TO_MILE_FACTOR
      ),
      new NumberColumn(
        Category.SPEED,
        "extendedStats.speedData.maxSpeed",
        Definition.SPEED_SYSTEM_UNITS,
        "Max Speed",
        Print.number,
        1,
        1,
        Constant.KM_TO_MILE_FACTOR
      ),
      new NumberColumn(
        Category.SPEED,
        "extendedStats.speedData.best20min",
        Definition.SPEED_SYSTEM_UNITS,
        "Best 20min Speed",
        Print.number,
        1,
        1,
        Constant.KM_TO_MILE_FACTOR
      ),
      new NumberColumn(
        Category.SPEED,
        "extendedStats.gradeData.upFlatDownMoveData.up",
        Definition.SPEED_SYSTEM_UNITS,
        "Climbing Speed",
        Print.number,
        1,
        1,
        Constant.KM_TO_MILE_FACTOR
      ),
      new NumberColumn(
        Category.SPEED,
        "extendedStats.gradeData.upFlatDownMoveData.flat",
        Definition.SPEED_SYSTEM_UNITS,
        "Flat Speed",
        Print.number,
        1,
        1,
        Constant.KM_TO_MILE_FACTOR
      ),
      new NumberColumn(
        Category.SPEED,
        "extendedStats.gradeData.upFlatDownMoveData.down",
        Definition.SPEED_SYSTEM_UNITS,
        "Downhill Speed",
        Print.number,
        1,
        1,
        Constant.KM_TO_MILE_FACTOR
      ),
      new NumberColumn(
        Category.SPEED,
        "extendedStats.speedData.lowerQuartileSpeed",
        Definition.SPEED_SYSTEM_UNITS,
        "25% Speed",
        Print.number,
        1,
        1,
        Constant.KM_TO_MILE_FACTOR
      ),
      new NumberColumn(
        Category.SPEED,
        "extendedStats.speedData.medianSpeed",
        Definition.SPEED_SYSTEM_UNITS,
        "50% Speed",
        Print.number,
        1,
        1,
        Constant.KM_TO_MILE_FACTOR
      ),
      new NumberColumn(
        Category.SPEED,
        "extendedStats.speedData.upperQuartileSpeed",
        Definition.SPEED_SYSTEM_UNITS,
        "75% Speed",
        Print.number,
        1,
        1,
        Constant.KM_TO_MILE_FACTOR
      ),
      new NumberColumn(
        Category.SPEED,
        "extendedStats.speedData.standardDeviationSpeed",
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
        "extendedStats.paceData.genuineGradeAdjustedAvgPace",
        Definition.LONG_PACE_SYSTEM_UNITS,
        "Grade Adj. Pace",
        Print.pace,
        null,
        null,
        1 / Constant.KM_TO_MILE_FACTOR
      ).setDescription("Grade Adjusted Pace"),
      new NumberColumn(
        Category.PACE,
        "extendedStats.paceData.best20min",
        Definition.LONG_PACE_SYSTEM_UNITS,
        "Best 20min Pace",
        Print.pace,
        null,
        null,
        1 / Constant.KM_TO_MILE_FACTOR
      ),
      new NumberColumn(
        Category.PACE,
        "extendedStats.paceData.lowerQuartilePace",
        Definition.LONG_PACE_SYSTEM_UNITS,
        "25% Pace",
        Print.pace,
        null,
        null,
        1 / Constant.KM_TO_MILE_FACTOR
      ),
      new NumberColumn(
        Category.PACE,
        "extendedStats.paceData.medianPace",
        Definition.LONG_PACE_SYSTEM_UNITS,
        "50% Pace",
        Print.pace,
        null,
        null,
        1 / Constant.KM_TO_MILE_FACTOR
      ),
      new NumberColumn(
        Category.PACE,
        "extendedStats.paceData.upperQuartilePace",
        Definition.LONG_PACE_SYSTEM_UNITS,
        "75% Pace",
        Print.pace,
        null,
        null,
        1 / Constant.KM_TO_MILE_FACTOR
      ),
      new NumberColumn(Category.PACE, "extendedStats.paceData.runningStressScore")
        .setHeader("Running Stress Score")
        .setDefault(true),
      new NumberColumn(Category.PACE, "extendedStats.paceData.runningStressScorePerHour").setHeader(
        "Running Stress Score / h"
      ),
      new NumberColumn(Category.PACE, "extendedStats.paceData.swimStressScore").setHeader("Swimming Stress Score"),
      new NumberColumn(Category.PACE, "extendedStats.paceData.swimStressScorePerHour").setHeader(
        "Swimming Stress Score / h"
      ),

      /**
       * Heart rate
       */
      new NumberColumn(Category.HEART_RATE, "extendedStats.heartRateData.averageHeartRate", "bpm", "Avg HR").setDefault(
        true
      ),
      new NumberColumn(Category.HEART_RATE, "extendedStats.heartRateData.maxHeartRate", "bpm", "Max HR"),
      new NumberColumn(
        Category.HEART_RATE,
        "extendedStats.heartRateData.activityHeartRateReserve",
        "%",
        "Avg HRR"
      ).setDescription("Average Heart Rate Reserve"),
      new NumberColumn(
        Category.HEART_RATE,
        "extendedStats.heartRateData.activityHeartRateReserveMax",
        "%",
        "Max HRR"
      ).setDescription("Max Heart Rate Reserve"),
      new NumberColumn(Category.HEART_RATE, "extendedStats.heartRateData.HRSS")
        .setDescription("Heart Rate Stress Score")
        .setDefault(true),
      new NumberColumn(Category.HEART_RATE, "extendedStats.heartRateData.HRSSPerHour")
        .setHeader("HRSS / h")
        .setDescription("Heart Rate Stress Score / h"),
      new NumberColumn(Category.HEART_RATE, "extendedStats.heartRateData.TRIMP").setDescription(
        "Training Impulse Score"
      ),
      new NumberColumn(Category.HEART_RATE, "extendedStats.heartRateData.TRIMPPerHour")
        .setHeader("TRIMP / h")
        .setDescription("Training Impulse Score / h"),
      new NumberColumn(Category.HEART_RATE, "extendedStats.heartRateData.best20min", "bpm", "Best 20min HR"),
      new NumberColumn(Category.HEART_RATE, "extendedStats.heartRateData.best60min", "bpm", "Best 60min HR"),
      new NumberColumn(
        Category.HEART_RATE,
        "extendedStats.heartRateData.lowerQuartileHeartRate",
        "bpm",
        "25% HR"
      ).setDescription("Lower Quartile Bpm"),
      new NumberColumn(
        Category.HEART_RATE,
        "extendedStats.heartRateData.medianHeartRate",
        "bpm",
        "50% HR"
      ).setDescription("Median Bpm"),
      new NumberColumn(
        Category.HEART_RATE,
        "extendedStats.heartRateData.upperQuartileHeartRate",
        "bpm",
        "75% HR"
      ).setDescription("Upper Quartile Bpm"),
      /**
       * Cadence
       */
      new NumberColumn(
        Category.CADENCE,
        "extendedStats.cadenceData.averageActiveCadence",
        Definition.CADENCE_UNITS,
        "Avg Active Cadence"
      )
        .setDescription("Average cadence when active")
        .setDefault(true),
      new NumberColumn(
        Category.CADENCE,
        "extendedStats.cadenceData.averageCadence",
        Definition.CADENCE_UNITS,
        "Avg Cadence"
      ).setDescription("Cadence Average inc. pause time"),
      new NumberColumn(
        Category.CADENCE,
        "extendedStats.cadenceData.cadenceActivePercentage",
        "%",
        "Active Cadence %"
      ).setDescription("Active cadence percentage when active"),
      new NumberColumn(
        Category.CADENCE,
        "extendedStats.cadenceData.maxCadence",
        Definition.CADENCE_UNITS,
        "Max Cadence"
      ),
      new NumberColumn(
        Category.CADENCE,
        "extendedStats.cadenceData.cadenceActiveTime",
        null,
        "Active Cadence Time",
        Print.time
      ).setDescription("Active cadence time"),
      new NumberColumn(
        Category.CADENCE,
        "extendedStats.gradeData.upFlatDownCadencePaceData.up",
        Definition.CADENCE_UNITS,
        "Climbing Cadence"
      ),
      new NumberColumn(
        Category.CADENCE,
        "extendedStats.gradeData.upFlatDownCadencePaceData.flat",
        Definition.CADENCE_UNITS,
        "Flat Cadence"
      ),
      new NumberColumn(
        Category.CADENCE,
        "extendedStats.gradeData.upFlatDownCadencePaceData.down",
        Definition.CADENCE_UNITS,
        "Downhill Cadence"
      ),
      new NumberColumn(
        Category.CADENCE,
        "extendedStats.cadenceData.standardDeviationCadence",
        Definition.CADENCE_UNITS,
        "σ Cadence"
      ).setDescription("Standard Deviation σ"),
      new NumberColumn(Category.CADENCE, "extendedStats.cadenceData.totalOccurrences")
        .setHeader("Cadence Count")
        .setDescription("Total Crank Revolutions for cycling and Steps for running"),
      new NumberColumn(
        Category.CADENCE,
        "extendedStats.cadenceData.lowerQuartileCadence",
        Definition.CADENCE_UNITS,
        "25% Cadence"
      ),
      new NumberColumn(
        Category.CADENCE,
        "extendedStats.cadenceData.medianCadence",
        Definition.CADENCE_UNITS,
        "50% Cadence"
      ),
      new NumberColumn(
        Category.CADENCE,
        "extendedStats.cadenceData.upperQuartileCadence",
        Definition.CADENCE_UNITS,
        "75% Cadence"
      ),
      new NumberColumn(
        Category.CADENCE,
        "extendedStats.cadenceData.upFlatDownCadencePaceData.up",
        Definition.CADENCE_UNITS,
        "Avg Climbing Cadence"
      ),
      new NumberColumn(
        Category.CADENCE,
        "extendedStats.cadenceData.upFlatDownCadencePaceData.flat",
        Definition.CADENCE_UNITS,
        "Avg Flat Cadence"
      ),
      new NumberColumn(
        Category.CADENCE,
        "extendedStats.cadenceData.upFlatDownCadencePaceData.down",
        Definition.CADENCE_UNITS,
        "Avg Downhill Cadence"
      ),
      new NumberColumn(
        Category.CADENCE,
        "extendedStats.cadenceData.averageDistancePerOccurrence",
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
      new TextColumn(Category.POWER, "extendedStats.powerData.hasPowerMeter", Print.boolean, "Power Meter"),
      new NumberColumn(Category.POWER, "extendedStats.powerData.avgWatts", "w", "Avg Watts").setDefault(true),
      new NumberColumn(
        Category.POWER,
        "extendedStats.powerData.avgWattsPerKg",
        "w/kg",
        "Avg Watts / Kilograms",
        Print.number,
        2
      ),
      new NumberColumn(Category.POWER, "extendedStats.powerData.weightedPower", "w", "Weighted Power"),
      new NumberColumn(
        Category.POWER,
        "extendedStats.powerData.weightedWattsPerKg",
        "w/kg",
        "Weighted Power / Kilograms",
        Print.number,
        2
      ),
      new NumberColumn(Category.POWER, "extendedStats.powerData.maxPower", "w", "Max Power"),
      new NumberColumn(Category.POWER, "extendedStats.powerData.best20min", "w", "Best 20min Power"),
      new NumberColumn(
        Category.POWER,
        "extendedStats.powerData.bestEightyPercent",
        "w",
        "Best 80% Power"
      ).setDescription("Best power held during 80% of moving time"),
      new NumberColumn(
        Category.POWER,
        "extendedStats.powerData.variabilityIndex",
        null,
        "Variability Index",
        Print.number,
        2
      ),
      new NumberColumn(Category.POWER, "extendedStats.powerData.punchFactor", null, "Intensity", Print.number, 2),
      new NumberColumn(
        Category.POWER,
        "extendedStats.powerData.powerStressScore",
        null,
        "Power Stress Score"
      ).setDefault(true),
      new NumberColumn(
        Category.POWER,
        "extendedStats.powerData.powerStressScorePerHour",
        null,
        "Power Stress Score / h"
      ),
      new NumberColumn(Category.POWER, "extendedStats.powerData.lowerQuartileWatts", "w", "25% Watts").setDescription(
        "Lower Quartile Watts"
      ),
      new NumberColumn(Category.POWER, "extendedStats.powerData.medianWatts", "w", "50% Watts").setDescription(
        "Median Watts"
      ),
      new NumberColumn(Category.POWER, "extendedStats.powerData.upperQuartileWatts", "w", "75% Watts").setDescription(
        "Upper Quartile Watts"
      ),

      /**
       * Elevation
       */
      new NumberColumn(
        Category.ELEVATION,
        "extendedStats.elevationData.avgElevation",
        Definition.ELEVATION_SYSTEM_UNITS,
        "Avg Elevation",
        Print.number,
        0,
        1,
        Constant.METER_TO_FEET_FACTOR
      ),
      new NumberColumn(
        Category.ELEVATION,
        "extendedStats.elevationData.accumulatedElevationDescent",
        Definition.ELEVATION_SYSTEM_UNITS,
        "Elevation Descent",
        Print.number,
        0,
        1,
        Constant.METER_TO_FEET_FACTOR
      ),
      new NumberColumn(
        Category.ELEVATION,
        "extendedStats.elevationData.lowerQuartileElevation",
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
        "extendedStats.elevationData.medianElevation",
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
        "extendedStats.elevationData.upperQuartileElevation",
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
        "extendedStats.elevationData.ascentSpeed.avg",
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
        "extendedStats.gradeData.avgGrade",
        Definition.GRADE_UNITS,
        "Avg Grade",
        Print.number,
        1,
        1
      ),
      new NumberColumn(
        Category.GRADE,
        "extendedStats.gradeData.avgMaxGrade",
        Definition.GRADE_UNITS,
        "Max Grade",
        Print.number,
        1,
        1
      ),
      new NumberColumn(
        Category.GRADE,
        "extendedStats.gradeData.avgMinGrade",
        Definition.GRADE_UNITS,
        "Min Grade",
        Print.number,
        1,
        1
      ),
      new TextColumn(Category.GRADE, "extendedStats.gradeData.gradeProfile", Print.field, "Grade Profile"),
      new NumberColumn(
        Category.GRADE,
        "extendedStats.gradeData.lowerQuartileGrade",
        Definition.GRADE_UNITS,
        "25% Grade",
        Print.number,
        1,
        1
      ),
      new NumberColumn(
        Category.GRADE,
        "extendedStats.gradeData.medianGrade",
        Definition.GRADE_UNITS,
        "50% Grade",
        Print.number,
        1,
        1
      ),
      new NumberColumn(
        Category.GRADE,
        "extendedStats.gradeData.upperQuartileGrade",
        Definition.GRADE_UNITS,
        "75% Grade"
      ),

      /**
       * Others
       */
      new AthleteSettingsColumn(Category.OTHERS).setDefault(true),
      new ActivityDeleteColumn(Category.OTHERS).setDefault(true)
    ];
  }
}
