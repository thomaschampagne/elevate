import { Component, Inject, Input, OnInit } from "@angular/core";
import { ActivityStreamsModel, AnalysisDataModel, PeakModel, SyncedActivityModel } from "@elevate/shared/models";
import _ from "lodash";
import { Sensor } from "../shared/models/sensors/sensor.model";
import { MeasureSystem } from "@elevate/shared/enums";
import { PeakChartComponent } from "./peak-chart/peak-chart.component";
import { ActivitySensorsService } from "../shared/activity-sensors.service";

interface PeaksResult {
  sensor: Sensor;
  peaks: PeakModel[];
}

@Component({
  selector: "app-activity-view-peaks",
  templateUrl: "./activity-view-peaks.component.html",
  styleUrls: ["./activity-view-peaks.component.scss"]
})
export class ActivityViewPeaksComponent implements OnInit {
  private static readonly CHERRY_PICKED_STREAMS_ORDER: (keyof ActivityStreamsModel)[] = [
    "watts",
    "heartrate",
    "velocity_smooth",
    "cadence",
    "grade_smooth"
  ];

  public peaksResults: PeaksResult[];

  @Input()
  public activity: SyncedActivityModel;

  @Input()
  public analysisData: AnalysisDataModel;

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
        const peaks: PeakModel[] = _.get(this.analysisData, sensor.peaksPath);
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
