import { Injectable } from "@angular/core";
import { AppStorageType, UserSettingsModel } from "@elevate/shared/models";
import { BaseDao } from "../base.dao";
import { StorageLocationModel } from "../../data-store/storage-location.model";

@Injectable()
export class UserSettingsDao extends BaseDao<UserSettingsModel> {

	public static readonly STORAGE_LOCATION: StorageLocationModel = new StorageLocationModel(AppStorageType.SYNC);

	public init(): void {
		this.storageLocation = UserSettingsDao.STORAGE_LOCATION;
	}
}
