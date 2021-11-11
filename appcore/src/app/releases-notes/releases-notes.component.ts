import { Component, Inject, OnInit } from "@angular/core";
import { SafeHtml } from "@angular/platform-browser";
import { environment } from "../../environments/environment";
import semver from "semver/preload";
import { VersionsProvider } from "../shared/services/versions/versions-provider";
import { ReleaseNoteService } from "./release-note.service";
import { AppPackage } from "../app-package";

interface ReleaseNote {
  version: string;
  html: SafeHtml;
  date: Date;
}

@Component({
  selector: "app-releases-notes",
  templateUrl: "./releases-notes.component.html",
  styleUrls: ["./releases-notes.component.scss"]
})
export class ReleasesNotesComponent implements OnInit {
  public releaseNotes: ReleaseNote[];

  public readonly repositoryUrl: string = AppPackage.getRepositoryUrl();

  constructor(
    @Inject(VersionsProvider) public readonly versionsProvider: VersionsProvider,
    @Inject(ReleaseNoteService) private readonly releaseNoteService: ReleaseNoteService
  ) {
    this.releaseNotes = [];
  }

  public ngOnInit(): void {
    this.versionsProvider.getGithubReleases().then(ghReleases => {
      const packageVersion = this.versionsProvider.getPackageVersion();
      for (const ghRelease of ghReleases) {
        // Do not display greater versions than ours
        if (semver.gt(ghRelease.tag_name, packageVersion)) {
          continue;
        }

        this.releaseNotes.push({
          version: ghRelease.tag_name,
          date: ghRelease.published_at,
          html: this.releaseNoteService.getReleaseNoteAsHtmlByBuildTarget(ghRelease, environment.buildTarget)
        });
      }
    });
  }
}
