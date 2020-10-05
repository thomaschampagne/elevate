import { Component, HostBinding, InjectionToken, OnInit } from "@angular/core";
import { ActivityService } from "../shared/services/activity/activity.service";
import {
    BulkRefreshStatsNotification,
    DesktopActivityService,
} from "../shared/services/activity/impl/desktop-activity.service";
import * as moment from "moment";
import { AppRoutesModel } from "../shared/models/app-routes.model";
import { NavigationEnd, Router, RouterEvent } from "@angular/router";
import { UserSettingsService } from "../shared/services/user-settings/user-settings.service";
import { MatDialog } from "@angular/material/dialog";
import { GotItDialogComponent } from "../shared/dialogs/got-it-dialog/got-it-dialog.component";
import { GotItDialogDataModel } from "../shared/dialogs/got-it-dialog/got-it-dialog-data.model";
import { ConfirmDialogDataModel } from "../shared/dialogs/confirm-dialog/confirm-dialog-data.model";
import { ConfirmDialogComponent } from "../shared/dialogs/confirm-dialog/confirm-dialog.component";
import { SyncService } from "../shared/services/sync/sync.service";
import { LoggerService } from "../shared/services/logging/logger.service";
import { AppEventsService } from "../shared/services/external-updates/app-events-service";
import { UserSettings } from "@elevate/shared/models";
import { ActivitiesSettingsLacksDialogComponent } from "./activities-settings-lacks-dialog.component";
import { LoadingDialogComponent } from "../shared/dialogs/loading-dialog/loading-dialog.component";
import { filter } from "rxjs/operators";
import { sleep } from "@elevate/shared/tools";
import DesktopUserSettingsModel = UserSettings.DesktopUserSettingsModel;

export const REFRESH_STATS_BAR_COMPONENT = new InjectionToken<RefreshStatsBarComponent>("REFRESH_STATS_BAR_COMPONENT");

@Component({ template: "" })
export class RefreshStatsBarComponent implements OnInit {
    public static readonly VERIFY_SETTINGS_LACKS_TIMEOUT: number = 20;
    public static readonly VERIFY_ATHLETE_SETTINGS_CONSISTENCY_TIMEOUT: number = 30;

    @HostBinding("hidden")
    public hideRefreshStatsBar: boolean;

    public hideGoToAthleteSettingsButton: boolean;
    public hideSettingsConsistencyWarning: boolean;
    public hideSettingsLacksWarning: boolean;

    constructor(
        public router: Router,
        public activityService: ActivityService,
        public appEventsService: AppEventsService,
        public dialog: MatDialog
    ) {
        this.hideGoToAthleteSettingsButton = false;
        this.hideRefreshStatsBar = true;
        this.hideSettingsConsistencyWarning = true;
        this.hideSettingsLacksWarning = true;
    }

    public ngOnInit(): void {
        // Delayed check of settings lacks and athlete settings consistency
        this.verifyHistoryCompliance();

        // Listen for url change to display or not the "Go to athlete settings" button
        this.handleAthleteSettingButton();

        // Listen for sync/recalculation performed
        this.appEventsService.syncDone$.subscribe((changes: boolean) => {
            if (changes) {
                sleep((RefreshStatsBarComponent.VERIFY_SETTINGS_LACKS_TIMEOUT * 1000) / 3).then(() => {
                    this.activityService.verifyActivitiesWithSettingsLacking();
                });
            }
        });

        // Display warning message on settings lacks updates
        this.activityService.activitiesWithSettingsLacks$.subscribe(settingsLacking => {
            if (settingsLacking) {
                this.showSettingsLacks();
            }
        });

        // Display warning message on athleteSettingsConsistency updates
        this.activityService.athleteSettingsConsistency$.subscribe((isConsistent: boolean) => {
            if (!isConsistent) {
                this.showConsistencyWarning();
            }
        });
    }

