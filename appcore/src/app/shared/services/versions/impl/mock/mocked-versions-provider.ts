import { VersionsProvider } from "../../versions-provider.interface";

export class MockedVersionsProvider implements VersionsProvider {

	getCurrentRemoteAppVersion(): Promise<string> {
		return Promise.resolve("2.0.0");
	}

	getInstalledAppVersion(): Promise<string> {
		return Promise.resolve("2.0.0");
	}

	getBuildMetadata(): Promise<{ commit: string; date: string }> {
		return Promise.resolve({
			commit: "xxxxxxx",
			date: new Date().toISOString()
		});
	}

	getWrapperVersion(): string {
		return "1.0.0";
	}

}
