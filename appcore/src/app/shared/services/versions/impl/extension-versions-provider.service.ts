import { Inject, Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { VersionsProvider } from "../versions-provider";
import { MatDialog } from "@angular/material/dialog";
import _ from "lodash";
import { AppPackage } from "@elevate/shared/tools/app-package";
import { GhRelease } from "@elevate/shared/models/updates/gh-release.model";
import { Platform } from "@elevate/shared/enums/platform.enum";

@Injectable()
export class ExtensionVersionsProvider extends VersionsProvider {
  private static readonly EXT_NAME: string = "zip";

  constructor(
    @Inject(HttpClient) public readonly httpClient: HttpClient,
    @Inject(MatDialog) protected readonly dialog: MatDialog
  ) {
    super(httpClient, dialog);
  }

  public getGithubReleases(acceptPreReleases: boolean = false): Promise<GhRelease[]> {
    return this.getWebExtGithubReleases(acceptPreReleases);
  }

  public getWebExtGithubReleases(acceptPreReleases: boolean = false): Promise<GhRelease[]> {
    const githubReleaseApiUrl = VersionsProvider.getGithubReleasesApiEndpoint(AppPackage.getRepositoryUrl());
    return this.httpClient
      .get<GhRelease[]>(githubReleaseApiUrl)
      .toPromise()
      .then((releases: GhRelease[]) => {
        if (_.isEmpty(releases)) {
          return Promise.reject("No github releases found");
        }

        // Get extension name from platform
        const releasesFound: GhRelease[] = [];

        // Seek for each release if downloadable asset match platform given
        for (const release of releases) {
          // Skip if draft release or prerelease (when not accepted)
          if (release.draft || (release.prerelease && !acceptPreReleases)) {
            continue;
          }

          const assetFound = _.find(release.assets, asset => {
            return !!new RegExp(`.${ExtensionVersionsProvider.EXT_NAME}$`, "gi").exec(asset.name);
          });

          // If we have a matching asset track release and break the loop
          if (assetFound) {
            releasesFound.push(release);
          }
        }

        if (!releasesFound.length) {
          return Promise.reject("No github releases found");
        }

        return Promise.resolve(releasesFound);
      });
  }

  public getBuildMetadata(): Promise<{ commit: string; date: string }> {
    const buildMetadata = require("../../../../../../../webextension/build_metadata.json");
    return Promise.resolve(buildMetadata);
  }

  public getPlatform(): Platform {
    return Platform.WEB_EXT;
  }

  public getWrapperVersion(): string {
    return "Chrome " + navigator.appVersion.match(/.*Chrome\/([0-9\.]+)/)[1];
  }
}
