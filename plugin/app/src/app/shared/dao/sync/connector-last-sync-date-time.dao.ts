import { Injectable } from "@angular/core";
import { BaseDao } from "../base.dao";
import { StorageLocationModel } from "../../data-store/storage-location.model";
import { StorageType } from "../../data-store/storage-type.enum";
import { ConnectorLastSyncDateTime } from "../../../../../modules/shared/models/sync/connector-last-sync-date-time.model";

@Injectable()
export class ConnectorLastSyncDateTimeDao extends BaseDao<ConnectorLastSyncDateTime> { // TODO Rn to "ConnectorSyncDateTimeDao" (shorter ;))

	public static readonly STORAGE_LOCATION: StorageLocationModel = new StorageLocationModel("connectorLastSyncDateTime",
		StorageType.COLLECTION, ConnectorLastSyncDateTime.ID_FIELD);
	public static readonly DEFAULT_STORAGE_VALUE: ConnectorLastSyncDateTime[] = [];

	public getDefaultStorageValue(): ConnectorLastSyncDateTime[] {
		return ConnectorLastSyncDateTimeDao.DEFAULT_STORAGE_VALUE;
	}

	public getStorageLocation(): StorageLocationModel {
		return ConnectorLastSyncDateTimeDao.STORAGE_LOCATION;
	}
}
