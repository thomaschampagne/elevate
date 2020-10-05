import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { PackageManifest } from "@angular/cli/utilities/package-metadata";
import { VersionsProvider } from "../versions-provider.interface";
import _ from "lodash";
import { PropertiesDao } from "../../../dao/properties/properties.dao";

@Injectable()
export class DesktopVersionsProvider implements VersionsProvider {
    constructor(public readonly httpClient: HttpClient, public readonly propertiesDao: PropertiesDao) {}

    private static getGithubReleaseApiUrl(packageManifest: any) {
        return `https://api.github.com/repos/${packageManifest.build.publish.owner}/${packageManifest.build.publish.repo}/releases`;
    }

    public getPackageVersion(): Promise<string> {
        const desktopPackageJson = this.packageManifest();
        return Promise.resolve(desktopPackageJson.version);
    }

    public getExistingVersion(): Promise<string> {
        return this.propertiesDao.findOne().then(properties => {
            return Promise.resolve(properties.existingVersion);
        });
    }

    public setExistingVersion(version: string): Promise<void> {
        return this.propertiesDao
            .findOne()
            .then(properties => {
                properties.existingVersion = version;
                return this.propertiesDao.update(properties, true);
            })
            .then(() => Promise.resolve());
    }

    public getRemoteVersion(): Promise<string> {
        const packageManifest = <any>this.packageManifest();
        const githubReleaseApiUrl = DesktopVersionsProvider.getGithubReleaseApiUrl(packageManifest);
        return this.httpClient
            .get<object[]>(githubReleaseApiUrl)
            .toPromise()
            .then(
                (release: any[]) => {
                    if (release && _.isArray(release) && release.length > 0) {
                        const latestRelease = release[0];
                        if (!latestRelease.draft && !latestRelease.prerelease && latestRelease.name) {
                            return Promise.resolve(latestRelease.name);
                        }
                    }
                    return Promise.resolve(null);
                },
                err => {
                    return Promise.reject(err);
                }
            );
    }

    public getLatestReleaseUrl(): string {
        const packageManifest = <any>this.packageManifest();
        return `https://github.com/${packageManifest.build.publish.owner}/${packageManifest.build.publish.repo}/releases/latest`;
    }

    public getBuildMetadata(): Promise<{ commit: string; date: string }> {
        const buildMetadata = require("../../../../../../../desktop/build_metadata.json");
        return Promise.resolve(<{ commit: string; date: string }>buildMetadata);
    }

    public getWrapperVersion(): string {
        return "Electron " + process.versions.electron;
    }

    public packageManifest(): PackageManifest {
        return <PackageManifest>require("../../../../../../../desktop/package.json");
    }
}
