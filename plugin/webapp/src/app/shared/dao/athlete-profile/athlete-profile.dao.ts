import { Injectable } from '@angular/core';
import { AthleteProfileModel } from "../../../../../../common/scripts/interfaces/IAthleteProfile";

@Injectable()
export class AthleteProfileDao {

	public static readonly ATHLETE_PROFILE_KEY: string = "syncWithAthleteProfile";

	constructor() {
	}

	/**
	 *
	 * @returns {chrome.storage.SyncStorageArea}
	 */
	public chromeStorageLocal(): chrome.storage.LocalStorageArea {
		return chrome.storage.local;
	}

	public get(): Promise<AthleteProfileModel> {

		return new Promise<AthleteProfileModel>((resolve) => {
			this.chromeStorageLocal().get(AthleteProfileDao.ATHLETE_PROFILE_KEY, (result: { syncWithAthleteProfile: AthleteProfileModel }) => {
				resolve(result.syncWithAthleteProfile);
			});
		});
	}
}
