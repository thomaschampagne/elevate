import { Injectable } from "@angular/core";
import * as _ from "lodash";
import { SyncedActivityModel } from "@elevate/shared/models";
import { BaseDao } from "../base.dao";
import { StorageLocationModel } from "../../data-store/storage-location.model";
import { StorageType } from "../../data-store/storage-type.enum";

@Injectable()
export class ActivityDao extends BaseDao<SyncedActivityModel> {

	public static readonly STORAGE_LOCATION: StorageLocationModel = new StorageLocationModel("syncedActivities", StorageType.LIST);
	public static readonly DEFAULT_STORAGE_VALUE: SyncedActivityModel[] = [];

	public getStorageLocation(): StorageLocationModel {
		return ActivityDao.STORAGE_LOCATION;
	}

	public getDefaultStorageValue(): SyncedActivityModel[] | SyncedActivityModel {
		return ActivityDao.DEFAULT_STORAGE_VALUE;
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
