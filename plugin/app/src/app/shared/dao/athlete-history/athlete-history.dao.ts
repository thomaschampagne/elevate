import { Injectable } from "@angular/core";
import { AthleteProfileModel } from "../../../../../../common/scripts/models/AthleteProfile";
import * as _ from "lodash";

@Injectable()
export class AthleteHistoryDao {

	// FIXME merge physical storage of "syncWithAthleteProfile" & "lastSyncDateTime" & "computedActivities" into a single local storage object "AthleteHistory" ?!
	public static readonly ATHLETE_SYNCED_PROFILE_KEY: string = "syncWithAthleteProfile";
	public static readonly LAST_SYNCED_DATE_TIME_KEY: string = "lastSyncDateTime";

	constructor() {
	}

	/**
	 *
	 * @returns {Promise<AthleteProfileModel>}
	 */
	public getProfile(): Promise<AthleteProfileModel> {

		return new Promise<AthleteProfileModel>((resolve) => {
			this.chromeStorageLocal().get(AthleteHistoryDao.ATHLETE_SYNCED_PROFILE_KEY, (result: { syncWithAthleteProfile: AthleteProfileModel }) => {
				resolve((result.syncWithAthleteProfile) ? result.syncWithAthleteProfile : null);
			});
		});
	}

	/**
	 *
	 * @param {AthleteProfileModel} athleteProfileModelToSave
	 * @returns {Promise<AthleteProfileModel>}
	 */
	public saveProfile(athleteProfileModelToSave: AthleteProfileModel): Promise<AthleteProfileModel> {

		return new Promise<AthleteProfileModel>((resolve) => {

			const profileData: any = {};
			profileData[AthleteHistoryDao.ATHLETE_SYNCED_PROFILE_KEY] = athleteProfileModelToSave;

			this.chromeStorageLocal().set(profileData, () => {
				this.getProfile().then((athleteProfileModel: AthleteProfileModel) => {
					resolve(athleteProfileModel);
				});
			});
		});
	}

	/**
	 *
	 * @returns {Promise<AthleteProfileModel>}
	 */
	public removeProfile(): Promise<AthleteProfileModel> {
		return new Promise<AthleteProfileModel>((resolve, reject) => {
			this.chromeStorageLocal().remove(AthleteHistoryDao.ATHLETE_SYNCED_PROFILE_KEY, () => {
				this.getProfile().then((athleteProfileModel: AthleteProfileModel) => {
					(_.isEmpty(athleteProfileModel)) ? resolve(athleteProfileModel) : reject("Profile has not been deleted");
				});
			});
		});
	}

	/**
	 *
	 * @returns {Promise<number>}
	 */
	public getLastSyncDateTime(): Promise<number> {
		return new Promise<number>((resolve) => {
			this.chromeStorageLocal().get(AthleteHistoryDao.LAST_SYNCED_DATE_TIME_KEY, (result: { lastSyncDateTime: number }) => {
				resolve((_.isNumber(result.lastSyncDateTime)) ? result.lastSyncDateTime : null);
			});
		});
	}

	/**
	 *
	 * @param {number} lastSyncDateTime
	 * @returns {Promise<number>}
	 */
	public saveLastSyncDateTime(lastSyncDateTime: number): Promise<number> {

		return new Promise<number>((resolve) => {

			const lastSyncDateTimeData: any = {};
			lastSyncDateTimeData[AthleteHistoryDao.LAST_SYNCED_DATE_TIME_KEY] = lastSyncDateTime;

			this.chromeStorageLocal().set(lastSyncDateTimeData, () => {
				this.getLastSyncDateTime().then((lastSyncDateTime: number) => {
					resolve(lastSyncDateTime);
				});
			});

		});
	}

	/**
	 *
	 * @returns {Promise<number>}
	 */
	public removeLastSyncDateTime(): Promise<number> {
		return new Promise<number>((resolve, reject) => {
			this.chromeStorageLocal().remove(AthleteHistoryDao.LAST_SYNCED_DATE_TIME_KEY, () => {
				this.getLastSyncDateTime().then((lastSyncDateTime: number) => {
					(_.isNumber(lastSyncDateTime)) ? reject("LastSyncDateTime has not been deleted") : resolve(null);
				});
			});
		});
	}

	/**
	 *
	 * @returns {chrome.storage.SyncStorageArea}
	 */
	public chromeStorageLocal(): chrome.storage.LocalStorageArea {
		return chrome.storage.local;
	}

}
