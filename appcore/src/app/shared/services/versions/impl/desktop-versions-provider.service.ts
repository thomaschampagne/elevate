import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { PackageManifest } from "@angular/cli/utilities/package-metadata";
import { VersionsProvider } from "../versions-provider.interface";

@Injectable()
export class DesktopVersionsProvider implements VersionsProvider {

	public static readonly PACKAGE_PRODUCTION: string = "https://raw.githubusercontent.com/thomaschampagne/elevate/master/package.json";

	constructor(public httpClient: HttpClient) {
	}

	public getInstalledAppVersion(): Promise<string> {
		const rootPackageJson = require("../../../../../../../package.json");
		return Promise.resolve(rootPackageJson.version);
	}


	public getCurrentRemoteAppVersion(): Promise<string> {
		return this.httpClient.get<PackageManifest>(DesktopVersionsProvider.PACKAGE_PRODUCTION).toPromise().then(response => {
			return Promise.resolve(response.version);
		}, err => {
			return Promise.reject(err);
		});
	}

}

