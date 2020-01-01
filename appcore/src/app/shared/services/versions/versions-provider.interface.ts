import { InjectionToken } from "@angular/core";

export const VERSIONS_PROVIDER = new InjectionToken<VersionsProvider>("VERSIONS_PROVIDER");

export interface VersionsProvider {
	getPackageVersion(): Promise<string>;

	getRemoteVersion(): Promise<string>;

	getWrapperVersion(): string;

	getBuildMetadata(): Promise<{ commit: string, date: string }>;
}
