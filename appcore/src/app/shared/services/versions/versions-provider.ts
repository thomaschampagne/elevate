import { repository, version } from "../../../../../../package.json";
import { HttpClient } from "@angular/common/http";
import { GhRelease } from "./gh-release.model";
import { Platform } from "@elevate/shared/enums";
import _ from "lodash";
import { Inject } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { NewInstalledVersionNoticeDialogComponent } from "./new-installed-version-notice-dialog.component";
import { WarningException } from "@elevate/shared/exceptions";

export abstract class VersionsProvider {
  private static readonly PLATFORM_FILE_EXT_MAP = new Map<Platform, string>([
    [Platform.WINDOWS, "exe"],
    [Platform.LINUX, "deb"],
    [Platform.MACOS, "dmg"],
    [Platform.WEB_EXT, "zip"]
  ]);

  protected constructor(
    @Inject(HttpClient) public readonly httpClient: HttpClient,
    @Inject(MatDialog) protected readonly dialog: MatDialog
  ) {}

  private static getGithubReleasesApiEndpoint(repoUrl: string): string {
    // Find out the short repo name from repo url
    const shortRepoName = repoUrl.split("/").slice(3, 5).join("/");
    return `https://api.github.com/repos/${shortRepoName}/releases`;
  }

  private static getGithubReleaseByTagApiEndpoint(repoUrl: string, tag: string): string {
    return `${this.getGithubReleasesApiEndpoint(repoUrl)}/tags/${tag}`;
  }

  abstract getGithubReleases(acceptPreReleases?: boolean): Promise<GhRelease[]>;

  abstract getLatestGithubRelease(acceptPreReleases?: boolean): Promise<GhRelease>;

  abstract getLatestRemoteVersion(acceptPreReleases?: boolean): Promise<string>;

  abstract getWrapperVersion(): string;

  abstract getPlatform(): Platform;

  abstract getBuildMetadata(): Promise<{ commit: string; date: string }>;

  abstract checkForUpdates(acceptPreReleases?: boolean): void;

  public getPackageVersion(): string {
    return version;
  }

  public getGithubReleasesByPlatform(platform: Platform, acceptPreReleases: boolean = false): Promise<GhRelease[]> {
    const githubReleaseApiUrl = VersionsProvider.getGithubReleasesApiEndpoint(this.getRepositoryUrl());
    return this.httpClient
      .get<GhRelease[]>(githubReleaseApiUrl)
      .toPromise()
      .then((releases: GhRelease[]) => {
        if (_.isEmpty(releases)) {
          return Promise.reject("No github releases found");
        }

        // Get extension name from platform
        const extName = VersionsProvider.PLATFORM_FILE_EXT_MAP.get(platform);

        const releasesFound: GhRelease[] = [];

        // Seek for each release if downloadable asset match platform given
        for (const release of releases) {
          // Skip if draft release or prerelease (when not accepted)
          if (release.draft || (release.prerelease && !acceptPreReleases)) {
            continue;
          }

          const assetFound = _.find(release.assets, asset => {
            return !!new RegExp(`.${extName}$`, "gi").exec(asset.name);
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

  public getLatestGithubReleaseByPlatform(platform: Platform, acceptPreReleases: boolean = false): Promise<GhRelease> {
    return this.getGithubReleasesByPlatform(platform, acceptPreReleases).then(
      (releases: GhRelease[]) => {
        return Promise.resolve(_.first(releases));
      },
      err => {
        return Promise.reject(err);
      }
    );
  }

  public getGithubReleaseByTag(tag: string): Promise<GhRelease> {
    const githubReleaseByTagApiUrl = VersionsProvider.getGithubReleaseByTagApiEndpoint(this.getRepositoryUrl(), tag);
    return this.httpClient.get<GhRelease>(githubReleaseByTagApiUrl).toPromise();
  }

  public notifyInstalledVersion(hasBeenUpgradedToVersion: string): void {
    this.getGithubReleaseByTag(hasBeenUpgradedToVersion)
      .then(ghRelease => {
        this.dialog.open(NewInstalledVersionNoticeDialogComponent, {
          minWidth: NewInstalledVersionNoticeDialogComponent.MIN_WIDTH,
          maxWidth: NewInstalledVersionNoticeDialogComponent.MAX_WIDTH,
          data: { ghRelease: ghRelease, platform: this.getPlatform() }
        });
      })
      .catch(err => {
        if (err.status === 404) {
          throw new WarningException(`Can't fetch release notes of ${hasBeenUpgradedToVersion} version from github`);
        }
        throw err;
      });
  }

  public getRepositoryUrl(): string {
    return repository.url;
  }

  public getLatestReleaseUrl(): string {
    return `${this.getRepositoryUrl()}/releases/latest`;
  }
}
