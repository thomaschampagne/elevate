import { StorageLocationModel } from "./storage-location.model";
import { AppUsageDetails } from "../models/app-usage-details.model";

export abstract class DataStore<T> {

	/**
	 * Fetch all data
	 * @param storageLocation {StorageLocationModel} location
	 * @param defaultStorageValue default value returned if no data found
	 */
	// TODO Rename fetchAll
	abstract fetch(storageLocation: StorageLocationModel, defaultStorageValue: T[] | T): Promise<T[] | T>;

	/**
	 * Save and replace all data
	 * @param storageLocation
	 * @param value
	 * @param defaultStorageValue
	 */
	// TODO Rename saveAll
	abstract save(storageLocation: StorageLocationModel, value: T[] | T, defaultStorageValue: T[] | T): Promise<T[] | T>;

	/**
	 * Update or insert a specific property at given path. Path is created if unknown.
	 * @param storageLocation {StorageLocationModel} location
	 * @param path
	 * @param value
	 * @param defaultStorageValue
	 */
	abstract upsertProperty<V>(storageLocation: StorageLocationModel, path: string | string[], value: V, defaultStorageValue: T[] | T): Promise<T>;

	/**
	 * Clear all data
	 * @param storageLocation
	 */
	abstract clear(storageLocation: StorageLocationModel): Promise<void>;

	/**
	 * Provide app usage
	 */
	abstract getAppUsageDetails(): Promise<AppUsageDetails>;

	// TODO Add count()
}
