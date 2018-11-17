import { Injectable } from "@angular/core";
import { BaseDao } from "../base.dao";
import { StorageLocationModel } from "../../data-store/storage-location.model";
import { AppStorageType, DatedAthleteSettingsModel } from "@elevate/shared/models";

@Injectable()
export class DatedAthleteSettingsDao extends BaseDao<DatedAthleteSettingsModel> {

	public static readonly STORAGE_LOCATION: StorageLocationModel = new StorageLocationModel(AppStorageType.LOCAL, "datedAthleteSettings");
	public static readonly DEFAULT_STORAGE_VALUE: DatedAthleteSettingsModel[] = [];

	public getDefaultStorageValue(): DatedAthleteSettingsModel[] | DatedAthleteSettingsModel {
		return DatedAthleteSettingsDao.DEFAULT_STORAGE_VALUE;
	}

	public getStorageLocation(): StorageLocationModel {
		return DatedAthleteSettingsDao.STORAGE_LOCATION;
	}

}
