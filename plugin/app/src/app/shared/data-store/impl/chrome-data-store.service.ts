import { Injectable } from "@angular/core";
import { AppStorageType } from "@elevate/shared/models";
import { DataStore } from "../data-store";
import { StorageLocationModel } from "../storage-location.model";
import * as _ from "lodash";
import { AppUsage } from "../../models/app-usage.model";
import { AppUsageDetails } from "../../models/app-usage-details.model";

@Injectable()
export class ChromeDataStore<T> extends DataStore<T> {

	/**
	 * @return {Promise<T[] | T>}
	 */
	public fetch(storageLocation: StorageLocationModel, query: Partial<T> | string | string[], defaultStorageValue: T[] | T): Promise<T[] | T> {

		return new Promise<T[] | T>((resolve: Function, reject: Function) => {

			if (_.isEmpty(query)) {
				query = null; // Means fetch all
			}

			this.getChromeStorageArea(storageLocation).get(query, (result: T[] | T) => {
				const error = this.getLastError();
				if (error) {
					reject(error.message);
				} else {
					if (storageLocation.key) {
						resolve(result[storageLocation.key] ? result[storageLocation.key] : defaultStorageValue);
					} else {
						resolve(!_.isEmpty(result) ? result : defaultStorageValue);
					}
				}
			});
		});
	}

	/**
	 *
	 * @param storageLocation
	 * @param value
	 * @param defaultStorageValue
	 * @return {Promise<T[] | T>}
	 */
	public save(storageLocation: StorageLocationModel, value: T[] | T, defaultStorageValue: T[] | T): Promise<T[] | T> {
		return new Promise<T[] | T>((resolve: Function, reject: Function) => {

			let saveQuery;
			if (storageLocation.key) {
				saveQuery = {};
				saveQuery[storageLocation.key] = value;
			} else {
				saveQuery = value;
			}

			this.getChromeStorageArea(storageLocation).set(saveQuery, () => {
				const error = this.getLastError();
				if (error) {
					reject(error.message);
				} else {
					const query = (storageLocation.key) ? (storageLocation.key) : null; // If no key, 'null' query will ask for all the storage
					this.fetch(storageLocation, query, defaultStorageValue).then((response: T[] | T) => {
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
	 * @param defaultStorageValue
	 */
	public upsertProperty<V>(storageLocation: StorageLocationModel, path: string | string[], value: V, defaultStorageValue: T[] | T): Promise<T> {

		const query = (storageLocation.key) ? storageLocation.key : null; // If no key, 'null' query will ask for all the storage

		return this.fetch(storageLocation, query, defaultStorageValue).then((dataStore: T[] | T) => {

			if (_.isArray(dataStore)) {
				return Promise.reject("Cannot save property to a storage type 'vector'");
			}

			dataStore = _.set(dataStore as Object, path, value) as T;

			return this.save(storageLocation, dataStore, defaultStorageValue).then((dataStoreSaved: T[] | T) => {
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
					(error) ? reject(error.message) : resolve();
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

	/**
	 *
	 * @param type
	 */
	public getAppUsageDetails(type: AppStorageType): Promise<AppUsageDetails> {

		return new Promise<AppUsageDetails>((resolve) => {


			let chromeStorageArea;
			let quotaBytes;

			if (type === AppStorageType.SYNC) {
				chromeStorageArea = this.chromeSyncStorageArea();
				quotaBytes = chromeStorageArea.QUOTA_BYTES;
			} else {
				chromeStorageArea = this.chromeLocalStorageArea();
				quotaBytes = chromeStorageArea.QUOTA_BYTES;
			}

			chromeStorageArea.getBytesInUse((bytesInUse: number) => {
				const appUsage = new AppUsage(bytesInUse, quotaBytes);
				const megaBytesInUse = appUsage.bytesInUse / (1024 * 1024);
				const percentUsage = appUsage.bytesInUse / appUsage.quotaBytes * 100;
				const appUsageDetails: AppUsageDetails = new AppUsageDetails(appUsage, megaBytesInUse, percentUsage);
				resolve(appUsageDetails);
			});
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
