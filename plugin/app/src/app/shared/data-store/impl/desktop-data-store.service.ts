import { Injectable } from "@angular/core";
import { StorageLocationModel } from "../storage-location.model";
import { DataStore } from "../data-store";
import { AppUsageDetails } from "../../models/app-usage-details.model";

@Injectable()
export class DesktopDataStore<T> extends DataStore<T> {
	clear(storageLocation: StorageLocationModel): Promise<void> {
		return Promise.resolve();
	}

	fetch(storageLocation: StorageLocationModel, query: Partial<T> | string | string[], defaultStorageValue: T[] | T): Promise<T[] | T> {
		return Promise.resolve(defaultStorageValue);
	}

	getAppUsageDetails(): Promise<AppUsageDetails> {
		return Promise.resolve(null);
	}

	save(storageLocation: StorageLocationModel, value: T[] | T, defaultStorageValue: T[] | T): Promise<T[] | T> {
		return Promise.resolve(defaultStorageValue);
	}

	upsertProperty<V>(storageLocation: StorageLocationModel, path: string | string[], value: V, defaultStorageValue: T[] | T): Promise<T> {
		return Promise.resolve(null);
	}

}
