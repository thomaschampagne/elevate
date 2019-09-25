import { Injectable } from "@angular/core";
import { BaseDao } from "../base.dao";
import { StorageLocationModel } from "../../data-store/storage-location.model";
import { StorageType } from "../../data-store/storage-type.enum";

@Injectable()
export class SyncDateTimeDao extends BaseDao<number> {

	public static readonly STORAGE_LOCATION: StorageLocationModel = new StorageLocationModel("syncDateTime", StorageType.SINGLE_VALUE);

	public getDefaultStorageValue(): number {
		return null;
	}

	public getStorageLocation(): StorageLocationModel {
		return SyncDateTimeDao.STORAGE_LOCATION;
	}
}
