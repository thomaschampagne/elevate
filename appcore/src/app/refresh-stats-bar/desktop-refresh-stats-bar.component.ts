import { Component, Inject, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import { ActivityService } from "../shared/services/activity/activity.service";
import { UserSettingsService } from "../shared/services/user-settings/user-settings.service";
import { MatDialog } from "@angular/material/dialog";
import { LoggerService } from "../shared/services/logging/logger.service";
import {
  BulkRefreshStatsNotification,
  DesktopActivityService
} from "../shared/services/activity/impl/desktop-activity.service";
import { GotItDialogComponent } from "../shared/dialogs/got-it-dialog/got-it-dialog.component";
import { GotItDialogDataModel } from "../shared/dialogs/got-it-dialog/got-it-dialog-data.model";
import moment from "moment";
import { RefreshStatsBarComponent } from "./refresh-stats-bar.component";
import { UserSettings } from "@elevate/shared/models";
import DesktopUserSettingsModel = UserSettings.DesktopUserSettingsModel;

@Component({
  selector: "app-desktop-refresh-stats-bar",
  template: `
    <div class="app-refresh-stats-bar">
      <!--Missing stress scores detected on some activities-->
      <div *ngIf="!hideSettingsLacksWarning" fxLayout="row" fxLayoutAlign="space-between center" class="ribbon">
        <div fxLayout="column" fxLayoutAlign="center start">
          <span>
            <mat-icon fontSet="material-icons-outlined" [style.vertical-align]="'bottom'">looks_one</mat-icon>
            Missing stress scores detected on some activities. You probably forgot some functional thresholds in dated
            athlete settings.
          </span>
        </div>
        <div fxLayout="row" fxLayoutAlign="space-between center">
          <button mat-flat-button color="accent" (click)="onShowActivitiesWithSettingsLacks()">Details</button>
          <button
            *ngIf="hideGoToAthleteSettingsButton"
            mat-flat-button
            color="accent"
            (click)="onEditAthleteSettingsFromSettingsLacksIssue()"
          >
            Fix settings
          </button>
          <button mat-icon-button (click)="onCloseSettingsLacksWarning()">
            <mat-icon fontSet="material-icons-outlined">close</mat-icon>
          </button>
        </div>
      </div>

      <!--Non consistent warning message-->
      <div *ngIf="!hideSettingsConsistencyWarning" fxLayout="row" fxLayoutAlign="space-between center" class="ribbon">
        <div fxLayout="column" fxLayoutAlign="center start">
          <span>
            <mat-icon fontSet="material-icons-outlined" [style.vertical-align]="'bottom'">{{
              hideSettingsLacksWarning ? "looks_one" : "looks_two"
            }}</mat-icon>
            Some of your activities need to be recalculated according to athlete settings changes.
          </span>
        </div>
        <div fxLayout="row" fxLayoutAlign="space-between center">
          <button mat-flat-button color="accent" (click)="onFixActivities()">Recalculate</button>
          <button mat-icon-button (click)="onCloseSettingsConsistencyWarning()">
            <mat-icon fontSet="material-icons-outlined">close</mat-icon>
          </button>
        </div>
      </div>

      <!--Recalculate activities section-->
      <div *ngIf="!hideRecalculation" fxLayout="row" fxLayoutAlign="space-between center" class="ribbon">
        <div fxLayout="column" fxLayoutAlign="center start">
          <span fxFlex class="mat-body-1" *ngIf="statusText">{{ statusText }}</span>
          <span fxFlex class="mat-caption">{{ processed }}/{{ toBeProcessed }} activities recalculated.</span>
        </div>
        <div fxLayout="row" fxLayoutAlign="space-between center">
          <button mat-icon-button (click)="onCloseRecalculation()">
            <mat-icon fontSet="material-icons-outlined">close</mat-icon>
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .ribbon {
        padding: 10px 20px;
        border-bottom: 1px solid #bfbfbf;
      }

      button {
        margin-left: 10px;
      }
    `
  ]
})
export class DesktopRefreshStatsBarComponent extends RefreshStatsBarComponent implements OnInit {
  public hideRecalculation: boolean;

  public statusText: string;
  public processed: number;
  public toBeProcessed: number;

  constructor(
    @Inject(Router) protected readonly router: Router,
    @Inject(ActivityService) protected readonly activityService: ActivityService,
    @Inject(UserSettingsService) protected readonly userSettingsService: UserSettingsService,
    @Inject(MatDialog) protected readonly dialog: MatDialog,
    @Inject(LoggerService) protected readonly logger: LoggerService
  ) {
    super(router, activityService, dialog);
    this.hideRecalculation = true;
  }

  public ngOnInit(): void {
    super.ngOnInit();

    const desktopActivityService = this.activityService as DesktopActivityService;
    desktopActivityService.refreshStats$.subscribe(
      (notification: BulkRefreshStatsNotification) => {
        if (notification.error) {
          this.logger.error(notification);
          this.dialog.open(GotItDialogComponent, {
            data: { content: notification.error.message } as GotItDialogDataModel
          });
          return;
        }

        this.showRecalculation();

        this.statusText =
          moment(notification.syncedActivityModel.start_time).format("ll") +
          ": " +
          notification.syncedActivityModel.name;

        if (notification.isLast) {
          this.statusText = "Recalculation done.";
        }

        this.processed = notification.currentlyProcessed;
        this.toBeProcessed = notification.toProcessCount;
      },
      err => {
        this.logger.error(err);
        throw err;
      }
    );
  }

  public onFixActivities(): void {
    super.onFixActivities();
    this.userSettingsService.fetch().then((userSettingsModel: DesktopUserSettingsModel) => {
      const desktopActivityService = this.activityService as DesktopActivityService;
      desktopActivityService.nonConsistentActivitiesWithAthleteSettings().then((activitiesIds: number[]) => {
        desktopActivityService.bulkRefreshStatsFromIds(activitiesIds, userSettingsModel);
      });
    });
  }

  public showRecalculation(): void {
    this.hideRefreshStatsBar = false; // We have to force the display back of bar
    this.hideRecalculation = false; // Show calculation
  }

  public onCloseRecalculation(): void {
    this.hideRecalculation = true;
  }
}
