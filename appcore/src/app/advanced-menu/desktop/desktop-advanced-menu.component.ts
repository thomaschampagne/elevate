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
    <mat-card>
      <mat-card-content>
        <div class="mat-h3">
          In case of problem with the app this section might help you. If problem continues, consider uninstall/install
          the app or report a bug.
        </div>
        <div class="mat-title">Activities tools</div>
        <div>
          <button mat-stroked-button color="primary" (click)="onRecalculateActivities()">
            Recalculate stats on all activities
          </button>
        </div>
        <div class="mat-title">Clean / Reset</div>
        <div>
          <button mat-stroked-button color="primary" (click)="onSyncedBackupClear()">
            Delete athlete's activities
          </button>
        </div>
        <div>
          <button mat-stroked-button color="primary" (click)="onUserSettingsReset()">
            Reset athlete & global settings
          </button>
        </div>
        <div>
          <button mat-stroked-button color="primary" (click)="onFullAppReset()">Full application reset</button>
        </div>
        <div class="mat-title">Debugging</div>
        <div>
          <button mat-stroked-button color="primary" (click)="openLogsFolder()">Open logs folder</button>
        </div>
        <div class="mat-title">Others</div>
        <div>
          <button mat-stroked-button color="primary" (click)="openAppDataFolder()">
            Open user program data folder
          </button>
        </div>
        <div>
          <button mat-stroked-button color="primary" (click)="openAppExecFolder()">
            Open executable program folder
          </button>
        </div>
        <div>
          <button mat-stroked-button color="primary" (click)="onRestart()">Restart app</button>
        </div>
      </mat-card-content>
    </mat-card>
  `,
  styles: [
    `
      button {
        width: 300px;
      }

      div {
        padding-top: 10px;
        padding-bottom: 10px;
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

  public onUserSettingsReset(): void {
    const data: ConfirmDialogDataModel = {
      title: "Reset settings",
      content:
        "This will reset your settings to defaults including: dated athlete settings and global settings. Are you sure to perform this action?"
    };

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      minWidth: ConfirmDialogComponent.MIN_WIDTH,
      maxWidth: ConfirmDialogComponent.MAX_WIDTH,
      data: data
    });

    const afterClosedSubscription = dialogRef.afterClosed().subscribe((confirm: boolean) => {
      if (confirm) {
        Promise.all([this.userSettingsService.reset(), this.athleteService.resetSettings()]).then(() => {
          this.snackBar.open("Settings have been reset", "Close");
          afterClosedSubscription.unsubscribe();
        });
      }
    });
  }

  public onRecalculateActivities(): void {
    const data: ConfirmDialogDataModel = {
      title: "Recalculate stats on all activities",
      content:
        "This will recompute stats on all your activities based on your current dated athlete settings and sensors' streams of each activity."
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
      title: "App reset",
      content:
        'This will completely delete all the data generated by the application to reach a "fresh install" state. Are you sure to perform this action?'
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
