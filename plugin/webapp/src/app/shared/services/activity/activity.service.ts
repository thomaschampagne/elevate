import { Injectable } from "@angular/core";
import { ActivityDao } from "../../dao/activity/activity.dao";
import { SyncedActivityModel } from "../../../../../../common/scripts/models/Sync";

@Injectable()
export class ActivityService {

	constructor(public activityDao: ActivityDao) {
	}

	/**
	 *
	 * @returns {Promise<SyncedActivityModel[]>}
	 */
	public fetch(): Promise<SyncedActivityModel[]> {
		return this.activityDao.fetch();
	}

}
