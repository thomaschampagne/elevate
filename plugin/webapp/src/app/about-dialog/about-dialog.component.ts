import { Component, OnInit, VERSION } from '@angular/core';
import * as d3 from "d3";

class AppLocalStorageUsage {
	bytesInUse: number;
	megaBytesInUse: number;
	quotaBytes: number;
	percentUsage: number;
}

@Component({
	selector: 'app-about-dialog',
	templateUrl: './about-dialog.component.html',
	styleUrls: ['./about-dialog.component.scss']
})
export class AboutDialogComponent implements OnInit {

	public static readonly MAX_WIDTH: string = "40%";
	public static readonly MIN_WIDTH: string = "40%";

	public angularVersion: string;
	public d3Version: string;
	public appVersion: string;
	public appLocalStorageUsage: AppLocalStorageUsage;

	constructor() {

	}

	public ngOnInit() {

		this.getAppLocalStorageUsage().then((appLocalStorageUsage: AppLocalStorageUsage) => {
			this.appLocalStorageUsage = appLocalStorageUsage;
		});

		this.appVersion = this.getAppVersion();
		this.angularVersion = VERSION.full;
		this.d3Version = d3.version;
	}

	public getAppVersion() {
		return chrome.runtime.getManifest().version;
	}

	public getAppLocalStorageUsage(): Promise<AppLocalStorageUsage> {

		return new Promise<AppLocalStorageUsage>((resolve: (appLocalStorageUsage: AppLocalStorageUsage) => void) => {

			this.chromeStorageLocal().getBytesInUse((bytesInUse: number) => {

				const quotaBytes = this.chromeStorageLocal().QUOTA_BYTES;

				const usage: AppLocalStorageUsage = {
					bytesInUse: bytesInUse,
					megaBytesInUse: parseFloat((bytesInUse / (1024 * 1024)).toFixed(2)),
					quotaBytes: quotaBytes,
					percentUsage: bytesInUse / quotaBytes * 100,
				};

				resolve(usage);
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
