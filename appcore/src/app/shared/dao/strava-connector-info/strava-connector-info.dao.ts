import { Injectable } from "@angular/core";
import { BaseDao } from "../base.dao";
import { StorageLocationModel } from "../../data-store/storage-location.model";
import { StorageType } from "../../data-store/storage-type.enum";
import { StravaConnectorInfo } from "@elevate/shared/sync";

@Injectable()
export class StravaConnectorInfoDao extends BaseDao<StravaConnectorInfo> {

	public static readonly STORAGE_LOCATION: StorageLocationModel = new StorageLocationModel("stravaConnectorInfo", StorageType.OBJECT);
	public static readonly DEFAULT_STORAGE_VALUE: StravaConnectorInfo = StravaConnectorInfo.DEFAULT_MODEL;

	getDefaultStorageValue(): StravaConnectorInfo {
		return StravaConnectorInfoDao.DEFAULT_STORAGE_VALUE;
	}

	getStorageLocation(): StorageLocationModel {
		return StravaConnectorInfoDao.STORAGE_LOCATION;
	}
}