    public showSettingsLacks(): void {
        this.hideSettingsLacksWarning = false;
        this.hideRefreshStatsBar = false;
    }

    public showConsistencyWarning(): void {
        this.hideSettingsConsistencyWarning = false;
        this.hideRefreshStatsBar = false;
    }

    public onCloseSettingsLacksWarning(): void {
        this.hideSettingsLacksWarning = true;
        this.hideRefreshStatsBar = this.hideSettingsConsistencyWarning;
    }

    public onCloseSettingsConsistencyWarning(): void {
        this.hideSettingsConsistencyWarning = true;
        this.hideRefreshStatsBar = this.hideSettingsLacksWarning;
    }

    public onShowActivitiesWithSettingsLacks(): void {
        const loadingDialog = this.dialog.open(LoadingDialogComponent);

        this.activityService.findActivitiesWithSettingsLacks().then(syncedActivityModels => {
            loadingDialog.close();
            this.dialog.open(ActivitiesSettingsLacksDialogComponent, {
                data: syncedActivityModels,
                minWidth: ActivitiesSettingsLacksDialogComponent.MIN_WIDTH,
            });
        });
    }

    public onEditAthleteSettingsFromSettingsLacksIssue(): void {
        if (this.router.isActive(AppRoutesModel.athleteSettings, true)) {
            this.dialog.open(GotItDialogComponent, {
                data: { content: "You're already on athlete settings section 😉" } as GotItDialogDataModel,
            });
        } else {
            this.router.navigate([AppRoutesModel.athleteSettings]);
        }
    }

    public onFixActivities(): void {
        this.onCloseSettingsConsistencyWarning();
        this.onCloseSettingsLacksWarning();
    }

    private verifyHistoryCompliance(): void {
        sleep(RefreshStatsBarComponent.VERIFY_SETTINGS_LACKS_TIMEOUT * 1000).then(() => {
            this.activityService.verifyActivitiesWithSettingsLacking();
        });

        sleep(RefreshStatsBarComponent.VERIFY_ATHLETE_SETTINGS_CONSISTENCY_TIMEOUT * 1000).then(() => {
            this.activityService.verifyConsistencyWithAthleteSettings();
        });
    }

    private handleAthleteSettingButton(): void {
        const athleteSettingsPath = "/" + AppRoutesModel.athleteSettings;
        this.hideGoToAthleteSettingsButton = this.router.url !== athleteSettingsPath;
        this.router.events.pipe(filter(event => event instanceof NavigationEnd)).subscribe((event: RouterEvent) => {
            this.hideGoToAthleteSettingsButton = event.url !== athleteSettingsPath;
        });
    }
}

