import { VersionsProvider } from "../../versions-provider.interface";

export class MockedVersionsProvider implements VersionsProvider {

	getCurrentRemoteAppVersion(): Promise<string> {
		return Promise.resolve("1.0.0");
	}

	getInstalledAppVersion(): Promise<string> {
		return Promise.resolve("1.0.0");
	}

}
