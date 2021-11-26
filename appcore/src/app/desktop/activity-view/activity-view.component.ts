import { Component, Inject, OnDestroy, OnInit } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { Location } from "@angular/common";
import { ActivityService } from "../../shared/services/activity/activity.service";
import { StreamsService } from "../../shared/services/streams/streams.service";
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
import { PaceSensor, SwimmingPaceSensor } from "./shared/models/sensors/move.sensor";
import { ActivityEditDialogComponent } from "./activity-edit/activity-edit-dialog.component";
import { DesktopUserSettingsService } from "../../shared/services/user-settings/desktop/desktop-user-settings.service";
import { LoggerService } from "../../shared/services/logging/logger.service";
import { ActivityViewService } from "./shared/activity-view.service";
import { environment } from "../../../environments/environment";
import { GotItDialogComponent } from "../../shared/dialogs/got-it-dialog/got-it-dialog.component";
import { GotItDialogDataModel } from "../../shared/dialogs/got-it-dialog/got-it-dialog-data.model";
import { Subscription } from "rxjs";
import { UserSettings } from "@elevate/shared/models/user-settings/user-settings.namespace";
import { ConnectorType } from "@elevate/shared/sync/connectors/connector-type.enum";
import { WarningException } from "@elevate/shared/exceptions/warning.exception";
import { MeasureSystem } from "@elevate/shared/enums/measure-system.enum";
import { ProcessStreamMode } from "@elevate/shared/sync/compute/stream-processor";
import { Activity, ACTIVITY_FLAGS_DESC_MAP, ActivityFlag } from "@elevate/shared/models/sync/activity.model";
import { ActivityComputer } from "@elevate/shared/sync/compute/activity-computer";
import { ElevateSport } from "@elevate/shared/enums/elevate-sport.enum";
import { Streams } from "@elevate/shared/models/activity-data/streams.model";
import { Time } from "@elevate/shared/tools/time";
import DesktopUserSettings = UserSettings.DesktopUserSettings;

@Component({
  selector: "app-activity-view",
  templateUrl: "./activity-view.component.html",
  styleUrls: ["./activity-view.component.scss"]
})
export class ActivityViewComponent implements OnInit, OnDestroy {
  constructor(
    @Inject(ActivatedRoute) private readonly route: ActivatedRoute,
    @Inject(UserSettingsService) private readonly userSettingsService: DesktopUserSettingsService,
    @Inject(ActivityService) protected readonly activityService: DesktopActivityService,
    @Inject(StreamsService) protected readonly streamsService: StreamsService,
    @Inject(OPEN_RESOURCE_RESOLVER) protected readonly openResourceResolver: DesktopOpenResourceResolver,
    @Inject(ActivityViewService) private readonly activityViewService: ActivityViewService,
    @Inject(Router) protected readonly router: Router,
    @Inject(MatSnackBar) protected readonly snackBar: MatSnackBar,
    @Inject(Location) private location: Location,
    @Inject(MatDialog) private readonly dialog: MatDialog,
    @Inject(LoggerService) private readonly logger: LoggerService
  ) {
    this.activity = null;
    this.typeDisplay = null;
    this.startDateDisplay = null;
    this.athleteSnapshotDisplay = null;
    this.streams = null;
    this.userSettings = null;
    this.hasMapData = false;
    this.displayGraph = false;
    this.displayFlags = true;
  }

  private static readonly DEVICE_WATCH_SPORTS = [
    ElevateSport.Run,
    ElevateSport.VirtualRun,
    ElevateSport.Swim,
    ElevateSport.Hike,
    ElevateSport.Walk,
    ElevateSport.InlineSkate,
    ElevateSport.NordicSki,
    ElevateSport.Crossfit
  ];

  public readonly ConnectorType = ConnectorType;

  public activity: Activity;
  public typeDisplay: string;
  public startDateDisplay: string;
  public endDateDisplay: string;
  public athleteSnapshotDisplay: string;
  public streams: Streams;
  public userSettings: DesktopUserSettings;
  public hasMapData: boolean;
  public deviceIcon: string;
  public displayGraph: boolean;
  public displayFlags: boolean;

  /**
   * Displays debug "on map statistics" activity data on graph bound selection
   */
  private selectedGraphBoundsSubscription: Subscription;

