import { StorageLocationModel } from "./storage-location.model";
import * as _ from "lodash";

export abstract class DataStore<T> {

	/**
	 * Assign a value to the object using nested path given
	 * @param object
	 * @param path
	 * @param value
	 */
	public static setAtPath<T, V>(object: T, path: string[], value: V): T {
		if (!_.has(object, path)) {
			throw new Error("Property at path '" + path.join(">") + "' do not exists");
		}
		return _.set<T>(<any> object, path, value);
	}

	/**
	 * Fetch all data
	 * @param storageLocation {StorageLocationModel} location
	 * @param query Pass null to query all
	 * @param defaultStorageValue
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
	 * Update or insert a specific property of data handled at given path (create path if needed)
	 * @param storageLocation
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
}
