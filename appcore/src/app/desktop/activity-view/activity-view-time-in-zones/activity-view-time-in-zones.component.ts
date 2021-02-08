import { Component, Inject, Input, OnInit } from "@angular/core";
import { ActivityStreamsModel, SyncedActivityModel } from "@elevate/shared/models";
import { TimeInZonesService } from "./services/time-in-zones.service";
import { MeasureSystem } from "@elevate/shared/enums";
import { SensorTimeInZones } from "./models/sensor-time-in-zones.model";
import { TimeInZonesChartComponent } from "./time-in-zones-chart/time-in-zones-chart.component";
import { ActivitySensorsService } from "../shared/activity-sensors.service";

@Component({
  selector: "app-activity-view-time-in-zones",
  templateUrl: "./activity-view-time-in-zones.component.html",
  styleUrls: ["./activity-view-time-in-zones.component.scss"]
})
export class ActivityViewTimeInZonesComponent implements OnInit {
  private static readonly CHERRY_PICKED_STREAMS_ORDER: (keyof ActivityStreamsModel)[] = [
    "heartrate",
    "watts",
    "velocity_smooth",
    "cadence",
    "altitude",
    "grade_smooth"
  ];

  @Input()
  public activity: SyncedActivityModel;

  @Input()
  public streams: ActivityStreamsModel;

  @Input()
  public measureSystem: MeasureSystem;

  public sensorTimeInZones: SensorTimeInZones[];

  constructor(
    @Inject(ActivitySensorsService) private readonly activitySensorsService: ActivitySensorsService,
    @Inject(TimeInZonesService) private readonly timeInZonesService: TimeInZonesService
  ) {}

  public ngOnInit(): void {
    // Get sensors data in order
    const sensors = this.activitySensorsService.provideSensors(
      this.activity,
      ActivityViewTimeInZonesComponent.CHERRY_PICKED_STREAMS_ORDER
    );

    // Looping on each sensor definitions to get peaks if available
    this.timeInZonesService.calculate(sensors, this.streams).then((timeInZonesResults: SensorTimeInZones[]) => {
      this.sensorTimeInZones = timeInZonesResults;
    });
  }

  public getGridRowHeight(): number {
    return TimeInZonesChartComponent.CHART_LAYOUT_SPECIFICS.height * 1.25;
  }
}
