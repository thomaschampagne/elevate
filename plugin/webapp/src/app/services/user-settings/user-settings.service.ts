import { Injectable } from '@angular/core';
import { IUserSettings } from "../../../../../common/scripts/interfaces/IUserSettings";
import { IZone } from "../../../../../common/scripts/interfaces/IActivityData";
import { ZoneDefinition } from "../../zones-settings/zone-definitions";
import { UserSettingsDao } from "../../dao/user-settings/user-settings.dao";

@Injectable()
export class UserSettingsService {

	public static readonly MARK_LOCAL_STORAGE_CLEAR: string = "localStorageMustBeCleared";

	constructor(private _userSettingsDao: UserSettingsDao) {
	}

	/**
	 *
	 * @returns {Promise<IUserSettings>}
	 */
	public fetch(): Promise<IUserSettings> {
		return this.userSettingsDao.fetch();
	}

	/**
	 *
	 * @param {string} key
	 * @returns {Promise<Object>}
	 */
	public get(key: string): Promise<Object> {
		return this.userSettingsDao.get(key);
	}

	/**
	 *
	 * @param {string} key
	 * @param value
	 * @returns {Promise<boolean>}
	 */
	public update(key: string, value: any): Promise<IUserSettings> {
		return this.userSettingsDao.update(key, value);
	}

	/**
	 * Clear local storage on next reload
	 * @returns {Promise<IUserSettings>}
	 */
	public markLocalStorageClear(): Promise<IUserSettings> {
		return this.update(UserSettingsService.MARK_LOCAL_STORAGE_CLEAR, true);
	}

	/**
	 *
	 * @param {ZoneDefinition} zoneDefinition
	 * @param {IZone[]} zones
	 * @returns {Promise<IZone[]>}
	 */
	public updateZones(zoneDefinition: ZoneDefinition, zones: IZone[]): Promise<IZone[]> {

		return new Promise<IZone[]>((resolve: Function, reject: Function) => {

			const path = "zones." + zoneDefinition.value;

			this.userSettingsDao.updateNested(path, zones).then((userSettings: IUserSettings) => {

				resolve(userSettings.zones[zoneDefinition.value]);

			}, error => {

				reject(error);

			});
		});
	}

	get userSettingsDao(): UserSettingsDao {
		return this._userSettingsDao;
	}

	set userSettingsDao(value: UserSettingsDao) {
		this._userSettingsDao = value;
	}
}
