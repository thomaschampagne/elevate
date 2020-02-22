import { Component, OnInit } from "@angular/core";
import { ElectronService } from "../shared/services/electron/electron.service";
import { ConfirmDialogDataModel } from "../shared/dialogs/confirm-dialog/confirm-dialog-data.model";
import { ConfirmDialogComponent } from "../shared/dialogs/confirm-dialog/confirm-dialog.component";
import { MatDialog } from "@angular/material/dialog";
import { DesktopSyncService } from "../shared/services/sync/impl/desktop-sync.service";
import { SyncState } from "../shared/services/sync/sync-state.enum";
import { AppRoutesModel } from "../shared/models/app-routes.model";
import { Router } from "@angular/router";

@Component({
	selector: "app-connectors",
	templateUrl: "./connectors.component.html",
	styleUrls: ["./connectors.component.scss"]
})
export class ConnectorsComponent implements OnInit {

	public static readonly ATHLETE_CHECKING_FIRST_SYNC_MESSAGE: string = "ATHLETE_CHECKING_FIRST_SYNC";

	constructor(public desktopSyncService: DesktopSyncService,
				public electronService: ElectronService,
				public router: Router,
				public dialog: MatDialog) {
	}

	public ngOnInit(): void {
	}

	public sync(fastSync: boolean = null, forceSync: boolean = null): Promise<void> {

		return this.desktopSyncService.getSyncState().then((syncState: SyncState) => {

			if (syncState === SyncState.NOT_SYNCED) {

				const data: ConfirmDialogDataModel = {
					title: "Important: check your athlete settings before",
					content: "No activities were synced before. Please make sure you have properly configured your dated athlete settings (cycling FTP, running FTP, swim FTP, heart rate, weight, ...) before starting a synchronization. " +
						"A lack of athlete settings configuration can cause empty stats and empty charts.",
					confirmText: "I configured my athlete settings, start sync",
					cancelText: "Configure athlete settings"
				};

				const dialogRef = this.dialog.open(ConfirmDialogComponent, {
					minWidth: ConfirmDialogComponent.MIN_WIDTH,
					maxWidth: "50%",
					data: data
				});

				return dialogRef.afterClosed().toPromise().then((confirm: boolean) => {
					const checkAthleteSettings = !confirm;
					if (checkAthleteSettings) {
						this.router.navigate([AppRoutesModel.athleteSettings]);
						return Promise.reject(ConnectorsComponent.ATHLETE_CHECKING_FIRST_SYNC_MESSAGE);
					} else {
						return Promise.resolve();
					}
				});

			} else {
				return Promise.resolve();
			}
		});

	}

	public onOpenLink(url: string): void {

		const data: ConfirmDialogDataModel = {
			title: "Add your connector as fitness company or organization",
			content: "Please contact me on twitter to get your fitness company or organization connector in Elevate.",
			confirmText: "Contact me"
		};

		const dialogRef = this.dialog.open(ConfirmDialogComponent, {
			minWidth: ConfirmDialogComponent.MIN_WIDTH,
			maxWidth: ConfirmDialogComponent.MAX_WIDTH,
			data: data
		});

		dialogRef.afterClosed().subscribe((confirm: boolean) => {
			if (confirm) {
				this.electronService.openExternalUrl(url);
			}
		});

	}
}
