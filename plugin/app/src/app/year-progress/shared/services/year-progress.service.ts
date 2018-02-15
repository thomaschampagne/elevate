import { Injectable } from "@angular/core";
import { YearProgressModel } from "../models/year-progress.model";
import { SyncedActivityModel } from "../../../../../../common/scripts/models/Sync";
import * as _ from "lodash";
import * as moment from "moment";
import { Moment } from "moment";
import { YearProgressActivityModel } from "../models/year-progress-activity.model";
import { ProgressionModel } from "../models/progression.model";
import { ActivityCountByTypeModel } from "../models/activity-count-by-type.model";
import { ProgressionAtDayModel } from "../models/progression-at-date.model";
import { ProgressType } from "../models/progress-type.enum";
import { Subject } from "rxjs/Subject";

@Injectable()
export class YearProgressService {

	public static readonly KM_TO_MILE_FACTOR: number = 0.621371;
	public static readonly METER_TO_FEET_FACTOR: number = 3.28084;

	public static readonly ERROR_NO_SYNCED_ACTIVITY_MODELS: string = "Empty SyncedActivityModels";
	public static readonly ERROR_NO_TYPES_FILTER: string = "Empty types filter";
	public static readonly ERROR_NO_YEAR_PROGRESS_MODELS: string = "Empty YearProgressModels from given activity types";

	public momentWatched: Moment;
	public momentWatchedChanges: Subject<Moment>;

	constructor() {
		// By default moment watched is today. Moment watched can be edited from external
		this.momentWatched = this.getTodayMoment().clone().startOf("day");
		this.momentWatchedChanges = new Subject<Moment>();
	}

