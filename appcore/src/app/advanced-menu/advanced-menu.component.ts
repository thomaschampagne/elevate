import { OnInit } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { MatSnackBar } from "@angular/material/snack-bar";
import { AthleteService } from "../shared/services/athlete/athlete.service";
import { ConfirmDialogComponent } from "../shared/dialogs/confirm-dialog/confirm-dialog.component";
import { UserSettingsService } from "../shared/services/user-settings/user-settings.service";
import { ConfirmDialogDataModel } from "../shared/dialogs/confirm-dialog/confirm-dialog-data.model";
import { SyncService } from "../shared/services/sync/sync.service";

export abstract class AdvancedMenuComponent implements OnInit {

    constructor(public userSettingsService: UserSettingsService,
                public athleteService: AthleteService,
                public syncService: SyncService<any>,
                public dialog: MatDialog,
                public snackBar: MatSnackBar) {
    }

    public ngOnInit(): void {
    }

    public abstract onZoneSettingsReset(): void;

    public onSyncedBackupClear(): void {

        const data: ConfirmDialogDataModel = {
            title: "Clear your athlete synced data",
            content: "Are you sure to perform this action? You will be able to re-import synced data through backup file " +
                "or a new re-synchronization."
        };

        const dialogRef = this.dialog.open(ConfirmDialogComponent, {
            minWidth: ConfirmDialogComponent.MIN_WIDTH,
            maxWidth: ConfirmDialogComponent.MAX_WIDTH,
            data: data
        });

        const afterClosedSubscription = dialogRef.afterClosed().subscribe((confirm: boolean) => {

            if (confirm) {
                this.syncService.clearSyncedData().then(() => {
                    afterClosedSubscription.unsubscribe();
                    location.reload();
                }, error => {
                    this.snackBar.open(error, "Close");
                });
            }
        });

    }
}



