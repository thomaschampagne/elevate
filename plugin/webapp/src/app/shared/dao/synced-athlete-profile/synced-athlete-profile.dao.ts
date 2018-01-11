import { Injectable } from '@angular/core';
import { AthleteProfileModel } from "../../../../../../common/scripts/models/AthleteProfile";

@Injectable()
export class SyncedAthleteProfileDao {

	// FIXME merge "syncWithAthleteProfile" & "lastSyncDateTime" into a single local storage object "syncedAthleteProfile"

	public static readonly ATHLETE_SYNCED_PROFILE_KEY: string = "syncWithAthleteProfile";
	public static readonly LAST_SYNCED_DATE_KEY: string = "lastSyncDateTime";

	constructor() {
	}

	/**
	 *
	 * @returns {chrome.storage.SyncStorageArea}
	 */
	public chromeStorageLocal(): chrome.storage.LocalStorageArea {
		return chrome.storage.local;
	}

	public getProfile(): Promise<AthleteProfileModel> {

		return new Promise<AthleteProfileModel>((resolve) => {
			this.chromeStorageLocal().get(SyncedAthleteProfileDao.ATHLETE_SYNCED_PROFILE_KEY, (result: { syncWithAthleteProfile: AthleteProfileModel }) => {
				resolve(result.syncWithAthleteProfile);
			});
		});
	}

	public getLastSyncDateTime(): Promise<number> {
		return new Promise<number>((resolve) => {
			this.chromeStorageLocal().get(SyncedAthleteProfileDao.LAST_SYNCED_DATE_KEY, (result: { lastSyncDateTime: number }) => {
				resolve(result.lastSyncDateTime);
			});
		});
	}
}
