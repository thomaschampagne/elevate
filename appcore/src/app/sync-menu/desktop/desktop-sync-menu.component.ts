import { Component, OnInit } from "@angular/core";
import { SyncMenuComponent } from "../sync-menu.component";
import { Router } from "@angular/router";
import { MatDialog } from "@angular/material/dialog";
import { MatSnackBar } from "@angular/material/snack-bar";
import {
    DesktopImportBackupDialogComponent,
    ImportBackupDialogComponent,
    ImportExportProgressDialogComponent
} from "../../shared/dialogs/import-backup-dialog/import-backup-dialog.component";
import { DesktopDumpModel } from "../../shared/models/dumps/desktop-dump.model";
import { SyncState } from "../../shared/services/sync/sync-state.enum";
import { AppEventsService } from "../../shared/services/external-updates/app-events-service";
import { DesktopSyncService } from "../../shared/services/sync/impl/desktop-sync.service";
import { AppRoutesModel } from "../../shared/models/app-routes.model";
import moment from "moment";
import _ from "lodash";
import { ConnectorSyncDateTime } from "@elevate/shared/models";
import { ConnectorType } from "@elevate/shared/sync";
import { ElevateException } from "@elevate/shared/exceptions";

@Component({
    selector: "app-desktop-sync-menu",
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
					{{syncDateMessage}}
				</span>
            </button>
            <mat-menu #syncMenu="matMenu">
                <button mat-menu-item *ngIf="(syncState === SyncState.NOT_SYNCED)"
                        (click)="goToConnectors()">
                    <mat-icon fontSet="material-icons-outlined">sync</mat-icon>
                    Sync via connectors
                </button>
                <button mat-menu-item *ngIf="(syncState === SyncState.PARTIALLY_SYNCED)"
                        (click)="goToConnectors()">
                    <mat-icon fontSet="material-icons-outlined">sync</mat-icon>
                    Continue sync via connectors
                </button>
                <ng-container *ngIf="(syncState === SyncState.SYNCED)">
                    <button mat-menu-item (click)="onSync(true)">
                        <mat-icon fontSet="material-icons-outlined">sync</mat-icon>
                        Sync "{{printMostRecentConnectorSynced()}}" recent activities
                    </button>
                    <button mat-menu-item (click)="goToConnectors()">
                        <mat-icon fontSet="material-icons-outlined">power</mat-icon>
                        Go to connectors
                    </button>
                </ng-container>
                <button mat-menu-item (click)="onSyncedBackupExport()" *ngIf="(syncState === SyncState.SYNCED)">
                    <mat-icon fontSet="material-icons-outlined">vertical_align_bottom</mat-icon>
                    Backup profile
                </button>
                <button mat-menu-item (click)="onSyncedBackupImport()">
                    <mat-icon fontSet="material-icons-outlined">vertical_align_top</mat-icon>
                    Restore a profile
                </button>
            </mat-menu>
        </div>
    `,
    styleUrls: ["./desktop-sync-menu.component.scss"]
})
export class DesktopSyncMenuComponent extends SyncMenuComponent implements OnInit {

    public mostRecentConnectorSyncedType: ConnectorType;

    constructor(public router: Router,
                public desktopSyncService: DesktopSyncService,
                public appEventsService: AppEventsService,
                public dialog: MatDialog,
                public snackBar: MatSnackBar) {
        super(router, desktopSyncService, appEventsService, dialog, snackBar);
        this.mostRecentConnectorSyncedType = null;
    }

    public ngOnInit() {
        super.ngOnInit();
    }

    public updateSyncDateStatus(): void {

        this.desktopSyncService.getSyncState().then((syncState: SyncState) => {
            this.syncState = syncState;
            if (this.syncState === SyncState.SYNCED) {
                this.desktopSyncService.getMostRecentSyncedConnector().then((connectorSyncDateTime: ConnectorSyncDateTime) => {
                    if (connectorSyncDateTime) {
                        this.mostRecentConnectorSyncedType = connectorSyncDateTime.connectorType;
                        if (_.isNumber(connectorSyncDateTime.dateTime)) {
                            this.syncDateMessage = "Synced " + moment(connectorSyncDateTime.dateTime).fromNow();
                        }
                    }
                });
            }
        });
    }

    public onSyncedBackupImport(): void {

        const dialogRef = this.dialog.open(DesktopImportBackupDialogComponent, {
            minWidth: ImportBackupDialogComponent.MIN_WIDTH,
            maxWidth: ImportBackupDialogComponent.MAX_WIDTH,
        });

        const afterClosedSubscription = dialogRef.afterClosed().subscribe((file: File) => {

            if (file) {
                const importingDialog = this.dialog.open(ImportExportProgressDialogComponent, {
                    disableClose: true,
                    data: ImportExportProgressDialogComponent.MODE_IMPORT
                });

                const reader = new FileReader(); // Reading file, when load, import it
                reader.readAsText(file);
                reader.onload = (event: Event) => {
                    const serializedDumpModel = (event.target as IDBRequest).result;
                    if (serializedDumpModel) {
                        const desktopDumpModel: DesktopDumpModel = DesktopDumpModel.deserialize(serializedDumpModel);
                        this.desktopSyncService.import(desktopDumpModel).then(() => {
                            importingDialog.close();
                            location.reload();
                        }, error => {
                            importingDialog.close();
                            this.snackBar.open(error, "Close");
                        });
                    }
                };
            }

            afterClosedSubscription.unsubscribe();
        });
    }

    public onSync(fastSync: boolean = null, forceSync: boolean = null): void {
        this.onSyncMostRecentConnectorSynced(fastSync);
    }

    public printMostRecentConnectorSynced(): string {
        return this.mostRecentConnectorSyncedType ? DesktopSyncService.niceConnectorPrint(this.mostRecentConnectorSyncedType) : null;
    }

    public onSyncMostRecentConnectorSynced(fastSync: boolean = null): void {

        if (this.mostRecentConnectorSyncedType) {
            this.desktopSyncService.sync(fastSync, null, this.mostRecentConnectorSyncedType);
        } else {
            throw new ElevateException("No recent connector synced found. Please sync a connector completely.");
        }
    }

    public goToConnectors(): void {
        this.router.navigate([AppRoutesModel.connectors]);
    }
}
