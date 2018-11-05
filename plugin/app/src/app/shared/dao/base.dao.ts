import { Inject } from "@angular/core";
import { DataStore } from "../data-store/data-store";
import { StorageLocation } from "../data-store/storage-location";

export abstract class BaseDao<T> {

	public storageLocation: StorageLocation = null;

	constructor(@Inject(DataStore) protected dataStore: DataStore<T>) {
		this.init();
	}

	public abstract init(): void;

	public checkStorageLocation(): Promise<void> {
		if (!this.storageLocation) {
			return Promise.reject("StorageLocation not set in '" + this.constructor.name + "'. Please override init method to assign a StorageLocation.");
		}
		return Promise.resolve();
	}

	public fetch(): Promise<T[]> {
		return this.checkStorageLocation().then(() => {
			return this.dataStore.fetch(this.storageLocation);
		});
	}

	public save(value: T[]): Promise<T[]> {
		return this.checkStorageLocation().then(() => {
			return this.dataStore.save(this.storageLocation, value);
		});
	}

	public clear(): Promise<T[]> {
		return this.checkStorageLocation().then(() => {
			return this.dataStore.clear(this.storageLocation);
		});
	}
}
