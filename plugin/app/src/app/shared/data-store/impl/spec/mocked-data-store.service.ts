import { DataStore } from "../../data-store";
import { StorageLocationModel } from "../../storage-location.model";

export class MockedDataStore<T> extends DataStore<T> {

	public dataStore: T[] | T;

	constructor(initObject?: T[] | T) {
		super();

		if (initObject) {
			this.dataStore = initObject;
		} else {
			this.setTypeVector();
		}
	}

	public fetch(storageLocation: StorageLocationModel): Promise<T[] | T> {
		return Promise.resolve(this.dataStore);
	}

	public save(storageLocation: StorageLocationModel, value: T[] | T): Promise<T[] | T> {
		this.dataStore = value;
		return this.fetch(storageLocation);
	}

	public clear(storageLocation: StorageLocationModel): Promise<T[] | T> {
		if (this.dataStore instanceof Array) {
			this.dataStore = [];
		} else if (this.dataStore instanceof Object) {
			this.dataStore = {} as T;
		}
		return Promise.resolve(null);
	}

	public saveProperty<V>(storageLocation: StorageLocationModel, path: string | string[], value: V): Promise<T> {

		const isNestedPath: boolean = (path instanceof Array && path.length > 0);
		const rootKey: string = (isNestedPath) ? path[0] : path as string;
		const hasRootKey = (rootKey && this.dataStore[rootKey]);

		if (!hasRootKey) {
			throw new Error("No root key found for:" + this.dataStore);
		}

		// Update store
		if (isNestedPath) {
			this.dataStore = DataStore.setAtPath(this.dataStore, path as string[], value);
		} else {
			this.dataStore[rootKey] = value;
		}

		return Promise.resolve(<T> this.dataStore);
	}

	public setTypeVector() {
		this.dataStore = [];
	}

	public setTypeObject() {
		this.dataStore = {} as T;
	}
}
