import { Inject, Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { PropertiesDao } from "../../../dao/properties/properties.dao";
import { ElectronService } from "../../../../desktop/electron/electron.service";
import { VersionsProvider } from "../versions-provider";
import { GhRelease } from "../gh-release.model";
import { MatDialog } from "@angular/material/dialog";
import { Platform } from "@elevate/shared/enums";
import { NewRemoteVersionNoticeDialogComponent } from "../new-remote-version-notice-dialog.component";
import { sleep } from "@elevate/shared/tools";
import semver from "semver";

@Injectable()
export class DesktopVersionsProvider extends VersionsProvider {
  private static readonly CHECK_FOR_NEW_VERSION_AFTER: number = 60 * 1000; // 1 minute
  private static readonly CHECK_FOR_NEW_VERSION_EVERY: number = 60 * 60 * 1000; // 1 hour

  constructor(
    @Inject(HttpClient) public readonly httpClient: HttpClient,
    @Inject(PropertiesDao) public readonly propertiesDao: PropertiesDao,
    @Inject(ElectronService) protected readonly electronService: ElectronService,
    @Inject(MatDialog) protected readonly dialog: MatDialog
  ) {
    super(httpClient, dialog);
  }

  public getGithubReleases(acceptPreReleases: boolean = false): Promise<GhRelease[]> {
    return this.getGithubReleasesByPlatform(this.getPlatform(), acceptPreReleases);
  }

  public getLatestGithubRelease(acceptPreReleases: boolean = false): Promise<GhRelease> {
    return this.getLatestGithubReleaseByPlatform(this.getPlatform(), acceptPreReleases);
  }

  public getLatestRemoteVersion(acceptPreReleases: boolean = false): Promise<string> {
    return this.getLatestGithubRelease(acceptPreReleases).then(ghRelease => {
      return Promise.resolve(ghRelease.tag_name);
    });
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

  public getBuildMetadata(): Promise<{ commit: string; date: string }> {
    const buildMetadata = require("../../../../../../../desktop/build_metadata.json");
    return Promise.resolve(buildMetadata as { commit: string; date: string });
  }

  public checkForUpdates(acceptPreReleases?: boolean): void {
    // Trigger version check on startup after timeout
    sleep(DesktopVersionsProvider.CHECK_FOR_NEW_VERSION_AFTER).then(() =>
      this.checkForNewGithubRelease(acceptPreReleases)
    );

    // Verify new version by an interval of time
    setInterval(
      () => this.checkForNewGithubRelease(acceptPreReleases),
      DesktopVersionsProvider.CHECK_FOR_NEW_VERSION_EVERY
    );
  }

  public getPlatform(): Platform {
    return this.electronService.getPlatform();
  }

  public getWrapperVersion(): string {
    return "Electron " + process.versions.electron;
  }

  public checkForNewGithubRelease(acceptPreReleases: boolean = false): void {
    // Get latest version for current platform
    this.getLatestGithubRelease(acceptPreReleases).then(ghRelease => {
      // Is remote version > current package version?
      if (semver.gt(ghRelease.tag_name, this.getPackageVersion())) {
        this.dialog.open(NewRemoteVersionNoticeDialogComponent, {
          minWidth: NewRemoteVersionNoticeDialogComponent.MIN_WIDTH,
          maxWidth: NewRemoteVersionNoticeDialogComponent.MAX_WIDTH,
          data: { ghRelease: ghRelease, platform: this.getPlatform() }
        });
      }
    });
  }
}
