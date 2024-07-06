import { Component, Inject } from "@angular/core";
import { UserSettingsService } from "../../shared/services/user-settings/user-settings.service";
import { ConfirmDialogDataModel } from "../../shared/dialogs/confirm-dialog/confirm-dialog-data.model";
import { ConfirmDialogComponent } from "../../shared/dialogs/confirm-dialog/confirm-dialog.component";
import { MatDialog } from "@angular/material/dialog";
import { MatSnackBar } from "@angular/material/snack-bar";
import { SyncService } from "../../shared/services/sync/sync.service";
import { AthleteService } from "../../shared/services/athlete/athlete.service";
import { AdvancedMenuComponent } from "../advanced-menu.component";
import { ExtensionUserSettingsService } from "../../shared/services/user-settings/extension/extension-user-settings.service";

@Component({
  selector: "app-advanced-menu",
  template: `
    <div class="narrow-centered-section">
      <mat-card>
        <mat-card-title>Web extension tools</mat-card-title>
        <mat-card-content>
          <div class="entry" fxLayout="row" fxLayoutAlign="space-between center">
            <div>Clear web extension cache</div>
            <div>
              <button mat-stroked-button color="primary" (click)="onPluginCacheClear()">Clear cache</button>
            </div>
          </div>
          <div class="entry" fxLayout="row" fxLayoutAlign="space-between center">
            <div>Wipe synced activities</div>
            <div>
              <button mat-stroked-button color="warn" (click)="onWipeActivities()">Wipe activities</button>
            </div>
          </div>
          <div class="entry" fxLayout="row" fxLayoutAlign="space-between center">
            <div>Reset global, athlete and zones settings</div>
            <div>
              <button mat-stroked-button color="warn" (click)="onUserSettingsReset()">Reset settings</button>
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
export class ExtensionAdvancedMenuComponent extends AdvancedMenuComponent {
  constructor(
    @Inject(UserSettingsService) protected readonly extensionUserSettingsService: ExtensionUserSettingsService,
    @Inject(AthleteService) protected readonly athleteService: AthleteService,
    @Inject(SyncService) protected readonly syncService: SyncService<any>,
    @Inject(MatDialog) protected readonly dialog: MatDialog,
    @Inject(MatSnackBar) protected readonly snackBar: MatSnackBar
  ) {
    super(syncService, dialog, snackBar);
  }

  public onPluginCacheClear(): void {
    const data: ConfirmDialogDataModel = {
      title: "Clear web extension cache",
      content: "This will clear cache of the web extension. You will keep your data and settings."
    };

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      minWidth: ConfirmDialogComponent.MIN_WIDTH,
      maxWidth: ConfirmDialogComponent.MAX_WIDTH,
      data: data
    });

    const afterClosedSubscription = dialogRef.afterClosed().subscribe((confirm: boolean) => {
      if (confirm) {
        localStorage.clear();
        this.extensionUserSettingsService.clearLocalStorageOnNextLoad().then(() => {
          this.snackBar
            .open("Cache has been cleared", "Reload App")
            .afterDismissed()
            .toPromise()
            .then(() => {
              location.reload();
            });
          afterClosedSubscription.unsubscribe();
        });
      }
    });
  }

  public onUserSettingsReset(): void {
    const data: ConfirmDialogDataModel = {
      title: "Reset all settings",
      content: "This will reset global, athlete and zones settings. Are you sure to perform this action?"
    };

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      minWidth: ConfirmDialogComponent.MIN_WIDTH,
      maxWidth: ConfirmDialogComponent.MAX_WIDTH,
      data: data
    });

    const afterClosedSubscription = dialogRef.afterClosed().subscribe(async (confirm: boolean) => {
      if (confirm) {
        try {
          await this.extensionUserSettingsService.resetGlobalSettings();
          await this.extensionUserSettingsService.resetZonesSettings();
          await this.athleteService.resetSettings();
          await this.extensionUserSettingsService.clearLocalStorageOnNextLoad();
          this.snackBar.open("Settings have been reset", "Close");
          afterClosedSubscription.unsubscribe();
        } catch (error) {
          console.error(error);
          afterClosedSubscription.unsubscribe();
        }
      }
    });
  }

  public onZoneSettingsReset(): void {
    const data: ConfirmDialogDataModel = {
      title: "Reset zones",
      content: "This will reset only your zones to defaults. Are you sure to perform this action?"
    };

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      minWidth: ConfirmDialogComponent.MIN_WIDTH,
      maxWidth: ConfirmDialogComponent.MAX_WIDTH,
      data: data
    });

    const afterClosedSubscription = dialogRef.afterClosed().subscribe((confirm: boolean) => {
      if (confirm) {
        Promise.all([
          this.extensionUserSettingsService.resetZonesSettings(),
          this.extensionUserSettingsService.clearLocalStorageOnNextLoad()
        ]).then(() => {
          this.snackBar.open("Zones settings have been reset", "Close");
          afterClosedSubscription.unsubscribe();
        });
      }
    });
  }
}
