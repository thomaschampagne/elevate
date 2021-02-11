import { Component, Inject } from "@angular/core";
import { UserSettingsService } from "../../shared/services/user-settings/user-settings.service";
import { MatDialog } from "@angular/material/dialog";
import { MatSnackBar } from "@angular/material/snack-bar";
import { SyncService } from "../../shared/services/sync/sync.service";
import { AthleteService } from "../../shared/services/athlete/athlete.service";
import { AdvancedMenuComponent } from "../advanced-menu.component";
import { ConfirmDialogDataModel } from "../../shared/dialogs/confirm-dialog/confirm-dialog-data.model";
import { ConfirmDialogComponent } from "../../shared/dialogs/confirm-dialog/confirm-dialog.component";
import { ElectronService } from "../../desktop/electron/electron.service";
import { ActivityService } from "../../shared/services/activity/activity.service";
import { DesktopActivityService } from "../../shared/services/activity/impl/desktop-activity.service";
import { UserSettings } from "@elevate/shared/models";
import DesktopUserSettingsModel = UserSettings.DesktopUserSettingsModel;

@Component({
  selector: "app-advanced-menu",
  template: `
    <div class="narrow-centered-section">
      <mat-card>
        <mat-card-title>Activities tools</mat-card-title>
        <mat-card-content>
          <div class="entry" fxLayout="row" fxLayoutAlign="space-between center">
            <div>Recalculate all activities from current athlete settings</div>
            <div>
              <button mat-stroked-button color="primary" (click)="onRecalculateActivities()">
                Recalculate activities
              </button>
            </div>
          </div>
        </mat-card-content>
      </mat-card>

      <mat-card>
        <mat-card-title>Application</mat-card-title>
        <mat-card-content>
          <div class="entry" fxLayout="row" fxLayoutAlign="space-between center">
            <div>Open logs folder of the application</div>
            <div>
              <button mat-stroked-button color="primary" (click)="openLogsFolder()">Open logs folder</button>
            </div>
          </div>
          <div class="entry" fxLayout="row" fxLayoutAlign="space-between center">
            <div>Open user application data folder</div>
            <div>
              <button mat-stroked-button color="primary" (click)="openAppDataFolder()">Open user data folder</button>
            </div>
          </div>
          <div class="entry" fxLayout="row" fxLayoutAlign="space-between center">
            <div>Open application install folder</div>
            <div>
              <button mat-stroked-button color="primary" (click)="openAppExecFolder()">Open install folder</button>
            </div>
          </div>
          <div class="entry" fxLayout="row" fxLayoutAlign="space-between center">
            <div>Restart the application</div>
            <div>
              <button mat-stroked-button color="primary" (click)="onRestart()">Restart now</button>
            </div>
          </div>
        </mat-card-content>
      </mat-card>
      <mat-card>
        <mat-card-title>Danger zone</mat-card-title>
        <mat-card-content>
          <div class="entry" fxLayout="row" fxLayoutAlign="space-between center">
            <div>Wipe synced activities</div>
            <div>
              <button mat-stroked-button color="warn" (click)="onSyncedBackupClear()">Wipe activities</button>
            </div>
          </div>
          <div class="entry" fxLayout="row" fxLayoutAlign="space-between center">
            <div>Reset global and zones settings to defaults</div>
            <div>
              <button mat-stroked-button color="warn" (click)="onGlobalAndZonesSettingsReset()">
                Reset global settings
              </button>
            </div>
          </div>
          <div class="entry" fxLayout="row" fxLayoutAlign="space-between center">
            <div>Reset athlete settings to defaults</div>
            <div>
              <button mat-stroked-button color="warn" (click)="onAthleteSettingsReset()">Reset athlete settings</button>
            </div>
          </div>
          <div class="entry" fxLayout="row" fxLayoutAlign="space-between center">
            <div>Complete reset of the application</div>
            <div>
              <button mat-stroked-button color="warn" (click)="onFullAppReset()">Reset everything</button>
            </div>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [
    `
      .entry {
        padding-top: 5px;
        padding-bottom: 5px;
      }
      button {
        width: 175px;
      }
    `
  ]
})
export class DesktopAdvancedMenuComponent extends AdvancedMenuComponent {
  constructor(
    @Inject(SyncService) protected readonly syncService: SyncService<any>,
    @Inject(MatDialog) protected readonly dialog: MatDialog,
    @Inject(MatSnackBar) protected readonly snackBar: MatSnackBar,
    @Inject(UserSettingsService) protected readonly userSettingsService: UserSettingsService,
    @Inject(ActivityService) protected readonly activityService: DesktopActivityService,
    @Inject(AthleteService) protected readonly athleteService: AthleteService,
    @Inject(ElectronService) protected readonly electronService: ElectronService
  ) {
    super(syncService, dialog, snackBar);
  }

  public onGlobalAndZonesSettingsReset(): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      minWidth: ConfirmDialogComponent.MIN_WIDTH,
      maxWidth: ConfirmDialogComponent.MAX_WIDTH,
      data: {
        title: "Reset global and zones settings",
        content: "This will reset your global and zones settings to defaults. Are you sure to perform this action?"
      } as ConfirmDialogDataModel
    });

    const afterClosedSubscription = dialogRef.afterClosed().subscribe((confirm: boolean) => {
      if (confirm) {
        Promise.all([this.userSettingsService.reset()]).then(() => {
          this.snackBar.open("Settings have been reset", "Close");
          afterClosedSubscription.unsubscribe();
        });
      }
    });
  }

  public onAthleteSettingsReset(): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      minWidth: ConfirmDialogComponent.MIN_WIDTH,
      maxWidth: ConfirmDialogComponent.MAX_WIDTH,
      data: {
        title: "Reset athlete settings",
        content: "This will reset your athlete settings to defaults. Are you sure to perform this action?"
      } as ConfirmDialogDataModel
    });

    const afterClosedSubscription = dialogRef.afterClosed().subscribe((confirm: boolean) => {
      if (confirm) {
        Promise.all([this.userSettingsService.reset(), this.athleteService.resetSettings()]).then(() => {
          this.snackBar.open("Athlete settings have been reset", "Close");
          afterClosedSubscription.unsubscribe();
        });
      }
    });
  }

  public onRecalculateActivities(): void {
    const data: ConfirmDialogDataModel = {
      title: "Recalculate stats on all activities",
      content: "This will recalculate stats of every activities using your current dated athlete settings."
    };

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      minWidth: ConfirmDialogComponent.MIN_WIDTH,
      maxWidth: ConfirmDialogComponent.MAX_WIDTH,
      data: data
    });

    dialogRef.afterClosed().subscribe((confirm: boolean) => {
      if (confirm) {
        this.userSettingsService.fetch().then((userSettingsModel: DesktopUserSettingsModel) => {
          this.activityService.recalculateAll(userSettingsModel);
        });
      }
    });
  }

  public onFullAppReset(): void {
    const data: ConfirmDialogDataModel = {
      title: "Full application reset",
      content: `This will erase everything to reach a "fresh install" state. Are you sure to perform this action?`
    };

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      minWidth: ConfirmDialogComponent.MIN_WIDTH,
      maxWidth: ConfirmDialogComponent.MAX_WIDTH,
      data: data
    });

    dialogRef.afterClosed().subscribe((confirm: boolean) => {
      if (confirm) {
        this.electronService.clearAppDataAndRestart();
      }
    });
  }

  public openLogsFolder(): void {
    this.electronService.openLogsFolder();
  }

  public openAppDataFolder(): void {
    this.electronService.openAppDataFolder();
  }

  public openAppExecFolder(): void {
    this.electronService.openAppExecFolder();
  }

  public onZoneSettingsReset(): void {
    throw new Error("Method onZoneSettingsReset not implemented.");
  }

  public onRestart(): void {
    this.electronService.restartApp();
  }
}
