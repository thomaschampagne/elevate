import { Injectable } from "@angular/core";
import { SyncedActivityModel } from "../../../../../../common/scripts/models/Sync";
import * as _ from "lodash";

@Injectable()
export class ActivityDao {

	public static readonly SYNCED_ACTIVITIES_KEY: string = "computedActivities";

	constructor() {
	}

	/**
	 *
	 * @returns {Promise<SyncedActivityModel[]>} stored SyncedActivityModels
	 */
	public fetch(): Promise<SyncedActivityModel[]> {
		return new Promise<SyncedActivityModel[]>((resolve) => {
			this.chromeStorageLocal().get(ActivityDao.SYNCED_ACTIVITIES_KEY, (result: { computedActivities: SyncedActivityModel[] }) => {
				const syncedActivityModels = (_.isEmpty(result.computedActivities)) ? null : result.computedActivities;
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
			this.chromeStorageLocal().set(syncedActivityData, () => {
				this.fetch().then((athleteProfileModel: SyncedActivityModel[]) => {
					resolve(athleteProfileModel);
				});
			});

		});
	}

	/**
	 *
	 * @returns {Promise<SyncedActivityModel[]>} removed SyncedActivityModels
	 */
	public remove(): Promise<SyncedActivityModel[]> {
		return new Promise<SyncedActivityModel[]>((resolve, reject) => {
			this.chromeStorageLocal().remove(ActivityDao.SYNCED_ACTIVITIES_KEY, () => {
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
	public chromeStorageLocal(): chrome.storage.LocalStorageArea {
		return chrome.storage.local;
	}
}