@Component({
    selector: "app-desktop-refresh-stats-bar",
    template: `
        <div class="app-refresh-stats-bar">
            <!--Missing stress scores detected on some activities-->
            <div *ngIf="!hideSettingsLacksWarning" fxLayout="row" fxLayoutAlign="space-between center">
                <div fxLayout="column" fxLayoutAlign="center start">
                    Missing stress scores detected on some activities. You probably forgot some functional thresholds in
                    dated athlete settings.
                </div>
                <div fxLayout="row" fxLayoutAlign="space-between center">
                    <button mat-flat-button color="accent" (click)="onShowActivitiesWithSettingsLacks()">
                        Details
                    </button>
                    <button
                        *ngIf="hideGoToAthleteSettingsButton"
                        mat-flat-button
                        color="accent"
                        (click)="onEditAthleteSettingsFromSettingsLacksIssue()"
                    >
                        Fix settings
                    </button>
                    <button mat-icon-button (click)="onCloseSettingsLacksWarning()">
                        <mat-icon fontSet="material-icons-outlined">close</mat-icon>
                    </button>
                </div>
            </div>

            <!--Non consistent warning message-->
            <div *ngIf="!hideSettingsConsistencyWarning" fxLayout="row" fxLayoutAlign="space-between center">
                <div fxLayout="column" fxLayoutAlign="center start">
                    Some of your activities need to be recalculated according to athlete settings changes.
                </div>
                <div fxLayout="row" fxLayoutAlign="space-between center">
                    <button mat-flat-button color="accent" (click)="onFixActivities()">Recalculate</button>
                    <button mat-icon-button (click)="onCloseSettingsConsistencyWarning()">
                        <mat-icon fontSet="material-icons-outlined">close</mat-icon>
                    </button>
                </div>
            </div>

            <!--Recalculate activities section-->
            <div *ngIf="!hideRecalculation" fxLayout="row" fxLayoutAlign="space-between center">
                <div fxLayout="column" fxLayoutAlign="center start">
                    <span fxFlex class="mat-body-1" *ngIf="statusText">{{ statusText }}</span>
                    <span fxFlex class="mat-caption">{{ processed }}/{{ toBeProcessed }} activities recalculated.</span>
                </div>
            </div>
        </div>
    `,
    styles: [
        `
            .app-refresh-stats-bar {
                padding: 10px 20px;
            }

            button {
                margin-left: 10px;
            }
        `,
    ],
})
export class DesktopRefreshStatsBarComponent extends RefreshStatsBarComponent implements OnInit {
    public hideRecalculation: boolean;

    public statusText: string;
    public processed: number;
    public toBeProcessed: number;

    constructor(
        public router: Router,
        public activityService: ActivityService,
        public userSettingsService: UserSettingsService,
        public appEventsService: AppEventsService,
        public dialog: MatDialog,
        public logger: LoggerService
    ) {
        super(router, activityService, appEventsService, dialog);
        this.hideRecalculation = true;
    }

    public ngOnInit(): void {
        super.ngOnInit();

        const desktopActivityService = this.activityService as DesktopActivityService;
        desktopActivityService.refreshStats$.subscribe(
            (notification: BulkRefreshStatsNotification) => {
                if (notification.error) {
                    this.logger.error(notification);
                    this.dialog.open(GotItDialogComponent, {
                        data: { content: notification.error.message } as GotItDialogDataModel,
                    });
                    return;
                }

                this.showRecalculation();

                this.statusText =
                    moment(notification.syncedActivityModel.start_time).format("ll") +
                    ": " +
                    notification.syncedActivityModel.name;

                if (notification.isLast) {
                    this.statusText = "Recalculation done. App is being refreshed...";
                    this.appEventsService.syncDone$.next(true);
                    setTimeout(() => {
                        this.closeRefreshStatsBar();
                    }, 2000);
                }

                this.processed = notification.currentlyProcessed;
                this.toBeProcessed = notification.toProcessCount;
            },
            err => {
                this.logger.error(err);
                throw err;
            }
        );
    }

    public onFixActivities(): void {
        super.onFixActivities();
        this.userSettingsService.fetch().then((userSettingsModel: DesktopUserSettingsModel) => {
            const desktopActivityService = this.activityService as DesktopActivityService;
            desktopActivityService.nonConsistentActivitiesWithAthleteSettings().then((activitiesIds: number[]) => {
                desktopActivityService.bulkRefreshStatsFromIds(activitiesIds, userSettingsModel);
            });
        });
    }

    public showRecalculation(): void {
        this.hideRefreshStatsBar = false; // We have to force the display back of bar
        this.hideRecalculation = false; // Show calculation
    }

    public closeRefreshStatsBar(): void {
        this.hideRefreshStatsBar = true;
        this.hideRecalculation = true;
        this.hideSettingsLacksWarning = true;
        this.hideSettingsConsistencyWarning = true;
    }
}

