import { ChangeDetectorRef, Component, Inject, Input, OnInit } from "@angular/core";
import { AxisType, Datum, Layout, LayoutAxis, PlotMouseEvent, PlotRelayoutEvent } from "plotly.js";
import _ from "lodash";
import moment from "moment";
import { Sensor } from "../shared/models/sensors/sensor.model";
import { BaseChartComponent } from "../shared/base-chart.component";
import { ScatterChart } from "../shared/models/plot-chart.model";
import { ActivityViewService } from "../shared/activity-view.service";
import { AppService } from "../../../shared/services/app-service/app.service";
import { PlotlyService } from "angular-plotly.js";
import { GradeAdjustedPaceSensor, PaceSensor } from "../shared/models/sensors/move.sensor";
import { ActivitySensorsService } from "../shared/activity-sensors.service";
import { environment } from "../../../../environments/environment";
import { Streams } from "@elevate/shared/models/activity-data/streams.model";
import { MeasureSystem } from "@elevate/shared/enums/measure-system.enum";
import { Constant } from "@elevate/shared/constants/constant";
import { ElevateException } from "@elevate/shared/exceptions/elevate.exception";
import { Activity } from "@elevate/shared/models/sync/activity.model";
import { ElevationSensor, ElevationAscentSpeedSensor } from "../shared/models/sensors/elevation.sensor";

enum ScaleMode {
  TIME,
  DISTANCE
}

@Component({
  selector: "app-activity-graph-chart",
  templateUrl: "./activity-graph-chart.component.html",
  styleUrls: ["./activity-graph-chart.component.scss"]
})
export class ActivityGraphChartComponent extends BaseChartComponent<ScatterChart> implements OnInit {
  private static readonly CHERRY_PICKED_STREAMS: (keyof Streams)[] = [
    "altitude",
    "velocity_smooth",
    "heartrate",
    "watts",
    "cadence",
    "grade_adjusted_speed",
    "ascent_speed"
  ];

  private static readonly AREA_FILL_SENSOR_NAME: string[] = [ElevationSensor.NAME];

  private static readonly DEBUG_STREAMS: (keyof Streams)[] = ["grade_smooth", "watts_calc"];

  private static readonly PER_SENSOR_LAYOUT_SPECIFICS = new Map<string, Partial<Layout>>([
    [
      PaceSensor.NAME,
      {
        yaxis: {
          autorange: "reversed",
          type: "date",
          tickformat: "%M:%S",
          hoverformat: null
        }
      }
    ],
    [
      GradeAdjustedPaceSensor.NAME,
      {
        yaxis: {
          autorange: "reversed",
          type: "date",
          tickformat: "%M:%S",
          hoverformat: null
        }
      }
    ]
  ]);

  private static readonly DEFAULT_SCALE_MODE: ScaleMode = ScaleMode.DISTANCE;
  private static readonly YAXIS_RANGE_MARGIN: number = 5;
  private static readonly YAXIS_TICK_FONT: number = 11;
  private static readonly WINDOW_SCALED_YAXIS_PADDING_FACTOR: number = 45;
  private static readonly DEFAULT_SENSOR_COUNT_DISPLAYED: number = 3;
  private static readonly CHART_LAYOUT_SPECIFICS: Partial<Layout> = {
    legend: { orientation: "h" },
    height: 350,
    margin: { r: 10, l: 60, t: 5, b: 0 }
  };

  @Input()
  public activity: Activity;

  @Input()
  public streams: Streams;

  @Input()
  public measureSystem: MeasureSystem;

  public readonly ScaleMode = ScaleMode;

  public scaleMode: ScaleMode;

  public isZooming: boolean;

  public hasDistance: boolean;

  private availableSensors: Sensor[];

  constructor(
    @Inject(ActivityViewService) private readonly activityViewService: ActivityViewService,
    @Inject(ActivitySensorsService) private readonly activitySensorsService: ActivitySensorsService,
    @Inject(AppService) protected readonly appService: AppService,
    @Inject(PlotlyService) protected readonly plotlyService: PlotlyService,
    @Inject(ChangeDetectorRef) private readonly changeDetectorRef: ChangeDetectorRef
  ) {
    super(appService, plotlyService);
    this.isZooming = false;

    // Add referenced debug streams for debugging activities while in development mode
    if (environment.showActivityDebugData) {
      ActivityGraphChartComponent.DEBUG_STREAMS.forEach(stream => {
        if (ActivityGraphChartComponent.CHERRY_PICKED_STREAMS.indexOf(stream) === -1) {
          ActivityGraphChartComponent.CHERRY_PICKED_STREAMS.push(stream);
        }
      });
    }
  }

  public createChart(): ScatterChart {
    return new ScatterChart(_.cloneDeep(ActivityGraphChartComponent.CHART_LAYOUT_SPECIFICS));
  }

