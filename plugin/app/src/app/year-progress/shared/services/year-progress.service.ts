import { Injectable } from "@angular/core";
import { YearProgressModel } from "../models/year-progress.model";
import * as _ from "lodash";
import * as moment from "moment";
import { Moment } from "moment";
import { YearProgressActivityModel } from "../models/year-progress-activity.model";
import { ProgressModel } from "../models/progress.model";
import { ActivityCountByTypeModel } from "../models/activity-count-by-type.model";
import { ProgressAtDayModel } from "../models/progress-at-date.model";
import { ProgressType } from "../enums/progress-type.enum";
import { Subject } from "rxjs";
import { SyncedActivityModel } from "@elevate/shared/models";
import { Constant } from "@elevate/shared/constants";
import { YearProgressPresetModel } from "../models/year-progress-preset.model";
import { YearProgressPresetDao } from "../dao/year-progress-preset.dao";
import { AppError } from "../../../shared/models/app-error.model";
import { YearProgressTypeModel } from "../models/year-progress-type.model";
import { TargetProgressModel } from "../models/target-progress.model";
import { ProgressMode } from "../enums/progress-mode.enum";
import { ProgressConfigModel } from "../interfaces/progress-config.model";
import { StandardProgressConfigModel } from "../models/standard-progress-config.model";
import { RollingProgressConfigModel } from "../models/rolling-progress-config.model";

@Injectable()
export class YearProgressService {

	public static readonly ERROR_NO_SYNCED_ACTIVITY_MODELS: string = "Empty SyncedActivityModels";
	public static readonly ERROR_NO_TYPES_FILTER: string = "Empty types filter";
	public static readonly ERROR_NO_YEAR_PROGRESS_MODELS: string = "Empty YearProgressModels from given activity types";

	public momentWatched: Moment;
	public momentWatchedChanges: Subject<Moment>;

	constructor(public yearProgressPresetDao: YearProgressPresetDao) {
		this.momentWatched = this.getTodayMoment().clone().startOf("day"); // By default moment watched is today. Moment watched can be edited from external
		this.momentWatchedChanges = new Subject<Moment>();
	}

	public static provideProgressTypes(isMetric: boolean): YearProgressTypeModel[] {
		return [
			new YearProgressTypeModel(ProgressType.DISTANCE, "Distance", (isMetric) ? "kilometers" : "miles", (isMetric) ? "km" : "mi"),
			new YearProgressTypeModel(ProgressType.TIME, "Time", "hours", "h"),
			new YearProgressTypeModel(ProgressType.ELEVATION, "Elevation", (isMetric) ? "meters" : "feet", (isMetric) ? "m" : "ft"),
			new YearProgressTypeModel(ProgressType.COUNT, "Count")
		];
	}

	/**
	 *
	 * @param config
	 * @param syncedActivityModels
	 */
	public progressions(config: ProgressConfigModel, syncedActivityModels: SyncedActivityModel[]): YearProgressModel[] {

		if (_.isEmpty(syncedActivityModels)) {
			throw new Error(YearProgressService.ERROR_NO_SYNCED_ACTIVITY_MODELS);
		}

		if (_.isEmpty(config.typesFilter)) {
			throw new Error(YearProgressService.ERROR_NO_TYPES_FILTER);
		}


		let yearProgressActivities = this.filterSyncedActivityModelAlongTypes(syncedActivityModels, config.typesFilter);

		if (_.isEmpty(yearProgressActivities)) {
			throw new Error(YearProgressService.ERROR_NO_YEAR_PROGRESS_MODELS);
		}

		// Sort yearProgressActivities along start_time
		yearProgressActivities = _.sortBy(yearProgressActivities, (activity: YearProgressActivityModel) => {
			return activity.start_time;
		});

		// Find along types date from & to / From: 1st january of first year / To: Today
		const todayMoment = this.getTodayMoment();
		const fromMoment: Moment = moment(_.first(syncedActivityModels).start_time).startOf("year"); // 1st january of first year
		const toMoment: Moment = this.getTodayMoment().clone().endOf("year").endOf("day");

		return (config.mode === ProgressMode.STANDARD_CUMULATIVE)
			? this.computeStandardProgressions(config as StandardProgressConfigModel, fromMoment, toMoment, todayMoment, yearProgressActivities)
			: this.computeRollingProgressions(config as RollingProgressConfigModel, fromMoment, toMoment, todayMoment, yearProgressActivities);
	}

