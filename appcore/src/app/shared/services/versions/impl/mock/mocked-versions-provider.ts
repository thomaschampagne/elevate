import { VersionsProvider } from "../../versions-provider.interface";

export class MockedVersionsProvider implements VersionsProvider {
    public getRemoteVersion(): Promise<string> {
        return Promise.resolve("2.0.0");
    }

    public getPackageVersion(): Promise<string> {
        return Promise.resolve("2.0.0");
    }

    public getBuildMetadata(): Promise<{ commit: string; date: string }> {
        return Promise.resolve({
            commit: "xxxxxxx",
            date: new Date().toISOString(),
        });
    }

    public getWrapperVersion(): string {
        return "1.0.0";
    }
}
