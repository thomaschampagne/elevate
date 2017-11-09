import { Injectable } from '@angular/core';
import { IUserSettings } from "../../../../common/scripts/interfaces/IUserSettings";
import { userSettings } from "../../../../common/scripts/UserSettings";

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

	public updateUserSetting(key: string, value: any): Promise<boolean> {

		const settingToBeUpdated: any = {};

		settingToBeUpdated[key] = value;

		return new Promise<boolean>((resolve) => {

			chrome.storage.sync.set(settingToBeUpdated, () => {

				resolve(true);

			});
		});

	}

}
