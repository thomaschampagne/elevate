import { Inject } from "@angular/core";
import { DataStore } from "../data-store/data-store";
import { StorageLocationModel } from "../data-store/storage-location.model";

export abstract class BaseDao<T> {

	public storageLocation: StorageLocationModel = null;

	constructor(@Inject(DataStore) protected dataStore: DataStore<T>) {
		this.init();
	}

	/**
	 * Override this init method to setup StorageLocationModel for your Dao
	 */
	public abstract init(): void;

	/**
	 * Check if StorageLocationModel is well set
	 */
	public checkStorageLocation(): Promise<void> {
		if (!this.storageLocation) {
			return Promise.reject("StorageLocationModel not set in '" + this.constructor.name + "'. Please override init method to assign a StorageLocationModel.");
		}
		return Promise.resolve();
	}

	/**
	 * Fetch all data
	 */
	public fetch(): Promise<T[] | T> {
		return this.checkStorageLocation().then(() => {
			return this.dataStore.fetch(this.storageLocation);
		});
	}

	/**
	 * Save and replace all data
	 * @param value
	 */
	public save(value: T[] | T): Promise<T[] | T> {
		return this.checkStorageLocation().then(() => {
			return this.dataStore.save(this.storageLocation, value);
		});
	}

	/**
	 * Save a specific property of data handled at path (assuming path exists)
	 * @param path key or array of keys to describe the nested path
	 * @param value
	 */
	public saveProperty<V>(path: string | string[], value: V): Promise<T> {
		return this.checkStorageLocation().then(() => {
			return this.dataStore.saveProperty<V>(this.storageLocation, path, value);
		});
	}

	/**
	 * Clear all data
	 */
	public clear(): Promise<T[] | T> {
		return this.checkStorageLocation().then(() => {
			return this.dataStore.clear(this.storageLocation);
		});
	}
}
