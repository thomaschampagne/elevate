import { Component, Inject, OnInit, ViewChild } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { ActivityService } from "../../../shared/services/activity/activity.service";
import { DesktopActivityService } from "../../../shared/services/activity/impl/desktop-activity.service";
import { NgForm } from "@angular/forms";
import _ from "lodash";
import { UserSettingsService } from "../../../shared/services/user-settings/user-settings.service";
import { DesktopUserSettingsService } from "../../../shared/services/user-settings/desktop/desktop-user-settings.service";
import { ElevateSport } from "@elevate/shared/enums/elevate-sport.enum";
import { Activity } from "@elevate/shared/models/sync/activity.model";
import { UserSettings } from "@elevate/shared/models/user-settings/user-settings.namespace";
import DesktopUserSettings = UserSettings.DesktopUserSettings;

@Component({
  selector: "app-activity-edit-dialog",
  templateUrl: "./activity-edit-dialog.component.html",
  styleUrls: ["./activity-edit-dialog.component.scss"]
})
export class ActivityEditDialogComponent implements OnInit {
  public static readonly MAX_WIDTH: string = "80%";
  public static readonly MIN_WIDTH: string = "40%";

  private static readonly USUAL_SPORTS_CATEGORY: ElevateSport[] = [
    ElevateSport.Ride,
    ElevateSport.Run,
    ElevateSport.Swim,
    ElevateSport.Hike,
    ElevateSport.Rowing
  ];

  @ViewChild("activityForm") activityForm: NgForm;

  public activity: Activity;

  public elevateSportCategories: { label: string; sportKeys: ElevateSport[] }[];

  constructor(
    @Inject(MatDialogRef) private readonly dialogRef: MatDialogRef<ActivityEditDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public readonly activityId: number,
    @Inject(ActivityService) protected readonly activityService: DesktopActivityService,
    @Inject(UserSettingsService) private readonly userSettingsService: DesktopUserSettingsService
  ) {
    this.setupSportsCategories();
  }

  public ngOnInit(): void {
    this.activityService.getById(this.activityId).then((storedActivity: Activity) => {
      this.activity = _.cloneDeep(storedActivity); // Cloned to loose instance reference. This allow form edit without live changing the model
    });
  }

  public startCase(sport: string): string {
    return _.startCase(sport);
  }

  public onSave(): void {
    this.userSettingsService
      .fetch()
      .then((userSettings: DesktopUserSettings) => {
        return this.activityService.getById(this.activityId).then((storedActivity: Activity) => {
          // If activity content changed, edit last edit time (activity will be saved in recalculateSingle method)
          if (!Activity.isSame(storedActivity, this.activity)) {
            this.activity.lastEditTime = new Date().toISOString();
          }

          // If sport type has changed. We have to loose source stats to rely on computed stats instead once computed.
          // For instance if an activity is flagged as "Ride" is changed to "Run", then the "moving time source stat"
          // will be wrong since speed thresholds to compute the moving time are different.
          if (storedActivity.type !== this.activity.type && this.activity.srcStats) {
            this.activity.srcStats = null;
          }

          return this.activityService.recalculateSingle(this.activity, userSettings);
        });
      })
      .then(() => {
        this.dialogRef.close(true);
      });
  }

  public onCancel() {
    this.dialogRef.close(false);
  }

  private setupSportsCategories(): void {
    this.elevateSportCategories = [
      {
        label: "Usual Sports",
        sportKeys: ActivityEditDialogComponent.USUAL_SPORTS_CATEGORY
      },
      {
        label: "Others Sports",
        sportKeys: _.difference(
          _.keys(ElevateSport) as ElevateSport[],
          ActivityEditDialogComponent.USUAL_SPORTS_CATEGORY
        )
      }
    ];
  }
}
