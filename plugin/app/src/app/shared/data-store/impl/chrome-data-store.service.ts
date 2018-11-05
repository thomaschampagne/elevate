import { Injectable } from "@angular/core";
import { AppStorageType } from "@elevate/shared/models";
import { DataStore } from "../data-store";
import { StorageLocation } from "../storage-location";

@Injectable()
export class ChromeDataStore<T> implements DataStore {

	/**
	 * @return {Promise<T[]>}
	 */
	public fetch<T>(storageLocation: StorageLocation): Promise<T[]> {

		return new Promise<T[]>((resolve: Function, reject: Function) => {

			this.getChromeStorageArea(storageLocation).get(storageLocation.key, (result: T) => {
				const error = this.getLastError();
				if (error) {
					reject(error.message);
				} else {
					resolve((result[storageLocation.key]) ? result[storageLocation.key] : null);
				}
			});
		});
	}

	/**
	 *
	 * @param storageLocation
	 * @param value
	 * @return {Promise<T[]>}
	 */
	public save<T>(storageLocation: StorageLocation, value: T[]): Promise<T[]> {
		return new Promise<T[]>((resolve: Function, reject: Function) => {
			let object = {};
			object[storageLocation.key] = value;
			this.getChromeStorageArea(storageLocation).set(object, () => {
				const error = this.getLastError();
				if (error) {
					reject(error.message);
				} else {
					this.fetch<T>(storageLocation).then((response: T[]) => {
						resolve(response);
					}, error => reject(error));
				}
			});
		});
	}

	/**
	 *
	 * @param storageLocation
	 */
	public clear<T>(storageLocation: StorageLocation): Promise<T[]> {
		return new Promise<T[]>((resolve: Function, reject: Function) => {
			this.getChromeStorageArea(storageLocation).remove(storageLocation.key, () => {
				const error = this.getLastError();
				if (error) {
					reject(error.message);
				} else {
					this.fetch<T>(storageLocation).then((response: T[]) => {
						if (!response) {
							resolve(null);
						} else {
							reject("Unable to clear data on storage location: " + JSON.stringify(storageLocation));
						}
					}, error => reject(error));
				}
			});
		});
	}

	public getChromeStorageArea(storageLocation: StorageLocation): chrome.storage.StorageArea {
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
