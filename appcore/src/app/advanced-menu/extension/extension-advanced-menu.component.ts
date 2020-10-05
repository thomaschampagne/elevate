import { Component } from "@angular/core";
import { UserSettingsService } from "../../shared/services/user-settings/user-settings.service";
import { ConfirmDialogDataModel } from "../../shared/dialogs/confirm-dialog/confirm-dialog-data.model";
import { ConfirmDialogComponent } from "../../shared/dialogs/confirm-dialog/confirm-dialog.component";
import { MatDialog } from "@angular/material/dialog";
import { MatSnackBar } from "@angular/material/snack-bar";
import { SyncService } from "../../shared/services/sync/sync.service";
import { AthleteService } from "../../shared/services/athlete/athlete.service";
import { AdvancedMenuComponent } from "../advanced-menu.component";

@Component({
    selector: "app-advanced-menu",
    template: `
        <mat-card>
            <mat-card-content>
                <div>In case of problem with the plugin this section might help you.</div>
                <div>
                    <button mat-stroked-button color="primary" (click)="onSyncedBackupClear()">
                        Clear athlete's activities
                    </button>
                </div>
                <div>
                    <button mat-stroked-button color="primary" (click)="onPluginCacheClear()">
                        Clear plugin cache
                    </button>
                </div>
                <div>
                    <button mat-stroked-button color="primary" (click)="onZoneSettingsReset()">
                        Reset zone settings
                    </button>
                </div>
                <div>
                    <button mat-stroked-button color="primary" (click)="onUserSettingsReset()">
                        Reset athlete & global settings
                    </button>
                </div>
                <div>If problem still persist, consider uninstall/install the plugin back or report a bug.</div>
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
        `,
    ],
})
export class ExtensionAdvancedMenuComponent extends AdvancedMenuComponent {
    constructor(
        public readonly userSettingsService: UserSettingsService,
        public readonly athleteService: AthleteService,
        public readonly syncService: SyncService<any>,
        public readonly dialog: MatDialog,
        public readonly snackBar: MatSnackBar
    ) {
        super(syncService, dialog, snackBar);
    }

    public onPluginCacheClear(): void {
        const data: ConfirmDialogDataModel = {
            title: "Clear the plugin cache",
            content:
                "This will remove caches of the plugin including display preferences (e.g. app theme chosen). You will not loose your synced data, athlete settings, zones settings or global settings.",
        };

        const dialogRef = this.dialog.open(ConfirmDialogComponent, {
            minWidth: ConfirmDialogComponent.MIN_WIDTH,
            maxWidth: ConfirmDialogComponent.MAX_WIDTH,
            data: data,
        });

        const afterClosedSubscription = dialogRef.afterClosed().subscribe((confirm: boolean) => {
            if (confirm) {
                localStorage.clear();
                this.userSettingsService.clearLocalStorageOnNextLoad().then(() => {
                    this.snackBar
                        .open("Plugin cache has been cleared", "Reload App")
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
            title: "Reset settings",
            content:
                "This will reset your settings to defaults including: dated athlete settings, zones settings and global settings. Are you sure to perform this action?",
        };

        const dialogRef = this.dialog.open(ConfirmDialogComponent, {
            minWidth: ConfirmDialogComponent.MIN_WIDTH,
            maxWidth: ConfirmDialogComponent.MAX_WIDTH,
            data: data,
        });

        const afterClosedSubscription = dialogRef.afterClosed().subscribe((confirm: boolean) => {
            if (confirm) {
                Promise.all([
                    this.userSettingsService.reset(),
                    this.athleteService.resetSettings(),
                    this.userSettingsService.clearLocalStorageOnNextLoad(),
                ]).then(() => {
                    this.snackBar.open("Settings have been reset", "Close");
                    afterClosedSubscription.unsubscribe();
                });
            }
        });
    }

    public onZoneSettingsReset(): void {
        const data: ConfirmDialogDataModel = {
            title: "Reset zones",
            content: "This will reset only your zones to defaults. Are you sure to perform this action?",
        };

        const dialogRef = this.dialog.open(ConfirmDialogComponent, {
            minWidth: ConfirmDialogComponent.MIN_WIDTH,
            maxWidth: ConfirmDialogComponent.MAX_WIDTH,
            data: data,
        });

        const afterClosedSubscription = dialogRef.afterClosed().subscribe((confirm: boolean) => {
            if (confirm) {
                Promise.all([
                    this.userSettingsService.reset(),
                    this.userSettingsService.clearLocalStorageOnNextLoad(),
                ]).then(() => {
                    this.snackBar.open("Zones settings have been reset", "Close");
                    afterClosedSubscription.unsubscribe();
                });
            }
        });
    }
}
