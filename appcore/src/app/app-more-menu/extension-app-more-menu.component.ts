import { Component } from "@angular/core";
import { AppMoreMenuComponent } from "./app-more-menu.component";

@Component({
  selector: "app-extension-app-more-menu",
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

      <button mat-menu-item (click)="onShowAbout()">
        <mat-icon fontSet="material-icons-outlined">info</mat-icon>
        About
      </button>
    </mat-menu>
  `
})
export class ExtensionAppMoreMenuComponent extends AppMoreMenuComponent {}
