import { Component, Inject, OnInit } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { ActivityService } from "../../shared/services/activity/activity.service";
import { StreamsService } from "../../shared/services/streams/streams.service";
import { ActivityStreamsModel, SyncedActivityModel, UserSettings } from "@elevate/shared/models";
import { UserSettingsService } from "../../shared/services/user-settings/user-settings.service";
import moment from "moment";
import _ from "lodash";
import { OPEN_RESOURCE_RESOLVER } from "../../shared/services/links-opener/open-resource-resolver";
import { DesktopActivityService } from "../../shared/services/activity/impl/desktop-activity.service";
import { AppRoutes } from "../../shared/models/app-routes";
import { MatSnackBar } from "@angular/material/snack-bar";
import { DesktopOpenResourceResolver } from "../../shared/services/links-opener/impl/desktop-open-resource-resolver.service";
import { ConfirmDialogDataModel } from "../../shared/dialogs/confirm-dialog/confirm-dialog-data.model";
import { ConfirmDialogComponent } from "../../shared/dialogs/confirm-dialog/confirm-dialog.component";
import { MatDialog } from "@angular/material/dialog";
import { ConnectorType } from "@elevate/shared/sync";
import { MeasureSystem } from "@elevate/shared/enums";
import { PaceSensor, SwimmingPaceSensor } from "./shared/models/sensors/move.sensor";
import { WarningException } from "@elevate/shared/exceptions";
import { ActivityEditDialogComponent } from "./activity-edit/activity-edit-dialog.component";
import { DesktopUserSettingsService } from "../../shared/services/user-settings/desktop/desktop-user-settings.service";
import DesktopUserSettingsModel = UserSettings.DesktopUserSettingsModel;

@Component({
  selector: "app-activity-view",
  templateUrl: "./activity-view.component.html",
  styleUrls: ["./activity-view.component.scss"]
})
export class ActivityViewComponent implements OnInit {
  public readonly ConnectorType = ConnectorType;

  public activity: SyncedActivityModel;
  public typeDisplay: string;
  public startDateDisplay: string;
  public athleteSnapshotDisplay: string;
  public shapedStreams: ActivityStreamsModel;
  public userSettings: DesktopUserSettingsModel;
  public hasMapData: boolean;

  constructor(
    @Inject(ActivatedRoute) private readonly route: ActivatedRoute,
    @Inject(UserSettingsService) private readonly userSettingsService: DesktopUserSettingsService,
    @Inject(ActivityService) protected readonly activityService: DesktopActivityService,
    @Inject(StreamsService) protected readonly streamsService: StreamsService,
    @Inject(OPEN_RESOURCE_RESOLVER) protected readonly openResourceResolver: DesktopOpenResourceResolver,
    @Inject(Router) protected readonly router: Router,
    @Inject(MatSnackBar) protected readonly snackBar: MatSnackBar,
    @Inject(MatDialog) private readonly dialog: MatDialog
  ) {
    this.activity = null;
    this.typeDisplay = null;
    this.startDateDisplay = null;
    this.athleteSnapshotDisplay = null;
    this.shapedStreams = null;
    this.userSettings = null;
    this.hasMapData = false;
  }

  public ngOnInit(): void {
    // Fetch activity to display from id
    const activityId = this.route.snapshot.params.id;
    this.activityService
      .getById(activityId)
      .then((activity: SyncedActivityModel) => {
        if (!activity) {
          this.onBackToActivities();
          return Promise.reject(new WarningException("Unknown activity"));
        }

        this.activity = activity;
        this.typeDisplay = _.startCase(this.activity.type);
        this.startDateDisplay = moment(this.activity.start_time).format("LLLL");

        return this.userSettingsService.fetch();
      })
      .then((userSettings: DesktopUserSettingsModel) => {
        this.userSettings = userSettings;
        this.athleteSnapshotDisplay = this.formatAthleteSnapshot(this.activity, this.userSettings.systemUnit);

        // Fetch associated stream if exists
        return this.streamsService.getShapedById(
          this.activity.id,
          SyncedActivityModel.isPaced(this.activity.type),
          this.activity.hasPowerMeter
        );
      })
      .then((shapedStreams: ActivityStreamsModel) => {
        this.shapedStreams = shapedStreams;
        this.hasMapData = shapedStreams?.latlng?.length > 0;
      })
      .catch(err => {
        if (!(err instanceof WarningException)) {
          throw err;
        }
      });
  }

  public onEditActivity(): void {
    const dialogRef = this.dialog.open(ActivityEditDialogComponent, {
      minWidth: ConfirmDialogComponent.MIN_WIDTH,
      maxWidth: ConfirmDialogComponent.MAX_WIDTH,
      data: this.activity.id
    });

    const afterClosedSubscription = dialogRef.afterClosed().subscribe(edited => {
      if (edited) {
        this.reloadActivityView().then(() => {
          this.snackBar.open("Activity edited.", "Ok", { duration: 5000 });
        });
      }
      afterClosedSubscription.unsubscribe();
    });
  }

