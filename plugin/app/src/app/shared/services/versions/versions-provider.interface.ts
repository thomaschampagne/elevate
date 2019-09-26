import { InjectionToken } from "@angular/core";

export const VERSIONS_PROVIDER = new InjectionToken<VersionsProvider>("VERSIONS_PROVIDER");

export interface VersionsProvider {
	getInstalledAppVersion(): Promise<string>;
	getCurrentRemoteAppVersion(): Promise<string>;
}
