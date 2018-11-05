import { StorageLocation } from "./storage-location";

export abstract class DataStore<T> {

	abstract fetch(storageLocation: StorageLocation): Promise<T[]>;

	abstract save(storageLocation: StorageLocation, value: T[]): Promise<T[]>;

	abstract clear(storageLocation: StorageLocation): Promise<T[]>; // TODO Try to return Promise<void> instead
}
