import { Component, HostListener, Inject, OnInit } from "@angular/core";
import { VersionsProvider } from "../shared/services/versions/versions-provider";
import { ElectronService } from "../desktop/electron/electron.service";
import { TopBarComponent } from "./top-bar.component";

@Component({
  selector: "app-desktop-top-bar",
  template: `
    <div class="top-bar">
      <div *ngIf="!isFullScreen" class="draggable"></div>
      <span class="top-bar-title mat-body-strong" *ngIf="buildMetadata && buildMetadata.commit && buildMetadata.date">
        Elevate v{{ currentVersion }}
      </span>
      <span class="toolbar-spacer"></span>
      <button mat-icon-button (click)="onMinimizeAppClicked()">
        <mat-icon fontSet="material-icons-outlined" inline="true">minimize</mat-icon>
      </button>
      <button *ngIf="!isFullscreen" mat-icon-button (click)="onFullscreenAppClicked()">
        <mat-icon fontSet="material-icons-outlined" inline="true">fullscreen</mat-icon>
      </button>
      <button *ngIf="isFullscreen" mat-icon-button (click)="onNormalScreenAppClicked()">
        <mat-icon fontSet="material-icons-outlined" inline="true">fullscreen_exit</mat-icon>
      </button>
      <button mat-icon-button (click)="onCloseAppClicked()">
        <mat-icon fontSet="material-icons-outlined" inline="true">close</mat-icon>
      </button>
    </div>
  `,
  styles: [
    `
      .top-bar {
        background-color: #303030;
        display: flex;
        align-items: center;
        color: white;
      }

      .draggable {
        -webkit-app-region: drag;
        position: absolute;
        left: 3px;
        right: 3px;
        top: 3px;
        height: 35px;
      }

      .top-bar-title {
        margin: 0 0 0 16px;
      }

      .toolbar-spacer {
        flex: 1 1 auto;
      }

      button {
        -webkit-app-region: no-drag;
      }

      button:last-child:hover {
        /* Set close icon red */
        color: #ff4643;
      }
    `
  ]
})
export class DesktopTopBarComponent extends TopBarComponent implements OnInit {
  public isFullscreen: boolean = null;
  public currentVersion: string;
  public buildMetadata: { commit: string; date: string };
  public isFullScreen: boolean;

  constructor(
    @Inject(VersionsProvider) public readonly versionsProvider: VersionsProvider,
    @Inject(ElectronService) private readonly electronService: ElectronService
  ) {
    super();
    this.isFullScreen = false;
  }

  @HostListener("document:fullscreenchange")
  public fullScreenListener(): void {
    this.isFullScreen = !window.screenTop && !window.screenY;
  }

  public ngOnInit() {
    this.currentVersion = this.versionsProvider.getPackageVersion();

    this.versionsProvider.getBuildMetadata().then((buildMetadata: { commit: string; date: string }) => {
      this.buildMetadata = buildMetadata;
      this.buildMetadata.date = this.buildMetadata.date.slice(0, 10).replace(/-/g, "");
    });

    this.electronService.remote.getCurrentWindow().on("enter-full-screen", event => {
      this.isFullscreen = this.electronService.remote.getCurrentWindow().isFullScreen();
    });

    this.electronService.remote.getCurrentWindow().addListener("leave-full-screen", event => {
      this.isFullscreen = this.electronService.remote.getCurrentWindow().isFullScreen();
    });

    this.isFullscreen = this.electronService.remote.getCurrentWindow().isFullScreen();
  }

  public onMinimizeAppClicked() {
    this.electronService.remote.getCurrentWindow().minimize();
  }

  public onCloseAppClicked() {
    this.electronService.remote.getCurrentWindow().close();
  }

  public onFullscreenAppClicked() {
    this.electronService.remote.getCurrentWindow().setFullScreen(true);
  }

  public onNormalScreenAppClicked() {
    this.electronService.remote.getCurrentWindow().setFullScreen(false);
  }
}
