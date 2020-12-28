import { Component, Inject, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import { ActivityService } from "../shared/services/activity/activity.service";
import { SyncService } from "../shared/services/sync/sync.service";
import { MatDialog } from "@angular/material/dialog";
import { LoggerService } from "../shared/services/logging/logger.service";
import { ConfirmDialogDataModel } from "../shared/dialogs/confirm-dialog/confirm-dialog-data.model";
import { ConfirmDialogComponent } from "../shared/dialogs/confirm-dialog/confirm-dialog.component";
import { GotItDialogComponent } from "../shared/dialogs/got-it-dialog/got-it-dialog.component";
import { GotItDialogDataModel } from "../shared/dialogs/got-it-dialog/got-it-dialog-data.model";
import { RecalculateActivitiesBarComponent } from "./recalculate-activities-bar.component";
import { UserSettingsService } from "../shared/services/user-settings/user-settings.service";

@Component({
  selector: "app-extension-recalculate-activities-bar",
  template: `
    <div class="app-recalculate-activities-bar">
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
          <button
            mat-icon-button
            (click)="onHideActivitiesWithSettingsLacks()"
            matTooltip="Don't remind me this warning"
          >
            <mat-icon fontSet="material-icons-outlined">notifications_off</mat-icon>
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
          <button mat-icon-button (click)="onHideActivitiesRecalculation()" matTooltip="Don't remind me this warning">
            <mat-icon fontSet="material-icons-outlined">notifications_off</mat-icon>
          </button>
          <button mat-icon-button (click)="onCloseSettingsConsistencyWarning()">
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
export class ExtensionRecalculateActivitiesBarComponent extends RecalculateActivitiesBarComponent implements OnInit {
  constructor(
    @Inject(Router) protected readonly router: Router,
    @Inject(ActivityService) protected readonly activityService: ActivityService,
    @Inject(SyncService) protected readonly syncService: SyncService<any>,
    @Inject(UserSettingsService) protected readonly userSettingsService: UserSettingsService,
    @Inject(MatDialog) protected readonly dialog: MatDialog,
    @Inject(LoggerService) protected readonly logger: LoggerService
  ) {
    super(router, activityService, userSettingsService, dialog);
  }

  public ngOnInit(): void {
    super.ngOnInit();
  }

  public onFixActivities(): void {
    super.onFixActivities();

    const data: ConfirmDialogDataModel = {
      title: "Recalculate synced activities affected by athlete settings changes",
      content:
        "Synced activities affected by athlete settings changes will be deleted to be synced again with " +
        'new athlete settings (equivalent to a "Sync all activities")',
      confirmText: "Proceed to the recalculation"
    };

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      minWidth: ConfirmDialogComponent.MIN_WIDTH,
      maxWidth: ConfirmDialogComponent.MAX_WIDTH,
      data: data
    });

    const afterClosedSubscription = dialogRef.afterClosed().subscribe((confirm: boolean) => {
      if (confirm) {
        let nonConsistentIds: number[];

        this.activityService
          .nonConsistentActivitiesWithAthleteSettings()
          .then((result: number[]) => {
            nonConsistentIds = result;
            return this.activityService.removeByManyIds(nonConsistentIds);
          })
          .then(() => {
            this.dialog.open(GotItDialogComponent, {
              data: {
                content:
                  nonConsistentIds.length +
                  " activities have been deleted and are synced back now. " +
                  'You can sync back these activities manually by yourself by triggering a "Sync all activities"'
              } as GotItDialogDataModel
            });

            // Start Sync all activities
            this.syncService.sync(false, false);
          })
          .catch(error => {
            this.logger.error(error);
            this.dialog.open(GotItDialogComponent, {
              data: { content: error } as GotItDialogDataModel
            });
          });
      }

      afterClosedSubscription.unsubscribe();
    });
  }
}
