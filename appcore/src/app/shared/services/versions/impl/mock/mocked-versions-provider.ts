import { VersionsProvider } from "../../versions-provider";
import { Inject, Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { GhRelease } from "../../gh-release.model";
import { MatDialog } from "@angular/material/dialog";
import { Platform } from "@elevate/shared/enums";

@Injectable()
export class MockedVersionsProvider extends VersionsProvider {
  constructor(
    @Inject(HttpClient) public readonly httpClient: HttpClient,
    @Inject(MatDialog) protected readonly dialog: MatDialog
  ) {
    super(httpClient, dialog);
  }

  public getGithubReleases(acceptPreReleases: boolean = false): Promise<GhRelease[]> {
    return Promise.resolve([]);
  }

  public getLatestGithubRelease(acceptPreReleases: boolean = false): Promise<GhRelease> {
    return Promise.resolve(null);
  }

  public getLatestRemoteVersion(): Promise<string> {
    return Promise.resolve("2.0.0");
  }

  public getPackageVersion(): string {
    return "2.0.0";
  }

  public getPlatform(): Platform {
    return null;
  }

  public getBuildMetadata(): Promise<{ commit: string; date: string }> {
    return Promise.resolve({
      commit: "xxxxxxx",
      date: new Date().toISOString()
    });
  }

  public checkForUpdates(): void {}

  public getWrapperVersion(): string {
    return "1.0.0";
  }
}