  public ngOnInit(): void {
    this.hasDistance = !_.isEmpty(this.streams.distance);

    this.updateScaleMode(ActivityGraphChartComponent.DEFAULT_SCALE_MODE, this.hasDistance);

    // Filter available sensors for current activity base on his streams content
    this.availableSensors = this.filterAvailableSensors(
      this.streams,
      ActivityGraphChartComponent.CHERRY_PICKED_STREAMS
    );

    this.updateActivityGraph();
  }

  private updateActivityGraph(): void {
    // Clear existing traces data if exists
    this.chart.clear();

    // Add traces data to scatter chart from every available sensors
    this.addTracesFromAvailableSensors();

    // Inject every sensor data in scatter chart
    this.populateTracesDataOnScaledStream(this.getActiveScaleStream());

    // Y/X Axis configuration
    this.configureAxis();
  }

  private getActiveScaleStream(): number[] {
    return this.scaleMode === ScaleMode.TIME ? this.streams.time : this.streams.distance;
  }

  private updateScaleMode(target: ScaleMode, hasDistance: boolean): void {
    this.scaleMode = hasDistance ? target : ScaleMode.TIME;
  }

  /**
   * Filter available sensors for current activity base on his streams content
   */
  private filterAvailableSensors(streams: Streams, cherryPickStreams: (keyof Streams)[]): Sensor[] {
    const sensors = this.activitySensorsService.provideSensors(this.activity, cherryPickStreams);

    const availableSensors = [];
    // Looping on each sensor definitions
    for (const sensor of sensors) {
      // If sensor data exists in streams
      if (streams[sensor.streamKey] && streams[sensor.streamKey].length > 0) {
        availableSensors.push(sensor);
      }
    }

    return availableSensors;
  }

  /**
   * Add traces data to scatter chart from every available sensors
   */
  private addTracesFromAvailableSensors(): void {
    // For every available sensors on current activity
    for (const [index, sensor] of this.availableSensors.entries()) {
      const hasAreaFill = ActivityGraphChartComponent.AREA_FILL_SENSOR_NAME.indexOf(sensor.name) !== -1;

      // create trace on scatter chart
      const addedTrace = this.chart.addTrace(
        index + 1,
        sensor,
        {
          color: sensor.color,
          shape: "spline",
          width: 1.25,
          simplify: true
        },
        hasAreaFill ? sensor.areaColor : null
      );

      // Automatically hide traces when DEFAULT_SENSOR_COUNT_DISPLAYED are displayed
      addedTrace.visible = index < ActivityGraphChartComponent.DEFAULT_SENSOR_COUNT_DISPLAYED ? true : "legendonly";
    }
  }

  /**
   * Fill up with data every traces data (matching available sensors) base on time or distance
   */
  private populateTracesDataOnScaledStream(scaleStream: number[]): void {
    // Populate each plot-data with data from their related stream
    // Use time or distance as base scale

    if (!scaleStream) {
      return;
    }

    scaleStream.forEach((scaleValue: number, index: number) => {
      // Set x value along scale mode type
      let xValue: Datum | number;
      if (this.scaleMode === ScaleMode.TIME) {
        // Time
        xValue = moment().startOf("day").add(scaleValue, "seconds").toDate();
      } else {
        // Distance, convert m/s to km or mi
        xValue = (scaleValue / 1000) * (this.measureSystem === MeasureSystem.IMPERIAL ? Constant.KM_TO_MILE_FACTOR : 1);
      }

      // Check if representation is based on date
      // Looping on each sensor definitions
      for (const sensor of this.availableSensors) {
        // Retrieve trace data from sensor def name
        const traceData = this.chart.getTraceData(sensor.name);

        // Foreach sensor add x axis formatted time or distance
        (traceData.x as (Datum | number)[]).push(xValue);

        // Foreach sensor add y axis value
        const sensorStream = this.streams[sensor.streamKey] as number[];
        const yValue = sensor.fromStreamConvert(sensorStream[index], this.measureSystem);

        // Test y-axis type
        const sensorLayoutSpecifics = ActivityGraphChartComponent.PER_SENSOR_LAYOUT_SPECIFICS.get(sensor.name);
        const isYValueDate = sensorLayoutSpecifics?.yaxis?.type === "date";

        // y-axis ticks: Test if date representation
        if (isYValueDate) {
          // Yes inject date as y value
          (traceData.y as Datum[]).push(moment().startOf("day").add(yValue, "seconds").toDate());
        } else {
          // Else it's a classic linear value, pass result as-is
          (traceData.y as Array<number>).push(yValue);
        }
      }
    });
  }

