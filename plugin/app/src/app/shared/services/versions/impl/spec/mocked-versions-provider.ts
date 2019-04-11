import { VersionsProvider } from "../../versions-provider.interface";

export class MockedVersionsProvider implements VersionsProvider {

	getCurrentRemoteAppVersion(): Promise<string> {
		return Promise.resolve("2.0.0");
	}

	getInstalledAppVersion(): Promise<string> {
		return Promise.resolve("2.0.0");
	}

}
