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
	 * Return activities having required data to compute fitness trend: heart rate, power data & swim data
	 * @param {boolean} powerMeterEnable
	 * @param {number} cyclingFtp
	 * @param {boolean} swimEnable
	 * @param {number} swimFtp
	 * @returns {Promise<IFitnessReadyActivity[]>}
	 */
	// TODO Move back to fitness service? Because of below TODOs
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

						if (isPowerMeterUsePossible) { // TODO This computation should be coded/tested in fitness service
							fitnessReadyActivity.powerStressScore = (activity.moving_time_raw * activity.extendedStats.powerData.weightedPower *
								(activity.extendedStats.powerData.weightedPower / cyclingFtp) / (cyclingFtp * 3600) * 100);
						}

						if (hasSwimmingData) { // TODO This computation should be coded/tested in fitness service
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



	get activityDao(): ActivityDao {
		return this._activityDao;
	}

	set activityDao(value: ActivityDao) {
		this._activityDao = value;
	}

}
