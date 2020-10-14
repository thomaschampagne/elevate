import { Inject, Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { VersionsProvider } from "../versions-provider";
import { Platform } from "@elevate/shared/enums";
import { GhRelease } from "../gh-release.model";
import { MatDialog } from "@angular/material/dialog";

@Injectable()
export class ExtensionVersionsProvider extends VersionsProvider {
  constructor(
    @Inject(HttpClient) public readonly httpClient: HttpClient,
    @Inject(MatDialog) protected readonly dialog: MatDialog
  ) {
    super(httpClient, dialog);
  }

  public getGithubReleases(acceptPreReleases: boolean = false): Promise<GhRelease[]> {
    return this.getGithubReleasesByPlatform(Platform.WEB_EXT, acceptPreReleases);
  }

  public getLatestGithubRelease(acceptPreReleases: boolean = false): Promise<GhRelease> {
    return this.getLatestGithubReleaseByPlatform(Platform.WEB_EXT, acceptPreReleases);
  }

  public getLatestRemoteVersion(acceptPreReleases: boolean = false): Promise<string> {
    return this.getLatestGithubRelease(acceptPreReleases).then(ghRelease => {
      return Promise.resolve(ghRelease.tag_name);
    });
  }

  public getBuildMetadata(): Promise<{ commit: string; date: string }> {
    const buildMetadata = require("../../../../../../../desktop/build_metadata.json");
    return Promise.resolve(buildMetadata);
  }

  public checkForUpdates(): void {
    // No check for updates into web extension at the moment.
    // Only desktop implementation is looking into github releases
  }

  public getPlatform(): Platform {
    return Platform.WEB_EXT;
  }

  public getWrapperVersion(): string {
    return "Chrome " + navigator.appVersion.match(/.*Chrome\/([0-9\.]+)/)[1];
  }
}
