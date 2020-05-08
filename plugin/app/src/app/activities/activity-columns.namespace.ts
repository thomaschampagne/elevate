import { SyncedActivityModel } from "@elevate/shared/models";
import * as _ from "lodash";
import * as moment from "moment";
import { Constant } from "@elevate/shared/constants";

export namespace ActivityColumns {

	export interface SpecificUnits {
	}

	export class SystemUnits implements SpecificUnits {

		public metric: string;
		public imperial: string;

		constructor(metric: string, imperial: string) {
			this.metric = metric;
			this.imperial = imperial;
		}
	}

	export class CadenceUnits implements SpecificUnits {

		public cycling: string;
		public running: string;

		constructor(cycling: string, running: string) {
			this.cycling = cycling;
			this.running = running;
		}
	}

	export enum ColumnType {
		DATE,
		TEXT,
		NUMBER,
		ATHLETE_SETTINGS,
		ACTIVITY_LINK,
		ACTIVITY_DELETE,
	}

	/**
	 * Column attributes base
	 */
	export abstract class Column<T> {

		public id: string;
		public header: string;
		public category: string;
		public description: string;

		public width = "115px"; // Default column width
		public sticky = false; // Column is not stick by default
		public isDefault = false; // Column is not default

		public abstract type: ColumnType;
		public abstract print: (...args: any[]) => string;

		protected constructor(category: string, id: string, header?: string, description?: string) {
			this.category = category;
			this.id = id;
			this.header = (header) ? header : _.upperFirst(_.last(this.id.split(".")));
			this.description = description;
		}

		/**
		 *
		 * @param header
		 */
		public setHeader(header: string): Column<T> {
			this.header = header;
			return this;
		}

		/**
		 *
		 * @param description
		 */
		public setDescription(description: string): Column<T> {
			this.description = description;
			return this;
		}

		/**
		 *
		 * @param width in px
		 */
		public setWidth(width: string): Column<T> {
			this.width = width;
			return this;
		}

