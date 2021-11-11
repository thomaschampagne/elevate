import { ChangeDetectorRef, Component, Inject, OnInit } from "@angular/core";
import { VersionsProvider } from "../shared/services/versions/versions-provider";
import { ElectronService } from "../desktop/electron/electron.service";
import { TopBarComponent } from "./top-bar.component";
import { WindowService } from "../shared/services/window/window.service";
import { DesktopWindowService } from "../shared/services/window/desktop-window.service";
import { Platform } from "@elevate/shared/enums/platform.enum";

@Component({
  selector: "app-desktop-top-bar",
  template: `
    <div *ngIf="!isFullScreen" class="top-bar-wrapper top-bar-h">
      <div class="top-bar-draggable top-bar-h"></div>
      <div class="top-bar-traffic-light-zone"><!-- Empty div used for flex space between behavior --></div>
      <span class="top-bar-title mat-caption">Elevate Training App <span class="alpha-tag">alpha</span></span>
      <div class="top-bar-traffic-light-zone">
        <ng-container *ngIf="!isMacOs">
          <button mat-icon-button (click)="onMinimizeAppClicked()">
            <mat-icon fontSet="material-icons-outlined" inline="true">remove</mat-icon>
          </button>
          <button *ngIf="!isMaximized" mat-icon-button (click)="onMaximizeAppClicked()">
            <mat-icon fontSet="material-icons-outlined" inline="true">fullscreen</mat-icon>
          </button>
          <button *ngIf="isMaximized" mat-icon-button (click)="onRestoreAppClicked()">
            <mat-icon fontSet="material-icons-outlined" inline="true">fullscreen_exit</mat-icon>
          </button>
          <button mat-icon-button (click)="onCloseAppClicked()">
            <mat-icon fontSet="material-icons-outlined" inline="true">clear</mat-icon>
          </button>
        </ng-container>
      </div>
    </div>
  `,
  styles: [
    `
      .top-bar-h {
        height: 34px;
      }

      .top-bar-wrapper {
        background-color: #303030;
        display: flex;
        align-items: center;
        justify-content: space-between;
        color: white;
      }

      .top-bar-draggable {
        -webkit-app-region: drag;
        position: absolute;
        left: 3px;
        right: 3px;
        top: 3px;
        bottom: 3px;
      }

      .top-bar-traffic-light-zone {
        width: 120px;
      }

      /*No drag on every buttons*/
      button {
        -webkit-app-region: no-drag;
        border-radius: 0;
      }

      button:hover {
        /* Set close bg red and full squared */
        background-color: #5a5a5a;
      }

      button:last-child:hover {
        /* Set close bg red and full squared */
        background-color: #ff4643;
      }

      .alpha-tag {
        background: white;
        color: black;
        border-radius: 4px;
        padding: 1px 3px;
        margin-left: 2px;
      }
    `
  ]
})
export class DesktopTopBarComponent extends TopBarComponent implements OnInit {
  public currentVersion: string;
  public buildMetadata: { commit: string; date: string };
  public isFullScreen: boolean;
  public isMaximized: boolean;

  public readonly isMacOs;

  constructor(
    @Inject(VersionsProvider) public readonly versionsProvider: VersionsProvider,
    @Inject(ElectronService) private readonly electronService: ElectronService,
    @Inject(WindowService) private readonly desktopWindowService: DesktopWindowService,
    @Inject(ChangeDetectorRef) private readonly changeDetectorRef: ChangeDetectorRef
  ) {
    super();
    this.isFullScreen = false;
    this.isMaximized = false;
    this.isMacOs = this.electronService.getPlatform() === Platform.MACOS;
  }

  public ngOnInit() {
    // Listen for fullscreen/maximize events
    this.desktopWindowService.isMaximized$.subscribe(isMaximized => {
      this.isMaximized = isMaximized;
      this.changeDetectorRef.detectChanges();
    });
    this.desktopWindowService.isFullScreen$.subscribe(isFullScreen => {
      this.isFullScreen = isFullScreen;
      this.changeDetectorRef.detectChanges();
    });

    this.currentVersion = this.versionsProvider.getPackageVersion();

    this.versionsProvider.getBuildMetadata().then((buildMetadata: { commit: string; date: string }) => {
      this.buildMetadata = buildMetadata;
      this.buildMetadata.date = this.buildMetadata.date.slice(0, 10).replace(/-/g, "");
    });
  }

  public onMinimizeAppClicked() {
    this.electronService.minimizeApp();
  }

  public onMaximizeAppClicked() {
    this.electronService.maximizeApp();
  }

  public onRestoreAppClicked() {
    this.electronService.restoreApp();
  }

  public onCloseAppClicked() {
    this.electronService.closeApp();
  }
}
