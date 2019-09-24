import { Component, OnInit } from "@angular/core";
import { SyncMenuComponent } from "../sync-menu.component";
import { Router } from "@angular/router";
import { MatDialog, MatSnackBar } from "@angular/material";
import { ConnectorLastSyncDateTime } from "@elevate/shared/models/sync/connector-last-sync-date-time.model";
import {
	DesktopImportBackupDialogComponent,
	ImportBackupDialogComponent
} from "../../shared/dialogs/import-backup-dialog/import-backup-dialog.component";
import { DesktopDumpModel } from "../../shared/models/dumps/desktop-dump.model";
import { SyncState } from "../../shared/services/sync/sync-state.enum";
import { AppEventsService } from "../../shared/services/external-updates/app-events-service";
import { DesktopSyncService } from "../../shared/services/sync/impl/desktop-sync.service";

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

		console.log("Desktop.updateLastSyncDateStatus called");

		// TODO Remove below !
		this.desktopSyncService.getSyncState().then((syncState: SyncState) => {

			console.debug("syncState: ", syncState);
			// debugger;

			this.syncState = SyncState.SYNCED;
			this.desktopSyncService.getLastSyncDateTime().then((connectorLastSyncDateTimes: ConnectorLastSyncDateTime[]) => {
				console.debug(connectorLastSyncDateTimes);
				// if (_.isNumber(lastSyncDateTime)) {
				// 	this.lastSyncDateMessage = moment(lastSyncDateTime).fromNow();
				// }
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
