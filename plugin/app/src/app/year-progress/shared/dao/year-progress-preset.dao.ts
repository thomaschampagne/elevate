import { Injectable } from "@angular/core";
import { YearToDateProgressPresetModel } from "../models/year-to-date-progress-preset.model";
import { BaseDao } from "../../../shared/dao/base.dao";
import { StorageLocationModel } from "../../../shared/data-store/storage-location.model";
import { StorageType } from "../../../shared/data-store/storage-type.enum";

@Injectable()
export class YearProgressPresetDao extends BaseDao<YearToDateProgressPresetModel> {

	public static readonly STORAGE_LOCATION: StorageLocationModel = new StorageLocationModel("yearProgressPresets", StorageType.COLLECTION);
	public static readonly DEFAULT_STORAGE_VALUE: YearToDateProgressPresetModel[] = [];

	public getStorageLocation(): StorageLocationModel {
		return YearProgressPresetDao.STORAGE_LOCATION;
	}

	public getDefaultStorageValue(): YearToDateProgressPresetModel[] | YearToDateProgressPresetModel {
		return YearProgressPresetDao.DEFAULT_STORAGE_VALUE;
	}
}
