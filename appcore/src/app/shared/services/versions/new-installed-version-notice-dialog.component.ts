import { Component, Inject, OnInit } from "@angular/core";
import { MAT_DIALOG_DATA } from "@angular/material/dialog";
import { ReleaseNoteService } from "../../../releases-notes/release-note.service";
import { environment } from "../../../../environments/environment";
import { SafeHtml } from "@angular/platform-browser";
import { Router } from "@angular/router";
import { AppRoutes } from "../../models/app-routes";
import { Platform } from "@elevate/shared/enums/platform.enum";
import { GhRelease } from "@elevate/shared/models/updates/gh-release.model";

@Component({
  selector: "app-new-installed-version-notice-dialog",
  template: `
    <h2 mat-dialog-title>
      Elevate has been upgraded to version <strong>{{ data.ghRelease.tag_name }}</strong>
    </h2>
    <mat-dialog-content class="mat-body-1">
      <div class="mat-subheading-2">Changelog:</div>
      <div [innerHtml]="releaseNoteContent" class="mat-body-1"></div>
    </mat-dialog-content>

    <mat-dialog-actions>
      <button color="primary" mat-dialog-close mat-stroked-button>Got it</button>
      <button color="primary" mat-dialog-close mat-stroked-button (click)="onViewAllReleaseNotes()">
        All release notes
      </button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      div {
        margin-bottom: 5px;
      }
    `
  ]
})
export class NewInstalledVersionNoticeDialogComponent implements OnInit {
  public static readonly MAX_WIDTH: string = "50%";
  public static readonly MIN_WIDTH: string = "50%";

  public readonly Platform = Platform;
  public releaseNoteContent: SafeHtml;

  constructor(
    @Inject(MAT_DIALOG_DATA) public readonly data: { ghRelease: GhRelease; platform: Platform },
    @Inject(ReleaseNoteService) private readonly releaseNoteService: ReleaseNoteService,
    @Inject(Router) protected readonly router: Router
  ) {}

  public ngOnInit(): void {
    this.releaseNoteContent = this.releaseNoteService.getReleaseNoteAsHtmlByBuildTarget(
      this.data.ghRelease,
      environment.buildTarget
    );
  }

  public onViewAllReleaseNotes(): void {
    this.router.navigate([AppRoutes.releasesNotes]);
  }
}
