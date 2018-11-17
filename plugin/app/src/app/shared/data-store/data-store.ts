import { StorageLocationModel } from "./storage-location.model";
import { AppStorageType } from "@elevate/shared/models";
import { AppUsageDetails } from "../models/app-usage-details.model";

export abstract class DataStore<T> {

	/**
	 * Fetch all data
	 * @param storageLocation {StorageLocationModel} location
	 * @param query pass object with keys to fetch, or array of key, or single key, or null to fetch all
	 * @param defaultStorageValue default value returned if no data found
	 */
	abstract fetch(storageLocation: StorageLocationModel, query: Partial<T> | string | string[], defaultStorageValue: T[] | T): Promise<T[] | T>;

	/**
	 * Save and replace all data
	 * @param storageLocation
	 * @param value
	 * @param defaultStorageValue
	 */
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
	 * @param type
	 */
	abstract getAppUsageDetails(type: AppStorageType): Promise<AppUsageDetails>;
}
