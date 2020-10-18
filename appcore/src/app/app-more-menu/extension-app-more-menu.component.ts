import { Component } from "@angular/core";
import { AppMoreMenuComponent } from "./app-more-menu.component";

@Component({
  selector: "app-extension-app-more-menu",
  template: `
    <button mat-icon-button [matMenuTriggerFor]="moreMenu">
      <mat-icon fontSet="material-icons-outlined">more_vert</mat-icon>
    </button>
    <mat-menu #moreMenu="matMenu">
      <button mat-menu-item (click)="onOpenLink('https://twitter.com/champagnethomas')">
        <mat-icon fontSet="material-icons-outlined">announcement</mat-icon>
        Plugin updates
      </button>

      <button mat-menu-item (click)="onShowReleaseNotes()">
        <mat-icon fontSet="material-icons-outlined">system_update</mat-icon>
        Release notes
      </button>

      <button mat-menu-item (click)="onShowShare()">
        <mat-icon fontSet="material-icons-outlined">share</mat-icon>
        Share plugin
      </button>

      <button mat-menu-item (click)="onOpenLink('https://www.strava.com/clubs/elevatestrava')">
        <mat-icon fontSet="material-icons-outlined">group</mat-icon>
        Strava club
      </button>

      <button mat-menu-item (click)="onOpenLink('https://thomaschampagne.github.io/elevate/')">
        <mat-icon fontSet="material-icons-outlined">public</mat-icon>
        Plugin page
      </button>

      <button mat-menu-item (click)="onShowReport()">
        <mat-icon fontSet="material-icons-outlined">bug_report</mat-icon>
        Report a bug
      </button>

      <button mat-menu-item (click)="onAdvanceMenu()">
        <mat-icon fontSet="material-icons-outlined">build</mat-icon>
        Advanced
      </button>

      <button mat-menu-item (click)="onShowAbout()">
        <mat-icon fontSet="material-icons-outlined">info</mat-icon>
        About
      </button>
    </mat-menu>
  `
})
export class ExtensionAppMoreMenuComponent extends AppMoreMenuComponent {}
