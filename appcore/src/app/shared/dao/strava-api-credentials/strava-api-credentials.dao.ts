import { Injectable } from "@angular/core";
import { BaseDao } from "../base.dao";
import { StorageLocationModel } from "../../data-store/storage-location.model";
import { StorageType } from "../../data-store/storage-type.enum";
import { StravaApiCredentials } from "@elevate/shared/sync";

@Injectable()
export class StravaApiCredentialsDao extends BaseDao<StravaApiCredentials> {

	public static readonly STORAGE_LOCATION: StorageLocationModel = new StorageLocationModel("stravaApiCredentials", StorageType.OBJECT);
	public static readonly DEFAULT_STORAGE_VALUE: StravaApiCredentials = StravaApiCredentials.DEFAULT_MODEL;

	getDefaultStorageValue(): StravaApiCredentials {
		return StravaApiCredentialsDao.DEFAULT_STORAGE_VALUE;
	}

	getStorageLocation(): StorageLocationModel {
		return StravaApiCredentialsDao.STORAGE_LOCATION;
	}
}
