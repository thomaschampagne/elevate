import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { VersionsProvider } from "../versions-provider.interface";

@Injectable()
export class ChromeVersionsProvider implements VersionsProvider {

	public static readonly MANIFEST_PRODUCTION: string = "https://raw.githubusercontent.com/thomaschampagne/elevate/master/plugin/manifest.json";

	constructor(public httpClient: HttpClient) {
	}

	public getInstalledAppVersion(): Promise<string> {
		debugger;
		return Promise.resolve(chrome.runtime.getManifest().version);
	}

	public getCurrentRemoteAppVersion(): Promise<string> {
		return this.httpClient.get<chrome.runtime.Manifest>(ChromeVersionsProvider.MANIFEST_PRODUCTION).toPromise().then(response => {
			return Promise.resolve(response.version);
		}, err => {
			return Promise.reject(err);
		});
	}

}
