import { Component, HostBinding, Inject, InjectionToken, OnInit } from "@angular/core";
import { ActivityService } from "../shared/services/activity/activity.service";
import { AppRoutesModel } from "../shared/models/app-routes.model";
import { NavigationEnd, Router, RouterEvent } from "@angular/router";
import { MatDialog } from "@angular/material/dialog";
import { GotItDialogComponent } from "../shared/dialogs/got-it-dialog/got-it-dialog.component";
import { GotItDialogDataModel } from "../shared/dialogs/got-it-dialog/got-it-dialog-data.model";
import { ActivitiesSettingsLacksDialogComponent } from "./activities-settings-lacks-dialog.component";
import { LoadingDialogComponent } from "../shared/dialogs/loading-dialog/loading-dialog.component";
import { filter } from "rxjs/operators";

export const REFRESH_STATS_BAR_COMPONENT = new InjectionToken<RefreshStatsBarComponent>("REFRESH_STATS_BAR_COMPONENT");

@Component({ template: "" })
export abstract class RefreshStatsBarComponent implements OnInit {
  @HostBinding("hidden")
  public hideRefreshStatsBar: boolean;

  public hideGoToAthleteSettingsButton: boolean;
  public hideSettingsConsistencyWarning: boolean;
  public hideSettingsLacksWarning: boolean;

  protected constructor(
    @Inject(Router) protected readonly router: Router,
    @Inject(ActivityService) protected readonly activityService: ActivityService,
    @Inject(MatDialog) protected readonly dialog: MatDialog
  ) {
    this.hideGoToAthleteSettingsButton = false;
    this.hideRefreshStatsBar = true;
    this.hideSettingsConsistencyWarning = true;
    this.hideSettingsLacksWarning = true;
  }

  public ngOnInit(): void {
    // Listen for url change to display or not the "Go to athlete settings" button
    this.handleAthleteSettingButton();

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
        minWidth: ActivitiesSettingsLacksDialogComponent.MIN_WIDTH
      });
    });
  }

  public onEditAthleteSettingsFromSettingsLacksIssue(): void {
    if (this.router.isActive(AppRoutesModel.athleteSettings, true)) {
      this.dialog.open(GotItDialogComponent, {
        data: { content: "You're already on athlete settings section 😉" } as GotItDialogDataModel
      });
    } else {
      this.router.navigate([AppRoutesModel.athleteSettings]);
    }
  }

  public onFixActivities(): void {
    this.onCloseSettingsConsistencyWarning();
    this.onCloseSettingsLacksWarning();
  }

  private handleAthleteSettingButton(): void {
    const athleteSettingsPath = "/" + AppRoutesModel.athleteSettings;
    this.hideGoToAthleteSettingsButton = this.router.url !== athleteSettingsPath;
    this.router.events.pipe(filter(event => event instanceof NavigationEnd)).subscribe((event: RouterEvent) => {
      this.hideGoToAthleteSettingsButton = event.url !== athleteSettingsPath;
    });
  }
}
