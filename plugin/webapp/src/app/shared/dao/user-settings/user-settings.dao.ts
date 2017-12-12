import { Injectable } from "@angular/core";
import { IUserSettings } from "../../../../../../common/scripts/interfaces/IUserSettings";
import { userSettings } from "../../../../../../common/scripts/UserSettings";
import * as _ from "lodash";

@Injectable()
export class UserSettingsDao {

	constructor() {
	}

	/**
	 *
	 * @returns {Promise<IUserSettings>}
	 */
	public fetch(): Promise<IUserSettings> {
		return new Promise<IUserSettings>((resolve) => {
			this.chromeStorageSync().get(userSettings, (userSettingsSynced: IUserSettings) => {
				resolve(userSettingsSynced);
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

			this.chromeStorageSync().get(userSettings, (userSettingsSynced: IUserSettings) => {

				const value = userSettingsSynced[key];
				if (_.isUndefined(value)) {
					reject(key + " not found in user settings");
				} else {
					resolve(value);
				}
			});
		});
	}

	/**
	 *
	 * @param {string} key
	 * @param value
	 * @returns {Promise<IUserSettings>}
	 */
	public update(key: string, value: any): Promise<IUserSettings> {

		return new Promise<IUserSettings>((resolve, reject) => {

			if (!_.has(userSettings, key)) {
				reject("key <" + key + "> does not exists in user settings");
				return;
			}

			const settingToBeUpdated: any = {};
			settingToBeUpdated[key] = value;

			this.chromeStorageSync().set(settingToBeUpdated, () => {
				this.fetch().then((userSettingsResult: IUserSettings) => {
					resolve(userSettingsResult);
				});
			});
		});
	}

	/**
	 *
	 * @param {string} path
	 * @param setting
	 * @returns {Promise<IUserSettings>}
	 */
	public updateNested(path: string, setting: any): Promise<IUserSettings> {

		return new Promise<IUserSettings>((resolve, reject) => {

			const doesPathExistsInSettings = _.has(userSettings, path);

			if (!doesPathExistsInSettings) {
				reject(path + " object path does not exists in user settings");
				return;
			}

			const absoluteObject = this.createNestedObject(path, setting);

			this.chromeStorageSync().set(absoluteObject, () => {
				this.fetch().then((userSettingsResult: IUserSettings) => {
					resolve(userSettingsResult);
				});
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
}
