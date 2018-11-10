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
	 * @param storageLocation
	 */
	abstract fetch(storageLocation: StorageLocationModel): Promise<T[] | T>;

	/**
	 * Save and replace all data
	 * @param storageLocation
	 * @param value
	 */
	abstract save(storageLocation: StorageLocationModel, value: T[] | T): Promise<T[] | T>;

	/**
	 * Save a specific property of data handled at path (assuming path exists)
	 * @param storageLocation
	 * @param path
	 * @param value
	 */
	abstract saveProperty<V>(storageLocation: StorageLocationModel, path: string | string[], value: V): Promise<T>;

	/**
	 * Clear all data
	 * @param storageLocation
	 */
	abstract clear(storageLocation: StorageLocationModel): Promise<T[] | T>; // TODO Try to return Promise<void> instead
}
