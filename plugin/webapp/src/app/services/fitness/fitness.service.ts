import { Injectable } from '@angular/core';
import { Moment } from "moment";
import { ActivityService, IFitnessReadyActivity } from "../activity/activity.service";
import * as _ from "lodash";
import moment = require("moment");

export interface IDayStress {
	ids: number[];
	date: Date;
	timestamp: number;
	type: string[];
	activitiesName: string[];
	trimpScore?: number;
	powerStressScore?: number;
	swimStressScore?: number;
	finalStressScore: number;
	previewDay: boolean;
}

export interface IDayFitnessTrend {
	ids: number[];
	date: string;
	timestamp: number;
	type: string[];
	activitiesName: string[];
	trimpScore?: number;
	powerStressScore?: number;
	swimStressScore?: number;
	finalStressScore?: number;
	ctl: number;
	atl: number;
	tsb: number;
	previewDay: boolean;
}


@Injectable()
export class FitnessService {

	constructor(private activityService: ActivityService) {
	}


	/**
	 * Return day by day the athlete stress. Active & rest days included
	 * @param {boolean} powerMeterEnable
	 * @param {number} cyclingFtp
	 * @param {boolean} swimEnable
	 * @param {number} swimFtp
	 * @returns {Promise<IDayStress[]>}
	 */
	public generateDailyStress(powerMeterEnable: boolean,
							   cyclingFtp: number,
							   swimEnable: boolean,
							   swimFtp: number): Promise<IDayStress[]> {

		return new Promise((resolve: (activityDays: IDayStress[]) => void,
							reject: (error: string) => void) => {

			this.activityService.filterFitnessReady(powerMeterEnable, cyclingFtp, swimEnable, swimFtp)
				.then((fitnessReadyActivities: IFitnessReadyActivity[]) => {

					if (_.isEmpty(fitnessReadyActivities)) {
						reject("No ready activities");
						return;
					}

					// Subtract 1 day to the first activity done in history:
					// Goal is to show graph point with 1 day before
					const startDay = moment(_.first(fitnessReadyActivities).date)
						.subtract(1, "days").startOf("day");

					const today: Moment = this.getTodayMoment().startOf("day"); // Today end of day

					// Now inject days off/resting
					const dailyActivity: IDayStress[] = [];
					const currentDay = moment(startDay).clone();

					while (currentDay.isSameOrBefore(today)) {

						// Compute athlete stress on that current day.
						const dayStress: IDayStress = this.dayStressOnDate(currentDay, fitnessReadyActivities);

						// Then push every day... Rest or active...
						dailyActivity.push(dayStress);

						// If current day is today. The last real day right?! Then leave the loop !
						if (currentDay.isSame(today)) break;

						// Add a day until today is reached :)
						currentDay.add(1, "days")
					}

					// Then add PREVIEW days
					this.appendPreviewDaysToDailyActivity(currentDay, dailyActivity);

					resolve(dailyActivity);
				});
		});
	}

	/**
	 *
	 * @param {boolean} powerMeterEnable
	 * @param {number} cyclingFtp
	 * @param {boolean} swimEnable
	 * @param {number} swimFtp
	 * @returns {Promise<IDayFitnessTrend[]>}
	 */
	public computeTrend(powerMeterEnable: boolean,
						cyclingFtp: number,
						swimEnable: boolean,
						swimFtp: number): Promise<IDayFitnessTrend[]> {

		return new Promise((resolve: (fitnessTrend: IDayFitnessTrend[]) => void,
							reject: (error: string) => void) => {

			this.generateDailyStress(powerMeterEnable, cyclingFtp, swimEnable, swimFtp)
				.then((dailyActivity: IDayStress[]) => {

					let ctl: number = 0;
					let atl: number = 0;
					let tsb: number = 0;

					const fitnessTrend: IDayFitnessTrend[] = [];

					_.forEach(dailyActivity, (dayStress: IDayStress) => {

						ctl = ctl + (dayStress.finalStressScore - ctl) * (1 - Math.exp(-1 / 42));
						atl = atl + (dayStress.finalStressScore - atl) * (1 - Math.exp(-1 / 7));
						tsb = ctl - atl;

						const dayFitnessTrend: IDayFitnessTrend = {
							ids: dayStress.ids,
							date: dayStress.date.toLocaleDateString(),
							timestamp: dayStress.timestamp,
							activitiesName: dayStress.activitiesName,
							type: dayStress.type,
							ctl: ctl,
							atl: atl,
							tsb: tsb,
							previewDay: dayStress.previewDay,
						};

						if (_.isNumber(dayStress.trimpScore) && dayStress.trimpScore > 0) {
							dayFitnessTrend.trimpScore = dayStress.trimpScore;
						}

						if (_.isNumber(dayStress.powerStressScore) && dayStress.powerStressScore > 0) {
							dayFitnessTrend.powerStressScore = dayStress.powerStressScore;
						}

						if (_.isNumber(dayStress.swimStressScore) && dayStress.swimStressScore > 0) {
							dayFitnessTrend.swimStressScore = dayStress.swimStressScore;
						}

						if (_.isNumber(dayStress.finalStressScore) && dayStress.finalStressScore > 0) {
							dayFitnessTrend.finalStressScore = dayStress.finalStressScore;
						}

						fitnessTrend.push(dayFitnessTrend);

					});

					resolve(fitnessTrend);
				});
		});
	}

