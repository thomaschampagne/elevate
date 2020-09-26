import { Component, Inject, Input, OnInit } from "@angular/core";
import { BaseChartComponent } from "../../shared/base-chart.component";
import { Sensor } from "../../shared/models/sensors/sensor.model";
import { BarsChart } from "../../shared/models/plot-chart.model";
import { Datum, Layout } from "plotly.js";
import _ from "lodash";
import { MeasureSystem } from "@elevate/shared/enums";
import { ZoneModel } from "@elevate/shared/models";
import moment from "moment";
import { AppService } from "../../../../shared/services/app-service/app.service";
import { PlotlyService } from "angular-plotly.js";
import { PaceSensor } from "../../shared/models/sensors/move.sensor";

@Component({
  selector: "app-time-in-zones-chart",
  templateUrl: "./time-in-zones-chart.component.html",
  styleUrls: ["./time-in-zones-chart.component.scss"]
})
export class TimeInZonesChartComponent extends BaseChartComponent<BarsChart> implements OnInit {
  public static readonly CHART_LAYOUT_SPECIFICS: Partial<Layout> = {
    height: 300,
    margin: {
      t: 30,
      b: 100,
      l: 60,
      r: 20
    },
    yaxis: {
      title: "Time",
      tickangle: 45
    },
    xaxis: {
      tickangle: -45,
      tickmode: "array",
      ticktext: [],
      tickvals: []
    }
  };

  private static readonly PER_SENSOR_LAYOUT_SPECIFICS = new Map<string, Partial<Layout>>([
    [
      PaceSensor.NAME,
      {
        xaxis: {
          autorange: "reversed"
        }
      }
    ]
  ]);

  @Input()
  public sensor: Sensor;

  @Input()
  public zones: ZoneModel[];

  @Input()
  public measureSystem: MeasureSystem;

  constructor(
    @Inject(AppService) protected readonly appService: AppService,
    @Inject(PlotlyService) protected readonly plotlyService: PlotlyService
  ) {
    super(appService, plotlyService);
  }

  public createChart(): BarsChart {
    return new BarsChart(_.cloneDeep(TimeInZonesChartComponent.CHART_LAYOUT_SPECIFICS));
  }

  public ngOnInit(): void {
    const barsData = this.chart.addBarsData(this.sensor.name, {
      color: this.sensor.color,
      opacity: 0.7,
      line: {
        color: "black",
        width: 1
      }
    });

    // Check for y-axis layout specifics. If exists merge them into current y-axis layout
    const sensorLayoutSpecifics = TimeInZonesChartComponent.PER_SENSOR_LAYOUT_SPECIFICS.get(this.sensor.name);
    if (sensorLayoutSpecifics) {
      this.chart.layout = _.merge(this.chart.layout, sensorLayoutSpecifics);
    }

    this.zones.forEach((zone: ZoneModel, index: number) => {
      // Handle x-value
      (barsData.x as number[]).push(index);
      this.chart.layout.xaxis.tickvals.push(index);

      const zoneFrom = this.sensor.displayZoneBoundValue(
        this.sensor.fromZoneBoundConvert(zone.from, this.measureSystem)
      );
      const zoneTo = this.sensor.displayZoneBoundValue(this.sensor.fromZoneBoundConvert(zone.to, this.measureSystem));
      this.chart.layout.xaxis.ticktext.push(
        `Z${index + 1} ${zoneFrom}-${zoneTo} ${this.sensor.getDisplayUnit(this.measureSystem)}`
      );

      // Handle y-value
      (barsData.y as Datum[]).push(zone.s > 0 ? moment().startOf("day").add(zone.s, "seconds").toDate() : null);
    });
  }
}