	/**
	 *
	 * @param {SyncedActivityModel[]} syncedActivityModels
	 * @param {string[]} typesFilter
	 * @param {number[]} yearsFilter
	 * @param {boolean} isMetric
	 * @param {boolean} includeCommuteRide
	 * @returns {YearProgressModel[]}
	 */
	public progression(syncedActivityModels: SyncedActivityModel[], typesFilter: string[], yearsFilter: number[],
					   isMetric: boolean, includeCommuteRide: boolean): YearProgressModel[] {

		if (_.isEmpty(syncedActivityModels)) {
			throw new Error(YearProgressService.ERROR_NO_SYNCED_ACTIVITY_MODELS);
		}

		if (_.isEmpty(typesFilter)) {
			throw new Error(YearProgressService.ERROR_NO_TYPES_FILTER);
		}

		const yearProgressModels: YearProgressModel[] = [];

		let yearProgressActivityModels = this.filterSyncedActivityModelAlongTypes(syncedActivityModels, typesFilter);

		if (_.isEmpty(yearProgressActivityModels)) {
			throw new Error(YearProgressService.ERROR_NO_YEAR_PROGRESS_MODELS);
		}

		// Sort yearProgressActivities along start_time
		yearProgressActivityModels = _.sortBy(yearProgressActivityModels, (activity: YearProgressActivityModel) => {
			return activity.start_time;
		});

		// Find along types date from & to / From: 1st january of first year / To: Today
		const todayMoment = this.getTodayMoment();
		const fromMoment: Moment = moment(_.first(syncedActivityModels).start_time).startOf("year"); // 1st january of first year
		const toMoment: Moment = this.getTodayMoment().clone().endOf("year").endOf("day");

		// From 'fromMoment' to 'todayMoment' loop on days...
		const currentDayMoment = moment(fromMoment);
		let currentYearProgress: YearProgressModel = null;
		let lastProgression: ProgressionModel = null;

		while (currentDayMoment.isSameOrBefore(toMoment)) {

			const currentYear = currentDayMoment.year();
			let progression: ProgressionModel = null;

			if (!_.isEmpty(yearsFilter)) { // Is there a filter on years?

				// ... Yes
				// Does exists current year in filter from the user?
				const currentYearNotFoundInFilter = _.indexOf(yearsFilter, currentYear) === -1;
				if (currentYearNotFoundInFilter) {
					currentDayMoment.add(1, "years");
					continue;
				}
			}

			// Create new year progress if current year do not exists
			const yearProgressAlreadyExistsForCurrentYear = _.find(yearProgressModels, {year: currentYear});

			if (!yearProgressAlreadyExistsForCurrentYear) {

				lastProgression = null; // New year then remove

				currentYearProgress = {
					year: currentYear,
					progressions: [],
				};

				// Start totals from 0
				progression = new ProgressionModel(
					currentDayMoment.year(),
					currentDayMoment.dayOfYear(),
					0,
					0,
					0,
					0
				);

				yearProgressModels.push(currentYearProgress); // register inside yearProgressModels

			} else {

				// Year exists
				progression = new ProgressionModel(
					currentDayMoment.year(),
					currentDayMoment.dayOfYear(),
					lastProgression.totalDistance,
					lastProgression.totalTime,
					lastProgression.totalElevation,
					lastProgression.count
				);
			}

			// Find matching yearProgressActivityModels
			const filterQuery: Partial<YearProgressActivityModel> = {
				year: currentDayMoment.year(),
				dayOfYear: currentDayMoment.dayOfYear(),
			};

			const activitiesFound: YearProgressActivityModel[] = _.filter(yearProgressActivityModels, filterQuery);

			if (activitiesFound.length > 0) {

				for (let i = 0; i < activitiesFound.length; i++) {

					if (!includeCommuteRide && activitiesFound[i].commute) {
						continue;
					}

					progression.totalDistance += activitiesFound[i].distance_raw;
					progression.totalTime += activitiesFound[i].moving_time_raw;
					progression.totalElevation += activitiesFound[i].elevation_gain_raw;
					progression.count++;
				}
			}

			lastProgression = _.clone(progression); // Keep tracking for tomorrow day.

			// Distance conversion
			let totalDistance = progression.totalDistance / 1000; // KM

			if (!isMetric) {
				totalDistance *= YearProgressService.KM_TO_MILE_FACTOR; // Imperial (Miles)
			}
			progression.totalDistance = Math.round(totalDistance);

			// Elevation conversion
			let totalElevation = progression.totalElevation; // Meters
			if (!isMetric) {
				totalElevation *= YearProgressService.METER_TO_FEET_FACTOR; // Imperial (feet)
			}
			progression.totalElevation = Math.round(totalElevation);

			// Convert time in seconds to hours
			progression.totalTime = progression.totalTime / 3600;

			// Tag progression day as future or not
			progression.isFuture = (!currentDayMoment.isSameOrBefore(todayMoment));

			currentYearProgress.progressions.push(progression);
			currentDayMoment.add(1, "days"); // Add a day until todayMoment
		}

		return yearProgressModels;
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
	 * @param {YearProgressModel[]} yearProgressModels
	 * @param {moment.Moment} dayMoment
	 * @param {ProgressType} progressType
	 * @param {number[]} selectedYears
	 * @param {Map<number, string>} yearsColorsMap
	 * @returns {ProgressionAtDayModel[]}
	 */
	public findProgressionsAtDay(yearProgressModels: YearProgressModel[], dayMoment: moment.Moment,
								 progressType: ProgressType, selectedYears: number[],
								 yearsColorsMap: Map<number, string>): ProgressionAtDayModel[] {

		const progressionsAtDay: ProgressionAtDayModel[] = [];

		_.forEach(selectedYears, (selectedYear: number) => {

			const dayMomentAtYear = dayMoment.year(selectedYear).startOf("day");

			const yearProgressModel: YearProgressModel = _.find(yearProgressModels, {
				year: selectedYear
			});

			const progressionModel: ProgressionModel = _.find(yearProgressModel.progressions, {
				dayOfYear: dayMomentAtYear.dayOfYear()
			});

			if (progressionModel) {

				const progressAtDay: ProgressionAtDayModel = {
					date: dayMomentAtYear.toDate(),
					year: dayMomentAtYear.year(),
					progressType: progressType,
					value: progressionModel.valueOf(progressType),
					color: (yearsColorsMap) ? yearsColorsMap.get(dayMomentAtYear.year()) : null
				};

				progressionsAtDay.push(progressAtDay);
			}
		});

		return progressionsAtDay;
	}

	/**
	 *
	 * @param {moment.Moment} momentWatched
	 */
	public onMomentWatchedChange(momentWatched: Moment): void {
		this.momentWatched = momentWatched;
		this.momentWatchedChanges.next(momentWatched);
	}

	/**
	 * Reset moment watch to default (today)
	 * @returns {moment.Moment} default moment
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

	public getTodayMoment(): Moment {
		return moment();
	}

}

