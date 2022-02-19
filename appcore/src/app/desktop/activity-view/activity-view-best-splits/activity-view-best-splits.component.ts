import { Component, Inject, Input, OnInit } from "@angular/core";
import { Activity } from "@elevate/shared/models/sync/activity.model";
import { Streams } from "@elevate/shared/models/activity-data/streams.model";
import { MeasureSystem } from "@elevate/shared/enums/measure-system.enum";
import { ActivitySensorsService } from "../shared/activity-sensors.service";
import { ActivityViewService } from "../shared/activity-view.service";
import { SplitRequest } from "@elevate/shared/models/splits/split-request.model";
import { SplitResponse } from "@elevate/shared/models/splits/split-response.model";
import { SplitRequestType } from "@elevate/shared/models/splits/split-request-type.enum";
import _ from "lodash";
import { Sensor } from "../shared/models/sensors/sensor.model";
import { Time } from "@elevate/shared/tools/time";
import { MatTableDataSource } from "@angular/material/table";
import { sleep } from "@elevate/shared/tools/sleep";
import { LoggerService } from "../../../shared/services/logging/logger.service";
import { DistanceSensor } from "../shared/models/sensors/distance.sensor";
import { Constant } from "@elevate/shared/constants/constant";
import { MatSnackBar } from "@angular/material/snack-bar";
import { ActivityService } from "../../../shared/services/activity/activity.service";
import { DesktopActivityService } from "../../../shared/services/activity/impl/desktop-activity.service";

@Component({
  selector: "app-activity-view-best-splits",
  templateUrl: "./activity-view-best-splits.component.html",
  styleUrls: ["./activity-view-best-splits.component.scss"]
})
export class ActivityViewBestSplitsComponent implements OnInit {
  private static readonly CHERRY_PICKED_STREAMS_ORDER: (keyof Streams)[] = [
    "velocity_smooth",
    "heartrate",
    "watts",
    "cadence"
  ];

  private static readonly TABLE_TITLE_MAP = new Map<string | keyof Streams, string>([
    ["range", "Distance/Time"],
    ["velocity_smooth", "Best Speed"],
    ["heartrate", "Best Heart rate"],
    ["watts", "Best Power"],
    ["cadence", "Best Cadence"]
  ]);

  private static readonly DEFAULT_METRIC_DIST_SPLITS: number[] = [1000, 5000, 10000];
  private static readonly DEFAULT_IMPERIAL_DIST_SPLITS: number[] =
    ActivityViewBestSplitsComponent.DEFAULT_METRIC_DIST_SPLITS.map(dist => dist / Constant.KM_TO_MILE_FACTOR);

  private static readonly DEFAULT_TIME_SPLITS: number[] = [60, 5 * 60, 10 * 60, 20 * 60];

  @Input()
  public activity: Activity;

  @Input()
  public streams: Streams;

  @Input()
  public measureSystem: MeasureSystem;

  public readonly MeasureSystem = MeasureSystem;

  public columnDefs: string[] = ["range"];
  public splitResponses: SplitResponse[] = [];
  public dataSource: MatTableDataSource<SplitResponse>;
  public dataStreams: { streamKey: string; stream: number[] }[];
  public sensors: Sensor[];
  public userDefinedSplit: { distance: number; time: string };
  public maxDistance: number;
  private maxTime: number;

  constructor(
    @Inject(ActivitySensorsService) private readonly activitySensorsService: ActivitySensorsService,
    @Inject(ActivityViewService) private readonly activityViewService: ActivityViewService,
    @Inject(ActivityService) protected readonly activityService: DesktopActivityService,
    @Inject(MatSnackBar) private readonly snackBar: MatSnackBar,
    @Inject(LoggerService) private readonly logger: LoggerService
  ) {
    this.dataSource = new MatTableDataSource();
    this.userDefinedSplit = {} as never;
  }

  public ngOnInit(): void {
    this.maxDistance = this.streams.distance?.length ? _.last(this.streams.distance) : null;
    this.maxTime = _.last(this.streams.time);

    // List sensor available for current activity
    this.sensors = this.activitySensorsService.provideSensors(
      this.activity,
      ActivityViewBestSplitsComponent.CHERRY_PICKED_STREAMS_ORDER
    );

    // Prepare and store available activity data streams from sensors
    this.dataStreams = this.sensors
      .map(sensor => {
        return {
          streamKey: sensor.streamKey,
          stream: this.streams[sensor.streamKey] as number[]
        };
      })
      .filter(dataStream => dataStream.stream);

    // Compute/display defaults distance splits
    this.addDefaultDistanceSplits()
      .then(() => {
        return this.addDefaultTimeSplits();
      })
      .then(() => {
        this.logger.debug("Default splits added");
      });

    this.userDefinedSplit.distance = this.getDefaultCustomDistSplit();
    this.userDefinedSplit.time = this.getDefaultCustomTimeSplit();
  }

