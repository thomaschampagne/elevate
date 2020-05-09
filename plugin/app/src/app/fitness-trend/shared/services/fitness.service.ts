import * as _ from "lodash";
import * as moment from "moment";
import { Moment } from "moment";
import { Injectable } from "@angular/core";
import { ActivityService } from "../../../shared/services/activity/activity.service";
import { DayStressModel } from "../models/day-stress.model";
import { DayFitnessTrendModel } from "../models/day-fitness-trend.model";
import { FitnessPreparedActivityModel } from "../models/fitness-prepared-activity.model";
import { HeartRateImpulseMode } from "../enums/heart-rate-impulse-mode.enum";
import { AppError } from "../../../shared/models/app-error.model";
import { SyncedActivityModel } from "@elevate/shared/models";
import { FitnessTrendConfigModel } from "../models/fitness-trend-config.model";

@Injectable()
export class FitnessService {

	public static readonly FUTURE_DAYS_PREVIEW: number = 14;
	public static readonly DEFAULT_LTHR_KARVONEN_HRR_FACTOR: number = 0.85;

	constructor(public activityService: ActivityService) {
	}

	/**
	 * Prepare activities by assigning stress scores on each of them
	 * @param {FitnessTrendConfigModel} fitnessTrendConfigModel
	 * @param {boolean} powerMeterEnable
	 * @param {boolean} swimEnable
	 * @param {string[]} skipActivityTypes
	 * @returns {Promise<FitnessPreparedActivityModel[]>}
	 */
	public prepare(fitnessTrendConfigModel: FitnessTrendConfigModel,
				   powerMeterEnable: boolean,
				   swimEnable: boolean,
				   skipActivityTypes?: string[]): Promise<FitnessPreparedActivityModel[]> {

		return new Promise((resolve: (result: FitnessPreparedActivityModel[]) => void,
							reject: (error: AppError) => void) => {

			return this.activityService.fetch().then((activities: SyncedActivityModel[]) => {

				// Check if provided activities are not empty
				if (_.isEmpty(activities) || activities.length === 0) {
					reject(new AppError(AppError.FT_NO_ACTIVITIES,
						"No activities available to generate the fitness trend"));
				}

				activities = this.filterActivities(activities, fitnessTrendConfigModel.ignoreBeforeDate,
					fitnessTrendConfigModel.ignoreActivityNamePatterns);

				// Check if activities filtered are not empty
				if (_.isEmpty(activities) || activities.length === 0) {
					reject(new AppError(AppError.FT_ALL_ACTIVITIES_FILTERED,
						"No activities available. They all have been filtered. Unable to generate the fitness trend."));
				}

				const fitnessPreparedActivities: FitnessPreparedActivityModel[] = [];

				_.forEach(activities, (activity: SyncedActivityModel) => {

					if (!_.isEmpty(skipActivityTypes) && _.indexOf(skipActivityTypes, activity.type) !== -1) {
						return;
					}

					if (!activity.athleteSnapshot) {
						reject(new AppError(AppError.FT_NO_ACTIVITY_ATHLETE_MODEL,
							"Some of your synced activities are missing athlete settings. To fix that check " +
							"your athlete settings and \"clear and re-sync your activities\""));
						return;
					}

					// Check if activity is eligible to fitness computing
					const hasHeartRateData: boolean = activity.extendedStats
						&& !_.isEmpty(activity.extendedStats.heartRateData)
						&& ((_.isNumber(activity.extendedStats.heartRateData.TRIMP) && fitnessTrendConfigModel.heartRateImpulseMode === HeartRateImpulseMode.TRIMP)
							|| (_.isNumber(activity.extendedStats.heartRateData.HRSS) && fitnessTrendConfigModel.heartRateImpulseMode === HeartRateImpulseMode.HRSS));

					const hasPowerData: boolean = (activity.type === "Ride" || activity.type === "VirtualRide" || activity.type === "EBikeRide")
						&& powerMeterEnable
						&& fitnessTrendConfigModel.heartRateImpulseMode !== HeartRateImpulseMode.TRIMP
						&& _.isNumber(activity.athleteSnapshot.athleteSettings.cyclingFtp)
						&& activity.extendedStats
						&& activity.extendedStats.powerData
						&& (activity.extendedStats.powerData.hasPowerMeter || fitnessTrendConfigModel.allowEstimatedPowerStressScore)
						&& _.isNumber(activity.extendedStats.powerData.powerStressScore);

					const hasRunningData: boolean = (activity.type === "Run" || activity.type === "VirtualRun")
						&& fitnessTrendConfigModel.heartRateImpulseMode !== HeartRateImpulseMode.TRIMP
						&& _.isNumber(activity.athleteSnapshot.athleteSettings.runningFtp)
						&& activity.extendedStats
						&& activity.extendedStats.paceData
						&& _.isNumber(activity.extendedStats.paceData.runningStressScore)
						&& fitnessTrendConfigModel.allowEstimatedRunningStressScore;

					const hasSwimmingData: boolean = (swimEnable
						&& _.isNumber(activity.athleteSnapshot.athleteSettings.swimFtp)
						&& activity.athleteSnapshot.athleteSettings.swimFtp > 0
						&& activity.type === "Swim"
						&& fitnessTrendConfigModel.heartRateImpulseMode !== HeartRateImpulseMode.TRIMP
						&& _.isNumber(activity.distance_raw) && _.isNumber(activity.moving_time_raw)
						&& activity.moving_time_raw > 0);

					const momentStartTime: Moment = moment(activity.start_time);

					const fitnessReadyActivity: FitnessPreparedActivityModel = {
						id: activity.id,
						date: momentStartTime.toDate(),
						timestamp: momentStartTime.toDate().getTime(),
						dayOfYear: momentStartTime.dayOfYear(),
						year: momentStartTime.year(),
						type: activity.type,
						hasPowerMeter: (activity.extendedStats && activity.extendedStats.powerData && activity.extendedStats.powerData.hasPowerMeter),
						name: activity.name,
						athleteSnapshot: activity.athleteSnapshot
					};

					if (hasHeartRateData) {

						if (fitnessTrendConfigModel.heartRateImpulseMode === HeartRateImpulseMode.TRIMP) {
							fitnessReadyActivity.trainingImpulseScore = activity.extendedStats.heartRateData.TRIMP;
						} else if (fitnessTrendConfigModel.heartRateImpulseMode === HeartRateImpulseMode.HRSS) {
							fitnessReadyActivity.heartRateStressScore = activity.extendedStats.heartRateData.HRSS;
						}
					}

					if (hasPowerData) {
						fitnessReadyActivity.powerStressScore = activity.extendedStats.powerData.powerStressScore;
					}

					if (hasRunningData) {
						fitnessReadyActivity.runningStressScore = activity.extendedStats.paceData.runningStressScore;
					}

					if (hasSwimmingData) {
						fitnessReadyActivity.swimStressScore = this.computeSwimStressScore(activity.distance_raw,
							activity.moving_time_raw,
							activity.elapsed_time_raw,
							activity.athleteSnapshot.athleteSettings.swimFtp);
					}

					fitnessPreparedActivities.push(fitnessReadyActivity);
				});

				resolve(fitnessPreparedActivities);
			});
		});
	}

