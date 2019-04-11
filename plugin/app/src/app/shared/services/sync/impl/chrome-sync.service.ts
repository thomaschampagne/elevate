import { Injectable } from "@angular/core";
import { SyncService } from "../sync.service";

@Injectable()
export class ChromeSyncService extends SyncService {

	public static readonly SYNC_URL_BASE: string = "https://www.strava.com/dashboard";
	public static readonly SYNC_WINDOW_WIDTH: number = 690;
	public static readonly SYNC_WINDOW_HEIGHT: number = 720;

	public sync(fastSync: boolean, forceSync: boolean): void {

		this.getCurrentTab((tab: chrome.tabs.Tab) => {
			const params = "?elevateSync=true&fastSync=" + fastSync + "&forceSync=" + forceSync + "&sourceTabId=" + tab.id;

			const features = "width=" + ChromeSyncService.SYNC_WINDOW_WIDTH +
				", height=" + ChromeSyncService.SYNC_WINDOW_HEIGHT + ", location=0";

			window.open(ChromeSyncService.SYNC_URL_BASE + params, "_blank", features);
		});
	}

	/**
	 *
	 * @param {(tab: chrome.tabs.Tab) => void} callback
	 */
	public getCurrentTab(callback: (tab: chrome.tabs.Tab) => void): void {
		chrome.tabs.getCurrent((tab: chrome.tabs.Tab) => {
			callback(tab);
		});
	}
}