	/**
	 *
	 * @param config
	 * @param fromMoment
	 * @param toMoment
	 * @param todayMoment
	 * @param yearProgressActivities
	 */
	public computeStandardProgressions(config: StandardProgressConfigModel,
									   fromMoment: Moment,
									   toMoment: Moment,
									   todayMoment,
									   yearProgressActivities): YearProgressModel[] {

		const yearProgressions: YearProgressModel[] = [];
		const hasYearFilter = !_.isEmpty(config.yearsFilter);
		let lastProgress: ProgressModel = null;

		// From 'fromMoment' to 'todayMoment' loop on days...
		const currentDayMoment = moment(fromMoment);
		let currentYearProgress: YearProgressModel = null;

		while (currentDayMoment.isSameOrBefore(toMoment)) {

			const currentYear = currentDayMoment.year();
			let progress: ProgressModel = null;

			if (hasYearFilter) {
				const currentYearNotSelected = (_.indexOf(config.yearsFilter, currentYear) === -1);
				if (currentYearNotSelected) { // Does exists current year in filter from the user?
					currentDayMoment.add(1, "years");
					continue;
				}
			}

			// Create new year progress if current year do not exists
			const isNewYearProgress = (!_.find(yearProgressions, {year: currentYear}));

			if (isNewYearProgress) {

				lastProgress = null; // New year then remove

				currentYearProgress = {
					mode: config.mode,
					year: currentYear,
					progressions: [],
				};

				// Start totals from 0
				progress = new ProgressModel(
					currentDayMoment.year(),
					currentDayMoment.dayOfYear(),
					0,
					0,
					0,
					0
				);

				yearProgressions.push(currentYearProgress); // register inside yearProgressions

			} else {

				// Year exists
				progress = new ProgressModel(
					currentDayMoment.year(),
					currentDayMoment.dayOfYear(),
					lastProgress.distance,
					lastProgress.time,
					lastProgress.elevation,
					lastProgress.count
				);
			}

			// Seek for activities performed that day
			const activitiesFound: YearProgressActivityModel[] = _.filter<YearProgressActivityModel>(yearProgressActivities, {
				year: currentDayMoment.year(),
				dayOfYear: currentDayMoment.dayOfYear()
			});

			if (activitiesFound.length > 0) {

				for (let i = 0; i < activitiesFound.length; i++) {

					if ((!config.includeCommuteRide && activitiesFound[i].commute) || (!config.includeIndoorRide && activitiesFound[i].trainer)) {
						continue;
					}

					progress.distance += activitiesFound[i].distance_raw;
					progress.time += activitiesFound[i].moving_time_raw;
					progress.elevation += activitiesFound[i].elevation_gain_raw;
					progress.count++;
				}
			}

			lastProgress = _.clone(progress); // Keep tracking for tomorrow day.

			// Tag progression day as future or not
			progress.isFuture = (!currentDayMoment.isSameOrBefore(todayMoment));

			// Prepare along metric/imperial & push
			currentYearProgress.progressions.push(this.prepareAlongSystemUnits(progress, config.isMetric));
			currentDayMoment.add(1, "days"); // Add a day until todayMoment
		}

		return yearProgressions;
	}

