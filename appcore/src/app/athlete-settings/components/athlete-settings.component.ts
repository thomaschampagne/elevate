import { Component, Inject, OnInit, ViewChild } from "@angular/core";
import { GenderModel } from "../models/gender.model";
import { ActivityService } from "../../shared/services/activity/activity.service";
import { LoggerService } from "../../shared/services/logging/logger.service";
import { AthleteService } from "../../shared/services/athlete/athlete.service";
import { AppService } from "../../shared/services/app-service/app.service";
import _ from "lodash";
import { NgForm } from "@angular/forms";
import { MatSnackBar } from "@angular/material/snack-bar";
import { ElevateSport } from "@elevate/shared/enums/elevate-sport.enum";
import { PracticeLevel } from "@elevate/shared/models/athlete/athlete-level.enum";
import { Gender } from "@elevate/shared/models/athlete/gender.enum";
import { AthleteModel } from "@elevate/shared/models/athlete/athlete.model";

@Component({
  selector: "app-athlete-settings",
  templateUrl: "./athlete-settings.component.html",
  styleUrls: ["./athlete-settings.component.scss"]
})
export class AthleteSettingsComponent implements OnInit {
  private static readonly USUAL_SPORTS_CATEGORY: ElevateSport[] = [
    ElevateSport.Ride,
    ElevateSport.Run,
    ElevateSport.Swim,
    ElevateSport.Triathlon,
    ElevateSport.Hike,
    ElevateSport.Walk,
    ElevateSport.Rowing
  ];

  private static readonly HIDDEN_SPORTS_CATEGORY: ElevateSport[] = [
    ElevateSport.Cardio,
    ElevateSport.Manual,
    ElevateSport.Mountaineering,
    ElevateSport.Orienteering,
    ElevateSport.Other,
    ElevateSport.VirtualRide,
    ElevateSport.VirtualRun,
    ElevateSport.Workout
  ];

  public readonly MAX_SPORTS: number = 10;
  public readonly DEFAULT_BIRTHDAY_START_DATE: Date = new Date(`${new Date().getFullYear() - 30}`); // Minus 30 years
  public readonly MAX_BIRTHDAY_DATE: Date = new Date();

  public readonly GENDERS: GenderModel[] = [
    {
      type: Gender.MEN,
      display: "Male"
    },
    {
      type: Gender.WOMEN,
      display: "Female"
    }
  ];

  public readonly PracticeLevel = PracticeLevel;
  public readonly PRACTICE_LEVELS: PracticeLevel[] = [
    PracticeLevel.NOVICE,
    PracticeLevel.ENTHUSIAST,
    PracticeLevel.COMPETITIVE,
    PracticeLevel.PRO
  ];

  public athleteModel: AthleteModel;
  public sportsCategories: { label: string; sportKeys: ElevateSport[] }[];

  @ViewChild("athleteForm") athleteForm: NgForm;

  constructor(
    @Inject(AppService) public readonly appService: AppService,
    @Inject(AthleteService) private readonly athleteService: AthleteService,
    @Inject(ActivityService) private readonly activityService: ActivityService,
    @Inject(MatSnackBar) private readonly snackBar: MatSnackBar,
    @Inject(LoggerService) private readonly logger: LoggerService
  ) {
    this.setupSportsCategories();
  }

  public ngOnInit(): void {
    this.athleteService.fetch().then((athleteModel: AthleteModel) => {
      this.athleteModel = athleteModel;
      setTimeout(() => this.athleteForm.control.markAllAsTouched()); // Force template driven form validation
    });
  }

  public onAthleteSettingsChanged(): void {
    this.verifyConsistencyWithAthleteSettings();
  }

  public onAthleteChanged(): void {
    if (this.athleteModel.sports.length >= this.MAX_SPORTS) {
      this.snackBar.open(`You can't add more than ${this.MAX_SPORTS} preferred sports`, "Ok", { duration: 4000 });
    }
    this.athleteService.update(this.athleteModel).then(() => this.onAthleteSettingsChanged());
  }

  public onDatedAthleteSettingsChanged(): void {
    this.onAthleteSettingsChanged();
  }

  private verifyConsistencyWithAthleteSettings() {
    this.activityService.verifyConsistencyWithAthleteSettings();
  }

  public startCase(sport: string): string {
    return _.startCase(sport);
  }

  private setupSportsCategories(): void {
    this.sportsCategories = [
      {
        label: "Usual Sports",
        sportKeys: AthleteSettingsComponent.USUAL_SPORTS_CATEGORY
      },
      {
        label: "Others Sports",
        sportKeys: _.difference(
          _.keys(ElevateSport) as ElevateSport[],
          AthleteSettingsComponent.USUAL_SPORTS_CATEGORY,
          AthleteSettingsComponent.HIDDEN_SPORTS_CATEGORY
        )
      }
    ];
  }
}
