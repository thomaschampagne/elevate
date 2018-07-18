import { Injectable } from "@angular/core";
import { ActivityDao } from "../../dao/activity/activity.dao";
import { SyncedActivityModel } from "../../../../../../shared/models/sync/synced-activity.model";

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
	 * @returns {Promise<SyncedActivityModel[]>} cleared SyncedActivityModels
	 */
	public clear(): Promise<SyncedActivityModel[]> {
		return this.activityDao.clear();
	}

	/**
	 *
	 * @param {number[]} activitiesToDelete
	 * @returns {Promise<SyncedActivityModel[]>}
	 */
	public removeByIds(activitiesToDelete: number[]): Promise<SyncedActivityModel[]> {
		return this.activityDao.removeByIds(activitiesToDelete);
	}
}

