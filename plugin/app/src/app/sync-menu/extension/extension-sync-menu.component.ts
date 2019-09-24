import _ from "lodash";
import * as moment from "moment";
import { Component, OnInit } from "@angular/core";
import { SyncMenuComponent } from "../sync-menu.component";
import { Router } from "@angular/router";
import { MatDialog, MatSnackBar } from "@angular/material";
import { AppEventsService } from "../../shared/services/external-updates/app-events-service";
import {
	ExtensionImportBackupDialogComponent,
	ImportBackupDialogComponent
} from "../../shared/dialogs/import-backup-dialog/import-backup-dialog.component";
import { SyncState } from "../../shared/services/sync/sync-state.enum";
import { ChromeSyncService } from "../../shared/services/sync/impl/chrome-sync.service";
import { ExtensionDumpModel } from "../../shared/models/dumps/extension-dump.model";

@Component({
	selector: "app-extension-sync-menu",
	templateUrl: "./extension-sync-menu.component.html",
	styleUrls: ["./extension-sync-menu.component.scss"]
})
export class ExtensionSyncMenuComponent extends SyncMenuComponent implements OnInit {

	constructor(public router: Router,
				public chromeSyncService: ChromeSyncService,
				public appEventsService: AppEventsService,
				public dialog: MatDialog,
				public snackBar: MatSnackBar) {
		super(router, chromeSyncService, appEventsService, dialog, snackBar);
	}

	public ngOnInit() {
		super.ngOnInit();
	}

	public updateLastSyncDateStatus(): void {

		this.chromeSyncService.getSyncState().then((syncState: SyncState) => {
			this.syncState = syncState;
			this.chromeSyncService.getLastSyncDateTime().then((lastSyncDateTime: number) => {
				if (_.isNumber(lastSyncDateTime)) {
					this.lastSyncDateMessage = moment(lastSyncDateTime).fromNow();
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
				this.chromeSyncService.import(dumpModel).then(() => {
					location.reload();
				}, error => {
					this.snackBar.open(error, "Close");
				});
			}

			afterClosedSubscription.unsubscribe();
		});
	}
}
