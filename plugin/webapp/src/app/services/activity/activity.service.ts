import { Injectable } from '@angular/core';
import { ActivityDao } from "../../dao/activity/activity.dao";
import { ISyncActivityComputed } from "../../../../../common/scripts/interfaces/ISync";

@Injectable()
export class ActivityService {

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