	/**
	 * Return day by day the athlete stress. Active & rest days included
	 * @param {FitnessTrendConfigModel} fitnessTrendConfigModel
	 * @param {boolean} powerMeterEnable
	 * @param {boolean} swimEnable
	 * @param {string[]} skipActivityTypes
	 * @returns {Promise<DayStressModel[]>}
	 */
	public generateDailyStress(fitnessTrendConfigModel: FitnessTrendConfigModel,
							   powerMeterEnable: boolean,
							   swimEnable: boolean,
							   skipActivityTypes?: string[]): Promise<DayStressModel[]> {

		return new Promise((resolve: (activityDays: DayStressModel[]) => void,
							reject: (error: string) => void) => {

			this.prepare(fitnessTrendConfigModel, powerMeterEnable, swimEnable, skipActivityTypes)
				.then((fitnessPreparedActivities: FitnessPreparedActivityModel[]) => {

					// Subtract 1 day to the first activity done in history:
					// Goal is to show graph point with 1 day before
					const startDay = moment(_.first(fitnessPreparedActivities).date)
						.subtract(1, "days").startOf("day");

					const today: Moment = this.getTodayMoment().startOf("day"); // Today end of day

					// Now inject days off/resting
					const dailyActivity: DayStressModel[] = [];
					const currentDay = moment(startDay).clone();

					while (currentDay.isSameOrBefore(today, "day")) {

						// Compute athlete stress on that current day.
						const dayStress: DayStressModel = this.dayStressOnDate(currentDay, fitnessPreparedActivities);

						// Then push every day... Rest or active...
						dailyActivity.push(dayStress);

						// If current day is today. The last real day right?! Then leave the loop !
						if (currentDay.isSame(today, "day")) {
							break;
						}

						// Add a day until today is reached :)
						currentDay.add(1, "days");
					}

					// Then add PREVIEW days
					this.appendPreviewDaysToDailyActivity(currentDay, dailyActivity);

					resolve(dailyActivity);

				}, error => reject(error));
		});
	}