	/**
	 *
	 * @param config
	 * @param fromMoment
	 * @param toMoment
	 * @param todayMoment
	 * @param yearProgressActivities
	 */
	public computeRollingProgressions(config: RollingProgressConfigModel,
									  fromMoment: Moment,
									  toMoment: Moment,
									  todayMoment,
									  yearProgressActivities): YearProgressModel[] {

		const yearProgressions: YearProgressModel[] = [];

		// From 'fromMoment' to 'todayMoment' loop on days...
		const currentDayMoment = moment(fromMoment);
		let currentYearProgress: YearProgressModel = null;

		let isRollingBufferSizeReached = false;
		let rollingBufferSize = 0;
		const rollingBuffers = {
			distance: [],
			time: [],
			elevation: [],
			count: []
		};

		const maxYearToCompute: number = (!_.isEmpty(config.yearsFilter)) ? _.max(config.yearsFilter) : null;

		while (currentDayMoment.isSameOrBefore(toMoment)) {

			// Increase buffer size until rolling days length is reached
			if (!isRollingBufferSizeReached) {
				(rollingBufferSize === config.rollingDays) ? isRollingBufferSizeReached = true : rollingBufferSize++;
			}

			const currentYear = currentDayMoment.year();

			if (maxYearToCompute && currentYear > maxYearToCompute) {
				currentDayMoment.add(1, "years");
				continue;
			}

			const activitiesFound: YearProgressActivityModel[] = _.filter<YearProgressActivityModel>(yearProgressActivities, {
				year: currentDayMoment.year(),
				dayOfYear: currentDayMoment.dayOfYear()
			});

			const onDayTotals = {
				distance: 0,
				time: 0,
				elevation: 0,
				count: 0
			};

			// Seek for activities performed that day
			const hasCurrentDayActivities = (activitiesFound.length > 0);
			if (hasCurrentDayActivities) {
				for (let i = 0; i < activitiesFound.length; i++) {

					if ((!config.includeCommuteRide && activitiesFound[i].commute) || (!config.includeIndoorRide && activitiesFound[i].trainer)) {
						continue;
					}

					onDayTotals.distance += activitiesFound[i].distance_raw;
					onDayTotals.time += activitiesFound[i].moving_time_raw;
					onDayTotals.elevation += activitiesFound[i].elevation_gain_raw;
					onDayTotals.count++;
				}
			}

			// Push totals performed on current day inside buffer
			rollingBuffers.distance.push(onDayTotals.distance);
			rollingBuffers.time.push(onDayTotals.time);
			rollingBuffers.elevation.push(onDayTotals.elevation);
			rollingBuffers.count.push(onDayTotals.count);

			const rollingCumulative = {
				distance: (_.sum(rollingBuffers.distance) - ((isRollingBufferSizeReached) ? rollingBuffers.distance.shift() : 0)),
				time: (_.sum(rollingBuffers.time) - (((isRollingBufferSizeReached) ? rollingBuffers.time.shift() : 0))),
				elevation: (_.sum(rollingBuffers.elevation) - ((isRollingBufferSizeReached) ? rollingBuffers.elevation.shift() : 0)),
				count: (_.sum(rollingBuffers.count) - ((isRollingBufferSizeReached) ? rollingBuffers.count.shift() : 0)),
			};

			const progression: ProgressModel = new ProgressModel(
				currentDayMoment.year(),
				currentDayMoment.dayOfYear(),
				rollingCumulative.distance,
				rollingCumulative.time,
				rollingCumulative.elevation,
				rollingCumulative.count
			);

			// Create new year progress if current year do not exists
			const isNewYearProgress = (!_.find(yearProgressions, {year: currentYear}));
			if (isNewYearProgress) {
				currentYearProgress = {
					mode: config.mode,
					year: currentYear,
					progressions: [],
				};
				yearProgressions.push(currentYearProgress); // register inside yearProgressions
			}

			// Tag progression day as future or not
			progression.isFuture = (!currentDayMoment.isSameOrBefore(todayMoment));

			// Prepare along metric/imperial & push
			currentYearProgress.progressions.push(this.prepareAlongSystemUnits(progression, config.isMetric));
			currentDayMoment.add(1, "days"); // Add a day until todayMoment
		}

		return yearProgressions;
	}

