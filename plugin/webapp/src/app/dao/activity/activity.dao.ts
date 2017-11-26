import { Injectable } from '@angular/core';
import { ISyncActivityComputed } from "../../../../../common/scripts/interfaces/ISync";

@Injectable()
export class ActivityDao {

	constructor() {
	}

	/**
	 *
	 * @returns {Promise<ISyncActivityComputed[]>}
	 */
	public fetch(): Promise<ISyncActivityComputed[]> {
		return new Promise<ISyncActivityComputed[]>((resolve) => {
			this.chromeStorageLocal().get("computedActivities", (activities: ISyncActivityComputed[]) => {
				resolve(activities);
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
