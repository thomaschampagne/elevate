import { Injectable } from "@angular/core";
import { BaseDao } from "../base.dao";
import { StorageLocationModel } from "../../data-store/storage-location.model";
import { environment } from "../../../../environments/environment";
import { UserSettings } from "@elevate/shared/models";
import UserSettingsModel = UserSettings.UserSettingsModel;

@Injectable()
export class UserSettingsDao extends BaseDao<UserSettingsModel> {

	public static readonly STORAGE_LOCATION: StorageLocationModel = new StorageLocationModel("userSettings");
	public static readonly DEFAULT_STORAGE_VALUE: UserSettingsModel = UserSettings.getDefaultsByEnvTarget(environment.target);

	public getStorageLocation(): StorageLocationModel {
		return UserSettingsDao.STORAGE_LOCATION;
	}

	public getDefaultStorageValue(): UserSettingsModel[] | UserSettingsModel {
		return UserSettingsDao.DEFAULT_STORAGE_VALUE;
	}
}