@Component({
    selector: "app-extension-refresh-stats-bar",
    template: `
        <div class="app-refresh-stats-bar">
            <!--Missing stress scores detected on some activities-->
            <div *ngIf="!hideSettingsLacksWarning" fxLayout="row" fxLayoutAlign="space-between center">
                <div fxLayout="column" fxLayoutAlign="center start">
                    Missing stress scores detected on some activities. You probably forgot some functional thresholds in
                    dated athlete settings.
                </div>
                <div fxLayout="row" fxLayoutAlign="space-between center">
                    <button mat-flat-button color="accent" (click)="onShowActivitiesWithSettingsLacks()">
                        Details
                    </button>
                    <button
                        *ngIf="hideGoToAthleteSettingsButton"
                        mat-flat-button
                        color="accent"
                        (click)="onEditAthleteSettingsFromSettingsLacksIssue()"
                    >
                        Fix settings
                    </button>
                    <button mat-icon-button (click)="onCloseSettingsLacksWarning()">
                        <mat-icon fontSet="material-icons-outlined">close</mat-icon>
                    </button>
                </div>
            </div>

            <!--Non consistent warning message-->
            <div *ngIf="!hideSettingsConsistencyWarning" fxLayout="row" fxLayoutAlign="space-between center">
                <div fxLayout="column" fxLayoutAlign="center start">
                    Some of your activities need to be recalculated according to athlete settings changes.
                </div>
                <div fxLayout="row" fxLayoutAlign="space-between center">
                    <button mat-flat-button color="accent" (click)="onFixActivities()">Recalculate</button>
                    <button mat-icon-button (click)="onCloseSettingsConsistencyWarning()">
                        <mat-icon fontSet="material-icons-outlined">close</mat-icon>
                    </button>
                </div>
            </div>
        </div>
    `,
    styles: [
        `
            .app-refresh-stats-bar {
                padding: 10px 20px;
            }

            button {
                margin-left: 10px;
            }
        `,
    ],
})
export class ExtensionRefreshStatsBarComponent extends RefreshStatsBarComponent implements OnInit {
    constructor(
        public router: Router,
        public activityService: ActivityService,
        public syncService: SyncService<any>,
        public appEventsService: AppEventsService,
        public dialog: MatDialog,
        public logger: LoggerService
    ) {
        super(router, activityService, appEventsService, dialog);
    }

    public ngOnInit(): void {
        super.ngOnInit();
    }

    public onFixActivities(): void {
        super.onFixActivities();

        const data: ConfirmDialogDataModel = {
            title: "Recalculate synced activities affected by athlete settings changes",
            content:
                "Synced activities affected by athlete settings changes will be deleted to be synced again with " +
                'new athlete settings (equivalent to a "Sync all activities")',
            confirmText: "Proceed to the recalculation",
        };

        const dialogRef = this.dialog.open(ConfirmDialogComponent, {
            minWidth: ConfirmDialogComponent.MIN_WIDTH,
            maxWidth: ConfirmDialogComponent.MAX_WIDTH,
            data: data,
        });

        const afterClosedSubscription = dialogRef.afterClosed().subscribe((confirm: boolean) => {
            if (confirm) {
                let nonConsistentIds: number[];

                this.activityService
                    .nonConsistentActivitiesWithAthleteSettings()
                    .then((result: number[]) => {
                        nonConsistentIds = result;
                        return this.activityService.removeByManyIds(nonConsistentIds);
                    })
                    .then(() => {
                        this.dialog.open(GotItDialogComponent, {
                            data: {
                                content:
                                    nonConsistentIds.length +
                                    " activities have been deleted and are synced back now. " +
                                    'You can sync back these activities manually by yourself by triggering a "Sync all activities"',
                            } as GotItDialogDataModel,
                        });

                        // Start Sync all activities
                        this.syncService.sync(false, false);
                    })
                    .catch(error => {
                        this.logger.error(error);
                        this.dialog.open(GotItDialogComponent, {
                            data: { content: error } as GotItDialogDataModel,
                        });
                    });
            }

            afterClosedSubscription.unsubscribe();
        });
    }
}
