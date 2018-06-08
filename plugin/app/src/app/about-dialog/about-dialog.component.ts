import { Component, OnInit, VERSION as  angularCoreVersion } from "@angular/core";
import { VERSION as angularMaterialVersion } from "@angular/material";
import * as d3 from "d3";
import { AppUsageService } from "../shared/services/app-usage/app-usage.service";
import { AppUsageDetails } from "../shared/models/app-usage-details.model";
import { AppUsageDao } from "../shared/dao/app-usage/app-usage.dao";
import { HttpClient } from "@angular/common/http";

@Component({
	selector: "app-about-dialog",
	templateUrl: "./about-dialog.component.html",
	styleUrls: ["./about-dialog.component.scss"],
	providers: [AppUsageService, AppUsageDao]
})
export class AboutDialogComponent implements OnInit {

	public static readonly MAX_WIDTH: string = "40%";
	public static readonly MIN_WIDTH: string = "40%";
	public static readonly MANIFEST_PRODUCTION: string = "https://raw.githubusercontent.com/thomaschampagne/stravistix/master/plugin/manifest.json";

	public angularCoreVersion: string;
	public angularMaterialVersion: string;
	public d3Version: string;
	public appVersion: string;
	public appUsageDetails: AppUsageDetails;
	public prodVersion: string;

	constructor(public appUsageService: AppUsageService,
				public httpClient: HttpClient) {
	}

	public ngOnInit(): void {

		this.appUsageService.get().then((appUsageDetails: AppUsageDetails) => {
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

	public getAppVersion(): string {
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
