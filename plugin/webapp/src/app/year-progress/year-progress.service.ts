import { Injectable } from '@angular/core';
import { YearProgressModel } from "./models/year-progress.model";
import { SyncedActivityModel } from "../../../../common/scripts/models/Sync";
import * as _ from "lodash";
import * as moment from "moment";
import { Moment } from "moment";
import { YearProgressActivityModel } from "./models/year-progress-activity.model";
import { ProgressionModel } from "./models/progression.model";

@Injectable()
export class YearProgressService {

	constructor() {
	}

	public progression(syncedActivityModels: SyncedActivityModel[], typesFilter: string[]): YearProgressModel[] {

		const yearProgressModels: YearProgressModel[] = [];

		let yearProgressActivityModels = this.filterSyncedActivityModel(syncedActivityModels, typesFilter);

		// Sort yearProgressActivities along start_time
		yearProgressActivityModels = _.sortBy(yearProgressActivityModels, (activity: YearProgressActivityModel) => {
			return activity.start_time;
		});

		// Find along types date from & to / From: 1st january of first year / To: Today
		const fromMoment: Moment = moment(_.first(yearProgressActivityModels).start_time).startOf("year"); // 1st january of first year
		const todayMoment: Moment = moment(_.last(yearProgressActivityModels).start_time).startOf("day");

		// From 'fromMoment' to 'todayMoment' loop on days...
		const currentDayMoment = moment(fromMoment);
		let currentYearProgress: YearProgressModel = null;
		let lastProgression: ProgressionModel = null;

		while (currentDayMoment.isSameOrBefore(todayMoment)) {

			const currentYear = currentDayMoment.year();
			let progression: ProgressionModel = null;

			// Create new year progress if current year do not exists
			if (!_.find(yearProgressModels, {year: currentYear})) {

				lastProgression = null; // New year then remove

				currentYearProgress = {
					year: currentYear,
					progressions: [],
				};

				// Start totals from 0
				progression = {
					onTimestamp: currentDayMoment.toDate().getTime(),
					onYear: currentDayMoment.year(),
					onDayOfYear: currentDayMoment.dayOfYear(),
					totalDistance: 0,
					totalTime: 0,
					totalElevation: 0,
					count: 0,
				};

				yearProgressModels.push(currentYearProgress); // register inside yearProgressModels

			} else {

				// Year exists
				progression = {
					onTimestamp: currentDayMoment.toDate().getTime(),
					onYear: currentDayMoment.year(),
					onDayOfYear: currentDayMoment.dayOfYear(),
					totalDistance: lastProgression.totalDistance,
					totalTime: lastProgression.totalTime,
					totalElevation: lastProgression.totalElevation,
					count: lastProgression.count,
				};
			}

			// Find matching yearProgressActivityModels
			const foundOnToday: SyncedActivityModel[] = _.filter(yearProgressActivityModels, {
				year: currentDayMoment.year(),
				dayOfYear: currentDayMoment.dayOfYear(),
			});

			if (foundOnToday.length > 0) {

				for (let i: number = 0; i < foundOnToday.length; i++) {
					// Then apply totals...
					progression.totalDistance += foundOnToday[i].distance_raw;
					progression.totalTime += foundOnToday[i].moving_time_raw;
					progression.totalElevation += foundOnToday[i].elevation_gain_raw;
					progression.count++;
				}
			}

			lastProgression = progression; // Keep tracking for tomorrow day.
			currentYearProgress.progressions.push(progression);
			currentDayMoment.add(1, "days"); // Add a day until todayMoment
		}

		return yearProgressModels;
	}


	/**
	 *
	 * @param {SyncedActivityModel[]} activities
	 * @param {string[]} typesFilter
	 * @returns {YearProgressActivityModel[]}
	 */
	private filterSyncedActivityModel(activities: SyncedActivityModel[], typesFilter: string[]): YearProgressActivityModel[] {

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
	 * @returns {moment.Moment}
	 */
	public getTodayMoment(): Moment {
		return moment().endOf("day");
	}
}
