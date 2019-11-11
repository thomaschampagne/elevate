import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { PackageManifest } from "@angular/cli/utilities/package-metadata";
import { VersionsProvider } from "../versions-provider.interface";

@Injectable()
export class DesktopVersionsProvider implements VersionsProvider {

	public static readonly PACKAGE_PRODUCTION: string = "https://raw.githubusercontent.com/thomaschampagne/elevate/master/package.json"; // TODO Change to real one when exists

	constructor(public httpClient: HttpClient) {
	}

	public getInstalledAppVersion(): Promise<string> {
		const desktopPackageJson = require("../../../../../../../desktop/package.json");
		return Promise.resolve(desktopPackageJson.version);
	}

	public getCurrentRemoteAppVersion(): Promise<string> {
		return this.httpClient.get<PackageManifest>(DesktopVersionsProvider.PACKAGE_PRODUCTION).toPromise().then(response => {
			return Promise.resolve(response.version);
		}, err => {
			return Promise.reject(err);
		});
	}

	public getBuildMetadata(): Promise<{ commit: string, date: string }> {
		const buildMetadata = require("../../../../../../../desktop/build_metadata.json");
		return Promise.resolve(buildMetadata);
	}

	public getContainerVersion(): string {
		return "Electron " + process.versions.electron;
	}
}

