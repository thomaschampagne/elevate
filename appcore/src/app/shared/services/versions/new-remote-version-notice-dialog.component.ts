import { Component, Inject, OnInit } from "@angular/core";
import { MAT_DIALOG_DATA } from "@angular/material/dialog";
import { GhRelease } from "./gh-release.model";
import { Platform } from "@elevate/shared/enums";
import { ReleaseNoteService } from "../../../releases-notes/release-note.service";
import { environment } from "../../../../environments/environment";
import { SafeHtml } from "@angular/platform-browser";

@Component({
  selector: "app-new-remote-version-notice-dialog",
  template: `
    <h2 mat-dialog-title>
      New version <strong>{{ data.ghRelease.tag_name }}</strong> available
    </h2>
    <mat-dialog-content class="mat-body-1">
      <!-- Windows or MacOS message -->
      <div *ngIf="data.platform === Platform.WINDOWS || data.platform === Platform.MACOS">
        <div>
          You may need to <strong>restart</strong> the app to <strong>trigger this update</strong>
          <i>(click "3-dots" icon then "Restart App")</i> or
          <a [href]="data.ghRelease.html_url">download update directly</a>.
        </div>
      </div>

      <!-- Linux message -->
      <div *ngIf="data.platform === Platform.LINUX">
        <div><a [href]="data.ghRelease.html_url">Download update</a>.</div>
      </div>

      <!-- web extension message -->
      <div *ngIf="data.platform === Platform.WEB_EXT">
        <div>
          You may need to <strong>restart</strong> your browser to <strong>trigger this update</strong> or you can
          follow below steps to force the update:
        </div>
        <div>
          <ul>
            <li>Open a new tab and type <strong>chrome://extensions</strong> then type <em>enter</em></li>
            <li>Tick <strong>Developer Mode</strong> checkbox.</li>
            <li>Click <strong>Update</strong> button to force the update.</li>
            <li>You are done.</li>
          </ul>
        </div>
      </div>

      <div class="mat-subheading-2">Changelog:</div>
      <div [innerHtml]="releaseNoteContent" class="mat-body-1"></div>
    </mat-dialog-content>

    <mat-dialog-actions>
      <button color="primary" mat-dialog-close mat-stroked-button>Got it</button>
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
export class NewRemoteVersionNoticeDialogComponent implements OnInit {
  public static readonly MAX_WIDTH: string = "50%";
  public static readonly MIN_WIDTH: string = "50%";

  public readonly Platform = Platform;
  public releaseNoteContent: SafeHtml;

  constructor(
    @Inject(MAT_DIALOG_DATA) public readonly data: { ghRelease: GhRelease; platform: Platform },
    @Inject(ReleaseNoteService) private readonly releaseNoteService: ReleaseNoteService
  ) {}

  public ngOnInit(): void {
    this.releaseNoteContent = this.releaseNoteService.getReleaseNoteAsHtmlByBuildTarget(
      this.data.ghRelease,
      environment.buildTarget
    );
  }
}