  /**
   * Configure X-axis and all multi Y-axis (position l/R, color, etc...) on a given chart, activity sensors & scale mode
   */
  private configureAxis(): void {
    // Calculate the left/right graph margin and yAxis step padding for multi yAxis placement purpose
    const { domainMarginLeft, domainMarginRight, yAxisPadding } = this.calculateMultiYAxisPosition(
      this.availableSensors
    );

    const isScaledOnTime = this.scaleMode === ScaleMode.TIME;
    let type: AxisType;
    let tickformat: string;
    let ticksuffix: string;
    let hoverformat: string;

    if (isScaledOnTime) {
      type = "date";
      tickformat = "%H:%M:%S";
      ticksuffix = "";
      hoverformat = "%H:%M:%S";
    } else {
      // Distance
      type = "linear";
      tickformat = "";
      ticksuffix = this.measureSystem === MeasureSystem.METRIC ? "km" : "mi";
      hoverformat = ".2f";
    }

    // Configure x-axis
    this.chart.layout.xaxis = _.merge(this.chart.layout.xaxis, {
      zeroline: false,
      type: type,
      tickformat: tickformat,
      ticksuffix: ticksuffix,
      hoverformat: hoverformat,
      domain: [domainMarginLeft, 1 - domainMarginRight]
    });

    // Loop on sensors definition to create multi y-axis
    for (const [index, sensor] of this.availableSensors.entries()) {
      const yAxisIndex = `yaxis${index > 0 ? index + 1 : ""}`;

      // Set y-axis alternatively on left or right side of graph (in the domain margin)
      const yAxisPosition = index % 2 ? 1 - index * yAxisPadding : index * yAxisPadding;

      // Find the y-axis range for the current stream (base on min & max)
      const currentStream = this.streams[sensor.streamKey] as number[];
      const minStreamValue = sensor.fromStreamConvert(_.min(currentStream), this.measureSystem);
      const maxStreamValue = sensor.fromStreamConvert(_.max(currentStream), this.measureSystem);
      const yAxisRange = [
        minStreamValue - ActivityGraphChartComponent.YAXIS_RANGE_MARGIN,
        maxStreamValue + ActivityGraphChartComponent.YAXIS_RANGE_MARGIN
      ];

      // Getting the unit (with measure system specific support)
      const unit = sensor.getDisplayUnit(this.measureSystem);

      // Then configure Y-axis
      this.chart.layout[yAxisIndex] = {
        gridcolor: this.chart.layout.yaxis.gridcolor, // Make sure to pass themed y-axis color to others y-axis(N)... Can be improved..
        title: sensor.name,
        ticksuffix: ` ${unit}`,
        titlefont: { color: sensor.color, size: ActivityGraphChartComponent.YAXIS_TICK_FONT },
        tickfont: { color: sensor.color, size: ActivityGraphChartComponent.YAXIS_TICK_FONT },
        showgrid: index === 0, // Show only grid for first sensor
        fixedrange: true, // Allow selection on x-axis only
        position: yAxisPosition,
        hoverformat: `.${sensor.defaultRoundDecimals}f`,
        zeroline: false,
        range: yAxisRange
      } as Partial<LayoutAxis>;

      // Check for y-axis layout specifics. If exists merge them into current y-axis layout
      const sensorLayoutSpecifics = ActivityGraphChartComponent.PER_SENSOR_LAYOUT_SPECIFICS.get(sensor.name);
      if (sensorLayoutSpecifics) {
        this.chart.layout[yAxisIndex] = _.merge(this.chart.layout[yAxisIndex], sensorLayoutSpecifics.yaxis);
      }

      // As post-configuration, declare all y-axis (except first one) being over first y-axis
      if (index > 0) {
        this.chart.layout[yAxisIndex].overlaying = "y";
      }
    }
  }

  /**
   * Calculate the left/right graph margin and yAxis step padding for multi yAxis placement purpose
   */
  private calculateMultiYAxisPosition(availableSensors: Sensor[]): {
    domainMarginLeft: number;
    domainMarginRight: number;
    yAxisPadding: number;
  } {
    // Calculate y-axis padding value for 1 yAxis from window width
    const yAxisPadding = (1 / window.innerWidth) * ActivityGraphChartComponent.WINDOW_SCALED_YAXIS_PADDING_FACTOR;

    // Count expected yAxis on left and right side
    const leftAxisCount = Math.ceil(availableSensors.length / 2);
    const rightAxisCount = availableSensors.length - leftAxisCount;

    // Calculate final margin domain left and right
    // Both have a specific applied factor to place them properly on their side
    const domainMarginLeft = yAxisPadding * leftAxisCount * (leftAxisCount > 1 ? 1.5 : 1);
    const domainMarginRight = yAxisPadding * rightAxisCount * 2.3;

    return {
      domainMarginLeft: domainMarginLeft,
      domainMarginRight: domainMarginRight,
      yAxisPadding: yAxisPadding
    };
  }