	/**
	 *
	 * @param {number} distance
	 * @param {number} movingTime
	 * @param {number} elaspedTime
	 * @param {number} swimFtp
	 * @returns {number}
	 */
	public computeSwimStressScore(distance: number, movingTime: number, elaspedTime: number, swimFtp: number) {
		const normalizedSwimSpeed = distance / (movingTime / 60); // Normalized_Swim_Speed (m/min) = distance(m) / timeInMinutesNoRest
		const swimIntensity = normalizedSwimSpeed / swimFtp; // Intensity = Normalized_Swim_Speed / Swim FTP
		return Math.pow(swimIntensity, 3) * (elaspedTime / 3600) * 100; // Swim Stress Score = Intensity^3 * TotalTimeInHours * 100
	}

	/**
	 * ComputeTrend the fitness trend
	 * @param {FitnessTrendConfigModel} fitnessTrendConfigModel
	 * @param {boolean} isPowerMeterEnabled
	 * @param {boolean} isSwimEnabled
	 * @param {string[]} skipActivityTypes
	 * @returns {Promise<DayFitnessTrendModel[]>}
	 */
	public computeTrend(fitnessTrendConfigModel: FitnessTrendConfigModel,
						isPowerMeterEnabled: boolean,
						isSwimEnabled: boolean,
						skipActivityTypes?: string[]): Promise<DayFitnessTrendModel[]> {

		return new Promise((resolve: (fitnessTrend: DayFitnessTrendModel[]) => void,
							reject: (error: string) => void) => {

			this.generateDailyStress(fitnessTrendConfigModel, isPowerMeterEnabled, isSwimEnabled, skipActivityTypes)
				.then((dailyActivity: DayStressModel[]) => {

					let ctl, atl, tsb;

					const fitnessTrend: DayFitnessTrendModel[] = [];

					let previousDayFitnessTrend: DayFitnessTrendModel = null;

					_.forEach(dailyActivity, (dayStress: DayStressModel, index: number) => {

						const isPreStartDay = (index === 0);

						if (isPreStartDay) {

							if (fitnessTrendConfigModel.initializedFitnessTrendModel) {
								ctl = (!_.isNull(fitnessTrendConfigModel.initializedFitnessTrendModel.ctl)) ? fitnessTrendConfigModel.initializedFitnessTrendModel.ctl : 0;
								atl = (!_.isNull(fitnessTrendConfigModel.initializedFitnessTrendModel.atl)) ? fitnessTrendConfigModel.initializedFitnessTrendModel.atl : 0;
								tsb = ctl - atl;
							} else {
								ctl = atl = tsb = 0;
							}

						} else {
							tsb = ctl - atl;
							ctl = ctl + (dayStress.finalStressScore - ctl) * (1 - Math.exp(-1 / 42));
							atl = atl + (dayStress.finalStressScore - atl) * (1 - Math.exp(-1 / 7));
						}

						let dayFitnessTrend: DayFitnessTrendModel;

						if (previousDayFitnessTrend) {
							dayFitnessTrend = new DayFitnessTrendModel(dayStress, ctl, atl, tsb, previousDayFitnessTrend.ctl,
								previousDayFitnessTrend.atl, previousDayFitnessTrend.tsb);
						} else {
							dayFitnessTrend = new DayFitnessTrendModel(dayStress, ctl, atl, tsb);
						}

						if (_.isNumber(dayStress.heartRateStressScore) && dayStress.heartRateStressScore > 0) {
							dayFitnessTrend.heartRateStressScore = dayStress.heartRateStressScore;
						}

						if (_.isNumber(dayStress.trainingImpulseScore) && dayStress.trainingImpulseScore > 0) {
							dayFitnessTrend.trainingImpulseScore = dayStress.trainingImpulseScore;
						}

						if (_.isNumber(dayStress.powerStressScore) && dayStress.powerStressScore > 0) {
							dayFitnessTrend.powerStressScore = dayStress.powerStressScore;
						}

						if (_.isNumber(dayStress.runningStressScore) && dayStress.runningStressScore > 0) {
							dayFitnessTrend.runningStressScore = dayStress.runningStressScore;
						}

						if (_.isNumber(dayStress.swimStressScore) && dayStress.swimStressScore > 0) {
							dayFitnessTrend.swimStressScore = dayStress.swimStressScore;
						}

						if (_.isNumber(dayStress.finalStressScore) && dayStress.finalStressScore > 0) {
							dayFitnessTrend.finalStressScore = dayStress.finalStressScore;
						}

						//Calculate the ramp rates
						if (index >= 7 ) { //only calculate weekly RR if we have a week of data
							dayFitnessTrend.rr7d = _.floor(ctl, 1) - _.floor(fitnessTrend[index - 7].ctl, 1);
							dayFitnessTrend.prevRR7d = previousDayFitnessTrend.rr7d;
						}
						if (index >= 28 ) { //only calculate monthly RR if we have a month of data
							dayFitnessTrend.rr28d = _.floor(ctl, 1) - _.floor(fitnessTrend[index - 28].ctl, 1);
							dayFitnessTrend.prevRR28d = previousDayFitnessTrend.rr28d;
						}
						if (index >= 90 ) { //only calculate 3mo RR if we have 3mo of data
							dayFitnessTrend.rr90d = _.floor(ctl, 1) - _.floor(fitnessTrend[index - 90].ctl, 1);
							dayFitnessTrend.prevRR90d = previousDayFitnessTrend.rr90d;
						}
						if (index >= 365 ) { //only calculate yearly RR if we have a year of data
							dayFitnessTrend.rr365d = _.floor(ctl, 1) - _.floor(fitnessTrend[index - 365].ctl, 1);
							dayFitnessTrend.prevRR365d = previousDayFitnessTrend.rr365d;
						}

						previousDayFitnessTrend = dayFitnessTrend;

						fitnessTrend.push(dayFitnessTrend);

					});

					resolve(fitnessTrend);

				}, error => reject(error)); // e.g. No activities found
		});
	}

