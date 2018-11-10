import { Injectable } from "@angular/core";
import * as _ from "lodash";
import { AppStorageType, SyncedActivityModel } from "@elevate/shared/models";
import { BaseDao } from "../base.dao";
import { StorageLocationModel } from "../../data-store/storage-location.model";

@Injectable()
export class ActivityDao extends BaseDao<SyncedActivityModel> {

	public static readonly STORAGE_LOCATION: StorageLocationModel = new StorageLocationModel(AppStorageType.LOCAL, "syncedActivities");

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
			return (<Promise<SyncedActivityModel[]>> this.save(modelsToBeSaved));
		});
	}
}
