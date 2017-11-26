import * as moment from "moment";
import { Moment } from "moment";
import { Injectable } from '@angular/core';
import { ActivityDao } from "../../dao/activity/activity.dao";
import { ISyncActivityComputed } from "../../../../../common/scripts/interfaces/ISync";
import * as _ from "lodash";

export interface IFitnessReadyActivity {
	id: number;
	date: Date;
	timestamp: number;
	dayOfYear: number;
	year: number;
	type: string;
	activityName: string;
	trimpScore?: number;
	powerStressScore?: number;
	swimStressScore?: number;
}

export interface IDayActivity {
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

@Injectable()
export class ActivityService {

	public static readonly FUTURE_DAYS_PREVIEW: number = 14;

	constructor(private _activityDao: ActivityDao) {
	}

	/**
	 *
	 * @returns {Promise<ISyncActivityComputed[]>}
	 */
	public fetch(): Promise<ISyncActivityComputed[]> {
		return this.activityDao.fetch();
	}

	/**
	 *
	 * @param {boolean} powerMeterEnable
	 * @param {number} cyclingFtp
	 * @param {boolean} swimEnable
	 * @param {number} swimFtp
	 * @returns {Promise<IFitnessReadyActivity[]>}
	 */
	public filterFitnessReady(powerMeterEnable: boolean,
							  cyclingFtp: number,
							  swimEnable: boolean,
							  swimFtp: number): Promise<IFitnessReadyActivity[]> {

		return new Promise((resolve: (result: IFitnessReadyActivity[]) => void,
							reject: (error: string) => void) => {

			return this.fetch().then((activities: ISyncActivityComputed[]) => {

				const fitnessReadyActivities: IFitnessReadyActivity[] = [];

				_.forEach(activities, (activity: ISyncActivityComputed) => {

					// Check if activity is eligible to fitness computing
					const hasHeartRateData: boolean = (activity.extendedStats
						&& !_.isEmpty(activity.extendedStats.heartRateData)
						&& _.isNumber(activity.extendedStats.heartRateData.TRIMP));

					const isPowerMeterUsePossible: boolean = (activity.type === "Ride" || activity.type === "VirtualRide")
						&& powerMeterEnable
						&& _.isNumber(cyclingFtp)
						&& activity.extendedStats && activity.extendedStats.powerData
						&& activity.extendedStats.powerData.hasPowerMeter
						&& _.isNumber(activity.extendedStats.powerData.weightedPower);

					const hasSwimmingData: boolean = (swimEnable && _.isNumber(swimFtp) && swimFtp > 0
						&& activity.type === "Swim"
						&& _.isNumber(activity.distance_raw) && _.isNumber(activity.moving_time_raw)
						&& activity.moving_time_raw > 0);

					if (hasHeartRateData || isPowerMeterUsePossible || hasSwimmingData) {

						const momentStartTime: Moment = moment(activity.start_time);

						const fitnessReadyActivity: IFitnessReadyActivity = {
							id: activity.id,
							date: momentStartTime.toDate(),
							timestamp: momentStartTime.toDate().getTime(),
							dayOfYear: momentStartTime.dayOfYear(),
							year: momentStartTime.year(),
							type: activity.type,
							activityName: activity.name,

						};

						if (hasHeartRateData) {
							fitnessReadyActivity.trimpScore = activity.extendedStats.heartRateData.TRIMP;
						}

						if (isPowerMeterUsePossible) {
							fitnessReadyActivity.powerStressScore = (activity.moving_time_raw * activity.extendedStats.powerData.weightedPower *
								(activity.extendedStats.powerData.weightedPower / cyclingFtp) / (cyclingFtp * 3600) * 100);
						}

						if (hasSwimmingData) {
							const normalizedSwimSpeed = activity.distance_raw / (activity.moving_time_raw / 60); // Normalized_Swim_Speed (m/min) = distance(m) / timeInMinutesNoRest
							const swimIntensity = normalizedSwimSpeed / swimFtp; // Intensity = Normalized_Swim_Speed / Swim FTP
							fitnessReadyActivity.swimStressScore = Math.pow(swimIntensity, 3) * (activity.elapsed_time_raw / 3600) * 100; // Swim Stress Score = Intensity^3 * TotalTimeInHours * 100
						}

						fitnessReadyActivities.push(fitnessReadyActivity);
					}
				});

				resolve(fitnessReadyActivities);
			});
		});
	}

	/**
	 *
	 * @param {boolean} powerMeterEnable
	 * @param {number} cyclingFtp
	 * @param {boolean} swimEnable
	 * @param {number} swimFtp
	 * @returns {Promise<IDayActivity[]>}
	 */
	public getDailyActivity(powerMeterEnable: boolean,
							cyclingFtp: number,
							swimEnable: boolean,
							swimFtp: number): Promise<IDayActivity[]> {

		return new Promise((resolve: (activityDays: IDayActivity[]) => void,
							reject: (error: string) => void) => {

			this.filterFitnessReady(powerMeterEnable, cyclingFtp, swimEnable, swimFtp)
				.then((fitnessReadyActivities: IFitnessReadyActivity[]) => {

					if (_.isEmpty(fitnessReadyActivities)) {
						reject("No ready activities");
						return;
					}

					// Subtract 1 day to the first activity done in history:
					// Goal is to show graph point with 1 day before
					const startDay = moment(_.first(fitnessReadyActivities).date).subtract(1, "days").startOf("day");

					const today: Moment = this.getTodayMoment().startOf("day"); // Today end of day

					// Now inject days off/resting
					const dailyActivity: IDayActivity[] = [];
					const currentDay = moment(startDay).clone();

					while (currentDay.isSameOrBefore(today)) {

						// Compute athlete activity on that current day. Rest or active. Provide final stress score if active.
						const dayActivity: IDayActivity = this.athleteDayActivity(currentDay, fitnessReadyActivities);

						// Then push every day... Rest or active...
						dailyActivity.push(dayActivity);

						// If current day is today. The last real day right?! Then leave the loop !
						if (currentDay.isSame(today)) break;

						// Add a day until today is reached :)
						currentDay.add(1, "days")
					}

					// Then add PREVIEW days
					this.appendPreviewDaysToDailyActivity(currentDay, dailyActivity);

					resolve(dailyActivity);
				})
		});
	}

	/**
	 *
	 * @param {moment.Moment} startFrom
	 * @param {IDayActivity[]} dailyActivity
	 */
	private appendPreviewDaysToDailyActivity(startFrom: moment.Moment, dailyActivity: IDayActivity[]) {

		for (let i: number = 0; i < ActivityService.FUTURE_DAYS_PREVIEW; i++) {

			const futureDate: Date = startFrom.add(1, "days").startOf("day").toDate();

			const dayActivity: IDayActivity = {
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
	 * @returns {IDayActivity}
	 */
	private athleteDayActivity(currentDay: moment.Moment, fitnessReadyActivities: IFitnessReadyActivity[]): IDayActivity {

		const foundActivitiesThatDay: IFitnessReadyActivity[] = _.filter(fitnessReadyActivities, {
			year: currentDay.year(),
			dayOfYear: currentDay.dayOfYear(),
		});

		const dayActivity: IDayActivity = {
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

	get activityDao(): ActivityDao {
		return this._activityDao;
	}

	set activityDao(value: ActivityDao) {
		this._activityDao = value;
	}

}
