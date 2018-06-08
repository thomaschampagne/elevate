import { Injectable } from "@angular/core";
import * as _ from "lodash";
import { SyncedActivityModel } from "../../../../../../shared/models/sync/synced-activity.model";

@Injectable()
export class ActivityDao {

	public static readonly SYNCED_ACTIVITIES_KEY: string = "syncedActivities";

	constructor() {
	}

	/**
	 *
	 * @returns {Promise<SyncedActivityModel[]>} stored SyncedActivityModels
	 */
	public fetch(): Promise<SyncedActivityModel[]> {
		return new Promise<SyncedActivityModel[]>((resolve) => {
			this.browserStorageLocal().get(ActivityDao.SYNCED_ACTIVITIES_KEY, (result: { syncedActivities: SyncedActivityModel[] }) => {
				const syncedActivityModels = (_.isEmpty(result.syncedActivities)) ? null : result.syncedActivities;
				resolve(syncedActivityModels);
			});
		});
	}

	/**
	 *
	 * @param {SyncedActivityModel[]} syncedActivityModels
	 * @returns {Promise<SyncedActivityModel[]>} saved SyncedActivityModels
	 */
	public save(syncedActivityModels: SyncedActivityModel[]): Promise<SyncedActivityModel[]> {
		return new Promise<SyncedActivityModel[]>((resolve) => {
			const syncedActivityData: any = {};
			syncedActivityData[ActivityDao.SYNCED_ACTIVITIES_KEY] = syncedActivityModels;
			this.browserStorageLocal().set(syncedActivityData, () => {
				this.fetch().then((models: SyncedActivityModel[]) => {
					resolve(models);
				});
			});
		});
	}

	/**
	 *
	 * @returns {Promise<SyncedActivityModel[]>} cleared SyncedActivityModels
	 */
	public clear(): Promise<SyncedActivityModel[]> {
		return new Promise<SyncedActivityModel[]>((resolve, reject) => {
			this.browserStorageLocal().remove(ActivityDao.SYNCED_ACTIVITIES_KEY, () => {
				this.fetch().then((syncedActivityModels: SyncedActivityModel[]) => {
					(_.isEmpty(syncedActivityModels)) ? resolve(syncedActivityModels) : reject("SyncedActivityModels have not been deleted");
				});
			});
		});
	}

	/**
	 *
	 * @returns {chrome.storage.SyncStorageArea}
	 */
	public browserStorageLocal(): chrome.storage.LocalStorageArea {
		return chrome.storage.local;
	}

	/**
	 *
	 * @param {number[]} activitiesToDelete
	 * @returns {Promise<SyncedActivityModel[]>}
	 */
	public removeByIds(activitiesToDelete: number[]): Promise<SyncedActivityModel[]> {
		return this.fetch().then((models: SyncedActivityModel[]) => {
			const modelsToBeSaved = _.filter(models, (syncedActivityModel: SyncedActivityModel) => {
				return (_.indexOf(activitiesToDelete, syncedActivityModel.id) === -1);
			});
			return this.save(modelsToBeSaved);
		});
	}
}