  public ngOnInit(): void {
    // Fetch activity to display from id
    const activityId = this.route.snapshot.params.id;
    this.activityService
      .getById(activityId)
      .then((activity: Activity) => {
        if (!activity) {
          this.onBack();
          return Promise.reject(new WarningException("Unknown activity"));
        }

        this.activity = activity;
        this.typeDisplay = _.startCase(this.activity.type);
        this.startDateDisplay = moment(this.activity.startTime).format("LLLL");
        this.endDateDisplay = moment(this.activity.endTime).format("LLLL");

        this.deviceIcon =
          ActivityViewComponent.DEVICE_WATCH_SPORTS.indexOf(this.activity.type) !== -1 ? "watch" : "smartphone";

        return this.userSettingsService.fetch();
      })
      .then((userSettings: DesktopUserSettings) => {
        this.userSettings = userSettings;
        this.athleteSnapshotDisplay = this.formatAthleteSnapshot(this.activity, this.userSettings.systemUnit);

        // Fetch associated stream if exists
        return this.streamsService.getProcessedById(ProcessStreamMode.DISPLAY, this.activity.id, {
          type: this.activity.type,
          hasPowerMeter: this.activity.hasPowerMeter,
          isSwimPool: this.activity.isSwimPool,
          athleteSnapshot: this.activity.athleteSnapshot
        });
      })
      .then((streams: Streams) => {
        this.streams = streams;
        this.hasMapData = streams?.latlng?.length > 0;

        this.logger.debug("Activity", this.activity);
        this.logger.debug("Streams", this.streams);
      })
      .catch(err => {
        if (!(err instanceof WarningException)) {
          throw err;
        }
      });

    // (Debug) Displays "on map statistics" activity data on graph bound selection
    this.setupDisplayDebugStatsOnSelectedBounds();
  }

  public onEditActivity(): void {
    const dialogRef = this.dialog.open(ActivityEditDialogComponent, {
      minWidth: ActivityEditDialogComponent.MIN_WIDTH,
      maxWidth: ActivityEditDialogComponent.MAX_WIDTH,
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

  public onClearFlags(): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      minWidth: ConfirmDialogComponent.MIN_WIDTH,
      maxWidth: ConfirmDialogComponent.MAX_WIDTH,
      data: {
        title: "Clear activity flags",
        content:
          "This will remove flagged issues on this activity <strong>forever</strong>. Removing issues may introduce unexpected behavior into Elevate features " +
          "(e.g. fitness trend bumps when an issue is related to a stress score).</br></br>To get issues back, remove activity and sync it again.</br></br>Are you sure to perform this action?</br></br>"
      } as ConfirmDialogDataModel
    });

    const afterClosedSubscription = dialogRef.afterClosed().subscribe((confirm: boolean) => {
      if (confirm) {
        this.activity.flags = null;
        this.activityService.update(this.activity).then(() => {
          this.reloadActivityView().then(() => {
            this.snackBar.open("Issues have been removed.", "Ok", { duration: 5000 });
          });
          afterClosedSubscription.unsubscribe();
        });
      }
    });
  }

  public getFlagReason(flag: ActivityFlag): string {
    return ACTIVITY_FLAGS_DESC_MAP.get(flag) || null;
  }

  public formatAthleteSnapshot(activity: Activity, systemUnit: MeasureSystem): string {
    const isRide = Activity.isRide(activity.type);
    const isRun = Activity.isRun(activity.type);
    const isSwim = Activity.isSwim(activity.type);

    const athleteSnapshot = activity.athleteSnapshot;

    let snapshotFormatted = `Weight ${athleteSnapshot.athleteSettings.weight}kg`;
    if (this.activity.athleteSnapshot.age) {
      snapshotFormatted += ` - Age ${this.activity.athleteSnapshot.age}`;
    }
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
    this.activityService.recalculateSingle(this.activity, this.userSettings).then(() => {
      this.reloadActivityView().then(() => {
        this.snackBar.open("Activity has been recalculated", "Ok", { duration: 5000 });
      });
    });
  }

