import { Injectable } from "@angular/core";
import { AppStorageType } from "@elevate/shared/models";
import { DataStore } from "../data-store";
import { StorageLocationModel } from "../storage-location.model";
import * as _ from "lodash";

@Injectable()
export class ChromeDataStore<T> implements DataStore<T> {

	/**
	 * @return {Promise<T[] | T>}
	 */
	public fetch(storageLocation: StorageLocationModel): Promise<T[] | T> {
		return new Promise<T[] | T>((resolve: Function, reject: Function) => {
			this.getChromeStorageArea(storageLocation).get(storageLocation.key, (result: T[] | T) => {
				const error = this.getLastError();
				if (error) {
					reject(error.message);
				} else {
					if (storageLocation.key) {
						resolve((result[storageLocation.key]) ? result[storageLocation.key] : null);
					} else {
						resolve((result) ? result : null);
					}
				}
			});
		});
	}

	/**
	 *
	 * @param storageLocation
	 * @param value
	 * @return {Promise<T[] | T>}
	 */
	public save(storageLocation: StorageLocationModel, value: T[] | T): Promise<T[] | T> {
		return new Promise<T[] | T>((resolve: Function, reject: Function) => {
			let object = {};
			if (storageLocation.key) {
				object[storageLocation.key] = value;
			} else {
				object = (_.isObject(value)) ? value : {};
			}
			this.getChromeStorageArea(storageLocation).set(object, () => {
				const error = this.getLastError();
				if (error) {
					reject(error.message);
				} else {
					this.fetch(storageLocation).then((response: T[] | T) => {
						resolve(response);
					}, error => reject(error));
				}
			});
		});
	}

	/**
	 *
	 * @param storageLocation
	 * @param path
	 * @param value
	 */
	public saveProperty<V>(storageLocation: StorageLocationModel, path: string | string[], value: V): Promise<T> {

		return this.fetch(storageLocation).then((dataStore: T[] | T) => {

			const isNestedPath: boolean = (path instanceof Array && path.length > 0);
			const rootKey: string = (isNestedPath) ? path[0] : path as string;
			const hasRootKey = (rootKey && _.has(dataStore, rootKey));

			if (!hasRootKey) {
				return Promise.reject("No root key '" + rootKey + "' found");
			}

			// Update store
			if (isNestedPath) {
				try {
					dataStore = DataStore.setAtPath(dataStore, path as string[], value);
				} catch (error) {
					return Promise.reject(error.message);
				}

			} else {
				dataStore[rootKey] = value;
			}

			return this.save(storageLocation, dataStore).then((dataStoreSaved: T[] | T) => {
				return Promise.resolve(<T> dataStoreSaved);
			});
		});
	}

	/**
	 *
	 * @param storageLocation
	 */
	public clear(storageLocation: StorageLocationModel): Promise<void> {
		return new Promise<void>((resolve: Function, reject: Function) => {
			if (storageLocation.key) {
				this.getChromeStorageArea(storageLocation).remove(storageLocation.key, () => {
					const error = this.getLastError();
					if (error) {
						reject(error.message);
					} else {
						this.fetch(storageLocation).then((response: T[] | T) => {
							if (!response) {
								resolve();
							} else {
								reject("Unable to clear data on storage location: " + JSON.stringify(storageLocation));
							}
						}, error => reject(error));
					}
				});
			} else {
				this.getChromeStorageArea(storageLocation).clear(() => {
					const error = this.getLastError();
					if (error) {
						reject(error.message);
					} else {
						resolve();
					}
				});
			}
		});
	}

	public getChromeStorageArea(storageLocation: StorageLocationModel): chrome.storage.StorageArea {
		return (storageLocation.type === AppStorageType.SYNC) ? this.chromeSyncStorageArea() : this.chromeLocalStorageArea();
	}

	/**
	 *
	 * @returns {chrome.storage.LocalStorageArea}
	 */
	public chromeLocalStorageArea(): chrome.storage.LocalStorageArea {
		return chrome.storage.local;
	}

	/**
	 *
	 * @returns {chrome.storage.SyncStorageArea}
	 */
	public chromeSyncStorageArea(): chrome.storage.SyncStorageArea {
		return chrome.storage.sync;
	}


	public getLastError(): chrome.runtime.LastError {
		return chrome.runtime.lastError;
	}

}
