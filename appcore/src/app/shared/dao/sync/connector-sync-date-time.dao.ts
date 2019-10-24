import { Injectable } from "@angular/core";
import { BaseDao } from "../base.dao";
import { StorageLocationModel } from "../../data-store/storage-location.model";
import { StorageType } from "../../data-store/storage-type.enum";
import { ConnectorSyncDateTime } from "@elevate/shared/models";

@Injectable()
export class ConnectorSyncDateTimeDao extends BaseDao<ConnectorSyncDateTime> {

	public static readonly STORAGE_LOCATION: StorageLocationModel = new StorageLocationModel("connectorSyncDateTime",
		StorageType.COLLECTION, ConnectorSyncDateTime.ID_FIELD);
	public static readonly DEFAULT_STORAGE_VALUE: ConnectorSyncDateTime[] = [];

	public getDefaultStorageValue(): ConnectorSyncDateTime[] {
		return ConnectorSyncDateTimeDao.DEFAULT_STORAGE_VALUE;
	}

	public getStorageLocation(): StorageLocationModel {
		return ConnectorSyncDateTimeDao.STORAGE_LOCATION;
	}
}
