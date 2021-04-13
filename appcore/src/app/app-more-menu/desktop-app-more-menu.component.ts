import { Component, Inject } from "@angular/core";
import { Router } from "@angular/router";
import { MatDialog } from "@angular/material/dialog";
import { OPEN_RESOURCE_RESOLVER, OpenResourceResolver } from "../shared/services/links-opener/open-resource-resolver";
import { ElectronService } from "../desktop/electron/electron.service";
import { AppMoreMenuComponent } from "./app-more-menu.component";

@Component({
  selector: "app-desktop-app-more-menu",
  template: `
    <button mat-icon-button [matMenuTriggerFor]="moreMenu">
      <mat-icon fontSet="material-icons-outlined">more_vert</mat-icon>
    </button>
    <mat-menu #moreMenu="matMenu">
      <button mat-menu-item (click)="onShowReleaseNotes()">
        <mat-icon fontSet="material-icons-outlined">system_update</mat-icon>
        Release notes
      </button>

      <button mat-menu-item (click)="onShowReport()">
        <mat-icon fontSet="material-icons-outlined">bug_report</mat-icon>
        Report a bug
      </button>

      <button mat-menu-item (click)="onAdvanceMenu()">
        <mat-icon fontSet="material-icons-outlined">architecture</mat-icon>
        Advanced
      </button>

      <button mat-menu-item (click)="onOnlineDoc()">
        <mat-icon fontSet="material-icons-outlined">assistant_photo</mat-icon>
        Online Doc
      </button>

      <button mat-menu-item (click)="onRestartApp()">
        <mat-icon fontSet="material-icons-outlined">replay</mat-icon>
        Restart App
      </button>

      <button mat-menu-item (click)="onShowAbout()">
        <mat-icon fontSet="material-icons-outlined">info</mat-icon>
        About
      </button>
    </mat-menu>
  `
})
export class DesktopAppMoreMenuComponent extends AppMoreMenuComponent {
  constructor(
    @Inject(Router) protected readonly router: Router,
    @Inject(MatDialog) protected readonly dialog: MatDialog,
    @Inject(OPEN_RESOURCE_RESOLVER) protected readonly openResourceResolver: OpenResourceResolver,
    @Inject(ElectronService) private readonly electronService: ElectronService
  ) {
    super(router, dialog, openResourceResolver);
  }

  public onRestartApp(): void {
    this.electronService.restartApp();
  }
}
