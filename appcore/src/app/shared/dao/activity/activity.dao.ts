import { Injectable } from "@angular/core";
import { SyncedActivityModel } from "@elevate/shared/models";
import { BaseDao } from "../base.dao";
import { StorageLocationModel } from "../../data-store/storage-location.model";
import { StorageType } from "../../data-store/storage-type.enum";

@Injectable()
export class ActivityDao extends BaseDao<SyncedActivityModel> {

	public static readonly STORAGE_LOCATION: StorageLocationModel = new StorageLocationModel("syncedActivities", StorageType.COLLECTION,
		SyncedActivityModel.ID_FIELD);
	public static readonly DEFAULT_STORAGE_VALUE: SyncedActivityModel[] = [];

	public getStorageLocation(): StorageLocationModel {
		return ActivityDao.STORAGE_LOCATION;
	}

	public getDefaultStorageValue(): SyncedActivityModel[] | SyncedActivityModel {
		return ActivityDao.DEFAULT_STORAGE_VALUE;
	}
}
