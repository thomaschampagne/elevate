import { Component, OnInit, VERSION } from '@angular/core';
import * as d3 from "d3";
import { AppUsageService } from "../shared/services/app-usage/app-usage.service";
import { AppUsage } from "../shared/models/app-usage.model";
import { AppUsageDetails } from "../shared/models/app-usage-details.model";

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
	public appUsageDetails: AppUsage;

	constructor(public appUsageService: AppUsageService) {
	}

	public ngOnInit() {

		this.appUsageService.get().then((appUsageDetails: AppUsageDetails) => {
			this.appUsageDetails = appUsageDetails;
		});

		this.appVersion = this.getAppVersion();
		this.angularVersion = VERSION.full;
		this.d3Version = d3.version;
	}

	public getAppVersion() {
		return chrome.runtime.getManifest().version;
	}

}
