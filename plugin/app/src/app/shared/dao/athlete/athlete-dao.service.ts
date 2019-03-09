import { Injectable } from "@angular/core";
import { BaseDao } from "../base.dao";
import { StorageLocationModel } from "../../data-store/storage-location.model";
import { AppStorageType, AthleteModel } from "@elevate/shared/models";

@Injectable()
export class AthleteDao extends BaseDao<AthleteModel> {

	public static readonly STORAGE_LOCATION: StorageLocationModel = new StorageLocationModel(AppStorageType.LOCAL, "athlete");
	public static readonly DEFAULT_STORAGE_VALUE: AthleteModel = AthleteModel.DEFAULT_MODEL;

	public getDefaultStorageValue(): AthleteModel {
		return AthleteDao.DEFAULT_STORAGE_VALUE;
	}

	public getStorageLocation(): StorageLocationModel {
		return AthleteDao.STORAGE_LOCATION;
	}

}
