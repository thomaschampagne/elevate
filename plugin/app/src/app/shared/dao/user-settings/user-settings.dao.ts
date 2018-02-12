import { Injectable } from "@angular/core";
import { UserSettingsModel } from "../../../../../../common/scripts/models/UserSettings";
import { userSettings } from "../../../../../../common/scripts/UserSettings";
import * as _ from "lodash";

@Injectable()
export class UserSettingsDao {

	constructor() {
	}

	/**
	 *
	 * @returns {Promise<UserSettingsModel>}
	 */
	public fetch(): Promise<UserSettingsModel> {
		return new Promise<UserSettingsModel>((resolve, reject) => {
			this.chromeStorageSync().get(userSettings, (userSettingsSynced: UserSettingsModel) => {
				const error = this.getChromeError();
				if (error) {
					reject(error.message);
				} else {
					resolve(userSettingsSynced);
				}
			});
		});
	}

	/**
	 *
	 * @param {string} key
	 * @returns {Promise<Object>}
	 */
	public get(key: string): Promise<Object> {

		return new Promise<Object>((resolve, reject) => {

			this.chromeStorageSync().get(userSettings, (userSettingsSynced: UserSettingsModel) => {

				const error = this.getChromeError();
				if (error) {
					reject(error.message);
				} else {
					const value = userSettingsSynced[key];
					if (_.isUndefined(value)) {
						reject(key + " not found in user settings");
					} else {
						resolve(value);
					}
				}
			});
		});
	}

	/**
	 *
	 * @param {string} key
	 * @param value
	 * @returns {Promise<UserSettingsModel>}
	 */
	public update(key: string, value: any): Promise<UserSettingsModel> {

		return new Promise<UserSettingsModel>((resolve, reject) => {

			if (!_.has(userSettings, key)) {
				reject("key <" + key + "> does not exists in user settings");
				return;
			}

			const settingToBeUpdated: any = {};
			settingToBeUpdated[key] = value;

			this.chromeStorageSync().set(settingToBeUpdated, () => {

				const error = this.getChromeError();
				if (error) {
					reject(error.message);
				} else {
					this.fetch().then((userSettingsResult: UserSettingsModel) => {
						resolve(userSettingsResult);
					}, error => {
						reject(error);
					});
				}
			});
		});
	}

	/**
	 *
	 * @param {string} path
	 * @param setting
	 * @returns {Promise<UserSettingsModel>}
	 */
	public updateNested(path: string, setting: any): Promise<UserSettingsModel> {

		return new Promise<UserSettingsModel>((resolve, reject) => {

			const doesPathExistsInSettings = _.has(userSettings, path);

			if (!doesPathExistsInSettings) {
				reject(path + " object path does not exists in user settings");
				return;
			}

			const absoluteObject = this.createNestedObject(path, setting);

			this.chromeStorageSync().set(absoluteObject, () => {

				const error = this.getChromeError();
				if (error) {
					reject(error.message);
				} else {
					this.fetch().then((userSettingsResult: UserSettingsModel) => {
						resolve(userSettingsResult);
					}, error => {
						reject(error);
					});
				}
			});
		});
	}

	/**
	 *
	 * @param {string} nestedPath
	 * @param {Object} objectToInsert
	 * @returns {Object}
	 */
	public createNestedObject(nestedPath: string, objectToInsert: Object): Object {
		const absoluteObject: Object = {};
		if (!_.has(absoluteObject, nestedPath)) {
			_.set(absoluteObject, nestedPath, objectToInsert);
		}
		return absoluteObject;
	}

	/**
	 *
	 * @returns {chrome.storage.SyncStorageArea}
	 */
	public chromeStorageSync(): chrome.storage.SyncStorageArea {
		return chrome.storage.sync;
	}

	/**
	 *
	 * @returns {chrome.runtime.LastError}
	 */
	public getChromeError(): chrome.runtime.LastError {
		return chrome.runtime.lastError;
	}


}
