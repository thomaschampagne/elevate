import { Component, Inject, Input, OnInit } from "@angular/core";
import { TimeInZonesService } from "./services/time-in-zones.service";
import { SensorTimeInZones } from "./models/sensor-time-in-zones.model";
import { TimeInZonesChartComponent } from "./time-in-zones-chart/time-in-zones-chart.component";
import { ActivitySensorsService } from "../shared/activity-sensors.service";
import { StreamsService } from "../../../shared/services/streams/streams.service";
import { Streams } from "@elevate/shared/models/activity-data/streams.model";
import { MeasureSystem } from "@elevate/shared/enums/measure-system.enum";
import { ProcessStreamMode } from "@elevate/shared/sync/compute/stream-processor";
import { Activity } from "@elevate/shared/models/sync/activity.model";

@Component({
  selector: "app-activity-view-time-in-zones",
  templateUrl: "./activity-view-time-in-zones.component.html",
  styleUrls: ["./activity-view-time-in-zones.component.scss"]
})
export class ActivityViewTimeInZonesComponent implements OnInit {
  private static readonly CHERRY_PICKED_STREAMS_ORDER: (keyof Streams)[] = [
    "watts",
    "heartrate",
    "velocity_smooth",
    "cadence",
    "grade_smooth",
    "altitude"
  ];

  @Input()
  public activity: Activity;

  @Input()
  public measureSystem: MeasureSystem;

  public sensorTimeInZones: SensorTimeInZones[];

  constructor(
    @Inject(ActivitySensorsService) private readonly activitySensorsService: ActivitySensorsService,
    @Inject(TimeInZonesService) private readonly timeInZonesService: TimeInZonesService,
    @Inject(StreamsService) protected readonly streamsService: StreamsService
  ) {}

  public ngOnInit(): void {
    // Get sensors data in order
    const sensors = this.activitySensorsService.provideSensors(
      this.activity,
      ActivityViewTimeInZonesComponent.CHERRY_PICKED_STREAMS_ORDER
    );

    // Getting streams to calculate time in zone for each sensors
    this.streamsService
      .getProcessedById(ProcessStreamMode.COMPUTE, this.activity.id, {
        type: this.activity.type,
        hasPowerMeter: this.activity.hasPowerMeter,
        isSwimPool: this.activity.isSwimPool,
        athleteSnapshot: this.activity.athleteSnapshot
      })
      .then(streams => {
        this.timeInZonesService.calculate(sensors, streams).then((timeInZonesResults: SensorTimeInZones[]) => {
          this.sensorTimeInZones = timeInZonesResults;
        });
      });
  }

  public getGridRowHeight(): number {
    return TimeInZonesChartComponent.CHART_LAYOUT_SPECIFICS.height * 1.25;
  }
}
