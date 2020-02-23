import { Component, HostBinding, InjectionToken, OnInit } from "@angular/core";
import { ActivityService } from "../shared/services/activity/activity.service";
import { BulkRefreshStatsNotification, DesktopActivityService } from "../shared/services/activity/impl/desktop-activity.service";
import * as moment from "moment";
import * as _ from "lodash";
import { AppRoutesModel } from "../shared/models/app-routes.model";
import { Router } from "@angular/router";
import { UserSettingsService } from "../shared/services/user-settings/user-settings.service";
import { MatDialog } from "@angular/material/dialog";
import { GotItDialogComponent } from "../shared/dialogs/got-it-dialog/got-it-dialog.component";
import { GotItDialogDataModel } from "../shared/dialogs/got-it-dialog/got-it-dialog-data.model";
import { ConfirmDialogDataModel } from "../shared/dialogs/confirm-dialog/confirm-dialog-data.model";
import { ConfirmDialogComponent } from "../shared/dialogs/confirm-dialog/confirm-dialog.component";
import { SyncService } from "../shared/services/sync/sync.service";
import { LoggerService } from "../shared/services/logging/logger.service";
import { AppEventsService } from "../shared/services/external-updates/app-events-service";

export const REFRESH_STATS_BAR_COMPONENT = new InjectionToken<RefreshStatsBarComponent>("REFRESH_STATS_BAR_COMPONENT");

@Component({template: ""})
export class RefreshStatsBarComponent implements OnInit {

	public static readonly SECONDS_TO_WAIT_BEFORE_VERIFY_CONSISTENCY: number = 30;

	@HostBinding("hidden")
	public hideRefreshStatsBar: boolean;

	public hideWarning: boolean;

	constructor(public router: Router,
				public activityService: ActivityService,
				public dialog: MatDialog) {
		this.hideRefreshStatsBar = true;
		this.hideWarning = true;
	}

	public ngOnInit(): void {

		// Start delayed check of athlete settings consistency
		_.delay(() => this.activityService.verifyConsistencyWithAthleteSettings(),
			RefreshStatsBarComponent.SECONDS_TO_WAIT_BEFORE_VERIFY_CONSISTENCY * 1000);

		// Display warning message on athleteSettingsConsistency updates
		this.activityService.athleteSettingsConsistency.subscribe((isConsistent: boolean) => {
			this.hideWarning = isConsistent;
			this.hideRefreshStatsBar = this.hideWarning;
		});

	}

	public onFixActivities(): void {
	}

	public onEditAthleteSettings(): void {

		if (this.router.isActive(AppRoutesModel.athleteSettings, true)) {
			this.dialog.open(GotItDialogComponent, {
				data: <GotItDialogDataModel> {content: "You're already on athlete settings section 😉"}
			});
		} else {
			this.router.navigate([AppRoutesModel.athleteSettings]);
		}
	}
}

@Component({
	selector: "app-desktop-refresh-stats-bar",
	template: `
		<div class="app-refresh-stats-bar">

			<!--Non consistent warning message-->
			<div *ngIf="!hideWarning" fxLayout="row" fxLayoutAlign="space-between center">
				<div fxLayout="column" fxLayoutAlign="center start">
					Some of your activities need to be recalculated according to athlete settings changes.
				</div>
				<div fxLayout="row" fxLayoutAlign="space-between center">
					<button mat-flat-button color="warn" (click)="onFixActivities()">
						Recalculate
					</button>
					<button mat-flat-button color="warn" (click)="onEditAthleteSettings()">
						Go to Athlete Settings
					</button>
				</div>
			</div>

			<!--Recalculate activities section-->
			<div *ngIf="!hideRecalculation" fxLayout="row" fxLayoutAlign="space-between center">
				<div fxLayout="column" fxLayoutAlign="center start">
					<span fxFlex class="mat-body-1" *ngIf="statusText">{{statusText}}</span>
					<span fxFlex class="mat-caption">{{processed}}/{{toBeProcessed}} activities recalculated.</span>
				</div>
			</div>
		</div>
	`,
	styles: [`
		.app-refresh-stats-bar {
			padding: 10px 20px;
		}

		button {
			margin-left: 10px;
		}
	`]
})
export class DesktopRefreshStatsBarComponent extends RefreshStatsBarComponent implements OnInit {

	public hideRecalculation: boolean;

	public statusText: string;
	public processed: number;
	public toBeProcessed: number;

	constructor(public router: Router,
				public activityService: ActivityService,
				public userSettingsService: UserSettingsService,
				public appEventsService: AppEventsService,
				public dialog: MatDialog) {
		super(router, activityService, dialog);
		this.hideRecalculation = true;
	}

