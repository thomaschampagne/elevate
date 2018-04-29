import { Injectable } from "@angular/core";
import * as _ from "lodash";

@Injectable()
export class AthleteHistoryDao {

	// FIXME merge physical storage of "lastSyncDateTime" & "computedActivities" into a single local storage object "AthleteHistory" ?!
	public static readonly LAST_SYNCED_DATE_TIME_KEY: string = "lastSyncDateTime";

	constructor() {
	}

	/**
	 *
	 * @returns {Promise<number>}
	 */
	public getLastSyncDateTime(): Promise<number> {
		return new Promise<number>((resolve) => {
			this.browserStorageLocal().get(AthleteHistoryDao.LAST_SYNCED_DATE_TIME_KEY, (result: { lastSyncDateTime: number }) => {
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

			this.browserStorageLocal().set(lastSyncDateTimeData, () => {
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
			this.browserStorageLocal().remove(AthleteHistoryDao.LAST_SYNCED_DATE_TIME_KEY, () => {
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
	public browserStorageLocal(): chrome.storage.LocalStorageArea {
		return chrome.storage.local;
	}

}