	/**
	 *
	 * @param {moment.Moment} startFrom
	 * @param {DayStressModel[]} dailyActivity
	 */
	public appendPreviewDaysToDailyActivity(startFrom: moment.Moment, dailyActivity: DayStressModel[]) {

		for (let i = 0; i < FitnessService.FUTURE_DAYS_PREVIEW; i++) {

			const futureDate: Date = startFrom.add(1, "days").startOf("day").toDate();

			const dayActivity: DayStressModel = new DayStressModel(futureDate, true);

			dailyActivity.push(dayActivity);
		}
	}

	/**
	 *
	 * @param {moment.Moment} currentDay
	 * @param {FitnessPreparedActivityModel[]} fitnessPreparedActivities
	 * @returns {DayStressModel}
	 */

	public dayStressOnDate(currentDay: moment.Moment, fitnessPreparedActivities: FitnessPreparedActivityModel[]): DayStressModel {

		const foundActivitiesThatDay: FitnessPreparedActivityModel[] = _.filter(fitnessPreparedActivities, {
			year: currentDay.year(),
			dayOfYear: currentDay.dayOfYear(),
		});

		const dayActivity: DayStressModel = new DayStressModel(currentDay.toDate(), false);

		// Compute final stress scores on that day
		if (foundActivitiesThatDay.length > 0) {

			_.forEach(foundActivitiesThatDay, (activity: FitnessPreparedActivityModel) => {

				dayActivity.ids.push(activity.id);
				dayActivity.activitiesName.push(activity.name);
				dayActivity.types.push(activity.type);
				dayActivity.athleteSnapshot = activity.athleteSnapshot;

				const hasPowerStressScore = _.isNumber(activity.powerStressScore);
				const hasHeartRateStressScore = _.isNumber(activity.heartRateStressScore);
				const hasRunningStressScore = _.isNumber(activity.runningStressScore);
				const hasSwimStressScore = _.isNumber(activity.swimStressScore);

				// Apply scores for that day
				if (hasPowerStressScore) {
					if (!dayActivity.powerStressScore) { // Initialize value if not exists
						dayActivity.powerStressScore = 0;
					}
					dayActivity.powerStressScore += activity.powerStressScore;
				}

				// HRSS
				if (hasHeartRateStressScore) { // Check for HRSS score if available
					if (!dayActivity.heartRateStressScore) { // Initialize value if not exists
						dayActivity.heartRateStressScore = 0;
					}
					dayActivity.heartRateStressScore += activity.heartRateStressScore;
				}

				// RSS
				if (hasRunningStressScore) { // Check for RSS score if available
					if (!dayActivity.runningStressScore) { // Initialize value if not exists
						dayActivity.runningStressScore = 0;
					}
					dayActivity.runningStressScore += activity.runningStressScore;
				}

				// TRIMP
				if (_.isNumber(activity.trainingImpulseScore)) { // Check for TRIMP score if available
					if (!dayActivity.trainingImpulseScore) { // Initialize value if not exists
						dayActivity.trainingImpulseScore = 0;
					}
					dayActivity.trainingImpulseScore += activity.trainingImpulseScore;
				}

				// SwimSS
				if (hasSwimStressScore) { // Check for TRIMP score if available
					if (!dayActivity.swimStressScore) { // Initialize value if not exists
						dayActivity.swimStressScore = 0;
					}
					dayActivity.swimStressScore += activity.swimStressScore;
				}

				// Apply final stress score for that day
				// Stress scores priorities for final score:
				// - PSS w/ Power meter
				// - HRSS
				// - TRIMP
				// - PSS without Power meter
				// - RSS
				// - SSS
				if (activity.powerStressScore && activity.hasPowerMeter) {
					dayActivity.finalStressScore += activity.powerStressScore;
				} else if (activity.heartRateStressScore) {
					dayActivity.finalStressScore += activity.heartRateStressScore;
				} else if (activity.trainingImpulseScore) {
					dayActivity.finalStressScore += activity.trainingImpulseScore;
				} else if (activity.powerStressScore && !activity.hasPowerMeter) {
					dayActivity.finalStressScore += activity.powerStressScore;
				} else if (activity.runningStressScore) {
					dayActivity.finalStressScore += activity.runningStressScore;
				} else if (activity.swimStressScore) {
					dayActivity.finalStressScore += activity.swimStressScore;
				}
			});

		}

		return dayActivity;
	}

