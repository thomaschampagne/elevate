import { Injectable } from "@angular/core";
import { ActivityDao } from "../../dao/activity/activity.dao";
import { SyncedActivityModel } from "../../../../../../common/scripts/models/Sync";

@Injectable()
export class ActivityService {

	constructor(public activityDao: ActivityDao) {
	}

	/**
	 *
	 * @returns {Promise<SyncedActivityModel[]>} stored SyncedActivityModels
	 */
	public fetch(): Promise<SyncedActivityModel[]> {
		return this.activityDao.fetch();
	}

	/**
	 *
	 * @param {SyncedActivityModel[]} syncedActivityModels
	 * @returns {Promise<SyncedActivityModel[]>} saved SyncedActivityModels
	 */
	public save(syncedActivityModels: SyncedActivityModel[]): Promise<SyncedActivityModel[]> {
		return this.activityDao.save(syncedActivityModels);
	}

	/**
	 *
	 * @returns {Promise<SyncedActivityModel[]>} removed SyncedActivityModels
	 */
	public remove(): Promise<SyncedActivityModel[]> {
		return this.activityDao.remove();
	}
}

