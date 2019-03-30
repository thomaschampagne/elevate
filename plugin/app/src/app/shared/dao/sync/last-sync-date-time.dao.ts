import { Injectable } from "@angular/core";
import { BaseDao } from "../base.dao";
import { StorageLocationModel } from "../../data-store/storage-location.model";

@Injectable()
export class LastSyncDateTimeDao extends BaseDao<number> {

	public static readonly STORAGE_LOCATION: StorageLocationModel = new StorageLocationModel("lastSyncDateTime");

	public getDefaultStorageValue(): number {
		return null;
	}

	public getStorageLocation(): StorageLocationModel {
		return LastSyncDateTimeDao.STORAGE_LOCATION;
	}
}
