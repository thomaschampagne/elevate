import { Component, HostBinding, OnDestroy, OnInit } from "@angular/core";
import { ActivityService } from "../shared/services/activity/activity.service";
import { AppRoutesModel } from "../shared/models/app-routes.model";
import { NavigationEnd, Router, RouterEvent } from "@angular/router";
import { Subscription } from "rxjs";
import { ConfirmDialogComponent } from "../shared/dialogs/confirm-dialog/confirm-dialog.component";
import { ConfirmDialogDataModel } from "../shared/dialogs/confirm-dialog/confirm-dialog-data.model";
import { MatDialog, MatSnackBar } from "@angular/material";
import { SyncService } from "../shared/services/sync/sync.service";
import * as _ from "lodash";

@Component({
	selector: "app-athlete-settings-consistency-ribbon",
	templateUrl: "./athlete-settings-consistency-ribbon.component.html",
	styleUrls: ["./athlete-settings-consistency-ribbon.component.scss"]
})
export class AthleteSettingsConsistencyRibbonComponent implements OnInit, OnDestroy {

	public static readonly SECONDS_TO_WAIT_BEFORE_VERIFY_CONSISTENCY: number = 8;

	@HostBinding("hidden")
	public isConsistent = true;

	public showAthleteSettingsButton: boolean = null;

	private subscription: Subscription;

	constructor(public router: Router,
				public activityService: ActivityService,
				public syncService: SyncService,
				public dialog: MatDialog,
				public snackBar: MatSnackBar) {
	}

	public ngOnInit(): void {

		// Listen for route changes to display or not "Go to AthleteSettings" button
		this.subscription = this.router.events.subscribe((routerEvent: RouterEvent) => {
			if (routerEvent instanceof NavigationEnd) {
				this.showAthleteSettingsButton = this.router.isActive(AppRoutesModel.athleteSettings, true);
			}
		});

		// Start delayed check of athlete settings consistency
		_.delay(() => this.activityService.verifyConsistencyWithAthleteSettings(),
			AthleteSettingsConsistencyRibbonComponent.SECONDS_TO_WAIT_BEFORE_VERIFY_CONSISTENCY * 1000);

		// Display ribbon or not on athleteSettingsConsistency updates (from that component or external)
		this.activityService.athleteSettingsConsistency.subscribe((isConsistent: boolean) => {
			this.isConsistent = isConsistent;
		});
	}

	public ngOnDestroy(): void {
		this.subscription.unsubscribe();
	}

	public onFixActivities(): void {

		const data: ConfirmDialogDataModel = {
			title: "Fix synced activities affected by athlete settings changes",
			content: "Synced activities affected by athlete settings changes will be deleted to be synced again with " +
				"new athlete settings (equivalent to a \"Sync all activities\")",
			confirmText: "Proceed to the fix"
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

					this.snackBar.open(nonConsistentIds.length + " activities have been deleted and are synced back now. " +
						"You can sync back these activities manually by yourself by triggering a \"Sync all activities\"", "Got it");

					// Start Sync all activities
					this.syncService.sync(false, false);

				}).catch(error => {
					this.snackBar.open(error, "Close");
				});
			}

			afterClosedSubscription.unsubscribe();
		});
	}

	public onEditAthleteSettings(): void {
		this.router.navigate([AppRoutesModel.athleteSettings]);
	}

	public onDismiss(): void {
		this.isConsistent = true;
	}
}