	/**
	 *
	 * @param progression
	 * @param isMetric
	 */
	public prepareAlongSystemUnits(progression: ProgressModel, isMetric: boolean): ProgressModel {

		// Distance conversion
		let distance = progression.distance / 1000; // KM

		if (!isMetric) {
			distance *= Constant.KM_TO_MILE_FACTOR; // Imperial (Miles)
		}
		progression.distance = Math.round(distance);

		// Elevation conversion
		let elevation = progression.elevation; // Meters
		if (!isMetric) {
			elevation *= Constant.METER_TO_FEET_FACTOR; // Imperial (feet)
		}
		progression.elevation = Math.round(elevation);

		// Convert time in seconds to hours
		progression.time = progression.time / 3600;

		return progression;
	}

	/**
	 *
	 * @param year
	 * @param targetValue
	 */
	public targetProgression(year: number, targetValue: number): TargetProgressModel[] {

		const targetProgressModels: TargetProgressModel[] = [];
		const daysInYear = (moment().year(year).isLeapYear()) ? 366 : 365;
		const progressStep = targetValue / daysInYear;

		let targetProgress = progressStep; // Start progression

		for (let day = 1; day <= daysInYear; day++) {
			targetProgressModels.push({
				dayOfYear: day,
				value: targetProgress
			});
			targetProgress += progressStep;
		}

		return targetProgressModels;
	}

	/**
	 *    Return activity count for each type of sport. Order by count desc
	 * @param {SyncedActivityModel[]} syncedActivityModels
	 * @returns {ActivityCountByTypeModel[]}
	 */
	public activitiesByTypes(syncedActivityModels: SyncedActivityModel[]): ActivityCountByTypeModel[] {

		const activitiesCountByTypes: ActivityCountByTypeModel[] = [];

		_.forIn(_.countBy(_.map(syncedActivityModels, "type")), (count: number, type: string) => {
			activitiesCountByTypes.push({
				type: type,
				count: count
			});
		});

		return _.orderBy(activitiesCountByTypes, (activityCountByTypeModel: ActivityCountByTypeModel) => {
			return activityCountByTypeModel.count * -1;
		});
	}

	/**
	 *
	 * @param {SyncedActivityModel[]} syncedActivityModels
	 * @returns {number[]}
	 */
	public availableYears(syncedActivityModels: SyncedActivityModel[]): number[] {

		syncedActivityModels = _.sortBy(syncedActivityModels, "start_time");

		const availableYears = [];
		const startYear: number = moment(_.first(syncedActivityModels).start_time).year();
		const endYear: number = this.getTodayMoment().year();

		let year: number = startYear;
		while (year <= endYear) {
			availableYears.push(year);
			year++;
		}

		return availableYears.reverse();
	}

	/**
	 *
	 * @param {SyncedActivityModel[]} activities
	 * @param {string[]} typesFilter
	 * @returns {YearProgressActivityModel[]}
	 */
	public filterSyncedActivityModelAlongTypes(activities: SyncedActivityModel[], typesFilter: string[]): YearProgressActivityModel[] {

		activities = _.filter(activities, (activity: YearProgressActivityModel) => {

			if (_.indexOf(typesFilter, activity.type) !== -1) {

				const momentStartTime: Moment = moment(activity.start_time);
				activity.year = momentStartTime.year();
				activity.dayOfYear = momentStartTime.dayOfYear();
				return true;

			}

			return false;

		});

		return activities as YearProgressActivityModel[];
	}