  private reloadActivityView(): Promise<boolean> {
    return this.router.navigate([`${AppRoutes.activity}`], { skipLocationChange: true }).then(() => {
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
    return this.activity?.extras?.strava?.activityId > 0;
  }

  public hasActivityFilePath(): boolean {
    return !!this.activity?.extras?.file?.path;
  }

  public getActivityFileType(): string {
    const type = this.activity?.extras?.file?.type;
    return type ? `(.${type})` : "";
  }

  public onBack(): void {
    this.location.back();
  }

  public onConfigureAthleteSettings(): void {
    this.router.navigate([`${AppRoutes.athleteSettings}`]);
  }

  public onOpenSourceActivity(sourceType: ConnectorType): void {
    this.openResourceResolver.openSourceActivity(this.activity.id, sourceType);
  }

  private setupDisplayDebugStatsOnSelectedBounds(): void {
    if (environment.showActivityDebugData) {
      this.selectedGraphBoundsSubscription = this.activityViewService.selectedGraphBounds$.subscribe(selectedBounds => {
        if (!selectedBounds) return;

        let dialogTemplate = "";
        const SEPARATOR = `<div>---------------------------</div>`;

        // Grade related debug
        if (this.streams.distance?.length && this.streams.altitude?.length) {
          const mapDeltaTime = _.round(this.streams.time[selectedBounds[1]] - this.streams.time[selectedBounds[0]], 1);
          const mapDeltaDistance = _.round(
            this.streams.distance[selectedBounds[1]] - this.streams.distance[selectedBounds[0]],
            1
          );
          const mapDeltaElevation = _.round(
            this.streams.altitude[selectedBounds[1]] - this.streams.altitude[selectedBounds[0]],
            1
          );
          const mapGrade = mapDeltaDistance > 0 ? _.round((mapDeltaElevation / mapDeltaDistance) * 100, 2) : 0;
          const processedGradeStream = this.streams.grade_smooth.slice(selectedBounds[0], selectedBounds[1] + 1);
          const processedGradeMean = _.round(_.mean(processedGradeStream), 2);

          dialogTemplate += `<div><strong>Indexes:</strong> ${selectedBounds[0]} to ${selectedBounds[1]}</div>`;
          dialogTemplate += `<div><strong>Map Δ Time:</strong> ${Time.secToMilitary(mapDeltaTime)}</div>`;
          dialogTemplate += `<div><strong>Map Δ Distance:</strong> ${mapDeltaDistance}m</div>`;
          dialogTemplate += `<div><strong>Map Δ Elevation:</strong> ${mapDeltaElevation}m</div>`;
          dialogTemplate += `<div><strong>Grade:</strong> Map ${mapGrade}%; Stream: ${processedGradeMean}%</div>`;
        }

        // Estimated watts VS real watts debug
        if (
          this.activity.hasPowerMeter &&
          this.streams.watts?.length &&
          this.streams.watts_calc?.length &&
          localStorage.getItem("DEBUG_EST_VS_REAL_WATTS") === "true"
        ) {
          dialogTemplate += SEPARATOR;

          const streamTime = this.streams.time.slice(selectedBounds[0], selectedBounds[1] + 1);
          const streamPower = this.streams.watts.slice(selectedBounds[0], selectedBounds[1] + 1);
          const streamEstDebugPower = this.streams.watts_calc.slice(selectedBounds[0], selectedBounds[1] + 1);

          const realPowerMean = _.round(_.mean(streamPower));
          const estDebugPowerMean = _.round(_.mean(streamEstDebugPower));
          dialogTemplate += `<div><strong>Power REAL/EST. Avg:</strong> Real Avg ${realPowerMean}w; Est Power: ${estDebugPowerMean}w; </div>`;

          const realNormPower = _.round(ActivityComputer.computeNormalizedPower(streamPower, streamTime));
          const estNormPower = _.round(ActivityComputer.computeNormalizedPower(streamEstDebugPower, streamTime));
          dialogTemplate += `<div><strong>Power REAL/EST. NP:</strong> Real NP ${realNormPower}w; Est NP: ${estNormPower}w; </div>`;
        }

        // Power stream only debug
        if (this.streams.watts?.length) {
          dialogTemplate += SEPARATOR;
          const streamTime = this.streams.time.slice(selectedBounds[0], selectedBounds[1] + 1);
          const streamPower = this.streams.watts.slice(selectedBounds[0], selectedBounds[1] + 1);

          const powerMean = _.round(_.mean(streamPower));
          const powerNorm = _.round(ActivityComputer.computeNormalizedPower(streamPower, streamTime));
          dialogTemplate += `<div><strong>Power Avg:</strong> Avg ${powerMean}w</div>`;
          dialogTemplate += `<div><strong>Power NP:</strong> NP ${powerNorm}w</div>`;
        }

        this.dialog.open(GotItDialogComponent, {
          data: {
            content: dialogTemplate
          } as GotItDialogDataModel,
          position: { bottom: "50px" },
          backdropClass: ["transparent"]
        });
      });
    }
  }

  public ngOnDestroy(): void {
    if (environment.showActivityDebugData) {
      this.selectedGraphBoundsSubscription.unsubscribe();
    }
  }
}