  private getDefaultCustomDistSplit(): number {
    let defaultUserDistance = this.maxDistance;

    if (this.measureSystem === MeasureSystem.IMPERIAL) {
      defaultUserDistance = defaultUserDistance / Constant.KM_TO_MILE_FACTOR;
    }

    defaultUserDistance = (defaultUserDistance / 1000) * 0.75;

    return defaultUserDistance - (defaultUserDistance % 5);
  }

  private getDefaultCustomTimeSplit(): string {
    const targetTime = this.maxTime * 0.75;
    return Time.secToMilitary(targetTime - (targetTime % 300));
  }

  private addDefaultDistanceSplits(): Promise<void> {
    if (this.maxDistance) {
      const distanceSplits =
        this.measureSystem === MeasureSystem.METRIC
          ? ActivityViewBestSplitsComponent.DEFAULT_METRIC_DIST_SPLITS
          : ActivityViewBestSplitsComponent.DEFAULT_IMPERIAL_DIST_SPLITS;

      return distanceSplits
        .filter(dist => dist <= this.maxDistance)
        .reduce((previous: Promise<void>, range: number) => {
          return previous.then(() => {
            return this.addSplit(SplitRequestType.DISTANCE, range);
          });
        }, Promise.resolve());
    } else {
      return Promise.resolve();
    }
  }

  private addDefaultTimeSplits(): Promise<void> {
    return ActivityViewBestSplitsComponent.DEFAULT_TIME_SPLITS.filter(time => time <= this.maxTime).reduce(
      (previous: Promise<void>, range: number) => {
        return previous.then(() => {
          return this.addSplit(SplitRequestType.TIME, range);
        });
      },
      Promise.resolve()
    );
  }

  private addSplit(type: SplitRequestType, range: number): Promise<void> {
    const splitRequest: SplitRequest = {
      type: type,
      sport: this.activity.type,
      range: range,
      scaleStream: type === SplitRequestType.TIME ? this.streams.time : this.streams.distance,
      dataStreams: this.dataStreams
    };

    return this.activityService.computeSplit(splitRequest).then(response => {
      // Detect and update new columns for  table print
      this.columnDefs = _.uniq(
        _.union(
          this.columnDefs,
          response.results.map(result => result.streamKey)
        )
      );
      // Append/track new response
      this.splitResponses.push(response);

      // Update table
      this.dataSource.data = this.splitResponses;

      return sleep();
    });
  }

  public printSplitValue(splitResponse: SplitResponse, streamKey: string): string {
    // Find out the sensor to use from the streamKey (= columnDef)
    const sensor = _.find(this.sensors, { streamKey: streamKey }) as Sensor;

    // Fetch the result value based on same streamKey
    const value = _.find(splitResponse.results, { streamKey: streamKey })?.value as number;

    if (value === undefined || value === null) {
      return "-";
    }

    // Finally, convert/format the value
    return `${sensor.formatFromStat(value, this.measureSystem)} ${sensor.getDisplayUnit(this.measureSystem)}`;
  }

  public printRangeValue(type: SplitRequestType, range: number): string {
    if (type === SplitRequestType.TIME) {
      return Time.secToMilitary(range);
    } else {
      const distanceSensor = DistanceSensor.DEFAULT;
      return `${distanceSensor.formatFromStat(range, this.measureSystem)} ${distanceSensor.getDisplayUnit(
        this.measureSystem
      )}`;
    }
  }

  public printTitle(columnDef: string): string {
    return ActivityViewBestSplitsComponent.TABLE_TITLE_MAP.get(columnDef);
  }

  public onSplitClick(splitResponse: SplitResponse, columnDef: string): void {
    const indexes = _.find(splitResponse.results, { streamKey: columnDef })?.indexes;
    this.activityViewService.selectedGraphBounds$.next(indexes);
  }

  public onAddDistanceSplit(): void {
    let splitValue = this.userDefinedSplit.distance * 1000;
    // Support case when user enter imperial distance
    if (this.measureSystem === MeasureSystem.IMPERIAL) {
      splitValue = splitValue / Constant.KM_TO_MILE_FACTOR;
    }

    // Check if distance is inferior or equal to max distance
    if (splitValue > this.maxDistance) {
      this.snackBar.open("Can't add split: entered distance is higher than activity distance itself", "Ok", {
        duration: 5000
      });
      return;
    }

    this.addSplit(SplitRequestType.DISTANCE, splitValue).then(() => {
      this.logger.debug("Custom split added");
    });
  }

  public onAddTimeSplit(): void {
    const splitValue = Time.militaryToSec(this.userDefinedSplit.time);

    // Check if time is inferior or equal to max time
    if (splitValue > this.maxTime) {
      this.snackBar.open("Can't add split: entered time is higher than activity time itself", "Ok", { duration: 5000 });
      return;
    }

    this.addSplit(SplitRequestType.TIME, splitValue).then(() => {
      this.logger.debug("Custom split added");
    });
  }
}
