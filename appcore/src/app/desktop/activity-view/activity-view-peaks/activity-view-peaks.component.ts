import { Component, Inject, Input, OnInit } from "@angular/core";
import _ from "lodash";
import { Sensor } from "../shared/models/sensors/sensor.model";
import { PeakChartComponent } from "./peak-chart/peak-chart.component";
import { ActivitySensorsService } from "../shared/activity-sensors.service";
import { Activity, Peak } from "@elevate/shared/models/sync/activity.model";
import { MeasureSystem } from "@elevate/shared/enums/measure-system.enum";
import { Streams } from "@elevate/shared/models/activity-data/streams.model";

interface PeaksResult {
  sensor: Sensor;
  peaks: Peak[];
}

@Component({
  selector: "app-activity-view-peaks",
  templateUrl: "./activity-view-peaks.component.html",
  styleUrls: ["./activity-view-peaks.component.scss"]
})
export class ActivityViewPeaksComponent implements OnInit {
  private static readonly CHERRY_PICKED_STREAMS_ORDER: (keyof Streams)[] = [
    "watts",
    "heartrate",
    "velocity_smooth",
    "cadence",
    "grade_smooth"
  ];

  public peaksResults: PeaksResult[];

  @Input()
  public activity: Activity;

  @Input()
  public measureSystem: MeasureSystem;

  constructor(@Inject(ActivitySensorsService) private readonly activitySensorsService: ActivitySensorsService) {
    this.peaksResults = [];
  }

  public ngOnInit(): void {
    // Get sensors data in order (for peaks we want watts first)
    const sensors = this.activitySensorsService.provideSensors(
      this.activity,
      ActivityViewPeaksComponent.CHERRY_PICKED_STREAMS_ORDER
    );

    // Looping on each sensor definitions to get peaks if available
    sensors.forEach(sensor => {
      if (sensor.peaksPath) {
        const peaks: Peak[] = _.get(this.activity.stats, sensor.peaksPath);
        if (peaks) {
          this.peaksResults.push({ sensor: sensor, peaks: peaks });
        }
      }
    });
  }

  public getGridRowHeight(): number {
    return PeakChartComponent.CHART_LAYOUT_SPECIFICS.height * 1.25;
  }
}
