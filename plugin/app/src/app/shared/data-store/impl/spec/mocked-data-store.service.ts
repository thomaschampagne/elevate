import { DataStore } from "../../data-store";
import { StorageLocationModel } from "../../storage-location.model";
import * as _ from "lodash";

export class MockedDataStore<T> extends DataStore<T> {

	public dataStore: T[] | T;

	constructor(initValue?: T[] | T) {
		super();
		if (!_.isUndefined(initValue)) {
			this.dataStore = initValue;
		} else {
			this.initWithVector();
		}
	}

	public clear(storageLocation: StorageLocationModel): Promise<void> {
		if (this.dataStore instanceof Array) {
			this.dataStore = [];
		} else if (this.dataStore instanceof Object) {
			this.dataStore = {} as T;
		}
		return Promise.resolve();
	}

	public fetch(storageLocation: StorageLocationModel, query: Partial<T> | string | string[], defaultStorageValue: T[] | T): Promise<T[] | T> {
		return Promise.resolve(this.dataStore);
	}

	public save(storageLocation: StorageLocationModel, value: T[] | T, defaultStorageValue: T[] | T): Promise<T[] | T> {
		this.dataStore = value;
		return this.fetch(storageLocation, null, defaultStorageValue);
	}

	public upsertProperty<V>(storageLocation: StorageLocationModel, path: string | string[], value: V, defaultStorageValue: T[] | T): Promise<T> {

		return this.fetch(storageLocation, null, defaultStorageValue).then((dataStore: T[] | T) => {

			if (_.isArray(dataStore)) {
				return Promise.reject("Cannot save property to a storage type 'vector'");
			}

			dataStore = _.set(dataStore as Object, path, value) as T;

			return this.save(storageLocation, dataStore, defaultStorageValue).then((dataStoreSaved: T[] | T) => {
				return Promise.resolve(<T> dataStoreSaved);
			});
		});

	}

	public initWithVector(vector?: T[]) {
		this.dataStore = (vector && vector.length > 0) ? vector : [];
	}

	public initWithObject(object?: T) {
		this.dataStore = (object) ? object : {} as T;
	}
}
