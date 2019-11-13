import { InjectionToken } from "@angular/core";

export const VERSIONS_PROVIDER = new InjectionToken<VersionsProvider>("VERSIONS_PROVIDER");

export interface VersionsProvider {
	getBuildMetadata(): Promise<{ commit: string, date: string }>;
	getInstalledAppVersion(): Promise<string>;
	getCurrentRemoteAppVersion(): Promise<string>;

	getWrapperVersion(): string;
}