	/**
	 *
	 * @param {SyncedActivityModel[]} activities
	 * @param {string} ignoreBeforeDate
	 * @param {string[]} ignoreActivityNamePatterns
	 * @returns {SyncedActivityModel[]}
	 */
	public filterActivities(activities: SyncedActivityModel[], ignoreBeforeDate: string, ignoreActivityNamePatterns: string[]): SyncedActivityModel[] {

		const hasIgnoreBeforeDate = !_.isEmpty(ignoreBeforeDate);
		const hasIgnoreActivityNamePatterns = ignoreActivityNamePatterns && ignoreActivityNamePatterns.length > 0;

		if (hasIgnoreBeforeDate || hasIgnoreActivityNamePatterns) {

			activities = _.filter(activities, (activity: SyncedActivityModel) => {

				if (hasIgnoreBeforeDate) {
					const isActivityAfterIgnoreDate = moment(activity.start_time).startOf("day").isSameOrAfter(ignoreBeforeDate);
					if (!isActivityAfterIgnoreDate) {
						return false;
					}
				}

				if (hasIgnoreActivityNamePatterns) {

					let ignoreActivityFromPattern = false;
					_.forEach(ignoreActivityNamePatterns, (ignorePattern: string) => {
						const hasPattern = activity.name.indexOf(ignorePattern) !== -1;
						if (hasPattern) {
							ignoreActivityFromPattern = true;
							return;
						}
					});

					if (ignoreActivityFromPattern) {
						return false;
					}
				}

				return true;
			});
		}

		return activities;
	}

	public getTodayMoment(): Moment {
		return moment();
	}


}
