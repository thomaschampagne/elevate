import { Injectable } from "@angular/core";
import { UserSettingsModel } from "../../../../../../core/shared/models/user-settings/user-settings.model";
import { userSettings } from "../../../../../../core/shared/UserSettings";
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
			this.browserStorageSync().get(userSettings, (userSettingsSynced: UserSettingsModel) => {
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
	 * @returns {Promise<T>}
	 */
	public get<T>(key: string): Promise<T> {

		return new Promise<T>((resolve, reject) => {

			this.browserStorageSync().get(userSettings, (userSettingsSynced: UserSettingsModel) => {

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

			this.browserStorageSync().set(settingToBeUpdated, () => {

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

			this.fetch().then((userSettingsModel: UserSettingsModel) => {

				const updatedUserSettingsModel = this.updateNestedPropertyOf(userSettingsModel, path, setting);

				this.browserStorageSync().set(updatedUserSettingsModel, () => {

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

			}, error => {
				reject(error);
			});
		});
	}

	/**
	 *
	 * @returns {Promise<UserSettingsModel>}
	 */
	public reset(): Promise<UserSettingsModel> {

		return new Promise<UserSettingsModel>((resolve, reject) => {

			this.browserStorageSync().set(userSettings, () => {

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
	 * @param {Object} sourceObject
	 * @param {string} path
	 * @param {Object} value
	 * @returns {Object}
	 */
	public updateNestedPropertyOf(sourceObject: Object, path: string, value: Object): Object {
		if (!_.has(sourceObject, path)) {
			throw new Error("Property at path '" + path + "' do not exists");
		}
		return _.set(sourceObject, path, value);
	}

	/**
	 *
	 * @returns {chrome.storage.SyncStorageArea}
	 */
	public browserStorageSync(): chrome.storage.SyncStorageArea {
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
