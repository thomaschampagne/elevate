import { StorageLocationModel } from "./storage-location.model";
import { AppUsageDetails } from "../models/app-usage-details.model";
import FindRequest = PouchDB.Find.FindRequest;

export abstract class DataStore<T> {

	/**
	 * Fetch all data
	 * @param storageLocation {StorageLocationModel} location
	 * @param defaultStorageValue default value returned if no data found
	 * @param findRequest
	 */
	// TODO Rename "fetchAll" or "getAll"
	abstract fetch(storageLocation: StorageLocationModel, defaultStorageValue: T[] | T, findRequest?: FindRequest<T[] | T>): Promise<T[] | T>;

	/**
	 * Save and replace all data
	 * @param storageLocation
	 * @param value
	 * @param defaultStorageValue
	 */
	// TODO Rename "saveAll" or "eraseWith" or "replaceAll"
	abstract save(storageLocation: StorageLocationModel, value: T[] | T, defaultStorageValue: T[] | T): Promise<T[] | T>;

	/**
	 *
	 * @param storageLocation
	 * @param value
	 */
	abstract put(storageLocation: StorageLocationModel, value: T): Promise<T>;

	/**
	 *
	 * @param storageLocation
	 * @param id
	 */
	abstract getById(storageLocation: StorageLocationModel, id: string): Promise<T>;

	/**
	 *
	 * @param storageLocation
	 * @param defaultStorageValue
	 * TODO Only for collections
	 */

	// TODO abstract count(storageLocation: StorageLocationModel, defaultStorageValue: T[] | T): number;

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
}
