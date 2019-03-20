import { Injectable } from "@angular/core";
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
	public fetch(storageLocation: StorageLocationModel, defaultStorageValue: T[] | T): Promise<T[] | T> {

		return new Promise<T[] | T>((resolve: Function, reject: Function) => {

			const fetchKeys = (storageLocation.key) ? storageLocation.key : null; // If no key, 'null' fetchKeys will ask for all the storage

			this.chromeLocalStorageArea().get(fetchKeys, (result: T[] | T) => {
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

			this.chromeLocalStorageArea().set(saveQuery, () => {
				const error = this.getLastError();
				if (error) {
					reject(error.message);
				} else {
					this.fetch(storageLocation, defaultStorageValue).then((response: T[] | T) => {
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


		return this.fetch(storageLocation, defaultStorageValue).then((dataStore: T[] | T) => {

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
				this.chromeLocalStorageArea().remove(storageLocation.key, () => {
					const error = this.getLastError();
					(error) ? reject(error.message) : resolve();
				});
			} else {
				this.chromeLocalStorageArea().clear(() => {
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
	public getAppUsageDetails(): Promise<AppUsageDetails> {

		return new Promise<AppUsageDetails>((resolve) => {
			const localStorageArea = this.chromeLocalStorageArea();
			localStorageArea.getBytesInUse((bytesInUse: number) => {
				const appUsage = new AppUsage(bytesInUse, localStorageArea.QUOTA_BYTES);
				const megaBytesInUse = appUsage.bytesInUse / (1024 * 1024);
				const percentUsage = appUsage.bytesInUse / appUsage.quotaBytes * 100;
				const appUsageDetails: AppUsageDetails = new AppUsageDetails(appUsage, megaBytesInUse, percentUsage);
				resolve(appUsageDetails);
			});
		});
	}

	/**
	 *
	 * @returns {chrome.storage.LocalStorageArea}
	 */
	public chromeLocalStorageArea(): chrome.storage.LocalStorageArea {
		return chrome.storage.local;
	}

	public getLastError(): chrome.runtime.LastError {
		return chrome.runtime.lastError;
	}

}
