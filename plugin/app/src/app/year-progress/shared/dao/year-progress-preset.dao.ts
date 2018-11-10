import { Injectable } from "@angular/core";
import { YearProgressPresetModel } from "../models/year-progress-preset.model";
import { BaseDao } from "../../../shared/dao/base.dao";
import { AppStorageType } from "@elevate/shared/models";
import { StorageLocationModel } from "../../../shared/data-store/storage-location.model";

@Injectable()
export class YearProgressPresetDao extends BaseDao<YearProgressPresetModel> {

	public static readonly STORAGE_LOCATION: StorageLocationModel = new StorageLocationModel(AppStorageType.LOCAL, "yearProgressPresets");

	public init(): void {
		this.storageLocation = YearProgressPresetDao.STORAGE_LOCATION;
	}
}
