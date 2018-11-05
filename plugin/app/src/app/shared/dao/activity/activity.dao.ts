import { Injectable } from "@angular/core";
import * as _ from "lodash";
import { AppStorageType, SyncedActivityModel } from "@elevate/shared/models";
import { BaseDao } from "../base.dao";
import { StorageLocation } from "../../data-store/storage-location";

@Injectable()
export class ActivityDao extends BaseDao<SyncedActivityModel> {

	public static readonly STORAGE_LOCATION: StorageLocation = {
		key: "syncedActivities",
		type: AppStorageType.LOCAL
	};

	public init(): void {
		this.storageLocation = ActivityDao.STORAGE_LOCATION;
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
