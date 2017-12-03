import { Injectable } from '@angular/core';
import { ActivityDao } from "../../dao/activity/activity.dao";
import { ISyncActivityComputed } from "../../../../../common/scripts/interfaces/ISync";

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


	get activityDao(): ActivityDao {
		return this._activityDao;
	}

	set activityDao(value: ActivityDao) {
		this._activityDao = value;
	}

}
