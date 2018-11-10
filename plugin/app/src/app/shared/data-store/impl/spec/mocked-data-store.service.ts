import { DataStore } from "../../data-store";
import { StorageLocationModel } from "../../storage-location.model";
import * as _ from "lodash";

export class MockedDataStore<T> extends DataStore<T> {

	public dataStore: T[] | T;

	constructor(initObject?: T[] | T) {
		super();

		if (initObject) {
			this.dataStore = initObject;
		} else {
			this.initWithVector();
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
		const hasRootKey = (rootKey && _.has(this.dataStore, rootKey));

		if (!hasRootKey) {
			return Promise.reject("No root key '" + rootKey + "' found");
		}

		// Update store
		if (isNestedPath) {
			try {
				this.dataStore = DataStore.setAtPath(this.dataStore, path as string[], value);
			} catch (error) {
				return Promise.reject(error.message);
			}

		} else {
			this.dataStore[rootKey] = value;
		}

		return Promise.resolve(<T> this.dataStore);
	}

	public initWithVector(vector?: T[]) {
		this.dataStore = (vector && vector.length > 0) ? vector : [];
	}

	public initWithObject(object?: T) {
		this.dataStore = (object) ? object : {} as T;
	}
}
