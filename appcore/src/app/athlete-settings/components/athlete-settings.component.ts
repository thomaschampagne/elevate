import { Component, Inject, OnInit } from "@angular/core";
import { UserSettingsService } from "../../shared/services/user-settings/user-settings.service";
import { AthleteModel, Gender } from "@elevate/shared/models";
import { GenderModel } from "../models/gender.model";
import { ActivityService } from "../../shared/services/activity/activity.service";
import { LoggerService } from "../../shared/services/logging/logger.service";
import { AthleteService } from "../../shared/services/athlete/athlete.service";

// TODO Give a helper guide to find dated settings (how to?)
// TODO Show athleteSnapshot used on strava activities

@Component({
  selector: "app-athlete-settings",
  templateUrl: "./athlete-settings.component.html",
  styleUrls: ["./athlete-settings.component.scss"]
})
export class AthleteSettingsComponent implements OnInit {
  public static readonly SYNCED_ATHLETE_MODEL_SETTING_GENDER_KEY = "gender";

  public readonly GENDER_LIST: GenderModel[] = [
    {
      type: Gender.MEN,
      display: "Male"
    },
    {
      type: Gender.WOMEN,
      display: "Female"
    }
  ];

  public athleteModel: AthleteModel;

  constructor(
    @Inject(UserSettingsService) private readonly userSettingsService: UserSettingsService,
    @Inject(AthleteService) private readonly athleteService: AthleteService,
    @Inject(ActivityService) private readonly activityService: ActivityService,
    @Inject(LoggerService) private readonly logger: LoggerService
  ) {}

  public ngOnInit(): void {
    this.athleteService.fetch().then((athleteModel: AthleteModel) => {
      this.athleteModel = athleteModel;
    });
  }

  public onAthleteSettingsChanged(): void {
    this.verifyConsistencyWithAthleteSettings();
    this.clearLocalStorageOnNextLoad();
  }

  public onGenderChanged(): void {
    this.athleteService.update(this.athleteModel).then(() => this.onAthleteSettingsChanged());
  }

  public onDatedAthleteSettingsModelsChanged(): void {
    this.onAthleteSettingsChanged();
  }

  public clearLocalStorageOnNextLoad(): void {
    this.userSettingsService.clearLocalStorageOnNextLoad().catch(error => this.logger.error(error));
  }

  private verifyConsistencyWithAthleteSettings() {
    this.activityService.verifyConsistencyWithAthleteSettings();
  }
}
