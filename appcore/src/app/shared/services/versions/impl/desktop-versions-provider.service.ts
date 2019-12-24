import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { PackageManifest } from "@angular/cli/utilities/package-metadata";
import { VersionsProvider } from "../versions-provider.interface";
import _ from "lodash";

@Injectable()
export class DesktopVersionsProvider implements VersionsProvider {

	public static readonly DESKTOP_SAVED_VERSION_KEY: string = "DESKTOP_SAVED_VERSION";

	constructor(public httpClient: HttpClient) {
	}

	private static getGithubReleaseApiUrl(packageManifest: any) {
		return `https://api.github.com/repos/${packageManifest.build.publish.owner}/${packageManifest.build.publish.repo}/releases`;
	}

	public getPackageVersion(): Promise<string> {
		const desktopPackageJson = this.packageManifest();
		return Promise.resolve(desktopPackageJson.version);
	}

	public getSavedVersion(): Promise<string> {
		return Promise.resolve(localStorage.getItem(DesktopVersionsProvider.DESKTOP_SAVED_VERSION_KEY));
	}

	public getRemoteVersion(): Promise<string> {
		const packageManifest = <any> this.packageManifest();
		const githubReleaseApiUrl = DesktopVersionsProvider.getGithubReleaseApiUrl(packageManifest);
		return this.httpClient.get<object[]>(githubReleaseApiUrl).toPromise().then((release: any[]) => {
			if (release && _.isArray(release) && release.length > 0) {
				const latestRelease = release[0];
				if (!latestRelease.draft && !latestRelease.prerelease && latestRelease.name) {
					return Promise.resolve(latestRelease.name);
				}
			}
			return Promise.resolve(null);
		}, err => {
			return Promise.reject(err);
		});
	}

	public getBuildMetadata(): Promise<{ commit: string, date: string }> {
		const buildMetadata = require("../../../../../../../desktop/build_metadata.json");
		return Promise.resolve(buildMetadata);
	}

	public getWrapperVersion(): string {
		return "Electron " + process.versions.electron;
	}

	public packageManifest(): PackageManifest {
		return require("../../../../../../../desktop/package.json");
	}
}

