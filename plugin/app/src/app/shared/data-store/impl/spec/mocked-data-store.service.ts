import { DataStore } from "../../data-store";
import { StorageLocation } from "../../storage-location";

export class MockedDataStore<T> extends DataStore<T> {

	protected vector: T[];

	constructor(initVector?: T[]) {
		super();
		this.vector = (initVector) ? initVector : [];
	}

	public fetch(storageLocation: StorageLocation): Promise<T[]> {
		return Promise.resolve(this.vector);
	}

	public save(storageLocation: StorageLocation, value: T[]): Promise<T[]> {
		this.vector = value;
		return this.fetch(storageLocation);
	}

	public clear(storageLocation: StorageLocation): Promise<T[]> {
		this.vector = [];
		return Promise.resolve(null);
	}

}