  /**
   * Toggle scale mode and update graph
   */
  public onToggleScaleMode(): void {
    this.scaleMode = this.scaleMode === ScaleMode.TIME ? ScaleMode.DISTANCE : ScaleMode.TIME;

    // Reset zoom
    this.resetZoom();

    // Update chart
    this.updateActivityGraph();
  }

  public onHover(mouseEvent: PlotMouseEvent): void {
    const hoverIndex = mouseEvent.points[0].pointIndex;
    this.activityViewService.graphMouseOverIndex$.next(hoverIndex);
  }

  public onUnHover(): void {
    this.activityViewService.graphMouseOverIndex$.next(false);
  }

  public toZoomRangeIndexes(zoomRangeFrom: number | string, zoomRangeTo: number | string): number[] | null {
    if (!this.chart.data[0] || !this.chart.data[0].x || this.chart.data[0].x.length === 0) {
      return null;
    }

    let fromIndex = null;
    let toIndex = null;

    const xAxisArray = this.chart.data[0].x;

    // Test if range is type number
    if (Number.isFinite(zoomRangeFrom) && Number.isFinite(zoomRangeTo)) {
      for (const [index, xAxisValue] of xAxisArray.entries()) {
        if (fromIndex === null && xAxisValue >= zoomRangeFrom) {
          fromIndex = index;
        }

        if (toIndex === null && xAxisValue >= zoomRangeTo) {
          toIndex = index;
        }

        if (fromIndex !== null && toIndex !== null) {
          break;
        }
      }
    }

    // Test if range is type string (it a date)
    if (typeof zoomRangeFrom === "string" && typeof zoomRangeTo === "string") {
      // Ensure short date string are properly formatted to full length (append 00:00:00 if required)
      zoomRangeFrom = _.padEnd(zoomRangeFrom, 19, " 00:00:00");
      zoomRangeTo = _.padEnd(zoomRangeTo, 19, " 00:00:00");

      for (const [index, xAxisValue] of xAxisArray.entries()) {
        if (fromIndex === null && xAxisValue >= new Date(zoomRangeFrom)) {
          fromIndex = index;
        }

        if (toIndex === null && xAxisValue >= new Date(zoomRangeTo)) {
          toIndex = index;
        }

        if (fromIndex !== null && toIndex !== null) {
          break;
        }
      }
    }

    if (fromIndex === null || toIndex === null || fromIndex > toIndex) {
      return null;
    }

    if (fromIndex === toIndex) {
      if (xAxisArray[fromIndex - 1]) {
        return [fromIndex - 1, toIndex];
      }

      if (xAxisArray[toIndex + 1]) {
        return [fromIndex, toIndex + 1];
      }
    }

    if (fromIndex < toIndex) {
      return [fromIndex, toIndex];
    }

    return null;
  }

  public onReLayout(plotReLayoutEvent: PlotRelayoutEvent): void {
    // Reconfigure axis when chart resized (e.g. by window resize)
    if (plotReLayoutEvent.autosize) {
      this.configureAxis();
      return;
    }

    // Detect zoom in graph from start/end zoom indexes
    const zoomIndexes = this.toZoomRangeIndexes(
      plotReLayoutEvent["xaxis.range[0]"],
      plotReLayoutEvent["xaxis.range[1]"]
    );

    if (!zoomIndexes) {
      // Invalid zoom indexes
      this.forceResetZoom();
    } else if (zoomIndexes.length === 2) {
      this.isZooming = true;

      // User zoomed. indexes are available
      // Lock zoom if max zoom has been reached
      const maxZoomReached = Math.abs(zoomIndexes[0] - zoomIndexes[1]) === 1;
      if (maxZoomReached) {
        this.lockUserZoom();
        this.redraw();
      }
    } else {
      throw new ElevateException("Failed to handle zoom in activity graph");
    }

    // Force angular to detect changes
    this.changeDetectorRef.detectChanges();

    // Notify bounds selected on zoom
    this.activityViewService.selectedGraphBounds$.next(zoomIndexes);
  }

  public onLegendClick(): void {
    // Ensure axis stay configured when toggle scatters from legend clicks
    this.configureAxis();
  }

  public forceResetZoom(): void {
    this.resetZoom();
    this.redraw();
  }

  public onUserResetZoom(): void {
    this.forceResetZoom();
  }

  private resetZoom(): void {
    this.chart.layout.xaxis.autorange = true; // Reset zoom
    this.unLockUserZoom();
    this.isZooming = false;
    this.activityViewService.selectedGraphBounds$.next(null);
  }

  private lockUserZoom(): void {
    this.chart.layout.xaxis.fixedrange = true;
  }

  private unLockUserZoom(): void {
    this.chart.layout.xaxis.fixedrange = false;
  }

  public onGraphClick(plotMouseEvent: PlotMouseEvent): void {}
}