	/**
	 *
	 * @param {YearProgressModel[]} yearProgressions
	 * @param {Moment} dayMoment
	 * @param {ProgressType} progressType
	 * @param {number[]} selectedYears
	 * @param {Map<number, string>} yearsColorsMap
	 * @returns {ProgressAtDayModel[]}
	 */
	public findProgressionsAtDay(yearProgressions: YearProgressModel[], dayMoment: Moment,
								 progressType: ProgressType, selectedYears: number[],
								 yearsColorsMap: Map<number, string>): ProgressAtDayModel[] {

		const progressionsAtDay: ProgressAtDayModel[] = [];

		_.forEach(selectedYears, (selectedYear: number) => {

			const dayMomentAtYear = dayMoment.year(selectedYear).startOf("day");

			const yearProgressModel: YearProgressModel = _.find(yearProgressions, {
				year: selectedYear
			});

			const progressModel: ProgressModel = _.find(yearProgressModel.progressions, {
				dayOfYear: dayMomentAtYear.dayOfYear()
			});

			if (progressModel) {

				const progressAtDay: ProgressAtDayModel = {
					date: dayMomentAtYear.toDate(),
					year: dayMomentAtYear.year(),
					progressType: progressType,
					value: progressModel.valueOf(progressType),
					color: (yearsColorsMap) ? yearsColorsMap.get(dayMomentAtYear.year()) : null
				};

				progressionsAtDay.push(progressAtDay);
			}
		});

		return progressionsAtDay;
	}

	/**
	 *
	 * @param {Moment} momentWatched
	 */
	public onMomentWatchedChange(momentWatched: Moment): void {
		this.momentWatched = momentWatched;
		this.momentWatchedChanges.next(momentWatched);
	}

	/**
	 * Reset moment watch to default (today)
	 * @returns {Moment} default moment
	 */
	public resetMomentWatched(): Moment {
		const todayMoment = this.getTodayMoment().clone().startOf("day");
		this.onMomentWatchedChange(todayMoment.clone());
		return todayMoment;
	}

	/**
	 *
	 * @param {number} hours
	 * @returns {string}
	 */
	public readableTimeProgress(hours: number): string {

		let readableTime = "";

		if (!_.isNumber(hours) || hours === 0) {

			readableTime = "0 h";

		} else {

			hours = Math.abs(hours);

			if (hours > 0) {

				const hoursFloored = Math.floor(hours);

				if (hoursFloored > 0) {
					readableTime = readableTime + hoursFloored + " h";
				}

				const remainingMinutes = (hours - hoursFloored) * 60;

				if (remainingMinutes > 0) {
					readableTime = readableTime + ((hoursFloored > 0) ? ", " : "") + Math.round(remainingMinutes) + " min";
				}
			}
		}

		return readableTime;
	}

	/**
	 * Fetch all preset
	 */
	public fetchPresets(): Promise<YearProgressPresetModel[]> {
		return (<Promise<YearProgressPresetModel[]>>this.yearProgressPresetDao.fetch());
	}

	/**
	 * Add preset to existing
	 * @param yearProgressPresetModel
	 */
	public addPreset(yearProgressPresetModel: YearProgressPresetModel): Promise<YearProgressPresetModel[]> {

		return (<Promise<YearProgressPresetModel[]>>this.yearProgressPresetDao.fetch().then((models: YearProgressPresetModel[]) => {

			const existingModel = _.find(models, {
				progressType: yearProgressPresetModel.progressType,
				activityTypes: yearProgressPresetModel.activityTypes,
				includeCommuteRide: yearProgressPresetModel.includeCommuteRide,
				includeIndoorRide: yearProgressPresetModel.includeIndoorRide,
				targetValue: yearProgressPresetModel.targetValue
			});

			if (existingModel) {
				return Promise.reject(new AppError(AppError.YEAR_PROGRESS_PRESETS_ALREADY_EXISTS, "You already saved this preset."));
			}

			models.push(yearProgressPresetModel);

			return this.yearProgressPresetDao.save(models);
		}));
	}

	/**
	 * Remove preset at index
	 * @param index
	 */
	public deletePreset(index: number): Promise<void> {
		return this.yearProgressPresetDao.fetch().then((models: YearProgressPresetModel[]) => {

			if (!models[index]) {
				return Promise.reject(new AppError(AppError.YEAR_PROGRESS_PRESETS_DO_NOT_EXISTS, "Year progress cannot be deleted"));
			}

			models.splice(index, 1);
			return this.yearProgressPresetDao.save(models).then(() => {
				return Promise.resolve();
			});
		});
	}

	public getTodayMoment(): Moment {
		return moment();
	}
}

