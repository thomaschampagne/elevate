import { Component, Inject, Input, OnInit } from "@angular/core";
import { LogChart } from "../../shared/models/plot-chart.model";
import { Sensor } from "../../shared/models/sensors/sensor.model";
import { BaseChartComponent } from "../../shared/base-chart.component";
import { Datum, Layout, PlotMouseEvent } from "plotly.js";
import _ from "lodash";
import moment from "moment";
import { AppService } from "../../../../shared/services/app-service/app.service";
import { PlotlyService } from "angular-plotly.js";
import { PaceSensor } from "../../shared/models/sensors/move.sensor";
import { GradeSensor } from "../../shared/models/sensors/grade.sensor";
import { Peak } from "@elevate/shared/models/sync/activity.model";
import { MeasureSystem } from "@elevate/shared/enums/measure-system.enum";
import { ActivityViewService } from "../../shared/activity-view.service";

@Component({
  selector: "app-peak-chart",
  templateUrl: "./peak-chart.component.html",
  styleUrls: ["./peak-chart.component.scss"]
})
export class PeakChartComponent extends BaseChartComponent<LogChart> implements OnInit {
  private static readonly TIME_TICKS: number[] = [
    1,
    2,
    5,
    10,
    60,
    2 * 60,
    5 * 60,
    10 * 60,
    20 * 60,
    30 * 60,
    60 * 60,
    2 * 60 * 60,
    3 * 60 * 60,
    4 * 60 * 60
  ];

  public static readonly CHART_LAYOUT_SPECIFICS: Partial<Layout> = {
    height: 300,
    margin: {
      t: 20,
      b: 60,
      l: 70,
      r: 20
    },
    xaxis: {
      tickmode: "array",
      tickvals: PeakChartComponent.TIME_TICKS,
      ticktext: [],
      ticksuffix: "s"
    },
    yaxis: {
      hoverformat: ".0f"
    }
  };

  private static readonly PER_SENSOR_LAYOUT_SPECIFICS = new Map<string, Partial<Layout>>([
    [
      PaceSensor.NAME,
      {
        yaxis: {
          autorange: "reversed",
          type: "date",
          tickformat: "%M:%S",
          hoverformat: "%M:%S"
        }
      }
    ],
    [
      GradeSensor.NAME,
      {
        yaxis: {
          hoverformat: ".1f"
        }
      }
    ]
  ]);

  @Input()
  public sensor: Sensor;

  @Input()
  public peaks: Peak[];

  @Input()
  public measureSystem: MeasureSystem;

  constructor(
    @Inject(AppService) protected readonly appService: AppService,
    @Inject(ActivityViewService) private readonly activityViewService: ActivityViewService,
    @Inject(PlotlyService) protected readonly plotlyService: PlotlyService
  ) {
    super(appService, plotlyService);
  }

  public createChart(): LogChart {
    // Define peak layout chart attributes
    return new LogChart(_.cloneDeep(PeakChartComponent.CHART_LAYOUT_SPECIFICS));
  }

  public ngOnInit(): void {
    const trace = this.chart.addTrace(
      1,
      this.sensor,
      {
        color: this.sensor.color,
        shape: "spline",
        width: 1.25
      },
      this.sensor.areaColor
    );

    // Getting the unit (with measure system specific support)
    const unit = this.sensor.getDisplayUnit(this.measureSystem);
    this.chart.layout.yaxis.ticksuffix = ` ${unit}`;

    // Set y-axis title
    this.chart.layout.yaxis.title = this.sensor.name;

    // Check for y-axis layout specifics. If exists merge them into current y-axis layout
    const sensorLayoutSpecifics = PeakChartComponent.PER_SENSOR_LAYOUT_SPECIFICS.get(this.sensor.name);
    if (sensorLayoutSpecifics) {
      this.chart.layout = _.merge(this.chart.layout, sensorLayoutSpecifics);
    }

    // Check if representation is based on date
    const isYValueDate = this.chart.layout.yaxis.type === "date";

    this.peaks.forEach(peak => {
      // x-axis ticks: If range is registered in tick to display then convert/add it to tick text array
      if (PeakChartComponent.TIME_TICKS.indexOf(peak.range) !== -1) {
        let text: string;
        if (peak.range < 60) {
          // Under minute
          text = `${peak.range}s`;
        } else if (peak.range < 60 * 60) {
          // Under hour
          text = `${peak.range / 60}m`;
        } else {
          text = `${peak.range / 3600}h`;
        }
        this.chart.layout.xaxis.ticktext.push(text);
      }
      (trace.x as Datum[]).push(peak.range);

      const yValue = this.sensor.fromStreamConvert(peak.result, this.measureSystem);

      // y-axis ticks: Test if date representation
      if (isYValueDate) {
        // Yes inject date as y value
        (trace.y as Datum[]).push(moment().startOf("day").add(yValue, "seconds").toDate());
      } else {
        // Else it's a classic linear value, pass result as-is
        (trace.y as number[]).push(yValue);
      }
    });
  }

  public onGraphClick(plotMouseEvent: PlotMouseEvent): void {
    const clickedPeak = this.peaks.find(peak => peak.range === plotMouseEvent.points[0].x);

    if (clickedPeak && clickedPeak.end - clickedPeak.start > 1) {
      this.activityViewService.selectedGraphBounds$.next([clickedPeak.start, clickedPeak.end]);
    }
  }
}
