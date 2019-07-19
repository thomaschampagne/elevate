import { Injectable } from "@angular/core";
import { BaseDao } from "../base.dao";
import { StorageLocationModel } from "../../data-store/storage-location.model";
import { StorageType } from "../../data-store/storage-type.enum";
import { ConnectorType } from "@elevate/shared/sync";

@Injectable()
export class LastSyncDateTimeDao extends BaseDao<number> { // TODO Rn to "SyncDateTimeDao" (shorter ;))

	public static readonly STORAGE_LOCATION: StorageLocationModel = new StorageLocationModel("lastSyncDateTime", StorageType.SINGLE_VALUE);

	public getDefaultStorageValue(): number {
		return null;
	}

	public getStorageLocation(): StorageLocationModel {
		return LastSyncDateTimeDao.STORAGE_LOCATION;
	}
}

// TODO Extract
export class ConnectorLastSyncDateTime {
	public connectorType: ConnectorType;
	public dateTime: number;

	constructor(connectorType: ConnectorType, dateTime: number) {
		this.connectorType = connectorType;
		this.dateTime = dateTime;
	}
}

// TODO Extract
@Injectable()
export class ConnectorLastSyncDateTimeDao extends BaseDao<ConnectorLastSyncDateTime> { // TODO Rn to "ConnectorSyncDateTimeDao" (shorter ;))

	public static readonly STORAGE_LOCATION: StorageLocationModel = new StorageLocationModel("connectorLastSyncDateTime",
		StorageType.COLLECTION);
	public static readonly DEFAULT_STORAGE_VALUE: ConnectorLastSyncDateTime[] = [];

	public getDefaultStorageValue(): ConnectorLastSyncDateTime[] {
		return ConnectorLastSyncDateTimeDao.DEFAULT_STORAGE_VALUE;
	}

	public getStorageLocation(): StorageLocationModel {
		return LastSyncDateTimeDao.STORAGE_LOCATION;
	}
}
