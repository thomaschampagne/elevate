import { StorageLocation } from "./storage-location";

export abstract class DataStore {

	abstract fetch<T>(storageLocation: StorageLocation): Promise<T[]>;

	abstract save<T>(storageLocation: StorageLocation, value: T[]): Promise<T[]>;

	abstract clear<T>(storageLocation: StorageLocation): Promise<T[]>; // TODO Try to return Promise<void> instead
}
