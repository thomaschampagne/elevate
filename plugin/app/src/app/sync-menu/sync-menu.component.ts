import { Component, InjectionToken, OnInit } from "@angular/core";
import { ConfirmDialogDataModel } from "../shared/dialogs/confirm-dialog/confirm-dialog-data.model";
import { ConfirmDialogComponent } from "../shared/dialogs/confirm-dialog/confirm-dialog.component";
import { GotItDialogComponent } from "../shared/dialogs/got-it-dialog/got-it-dialog.component";
import { GotItDialogDataModel } from "../shared/dialogs/got-it-dialog/got-it-dialog-data.model";
import { SyncService } from "../shared/services/sync/sync.service";
import { MatDialog } from "@angular/material/dialog";
import { MatSnackBar } from "@angular/material/snack-bar";
import { Router } from "@angular/router";
import { AppEventsService } from "../shared/services/external-updates/app-events-service";
import { SyncResultModel } from "@elevate/shared/models";
import { ElevateException } from "@elevate/shared/exceptions";
import { SyncState } from "../shared/services/sync/sync-state.enum";

export const SYNC_MENU_COMPONENT_TOKEN = new InjectionToken<SyncMenuComponent>("SYNC_MENU_COMPONENT_TOKEN");

@Component({template: ""})
export class SyncMenuComponent implements OnInit {

	public SyncState = SyncState;
	public syncState: SyncState;
	public syncDateMessage: string;

	constructor(public router: Router,
				public syncService: SyncService<any>,
				public appEventsService: AppEventsService,
				public dialog: MatDialog,
				public snackBar: MatSnackBar) {
		this.syncState = null;
		this.syncDateMessage = null;
	}

	public ngOnInit(): void {

		// Update sync status in toolbar and Refresh SyncDate displayed every minutes
		this.updateSyncDateStatus();
		setInterval(() => {
			this.updateSyncDateStatus();
		}, 1000 * 60);

		this.appEventsService.onSyncDone.subscribe((syncResult: SyncResultModel) => {
			if (syncResult) {
				this.updateSyncDateStatus();
			}
		});
	}

	public updateSyncDateStatus(): void {
		throw new ElevateException("updateSyncDateStatus must be implemented in a child class");
	}

	public onSyncedBackupImport(): void {
		throw new ElevateException("onSyncedBackupImport must be implemented in a child class");
	}

	public onSync(fastSync: boolean = null, forceSync: boolean = null): void {
	}

	public onClearSyncedData(): void {

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
					location.reload();
				}, error => {
					this.snackBar.open(error, "Close");
				});
			}
			afterClosedSubscription.unsubscribe();
		});
	}

	public onSyncedBackupExport(): void {

		this.syncService.export().then((result: any) => {

			this.dialog.open(GotItDialogComponent, {
				minWidth: GotItDialogComponent.MIN_WIDTH,
				maxWidth: GotItDialogComponent.MAX_WIDTH,
				data: new GotItDialogDataModel(null, "File \"" + result.filename + "\" is being saved to your download folder.")
			});

		}, error => {
			this.snackBar.open(error, "Close");
		});
	}

}
