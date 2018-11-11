import { Injectable } from "@angular/core";
import { YearProgressPresetModel } from "../models/year-progress-preset.model";
import { BaseDao } from "../../../shared/dao/base.dao";
import { AppStorageType } from "@elevate/shared/models";
import { StorageLocationModel } from "../../../shared/data-store/storage-location.model";

@Injectable()
export class YearProgressPresetDao extends BaseDao<YearProgressPresetModel> {

	public static readonly STORAGE_LOCATION: StorageLocationModel = new StorageLocationModel(AppStorageType.LOCAL, "yearProgressPresets");
	public static readonly DEFAULT_STORAGE_VALUE: YearProgressPresetModel[] = [];

	public getStorageLocation(): StorageLocationModel {
		return YearProgressPresetDao.STORAGE_LOCATION;
	}

	public getDefaultStorageValue(): YearProgressPresetModel[] | YearProgressPresetModel {
		return YearProgressPresetDao.DEFAULT_STORAGE_VALUE;
	}
}
