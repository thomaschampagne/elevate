import { Injectable } from "@angular/core";
import { YearProgressPresetModel } from "../models/year-progress-preset.model";
import { BaseDao } from "../../../shared/dao/base.dao";
import { AppStorageType } from "@elevate/shared/models";
import { StorageLocation } from "../../../shared/data-store/storage-location";

@Injectable()
export class YearProgressPresetDao extends BaseDao<YearProgressPresetModel> {

	public static readonly STORAGE_LOCATION: StorageLocation = {
		key: "yearProgressPresets",
		type: AppStorageType.LOCAL
	};

	public init(): void {
		this.storageLocation = YearProgressPresetDao.STORAGE_LOCATION;
	}
}
