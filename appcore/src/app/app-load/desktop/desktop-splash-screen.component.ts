import { ChangeDetectorRef, Component, Inject, OnDestroy, OnInit } from "@angular/core";
import { SplashScreenComponent } from "../splash-screen.component";
import { AppService } from "../../shared/services/app-service/app.service";
import { DesktopUpdateService } from "../../desktop/app-update/desktop-update.service";
import { Observable, Subscription } from "rxjs";
import { MatSnackBar } from "@angular/material/snack-bar";
import { LoggerService } from "../../shared/services/logging/logger.service";
import { countdown } from "@elevate/shared/tools/countdown";
import { StaticUpdateNotify, UpdateNotify } from "@elevate/shared/models/updates/update-notify";

@Component({
  selector: "app-desktop-splash-screen",
  template: `
    <div *ngIf="!appService.isAppLoaded" id="init-app-container">
      <div class="window-draggable"></div>
      <div class="wrapper">
        <div class="logo"></div>
        <div class="loading-status mat-h4">
          <ng-container *ngIf="updateNotify">
            <ng-container *ngIf="updateNotify.isAutoUpdatable">
              <div class="loading-text-status" *ngIf="downloadUpdateProgress !== 100">Downloading update</div>
              <div class="loading-text-status" *ngIf="downloadUpdateProgress === 100">Restarting...</div>
              <mat-progress-bar
                *ngIf="downloadUpdateProgress !== 100"
                mode="determinate"
                [value]="downloadUpdateProgress"
              ></mat-progress-bar>
            </ng-container>
            <ng-container *ngIf="!updateNotify.isAutoUpdatable">
              <div class="loading-text-status">
                New update <strong>{{ updateNotify.version }}</strong> available.
              </div>
              <div class="loading-text-status mat-h4">
                <i
                  >Installing new updates is strongly recommended. <strong>Don't skip them!</strong>.<br />Auto-update
                  for this platform will be available in a future version.</i
                >
              </div>
              <div>
                <button (click)="onStaticDownload()" color="primary" mat-stroked-button>Download update</button>
                <span fxFlex="1"></span>
                <button
                  *ngIf="this.skipCountdown$"
                  [disabled]="(this.skipCountdown$ | async) > 0"
                  (click)="onSkipStaticUpdate()"
                  color="primary"
                  mat-stroked-button
                >
                  Skip
                  <span *ngIf="(this.skipCountdown$ | async) > 0">
                    ({{ this.skipCountdown$ | async | number: "2.0" }})</span
                  >
                </button>
              </div>
            </ng-container>
          </ng-container>

          <ng-container *ngIf="!updateNotify">
            <div class="loading-text-status">Loading</div>
            <mat-progress-bar mode="indeterminate"></mat-progress-bar>
          </ng-container>
        </div>
      </div>
    </div>
  `,
  styleUrls: ["./desktop-splash-screen.component.scss"]
})
export class DesktopSplashScreenComponent extends SplashScreenComponent implements OnInit, OnDestroy {
  constructor(
    @Inject(DesktopUpdateService) protected readonly desktopUpdateService: DesktopUpdateService,
    @Inject(AppService) public readonly appService: AppService,
    @Inject(ChangeDetectorRef) private readonly changeDetectorRef: ChangeDetectorRef,
    @Inject(MatSnackBar) protected readonly snackBar: MatSnackBar,
    @Inject(LoggerService) private readonly logger: LoggerService
  ) {
    super();

    this.updateNotify = null;

    this.updateNotifySub = this.desktopUpdateService.updateNotify$.subscribe(updateNotify => {
      this.updateNotify = updateNotify;
      if (!this.updateNotify.isAutoUpdatable) {
        this.skipCountdown$ = countdown(DesktopSplashScreenComponent.SKIP_COUNTDOWN);
      }
    });

    this.downloadUpdateSub = this.desktopUpdateService.downloadUpdate$.subscribe(
      progress => {
        this.downloadUpdateProgress = progress;
        this.changeDetectorRef.detectChanges();
      },
      error => this.logger.error(error)
    );
  }

  private static readonly SKIP_COUNTDOWN = 5;

  public updateNotify: UpdateNotify;
  public downloadUpdateProgress: number;
  public skipCountdown$: Observable<number>;

  private updateNotifySub: Subscription;
  private downloadUpdateSub: Subscription;

  public ngOnInit(): void {}

  public ngOnDestroy(): void {
    this.updateNotifySub.unsubscribe();
    this.downloadUpdateSub.unsubscribe();
  }

  public onStaticDownload(): void {
    const staticUpdateNotify = this.updateNotify as StaticUpdateNotify;
    this.desktopUpdateService.onStaticDownload(staticUpdateNotify, true);
  }

  public onSkipStaticUpdate(): void {
    this.desktopUpdateService.skipStaticUpdate();

    this.snackBar.open("You probably missed new features and improvements 😉️. Update app next time!", null, {
      duration: 10000
    });
  }
}