		/**
		 *
		 */
		public setSticky(): Column<T> {
			this.sticky = true;
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

		constructor(category: string, id: string, print?: (activity: SyncedActivityModel, path?: string) => string, header?: string, description?: string) {
			super(category, id, header, description);
			this.print = (print) ? print : Print.field;
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

		constructor(category: string, id: string, print?: (activity: SyncedActivityModel, path?: string)
			=> string, header?: string, description?: string) {
			super(category, id, print, header, description);
		}
	}


	/**
	 * Settings based column
	 */
	export class AthleteSettingsColumn<T> extends TextColumn<T> {
		public type: ColumnType = ColumnType.ATHLETE_SETTINGS;

		constructor(category: string) {
			super(category, "athleteSettings", null, "Athlete Settings", "Display athlete settings which have been used to compute stats that day");
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
		public print: (activity: SyncedActivityModel, units: string | SpecificUnits, precision: number, factor: number, isImperial: boolean,
					   imperialFactor: number, path?: string) => string;
		public units: string | SpecificUnits;
		public precision: number;
		public factor: number;
		public imperialFactor: number;

		constructor(category: string, id: string, units?: string | SpecificUnits, header?: string,
					print?: (activity: SyncedActivityModel, units: string | SpecificUnits, precision: number, factor: number, isImperial: boolean,
							 imperialFactor: number, path?: string) => string,
					precision?: number, factor?: number, imperialFactor?: number, description?: string) {

			super(category, id, header, description);
			this.print = (print) ? print : Print.number;
			this.units = (units) ? units : null;
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

		/**
		 *
		 * @param activity
		 * @param units
		 * @param precision
		 * @param factor
		 * @param isImperial
		 * @param imperialFactor
		 * @param path
		 */
		public static number(activity: SyncedActivityModel, units: string | SpecificUnits, precision: number, factor: number, isImperial: boolean,
							 imperialFactor: number, path?: string): string {

			const value = Print.getConvertValueAtPath(path, activity, precision, factor, isImperial, imperialFactor);

			if (units && units instanceof SystemUnits) {
				units = isImperial ? units.imperial : units.metric;
			}

			if (units && units instanceof CadenceUnits) {

				if (activity.type === "Run") {
					units = units.running;
				} else if (activity.type === "Ride" || activity.type === "VirtualRide" || activity.type === "EBikeRide") {
					units = units.cycling;
				}
			}

			return (_.isNumber(value) && !_.isNaN(value)) ? ((units) ? value + " " + units : value.toString()) : Print.NO_DATA;
		}


		/**
		 *
		 * @param activity
		 * @param units
		 * @param precision
		 * @param factor
		 * @param isImperial
		 * @param imperialFactor
		 * @param path
		 */
		public static pace(activity: SyncedActivityModel, units: string | SpecificUnits, precision: number, factor: number,
						   isImperial: boolean, imperialFactor: number, path?: string): string {

			const value = Print.getConvertValueAtPath(path, activity, precision, factor, isImperial, imperialFactor);

			if (units && units instanceof SystemUnits) {
				units = isImperial ? units.imperial : units.metric;
			}

			return (_.isNumber(value) && !_.isNaN(value)) ? (moment().startOf("day").seconds(value).format("mm:ss") + (units ? " " + units : "")) : Print.NO_DATA;
		}

		/**
		 *
		 * @param activity
		 * @param units
		 * @param precision
		 * @param factor
		 * @param isImperial
		 * @param imperialFactor
		 * @param path
		 */
		public static time(activity: SyncedActivityModel, units: string | SpecificUnits, precision: number, factor?: number,
						   isImperial?: boolean, imperialFactor?: number, path?: string): string {

			const value = Print.getConvertValueAtPath(path, activity, precision, factor, isImperial, imperialFactor);

			return (_.isNumber(value) && !_.isNaN(value)) ? (moment().startOf("day").seconds(value).format("HH:mm:ss")) : Print.NO_DATA;
		}

		/**
		 *
		 * @param path
		 * @param activity
		 * @param precision
		 * @param factor
		 * @param isImperial
		 * @param imperialFactor
		 */
		private static getConvertValueAtPath(path: string, activity: SyncedActivityModel, precision: number, factor?: number,
											 isImperial?: boolean, imperialFactor?: number): number {

			let value = null;

			if (path) {
				value = _.at(activity as any, path)[0];
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

		/**
		 *
		 * @param activity
		 * @param path
		 */
		public static boolean(activity: SyncedActivityModel, path: string): string {
			return (_.first(_.at(activity as any, path))) ? "Yes" : "No";
		}


		/**
		 *
		 * @param activity
		 * @param path
		 */
		public static field(activity: SyncedActivityModel, path: string): string {
			return _.first(_.at(activity as any, path));
		}

		/**
		 *
		 * @param activity
		 */
		public static startDate(activity: SyncedActivityModel): string {
			return `${moment(activity.start_time).format("ddd, MMM DD, YYYY")}`;
		}


		/**
		 *
		 * @param activity
		 */
		public static movingTime(activity: SyncedActivityModel): string {
			return moment.utc(activity.moving_time_raw * 1000).format("HH:mm:ss");
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
		public static readonly SPEED_SYSTEM_UNITS: SystemUnits = new SystemUnits("kph", "mph");
		public static readonly CADENCE_UNITS: CadenceUnits = new CadenceUnits("rpm", "spm");

		public static readonly ALL: Column<SyncedActivityModel>[] = [

			/**
			 * Common
			 */
			new DateColumn(Category.COMMON, "start_time", "Date").setWidth("150px").setDefault(true),
			new ActivityLinkColumn(Category.COMMON, "name").setWidth("230px").setDefault(true),
			new TextColumn(Category.COMMON, "type").setDefault(true),
			new TextColumn(Category.COMMON, "moving_time_raw", Print.movingTime, "Moving Time").setDefault(true),
			new NumberColumn(Category.COMMON, "distance_raw", Definition.LONG_DISTANCE_SYSTEM_UNITS, "Distance", Print.number, 1, 0.001, Constant.KM_TO_MILE_FACTOR).setDefault(true),
			new NumberColumn(Category.COMMON, "elevation_gain_raw", Definition.ELEVATION_SYSTEM_UNITS, "Elevation Gain", Print.number, 1, 1, Constant.METER_TO_FEET_FACTOR).setDefault(true),
			new NumberColumn(Category.COMMON, "extendedStats.speedData.genuineAvgSpeed", Definition.SPEED_SYSTEM_UNITS, "Avg Moving Speed", Print.number, 1, 1, Constant.KM_TO_MILE_FACTOR).setDefault(true),
			new NumberColumn(Category.COMMON, "extendedStats.paceData.avgPace", Definition.LONG_PACE_SYSTEM_UNITS, "Avg Pace", Print.pace, null, null, (1 / Constant.KM_TO_MILE_FACTOR)).setDefault(true),
			new NumberColumn(Category.COMMON, "extendedStats.runningPerformanceIndex", null, "Run Perf. Index", Print.number, 2),
			new NumberColumn(Category.COMMON, "calories", null, "Calories", Print.number).setDefault(true),
			new NumberColumn(Category.COMMON, "extendedStats.moveRatio", null, "Move Ratio", Print.number, 2),

			/**
			 * Speed
			 */
			new NumberColumn(Category.SPEED, "extendedStats.speedData.totalAvgSpeed", Definition.SPEED_SYSTEM_UNITS, "Avg Total Speed", Print.number, 1, 1, Constant.KM_TO_MILE_FACTOR),
			new NumberColumn(Category.SPEED, "extendedStats.speedData.best20min", Definition.SPEED_SYSTEM_UNITS, "Best 20min Speed", Print.number, 1, 1, Constant.KM_TO_MILE_FACTOR).setDefault(true),
			// new NumberColumn(Category.SPEED, "extendedStats.speedData.avgPace", Definition.LONG_PACE_SYSTEM_UNITS, "", Print.number, 1, 1, Constant.KM_TO_MILE_FACTOR),
			new NumberColumn(Category.SPEED, "extendedStats.speedData.lowerQuartileSpeed", Definition.SPEED_SYSTEM_UNITS, "25% Speed", Print.number, 1, 1, Constant.KM_TO_MILE_FACTOR),
			new NumberColumn(Category.SPEED, "extendedStats.speedData.medianSpeed", Definition.SPEED_SYSTEM_UNITS, "50% Speed", Print.number, 1, 1, Constant.KM_TO_MILE_FACTOR),
			new NumberColumn(Category.SPEED, "extendedStats.speedData.upperQuartileSpeed", Definition.SPEED_SYSTEM_UNITS, "75% Speed", Print.number, 1, 1, Constant.KM_TO_MILE_FACTOR),
			// new NumberColumn(Category.SPEED, "extendedStats.speedData.varianceSpeed", Definition.SPEED_SYSTEM_UNITS, "", Print.number, 1, 1, Constant.KM_TO_MILE_FACTOR),
			new NumberColumn(Category.SPEED, "extendedStats.speedData.standardDeviationSpeed", Definition.SPEED_SYSTEM_UNITS, "σ Speed", Print.number, 1, 1, Constant.KM_TO_MILE_FACTOR, "Standard Deviation Speed"),


			/**
			 * Pace
			 */
			new NumberColumn(Category.PACE, "extendedStats.paceData.genuineGradeAdjustedAvgPace", Definition.LONG_PACE_SYSTEM_UNITS, "Grade Adj. Pace", Print.pace, null, null, (1 / Constant.KM_TO_MILE_FACTOR)).setDescription("Grade Adjusted Pace"),
			new NumberColumn(Category.PACE, "extendedStats.paceData.best20min", Definition.LONG_PACE_SYSTEM_UNITS, "Best 20min Pace", Print.pace, null, null, (1 / Constant.KM_TO_MILE_FACTOR)).setDefault(true),
			new NumberColumn(Category.PACE, "extendedStats.paceData.lowerQuartilePace", Definition.LONG_PACE_SYSTEM_UNITS, "25% Pace", Print.pace, null, null, (1 / Constant.KM_TO_MILE_FACTOR)),
			new NumberColumn(Category.PACE, "extendedStats.paceData.medianPace", Definition.LONG_PACE_SYSTEM_UNITS, "50% Pace", Print.pace, null, null, (1 / Constant.KM_TO_MILE_FACTOR)),
			new NumberColumn(Category.PACE, "extendedStats.paceData.upperQuartilePace", Definition.LONG_PACE_SYSTEM_UNITS, "75% Pace", Print.pace, null, null, (1 / Constant.KM_TO_MILE_FACTOR)),
			new NumberColumn(Category.PACE, "extendedStats.paceData.runningStressScore").setHeader("Running Stress Score").setDefault(true),
			new NumberColumn(Category.PACE, "extendedStats.paceData.runningStressScorePerHour").setHeader("Running Stress Score / h").setDefault(true),

			/**
			 * Heart rate
			 */
			new NumberColumn(Category.HEART_RATE, "extendedStats.heartRateData.averageHeartRate", "bpm", "Avg HR").setDefault(true),
			new NumberColumn(Category.HEART_RATE, "extendedStats.heartRateData.maxHeartRate", "bpm", "Max HR"),
			new NumberColumn(Category.HEART_RATE, "extendedStats.heartRateData.activityHeartRateReserve", "%", "Avg HRR").setDescription("Average Heart Rate Reserve"),
			new NumberColumn(Category.HEART_RATE, "extendedStats.heartRateData.activityHeartRateReserveMax", "%", "Max HRR").setDescription("Max Heart Rate Reserve"),
			new NumberColumn(Category.HEART_RATE, "extendedStats.heartRateData.HRSS").setDescription("Heart Rate Stress Score").setDefault(true),
			new NumberColumn(Category.HEART_RATE, "extendedStats.heartRateData.HRSSPerHour").setHeader("HRSS / h").setDescription("Heart Rate Stress Score / Hour").setDefault(true),
			new NumberColumn(Category.HEART_RATE, "extendedStats.heartRateData.TRIMP").setDescription("Training Impulse Score"),
			new NumberColumn(Category.HEART_RATE, "extendedStats.heartRateData.TRIMPPerHour").setHeader("TRIMP / h").setDescription("Training Impulse Score / Hour"),
			new NumberColumn(Category.HEART_RATE, "extendedStats.heartRateData.best20min", "bpm", "Best 20min HR").setDefault(true),
			new NumberColumn(Category.HEART_RATE, "extendedStats.heartRateData.best60min", "bpm", "Best 60min HR"),
			new NumberColumn(Category.HEART_RATE, "extendedStats.heartRateData.lowerQuartileHeartRate", "bpm", "25% HR").setDescription("Lower Quartile Bpm"),
			new NumberColumn(Category.HEART_RATE, "extendedStats.heartRateData.medianHeartRate", "bpm", "50% HR").setDescription("Median Bpm"),
			new NumberColumn(Category.HEART_RATE, "extendedStats.heartRateData.upperQuartileHeartRate", "bpm", "75% HR").setDescription("Upper Quartile Bpm"),
			/**
			 * Cadence
			 */
			new NumberColumn(Category.CADENCE, "extendedStats.cadenceData.cadencePercentageMoving", "%", "Cadence % Moving").setDescription("Cadence percentage while moving"),
			new NumberColumn(Category.CADENCE, "extendedStats.cadenceData.cadenceTimeMoving", null, "Cadence Time Moving", Print.time).setDescription("Cadence Time while moving"),
			new NumberColumn(Category.CADENCE, "extendedStats.cadenceData.averageCadenceMoving", Definition.CADENCE_UNITS, "Cadence Avg Moving").setDescription("Cadence Average while moving").setDefault(true),
			new NumberColumn(Category.CADENCE, "extendedStats.cadenceData.standardDeviationCadence", Definition.CADENCE_UNITS, "σ Cadence").setDescription("Standard Deviation σ"),
			new NumberColumn(Category.CADENCE, "extendedStats.cadenceData.totalOccurrences").setHeader("Cadence Count").setDescription("Total Crank Revolutions for cycling and Steps for running"),
			new NumberColumn(Category.CADENCE, "extendedStats.cadenceData.lowerQuartileCadence", Definition.CADENCE_UNITS, "25% Cadence"),
			new NumberColumn(Category.CADENCE, "extendedStats.cadenceData.medianCadence", Definition.CADENCE_UNITS, "50% Cadence"),
			new NumberColumn(Category.CADENCE, "extendedStats.cadenceData.upperQuartileCadence", Definition.CADENCE_UNITS, "75% Cadence"),
			new NumberColumn(Category.CADENCE, "extendedStats.cadenceData.upFlatDownCadencePaceData.up", Definition.CADENCE_UNITS, "Climbing Avg Cadence"),
			new NumberColumn(Category.CADENCE, "extendedStats.cadenceData.upFlatDownCadencePaceData.flat", Definition.CADENCE_UNITS, "Flat Avg Cadence"),
			new NumberColumn(Category.CADENCE, "extendedStats.cadenceData.upFlatDownCadencePaceData.down", Definition.CADENCE_UNITS, "Downhill Avg Cadence"),
			new NumberColumn(Category.CADENCE, "extendedStats.cadenceData.averageDistancePerOccurrence", Definition.SHORT_DISTANCE_SYSTEM_UNITS, "Distance / Revolution", Print.number, 2, 1, Constant.METER_TO_FEET_FACTOR),
			// new NumberColumn(Category.CADENCE, "extendedStats.cadenceData.lowerQuartileDistancePerOccurrence", "rpm", "lowerQuartileDistancePerOccurrence"),
			// new NumberColumn(Category.CADENCE, "extendedStats.cadenceData.medianDistancePerOccurrence", "rpm", "medianDistancePerOccurrence"),
			// new NumberColumn(Category.CADENCE, "extendedStats.cadenceData.upperQuartileDistancePerOccurrence", "rpm", "upperQuartileDistancePerOccurrence"),

			/**
			 * Power
			 */
			new TextColumn(Category.POWER, "extendedStats.powerData.hasPowerMeter", Print.boolean, "Power Meter"),
			new NumberColumn(Category.POWER, "extendedStats.powerData.avgWatts", "w", "Avg Watts").setDefault(true),
			new NumberColumn(Category.POWER, "extendedStats.powerData.avgWattsPerKg", "w/kg", "Avg Watts / Kilograms", Print.number, 2).setDefault(true),
			new NumberColumn(Category.POWER, "extendedStats.powerData.weightedPower", "w", "Weighted Power"),
			new NumberColumn(Category.POWER, "extendedStats.powerData.weightedWattsPerKg", "w/kg", "Weighted Power / Kilograms", Print.number, 2),
			new NumberColumn(Category.POWER, "extendedStats.powerData.best20min", "w", "Best 20min Power").setDefault(true),
			// new NumberColumn(Category.POWER, "extendedStats.powerData.bestEightyPercent", "w", "bestEightyPercent"),
			new NumberColumn(Category.POWER, "extendedStats.powerData.variabilityIndex", null, "Variability Index", Print.number, 2),
			// new NumberColumn(Category.POWER, "extendedStats.powerData.punchFactor", "w", "punchFactor"),
			new NumberColumn(Category.POWER, "extendedStats.powerData.powerStressScore", null, "Power Stress Score").setDefault(true),
			new NumberColumn(Category.POWER, "extendedStats.powerData.powerStressScorePerHour", null, "Power Stress Score / h").setDefault(true),
			new NumberColumn(Category.POWER, "extendedStats.powerData.lowerQuartileWatts", "w", "25% Watts").setDescription("Lower Quartile Watts"),
			new NumberColumn(Category.POWER, "extendedStats.powerData.medianWatts", "w", "50% Watts").setDescription("Median Watts"),
			new NumberColumn(Category.POWER, "extendedStats.powerData.upperQuartileWatts", "w", "75% Watts").setDescription("Upper Quartile Watts"),

			/**
			 * Elevation
			 */
			new NumberColumn(Category.ELEVATION, "extendedStats.elevationData.avgElevation", Definition.ELEVATION_SYSTEM_UNITS, "Avg Elevation", Print.number, 0, 1, Constant.METER_TO_FEET_FACTOR),
			new NumberColumn(Category.ELEVATION, "extendedStats.elevationData.accumulatedElevationDescent", Definition.ELEVATION_SYSTEM_UNITS, "ElevationDescent", Print.number, 0, 1, Constant.METER_TO_FEET_FACTOR),
			new NumberColumn(Category.ELEVATION, "extendedStats.elevationData.lowerQuartileElevation", Definition.ELEVATION_SYSTEM_UNITS, "25% Elevation", Print.number, 0, 1, Constant.METER_TO_FEET_FACTOR, "Lower Quartile Elevation"),
			new NumberColumn(Category.ELEVATION, "extendedStats.elevationData.medianElevation", Definition.ELEVATION_SYSTEM_UNITS, "50% Elevation", Print.number, 0, 1, Constant.METER_TO_FEET_FACTOR, "Median Elevation"),
			new NumberColumn(Category.ELEVATION, "extendedStats.elevationData.upperQuartileElevation", Definition.ELEVATION_SYSTEM_UNITS, "75% Elevation", Print.number, 0, 1, Constant.METER_TO_FEET_FACTOR, "Upper Quartile Elevation"),


			/**
			 * Others
			 */
			new AthleteSettingsColumn(Category.OTHERS).setDefault(true),
			new ActivityDeleteColumn(Category.OTHERS).setDefault(true)
		];
	}
}