	/**
	 *
	 * @param {moment.Moment} startFrom
	 * @param {IDayStress[]} dailyActivity
	 */
	private appendPreviewDaysToDailyActivity(startFrom: moment.Moment, dailyActivity: IDayStress[]) {

		for (let i: number = 0; i < ActivityService.FUTURE_DAYS_PREVIEW; i++) {

			const futureDate: Date = startFrom.add(1, "days").startOf("day").toDate();

			const dayActivity: IDayStress = {
				ids: [],
				date: futureDate,
				timestamp: futureDate.getTime(),
				type: [],
				activitiesName: [],
				trimpScore: 0,
				previewDay: true,
				finalStressScore: 0,
			};

			dailyActivity.push(dayActivity);
		}
	}

	/**
	 *
	 * @param {moment.Moment} currentDay
	 * @param {IFitnessReadyActivity[]} fitnessReadyActivities
	 * @returns {IDayStress}
	 */

	private dayStressOnDate(currentDay: moment.Moment, fitnessReadyActivities: IFitnessReadyActivity[]): IDayStress {

		const foundActivitiesThatDay: IFitnessReadyActivity[] = _.filter(fitnessReadyActivities, {
			year: currentDay.year(),
			dayOfYear: currentDay.dayOfYear(),
		});

		const dayActivity: IDayStress = {
			ids: [],
			date: currentDay.toDate(),
			timestamp: currentDay.toDate().getTime(),
			type: [],
			activitiesName: [],
			previewDay: false,
			finalStressScore: 0
		};

		// Compute final stress scores on that day
		if (foundActivitiesThatDay.length > 0) {

			_.forEach(foundActivitiesThatDay, (activity: IFitnessReadyActivity) => {

				dayActivity.ids.push(activity.id);
				dayActivity.activitiesName.push(activity.activityName);
				dayActivity.type.push(activity.type);

				// Apply scores for that day
				// PSS
				if (activity.powerStressScore) {

					if (!dayActivity.powerStressScore) { // Initialize value if not exists
						dayActivity.powerStressScore = 0;
					}

					dayActivity.powerStressScore += activity.powerStressScore;
				}

				// TRIMP
				if (activity.trimpScore) { // Check for TRIMP score if available
					if (!dayActivity.trimpScore) { // Initialize value if not exists
						dayActivity.trimpScore = 0;
					}
					dayActivity.trimpScore += activity.trimpScore;
				}

				// SwimSS
				if (activity.swimStressScore) { // Check for TRIMP score if available
					if (!dayActivity.swimStressScore) { // Initialize value if not exists
						dayActivity.swimStressScore = 0;
					}
					dayActivity.swimStressScore += activity.swimStressScore;
				}

				// Apply final stress score for that day
				if (activity.powerStressScore) { // Use PSS has priority over TRIMP

					dayActivity.finalStressScore += activity.powerStressScore;

				} else if (activity.trimpScore) {

					dayActivity.finalStressScore += activity.trimpScore;

				} else if (activity.swimStressScore) {

					dayActivity.finalStressScore += activity.swimStressScore;

				}
			});

		}

		return dayActivity;
	}

	public getTodayMoment(): Moment {
		return moment();
	}
}
