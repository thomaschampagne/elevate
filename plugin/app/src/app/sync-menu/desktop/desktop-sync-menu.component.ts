import { Component, OnInit } from "@angular/core";
import { SyncMenuComponent } from "../sync-menu.component";
import { Router } from "@angular/router";
import { MatDialog, MatSnackBar } from "@angular/material";
import { ConnectorSyncDateTime } from "@elevate/shared/models/sync";
import {
	DesktopImportBackupDialogComponent,
	ImportBackupDialogComponent
} from "../../shared/dialogs/import-backup-dialog/import-backup-dialog.component";
import { DesktopDumpModel } from "../../shared/models/dumps/desktop-dump.model";
import { SyncState } from "../../shared/services/sync/sync-state.enum";
import { AppEventsService } from "../../shared/services/external-updates/app-events-service";
import { DesktopSyncService } from "../../shared/services/sync/impl/desktop-sync.service";
import moment from "moment";
import _ from "lodash";

@Component({
	selector: "app-desktop-sync-menu",
	templateUrl: "./desktop-sync-menu.component.html",
	styleUrls: ["./desktop-sync-menu.component.scss"]
})
export class DesktopSyncMenuComponent extends SyncMenuComponent implements OnInit {

	constructor(public router: Router,
				public desktopSyncService: DesktopSyncService,
				public appEventsService: AppEventsService,
				public dialog: MatDialog,
				public snackBar: MatSnackBar) {
		super(router, desktopSyncService, appEventsService, dialog, snackBar);
	}

	public ngOnInit() {
		super.ngOnInit();
	}

	public updateLastSyncDateStatus(): void {

		this.desktopSyncService.getSyncState().then((syncState: SyncState) => {
			this.syncState = SyncState.SYNCED;
			this.desktopSyncService.getMostRecentSyncedConnector().then((connectorLastSyncDateTime: ConnectorLastSyncDateTime) => {
				if (_.isNumber(connectorLastSyncDateTime.dateTime)) {
					this.lastSyncDateMessage = _.upperFirst(connectorLastSyncDateTime.connectorType.toLowerCase())
						+ " connector synced " + moment(connectorLastSyncDateTime.dateTime).fromNow();
				}
			});
		});
	}

	public onSyncedBackupImport(): void {

		const dialogRef = this.dialog.open(DesktopImportBackupDialogComponent, {
			minWidth: ImportBackupDialogComponent.MIN_WIDTH,
			maxWidth: ImportBackupDialogComponent.MAX_WIDTH,
		});

		const afterClosedSubscription = dialogRef.afterClosed().subscribe((serializedDumpModel: string) => {

			if (serializedDumpModel) {
				const desktopDumpModel: DesktopDumpModel = DesktopDumpModel.deserialize(serializedDumpModel);
				this.desktopSyncService.import(desktopDumpModel).then(() => {
					location.reload();
				}, error => {
					this.snackBar.open(error, "Close");
				});
			}

			afterClosedSubscription.unsubscribe();
		});
	}
}
