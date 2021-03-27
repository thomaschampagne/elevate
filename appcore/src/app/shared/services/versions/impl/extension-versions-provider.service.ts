import { Inject, Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { VersionsProvider } from "../versions-provider";
import { Platform } from "@elevate/shared/enums";
import { MatDialog } from "@angular/material/dialog";
import { GhRelease } from "@elevate/shared/models";
import _ from "lodash";

@Injectable()
export class ExtensionVersionsProvider extends VersionsProvider {
  private static readonly EXT_NAME: string = "crx";

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
    const githubReleaseApiUrl = VersionsProvider.getGithubReleasesApiEndpoint(this.getRepositoryUrl());
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
    const buildMetadata = require("../../../../../../../desktop/build_metadata.json");
    return Promise.resolve(buildMetadata);
  }

  public getPlatform(): Platform {
    return Platform.WEB_EXT;
  }

  public getWrapperVersion(): string {
    return "Chrome " + navigator.appVersion.match(/.*Chrome\/([0-9\.]+)/)[1];
  }
}
