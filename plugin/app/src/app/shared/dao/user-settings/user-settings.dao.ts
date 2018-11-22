import { Injectable } from "@angular/core";
import { AppStorageType, UserSettingsModel } from "@elevate/shared/models";
import { BaseDao } from "../base.dao";
import { StorageLocationModel } from "../../data-store/storage-location.model";
import { userSettingsData } from "@elevate/shared/data";

@Injectable()
export class UserSettingsDao extends BaseDao<UserSettingsModel> {

	public static readonly STORAGE_LOCATION: StorageLocationModel = new StorageLocationModel(AppStorageType.SYNC, "userSettings");
	public static readonly DEFAULT_STORAGE_VALUE: UserSettingsModel = userSettingsData;

	public getStorageLocation(): StorageLocationModel {
		return UserSettingsDao.STORAGE_LOCATION;
	}

	public getDefaultStorageValue(): UserSettingsModel[] | UserSettingsModel {
		return UserSettingsDao.DEFAULT_STORAGE_VALUE;
	}
}
