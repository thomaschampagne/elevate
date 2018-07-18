import { Injectable } from "@angular/core";
import { AppUsage } from "../../models/app-usage.model";

@Injectable()
export class AppUsageDao {

	constructor() {
	}

	/**
	 *
	 * @returns {chrome.storage.SyncStorageArea}
	 */
	public browserStorageLocal(): chrome.storage.LocalStorageArea {
		return chrome.storage.local;
	}

	public get(): Promise<AppUsage> {

		return new Promise<AppUsage>((resolve) => {

			this.browserStorageLocal().getBytesInUse((bytesInUse: number) => {
				resolve(new AppUsage(bytesInUse, this.browserStorageLocal().QUOTA_BYTES));
			});
		});
	}
}
