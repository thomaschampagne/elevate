import _ from "lodash";
import * as moment from "moment";
import { Component, OnInit } from "@angular/core";
import { SyncMenuComponent } from "../sync-menu.component";
import { Router } from "@angular/router";
import { MatDialog } from "@angular/material/dialog";
import { MatSnackBar } from "@angular/material/snack-bar";
import { AppEventsService } from "../../shared/services/external-updates/app-events-service";
import { ExtensionImportBackupDialogComponent, ImportBackupDialogComponent } from "../../shared/dialogs/import-backup-dialog/import-backup-dialog.component";
import { SyncState } from "../../shared/services/sync/sync-state.enum";
import { ExtensionSyncService } from "../../shared/services/sync/impl/extension-sync.service";
import { ExtensionDumpModel } from "../../shared/models/dumps/extension-dump.model";
import { ConfirmDialogDataModel } from "../../shared/dialogs/confirm-dialog/confirm-dialog-data.model";
import { ConfirmDialogComponent } from "../../shared/dialogs/confirm-dialog/confirm-dialog.component";
import { AppRoutesModel } from "../../shared/models/app-routes.model";
import { SyncDateTime } from "@elevate/shared/models/sync/sync-date-time.model";

@Component({
    selector: "app-extension-sync-menu",
    template: `
        <div *ngIf="(syncState !== null)">
            <button mat-stroked-button color="primary" [matMenuTriggerFor]="syncMenu">
                <mat-icon fontSet="material-icons-outlined" *ngIf="(syncState === SyncState.NOT_SYNCED)">
                    sync_disabled
                </mat-icon>
                <mat-icon fontSet="material-icons-outlined" *ngIf="(syncState === SyncState.PARTIALLY_SYNCED)">
                    sync_problem
                </mat-icon>
                <mat-icon fontSet="material-icons-outlined" *ngIf="(syncState === SyncState.SYNCED)">
                    sync
                </mat-icon>
                <span *ngIf="(syncState === SyncState.NOT_SYNCED)">
					Activities not synced
				</span>
                <span *ngIf="(syncState === SyncState.PARTIALLY_SYNCED)">
					Activities partially synced
				</span>
                <span *ngIf="(syncState === SyncState.SYNCED && syncDateMessage)">
					Synced {{syncDateMessage}}
				</span>
            </button>
            <mat-menu #syncMenu="matMenu">
                <!--Force full re-sync even of not first synced (to clean up any old history still stored)-->
                <button mat-menu-item (click)="onSync(true, false)"
                        *ngIf="(syncState === SyncState.SYNCED)">
                    <mat-icon fontSet="material-icons-outlined">update</mat-icon>
                    Sync recent activities
                </button>
                <button mat-menu-item
                        (click)="onSync(false, syncState === SyncState.NOT_SYNCED)">
                    <mat-icon fontSet="material-icons-outlined">sync</mat-icon>
                    <span *ngIf="(syncState === SyncState.NOT_SYNCED)">Sync</span>
                    <span *ngIf="(syncState === SyncState.SYNCED)">Sync all activities</span>
                    <span *ngIf="(syncState === SyncState.PARTIALLY_SYNCED)">Continue sync</span>
                </button>
                <button mat-menu-item (click)="onSync(false, true)"
                        *ngIf="(syncState !== SyncState.NOT_SYNCED)">
                    <mat-icon fontSet="material-icons-outlined">redo</mat-icon>
                    Clear and re-sync activities
                </button>
                <button mat-menu-item (click)="onClearSyncedData()"
                        *ngIf="(syncState !== SyncState.NOT_SYNCED)">
                    <mat-icon fontSet="material-icons-outlined">clear</mat-icon>
                    Clear synced activities
                </button>
                <button mat-menu-item (click)="onSyncedBackupExport()" *ngIf="(syncState === SyncState.SYNCED)">
                    <mat-icon fontSet="material-icons-outlined">vertical_align_bottom</mat-icon>
                    Backup profile
                </button>
                <button mat-menu-item (click)="onSyncedBackupImport()">
                    <mat-icon fontSet="material-icons-outlined">vertical_align_top</mat-icon>
                    Restore profile
                </button>
            </mat-menu>
        </div>
    `,
    styleUrls: ["./extension-sync-menu.component.scss"]
})
export class ExtensionSyncMenuComponent extends SyncMenuComponent implements OnInit {

    constructor(public router: Router,
                public extensionSyncService: ExtensionSyncService,
                public appEventsService: AppEventsService,
                public dialog: MatDialog,
                public snackBar: MatSnackBar) {
        super(router, extensionSyncService, appEventsService, dialog, snackBar);
    }

    public ngOnInit() {
        super.ngOnInit();
    }

    public updateSyncDateStatus(): void {

        this.extensionSyncService.getSyncState().then((syncState: SyncState) => {
            this.syncState = syncState;
            this.extensionSyncService.getSyncDateTime().then((syncDateTime: SyncDateTime) => {
                if (_.isNumber(syncDateTime.syncDateTime)) {
                    this.syncDateMessage = moment(syncDateTime.syncDateTime).fromNow();
                }
            });
        });
    }

    public onSyncedBackupImport(): void {

        const dialogRef = this.dialog.open(ExtensionImportBackupDialogComponent, {
            minWidth: ImportBackupDialogComponent.MIN_WIDTH,
            maxWidth: ImportBackupDialogComponent.MAX_WIDTH,
        });

        const afterClosedSubscription = dialogRef.afterClosed().subscribe((dumpModel: ExtensionDumpModel) => {

            if (dumpModel) {
                this.extensionSyncService.import(dumpModel).then(() => {
                    location.reload();
                }, error => {
                    this.snackBar.open(error, "Close");
                });
            }

            afterClosedSubscription.unsubscribe();
        });
    }

    public onSync(fastSync: boolean, forceSync: boolean): void {

        if (this.syncState === SyncState.NOT_SYNCED) {

            const data: ConfirmDialogDataModel = {
                title: "⚠️ First synchronisation",
                content: "Your first synchronisation can take a long time and can be done in several times " +
                    "if you have more than 400 activities. Make sure you properly setup your " +
                    "athlete settings before (Cycling FTP, Running FTP, Swim FTP, Heart rate, ...) or may have missing results in " +
                    "Elevate features. This is to avoid a redo of the first synchronisation.",
                confirmText: "Start sync",
                cancelText: "Check my athlete settings"
            };

            const dialogRef = this.dialog.open(ConfirmDialogComponent, {
                minWidth: ConfirmDialogComponent.MIN_WIDTH,
                maxWidth: "50%",
                data: data
            });

            const afterClosedSubscription = dialogRef.afterClosed().subscribe((confirm: boolean) => {

                if (confirm) {
                    this.syncService.sync(fastSync, forceSync);
                } else {
                    this.router.navigate([AppRoutesModel.athleteSettings]);
                }
                afterClosedSubscription.unsubscribe();
            });

        } else {
            this.syncService.sync(fastSync, forceSync);
        }
    }
}
