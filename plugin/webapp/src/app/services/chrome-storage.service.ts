import { Injectable } from '@angular/core';
import { IUserSettings } from "../../../../common/scripts/interfaces/IUserSettings";
import { userSettings } from "../../../../common/scripts/UserSettings";
import * as _ from "lodash";
import { IZone } from "../../../../common/scripts/interfaces/IActivityData";
import { IZoneDefinition } from "../zones-settings/zone-definitions";

@Injectable()
export class ChromeStorageService {

	constructor() {
	}

	public fetchUserSettings(): Promise<IUserSettings> {
		return new Promise<IUserSettings>((resolve) => {
			chrome.storage.sync.get(userSettings, (userSettingsSynced: IUserSettings) => {
				resolve(userSettingsSynced);
			});
		});
	}


	public getUserSetting(key: string): Promise<any> {
		return new Promise<any>((resolve, reject) => {
			chrome.storage.sync.get(userSettings, (userSettingsSynced: IUserSettings) => {
				const value = userSettingsSynced[key];
				if (!_.isUndefined(value)) {
					resolve(value);
				} else {
					reject(key + " not found in user settings")
				}
			});
		});
	}

	public updateUserSetting(key: string, value: any): Promise<boolean> {

		const settingToBeUpdated: any = {};

		settingToBeUpdated[key] = value;

		return new Promise<boolean>((resolve) => {

			chrome.storage.sync.set(settingToBeUpdated, () => {

				resolve(true);

			});
		});

	}

	/**
	 * TODO Unit test and refactor
	 * @returns {Promise<boolean>}
	 */
	public markLocalStorageClear(): Promise<boolean> {
		return this.updateUserSetting("localStorageMustBeCleared", true);
	}

	/**
	 *
	 * TODO Move "updateZoneSetting" in proper Dao (+ test?!)
	 TODO: some Given test data:
	 const TO_BE_SAVED_ZONES = [ // 8 zones
	 {from: 0, to: 50},
	 {from: 50, to: 100},
	 {from: 100, to: 150},
	 {from: 150, to: 200},
	 {from: 200, to: 250},
	 {from: 250, to: 300},
	 {from: 300, to: 400},
	 {from: 400, to: 500}
	 ];

	 const EXISTING_STORED_SPEED_ZONES_MOCKED: IZone[] = [
	 {from: 0, to: 10},
	 {from: 10, to: 20},
	 {from: 20, to: 30},
	 {from: 30, to: 40},
	 {from: 40, to: 50}
	 ];

	 const EXISTING_STORED_USER_SETTINGS_MOCKED = {
			zones: {
				speed: EXISTING_STORED_SPEED_ZONES_MOCKED
			}
		};
	 *
	 *
	 *
	 * @param {IZoneDefinition} zoneDefinition
	 * @param {IZone[]} zones
	 * @returns {Promise<boolean>}
	 */
	public updateZoneSetting(zoneDefinition: IZoneDefinition, zones: IZone[]): Promise<boolean> {

		return new Promise<boolean>((resolve: Function) => {

			this.fetchUserSettings().then((userSettings: IUserSettings) => {

				userSettings.zones[zoneDefinition.value] = zones;

				chrome.storage.sync.set(userSettings, () => {

					// Clear local storage on next strava.com reload
					this.markLocalStorageClear().then(() => {
						resolve(true);
					});
				});
			});
		});
	}
}