  public formatAthleteSnapshot(activity: SyncedActivityModel, systemUnit: MeasureSystem): string {
    const isRide = SyncedActivityModel.isRide(activity.type);
    const isRun = SyncedActivityModel.isRun(activity.type);
    const isSwim = SyncedActivityModel.isSwim(activity.type);

    const athleteSnapshot = activity.athleteSnapshot;

    let snapshotFormatted = `Weight ${athleteSnapshot.athleteSettings.weight}kg`;
    snapshotFormatted += ` - MaxHR ${this.activity.athleteSnapshot.athleteSettings.maxHr}bpm`;
    snapshotFormatted += ` - RestHR ${this.activity.athleteSnapshot.athleteSettings.restHr}bpm`;

    if (this.activity.athleteSnapshot.athleteSettings.lthr.cycling && isRide) {
      snapshotFormatted += ` - Lthr ${this.activity.athleteSnapshot.athleteSettings.lthr.cycling}bpm`;
    } else if (this.activity.athleteSnapshot.athleteSettings.lthr.running && isRun) {
      snapshotFormatted += ` - Lthr ${this.activity.athleteSnapshot.athleteSettings.lthr.running}bpm`;
    } else if (this.activity.athleteSnapshot.athleteSettings.lthr.default) {
      snapshotFormatted += ` - Lthr ${this.activity.athleteSnapshot.athleteSettings.lthr.default}bpm`;
    }

    if (isRide) {
      const cyclingFtp = this.activity.athleteSnapshot.athleteSettings.cyclingFtp;
      snapshotFormatted += ` - Threshold ${cyclingFtp ? cyclingFtp + "w" : "Missing"}`;
    }

    if (isRun) {
      const runningFtp = this.activity.athleteSnapshot.athleteSettings.runningFtp;
      snapshotFormatted += ` - Threshold ${
        runningFtp
          ? PaceSensor.DEFAULT.fromStatsConvert(runningFtp, this.userSettings.systemUnit) +
            PaceSensor.DEFAULT.getDisplayUnit(systemUnit)
          : "Missing"
      }`;
    }

    if (isSwim) {
      const swimFtpMeterPerMin = this.activity.athleteSnapshot.athleteSettings.swimFtp;
      snapshotFormatted += ` - Threshold ${
        swimFtpMeterPerMin
          ? SwimmingPaceSensor.DEFAULT.fromStatsConvert(
              (1 / (swimFtpMeterPerMin / 60)) * 1000, // Convert m/min to s/km
              this.userSettings.systemUnit
            ) + SwimmingPaceSensor.DEFAULT.getDisplayUnit(systemUnit)
          : "Missing"
      }`;
    }

    return snapshotFormatted;
  }

  public onRecalculateActivity(): void {
    this.activityService.recalculateSingle(this.activity, this.userSettings, true).then(() => {
      this.reloadActivityView().then(() => {
        this.snackBar.open("Activity has been recalculated", "Ok", { duration: 5000 });
      });
    });
  }

  private reloadActivityView(): Promise<boolean> {
    return this.router.navigate([`${AppRoutes.activity}`]).then(() => {
      return this.router.navigate([`${AppRoutes.activity}/${this.activity.id}`]);
    });
  }

  public onDeleteActivity(): void {
    const data: ConfirmDialogDataModel = {
      title: 'Deleting activity "' + this.activity.name + '"',
      content: `Are you sure? You can fetch back this activity through a "Sync all activities"`,
      confirmText: "Delete"
    };

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      minWidth: ConfirmDialogComponent.MIN_WIDTH,
      maxWidth: ConfirmDialogComponent.MAX_WIDTH,
      data: data
    });

    const afterClosedSubscription = dialogRef.afterClosed().subscribe((confirm: boolean) => {
      if (confirm) {
        this.activityService.removeById(this.activity.id).then(
          () => {
            this.router.navigate([`${AppRoutes.activities}`]);
          },
          error => {
            this.snackBar.open(error, "Close");
          }
        );
      }
      afterClosedSubscription.unsubscribe();
    });
  }

  public hasStravaActivityId(): boolean {
    return this.activity?.extras?.strava_activity_id > 0;
  }

  public hasActivityFilePath(): boolean {
    return !!this.activity?.extras?.fs_activity_location?.path;
  }

  public onBackToActivities(): void {
    this.router.navigate([`${AppRoutes.activities}`]);
  }

  public onConfigureAthleteSettings(): void {
    this.router.navigate([`${AppRoutes.athleteSettings}`]);
  }

  public onOpenSourceActivity(sourceType: ConnectorType): void {
    this.openResourceResolver.openSourceActivity(this.activity.id, sourceType);
  }
}
