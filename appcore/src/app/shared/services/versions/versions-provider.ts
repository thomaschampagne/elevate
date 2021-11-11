import { HttpClient } from "@angular/common/http";
import { Inject } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { NewInstalledVersionNoticeDialogComponent } from "./new-installed-version-notice-dialog.component";
import { AppPackage } from "../../../app-package";
import { GhRelease } from "@elevate/shared/models/updates/gh-release.model";
import { WarningException } from "@elevate/shared/exceptions/warning.exception";
import { Platform } from "@elevate/shared/enums/platform.enum";

export abstract class VersionsProvider {
  protected constructor(
    @Inject(HttpClient) public readonly httpClient: HttpClient,
    @Inject(MatDialog) protected readonly dialog: MatDialog
  ) {}

  protected static getGithubReleaseByTagApiEndpoint(repoUrl: string, tag: string): string {
    return `${this.getGithubReleasesApiEndpoint(repoUrl)}/tags/${tag}`;
  }

  protected static getGithubReleasesApiEndpoint(repoUrl: string): string {
    // Find out the short repo name from repo url
    const shortRepoName = repoUrl.split("/").slice(3, 5).join("/");
    return `https://api.github.com/repos/${shortRepoName}/releases`;
  }

  abstract getGithubReleases(acceptPreReleases?: boolean): Promise<GhRelease[]>;

  abstract getWrapperVersion(): string;

  abstract getPlatform(): Platform;

  abstract getBuildMetadata(): Promise<{ commit: string; date: string }>;

  public getPackageVersion(): string {
    return AppPackage.getVersion();
  }

  public getGithubReleaseByTag(tag: string): Promise<GhRelease> {
    const githubReleaseByTagApiUrl = VersionsProvider.getGithubReleaseByTagApiEndpoint(
      AppPackage.getRepositoryUrl(),
      tag
    );
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

  public getLatestReleaseUrl(): string {
    return `${AppPackage.getRepositoryUrl()}/releases/latest`;
  }
}
