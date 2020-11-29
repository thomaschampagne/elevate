import { Component, HostBinding, Inject, InjectionToken, OnInit } from "@angular/core";
import { ActivityService } from "../shared/services/activity/activity.service";
import { AppRoutes } from "../shared/models/app-routes";
import { NavigationEnd, Router, RouterEvent } from "@angular/router";
import { MatDialog } from "@angular/material/dialog";
import { GotItDialogComponent } from "../shared/dialogs/got-it-dialog/got-it-dialog.component";
import { GotItDialogDataModel } from "../shared/dialogs/got-it-dialog/got-it-dialog-data.model";
import { ActivitiesSettingsLacksDialogComponent } from "./activities-settings-lacks-dialog.component";
import { LoadingDialogComponent } from "../shared/dialogs/loading-dialog/loading-dialog.component";
import { filter } from "rxjs/operators";
import { ConfirmDialogDataModel } from "../shared/dialogs/confirm-dialog/confirm-dialog-data.model";
import { ConfirmDialogComponent } from "../shared/dialogs/confirm-dialog/confirm-dialog.component";
import { UserSettingsService } from "../shared/services/user-settings/user-settings.service";
import { UserSettings } from "@elevate/shared/models";
import UserSettingsModel = UserSettings.UserSettingsModel;

export const REFRESH_STATS_BAR_COMPONENT = new InjectionToken<RefreshStatsBarComponent>("REFRESH_STATS_BAR_COMPONENT");

@Component({ template: "" })
export abstract class RefreshStatsBarComponent implements OnInit {
  @HostBinding("hidden")
  public hideRefreshStatsBar: boolean;

  public hideGoToAthleteSettingsButton: boolean;
  public hideSettingsConsistencyWarning: boolean;
  public hideSettingsLacksWarning: boolean;
  private userWarningsDisabled: { missingStressScores: boolean; activitiesNeedRecalculation: boolean };

  protected constructor(
    @Inject(Router) protected readonly router: Router,
    @Inject(ActivityService) protected readonly activityService: ActivityService,
    @Inject(UserSettingsService) protected readonly userSettingsService: UserSettingsService,
    @Inject(MatDialog) protected readonly dialog: MatDialog
  ) {
    this.hideGoToAthleteSettingsButton = false;
    this.hideRefreshStatsBar = true;
    this.hideSettingsConsistencyWarning = true;
    this.hideSettingsLacksWarning = true;
    this.userWarningsDisabled = {
      missingStressScores: false,
      activitiesNeedRecalculation: false
    };
  }

  public ngOnInit(): void {
    this.userSettingsService.fetch().then(userSettings => {
      this.userWarningsDisabled.missingStressScores = userSettings.disableMissingStressScoresWarning;
      this.userWarningsDisabled.activitiesNeedRecalculation = userSettings.disableActivitiesNeedRecalculationWarning;
    });

    // Listen for url change to display or not the "Go to athlete settings" button
    this.handleAthleteSettingButton();

    // Display warning message on settings lacks updates
    this.activityService.activitiesWithSettingsLacks$.subscribe(settingsLacking => {
      if (settingsLacking && !this.userWarningsDisabled.missingStressScores) {
        this.showSettingsLacks();
      }
    });

    // Display warning message on athleteSettingsConsistency updates
    this.activityService.athleteSettingsConsistency$.subscribe((isConsistent: boolean) => {
      if (!isConsistent && !this.userWarningsDisabled.activitiesNeedRecalculation) {
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
        minWidth: ActivitiesSettingsLacksDialogComponent.MIN_WIDTH
      });
    });
  }

  public onHideActivitiesWithSettingsLacks(): void {
    const title = 'Disable <i>"Missing stress scores detected..."</i> warning';
    const optionKey: keyof UserSettingsModel = "disableMissingStressScoresWarning";
    const onCloseAction = () => this.onCloseSettingsLacksWarning();

    this.onHideActivitiesConsistencyWarning(title, optionKey, onCloseAction);
  }

  public onHideActivitiesRecalculation(): void {
    const title = 'Disable <i>"Activities need to be recalculated..."</i> warning';
    const optionKey: keyof UserSettingsModel = "disableActivitiesNeedRecalculationWarning";
    const onCloseAction = () => this.onCloseSettingsConsistencyWarning();

    this.onHideActivitiesConsistencyWarning(title, optionKey, onCloseAction);
  }

  public onHideActivitiesConsistencyWarning(
    title: string,
    optionKey: keyof UserSettingsModel,
    onCloseAction: () => void
  ): void {
    const data: ConfirmDialogDataModel = {
      title: title,
      content:
        "<strong>Disabling this warning is not recommended.</strong><br/><br/>" +
        "You should rather fix your athlete settings instead to avoid misleading stats results.<br/><br/>" +
        "Note: You can enable back this warning in global settings<br/><br/>",
      confirmText: "Disable warning",
      cancelText: "Keep"
    };

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      minWidth: ConfirmDialogComponent.MIN_WIDTH,
      maxWidth: ConfirmDialogComponent.MAX_WIDTH,
      data: data
    });

    const afterClosedSubscription = dialogRef.afterClosed().subscribe((confirm: boolean) => {
      if (confirm) {
        this.userSettingsService.updateOption(optionKey, true).then(onCloseAction);
        afterClosedSubscription.unsubscribe();
      }
    });
  }

  public onEditAthleteSettingsFromSettingsLacksIssue(): void {
    if (this.router.isActive(AppRoutes.athleteSettings, true)) {
      this.dialog.open(GotItDialogComponent, {
        data: { content: "You're already on athlete settings section 😉" } as GotItDialogDataModel
      });
    } else {
      this.router.navigate([AppRoutes.athleteSettings]);
    }
  }

  public onFixActivities(): void {
    this.onCloseSettingsConsistencyWarning();
    this.onCloseSettingsLacksWarning();
  }

  private handleAthleteSettingButton(): void {
    const athleteSettingsPath = "/" + AppRoutes.athleteSettings;
    this.hideGoToAthleteSettingsButton = this.router.url !== athleteSettingsPath;
    this.router.events.pipe(filter(event => event instanceof NavigationEnd)).subscribe((event: RouterEvent) => {
      this.hideGoToAthleteSettingsButton = event.url !== athleteSettingsPath;
    });
  }
}