	public ngOnInit(): void {

		super.ngOnInit();

		const desktopActivityService = <DesktopActivityService> this.activityService;
		desktopActivityService.refreshStats$.subscribe((notification: BulkRefreshStatsNotification) => {

				if (notification.error) {
					this.dialog.open(GotItDialogComponent, {
						data: <GotItDialogDataModel> {content: notification.error.message}
					});
					return;
				}

				this.hideRefreshStatsBar = false; // We have to force display back of bar
				this.hideRecalculation = false;

				this.statusText = moment(notification.syncedActivityModel.start_time).format("ll") + ": " + notification.syncedActivityModel.name;

				if (notification.isLast) {
					this.statusText = "Recalculation done. App is being refreshed...";
					this.appEventsService.onSyncDone.next(true);
					setTimeout(() => {
						this.hideRefreshStatsBar = true;
						this.hideRecalculation = true;
						this.hideWarning = true;
					}, 2000);
				}

				this.processed = notification.currentlyProcessed;
				this.toBeProcessed = notification.toProcessCount;
			},
			err => {
				throw err;
			});

	}

	public onFixActivities(): void {
		super.onFixActivities();
		this.hideRefreshStatsBar = true; // It will showed back by the recalculation
		this.hideWarning = true;
		this.userSettingsService.fetch().then(userSettingsModel => {
			const desktopActivityService = <DesktopActivityService> this.activityService;
			desktopActivityService.nonConsistentActivitiesWithAthleteSettings().then((activitiesIds: number[]) => {
				desktopActivityService.bulkRefreshStatsFromIds(activitiesIds, userSettingsModel);
			});
		});
	}
}

@Component({
	selector: "app-extension-refresh-stats-bar",
	template: `
		<div class="app-refresh-stats-bar">
			<!--Non consistent warning message-->
			<div *ngIf="!hideWarning" fxLayout="row" fxLayoutAlign="space-between center">
				<div fxLayout="column" fxLayoutAlign="center start">
					Some of your activities need to be recalculated according to athlete settings changes.
				</div>
				<div fxLayout="row" fxLayoutAlign="space-between center">
					<button mat-flat-button color="warn" (click)="onFixActivities()">
						Recalculate
					</button>
					<button mat-flat-button color="warn" (click)="onEditAthleteSettings()">
						Go to Athlete Settings
					</button>
				</div>
			</div>
		</div>
	`,
	styles: [`
		.app-refresh-stats-bar {
			padding: 10px 20px;
		}

		button {
			margin-left: 10px;
		}
	`]
})
export class ExtensionRefreshStatsBarComponent extends RefreshStatsBarComponent implements OnInit {

	constructor(public router: Router,
				public activityService: ActivityService,
				public syncService: SyncService<any>,
				public dialog: MatDialog,
				public logger: LoggerService) {
		super(router, activityService, dialog);
	}

	public ngOnInit(): void {
		super.ngOnInit();
	}

	public onFixActivities(): void {
		super.onFixActivities();

		const data: ConfirmDialogDataModel = {
			title: "Recalculate synced activities affected by athlete settings changes",
			content: "Synced activities affected by athlete settings changes will be deleted to be synced again with " +
				"new athlete settings (equivalent to a \"Sync all activities\")",
			confirmText: "Proceed to the recalculation"
		};

		const dialogRef = this.dialog.open(ConfirmDialogComponent, {
			minWidth: ConfirmDialogComponent.MIN_WIDTH,
			maxWidth: ConfirmDialogComponent.MAX_WIDTH,
			data: data
		});

		const afterClosedSubscription = dialogRef.afterClosed().subscribe((confirm: boolean) => {

			if (confirm) {

				let nonConsistentIds: number[];

				this.activityService.nonConsistentActivitiesWithAthleteSettings().then((result: number[]) => {
					nonConsistentIds = result;
					return this.activityService.removeByIds(nonConsistentIds);

				}).then(() => {

					this.dialog.open(GotItDialogComponent, {
						data: <GotItDialogDataModel> {
							content: nonConsistentIds.length + " activities have been deleted and are synced back now. " +
								"You can sync back these activities manually by yourself by triggering a \"Sync all activities\""
						}
					});

					// Start Sync all activities
					this.syncService.sync(false, false);

				}).catch(error => {
					this.logger.error(error);
					this.dialog.open(GotItDialogComponent, {
						data: <GotItDialogDataModel> {content: error}
					});
				});
			}

			afterClosedSubscription.unsubscribe();
		});
	}

}
