import { Injectable } from "@angular/core";
import { SyncedActivityModel } from "../../../../../../common/scripts/models/Sync";
import * as _ from "lodash";

@Injectable()
export class ActivityDao {

	constructor() {
	}

	/**
	 *
	 * @returns {Promise<SyncedActivityModel[]>}
	 */
	public fetch(): Promise<SyncedActivityModel[]> {
		return new Promise<SyncedActivityModel[]>((resolve) => {
			this.chromeStorageLocal().get("computedActivities", (result: { computedActivities: SyncedActivityModel[] }) => {
				const syncedActivityModels = (_.isEmpty(result.computedActivities)) ? [] : result.computedActivities;
				resolve(syncedActivityModels);
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
