import { Component, OnInit, VERSION as angularCoreVersion } from "@angular/core";
import { VERSION as angularMaterialVersion } from "@angular/material";
import * as d3 from "d3";
import { AppUsageDetails } from "../shared/models/app-usage-details.model";
import { HttpClient } from "@angular/common/http";
import { DataStore } from "../shared/data-store/data-store";

@Component({
	selector: "app-about-dialog",
	templateUrl: "./about-dialog.component.html",
	styleUrls: ["./about-dialog.component.scss"]
})
export class AboutDialogComponent implements OnInit {

	public static readonly MAX_WIDTH: string = "40%";
	public static readonly MIN_WIDTH: string = "40%";
	public static readonly MANIFEST_PRODUCTION: string = "https://raw.githubusercontent.com/thomaschampagne/elevate/master/plugin/manifest.json";

	public angularCoreVersion: string;
	public angularMaterialVersion: string;
	public d3Version: string;
	public appVersion: string;
	public appUsageDetails: AppUsageDetails;
	public prodVersion: string;

	constructor(public dataStore: DataStore<void>,
				public httpClient: HttpClient) {
	}

	public ngOnInit(): void {

		this.dataStore.getAppUsageDetails().then((appUsageDetails: AppUsageDetails) => {
			this.appUsageDetails = appUsageDetails;
		});

		this.appVersion = this.getAppVersion();
		this.angularCoreVersion = angularCoreVersion.full;
		this.angularMaterialVersion = angularMaterialVersion.full;
		this.d3Version = d3.version;

		this.getProdAppVersion().then((version: string) => {
			this.prodVersion = version;
		});
	}

	public getAppVersion(): string { // TODO Avoid use chrome directly !!
		return chrome.runtime.getManifest().version_name;
	}

	public getProdAppVersion(): Promise<string> {
		return this.httpClient.get<any>(AboutDialogComponent.MANIFEST_PRODUCTION).toPromise().then((response: any) => {
			return Promise.resolve(response.version_name);
		}, err => {
			return Promise.reject(err);
		});
	}
}
