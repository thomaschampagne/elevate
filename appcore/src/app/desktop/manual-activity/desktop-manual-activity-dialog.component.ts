import { Component, Inject, OnInit, ViewChild } from "@angular/core";
import { NgForm } from "@angular/forms";
import { Activity, ActivityStats } from "@elevate/shared/models/sync/activity.model";
import { ElevateSport } from "@elevate/shared/enums/elevate-sport.enum";
import { MatDialogRef } from "@angular/material/dialog";
import _ from "lodash";
import { ActivityService } from "../../shared/services/activity/activity.service";
import { DesktopActivityService } from "../../shared/services/activity/impl/desktop-activity.service";
import { MatSnackBar } from "@angular/material/snack-bar";
import { SyncService } from "../../shared/services/sync/sync.service";
import { DesktopSyncService } from "../../shared/services/sync/impl/desktop-sync.service";
import { AthleteService } from "../../shared/services/athlete/athlete.service";
import { UserSettingsService } from "../../shared/services/user-settings/user-settings.service";
import { MeasureSystem } from "@elevate/shared/enums/measure-system.enum";

@Component({
  selector: "app-desktop-manual-activity",
  templateUrl: "./desktop-manual-activity-dialog.component.html",
  styleUrls: ["./desktop-manual-activity-dialog.component.scss"]
})
export class DesktopManualActivityDialogComponent implements OnInit {
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

  public today: Date;
  public startDate: Date;
  public startHours: number;
  public startMinutes: number;

  public durationHours: number;
  public durationMinutes: number;
  public durationSeconds: number;

  public readonly MeasureSystem = MeasureSystem;

  public measureSystem: MeasureSystem;

  public isRide: boolean;
  public isRun: boolean;
  public isSwim: boolean;

  constructor(
    @Inject(ActivityService) private readonly activityService: DesktopActivityService,
    @Inject(SyncService) protected readonly desktopSyncService: DesktopSyncService,
    @Inject(AthleteService) protected readonly athleteService: AthleteService,
    @Inject(UserSettingsService) protected readonly userSettingsService: UserSettingsService,
    @Inject(MatDialogRef) private readonly dialogRef: MatDialogRef<DesktopManualActivityDialogComponent>,
    @Inject(MatSnackBar) private readonly snackBar: MatSnackBar
  ) {
    this.userSettingsService.fetch().then(userSettings => {
      this.measureSystem = userSettings.systemUnit;
    });

    this.today = new Date();
    this.startDate = new Date();
    this.startHours = new Date().getHours() - 1;
    this.startMinutes = new Date().getMinutes();

    this.durationHours = 1;
    this.durationMinutes = 0;
    this.durationSeconds = 0;

    // Create activity with defaults
    this.activity = new Activity();
    this.activity.name = "My activity (manual)";
    this.activity.manual = true;
    this.activity.connector = null;
    this.activity.type = ElevateSport.Ride;
    this.activity.hasPowerMeter = false;
    this.activity.stats = {
      elevation: {},
      scores: {
        stress: {}
      }
    } as ActivityStats;

    // Update sports booleans for dynamic form update along sport type selected
    this.refreshSportsState();

    // List sports with usual/other categories
    this.setupSportsCategories();
  }

  public ngOnInit(): void {}

  public onSubmit(): void {
    this.startDate.setHours(this.startHours, this.startMinutes, 0, 0);
    const duration = this.durationHours * 3600 + this.durationMinutes * 60 + this.durationSeconds;

    this.activityService
      .createManualEntry(this.activity, this.measureSystem, this.startDate, duration)
      .then(() => {
        this.desktopSyncService.isSyncing$.next(false); // Emulate end of sync
        this.snackBar.open(`Activity saved`, "Ok", { duration: 2000 });
        this.dialogRef.close();
      })
      .catch(error => {
        this.snackBar.open(error.message || error, "Ok");
      });
  }

  public refreshSportsState(): void {
    this.isRide = Activity.isRide(this.activity.type);
    this.isRun = Activity.isRun(this.activity.type);
    this.isSwim = Activity.isSwim(this.activity.type);

    // Reset values on changes
    this.activity.stats.scores.stress.hrss = null;
    this.activity.stats.scores.stress.pss = null;
    this.activity.stats.scores.stress.rss = null;
    this.activity.stats.scores.stress.sss = null;
  }

  public onCancel(): void {
    this.dialogRef.close();
  }

  public startCase(sport: string): string {
    return _.startCase(sport);
  }

  private setupSportsCategories(): void {
    this.elevateSportCategories = [
      {
        label: "Usual Sports",
        sportKeys: DesktopManualActivityDialogComponent.USUAL_SPORTS_CATEGORY
      },
      {
        label: "Others Sports",
        sportKeys: _.difference(
          _.keys(ElevateSport) as ElevateSport[],
          DesktopManualActivityDialogComponent.USUAL_SPORTS_CATEGORY
        )
      }
    ];
  }
}
