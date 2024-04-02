import Chart, { ChartPoint, LinearTickOptions } from "chart.js";
import _ from "lodash";
import { Helper } from "../../../helper";
import { AppResourcesModel } from "../../../models/app-resources.model";
import { SpeedUnitDataModel } from "@elevate/shared/models/activity-data/speed-unit-data.model";
import { ZoneModel } from "@elevate/shared/models/zone.model";
import { Time } from "@elevate/shared/tools/time";
import { Peak } from "@elevate/shared/models/sync/activity.model";

type GraphTypes = "histogram" | "scatter-line";

export abstract class AbstractDataView {
  protected units: string;
  protected chart: Chart;
  protected canvasId: string;
  protected viewTitle: string;
  protected content: string;
  protected grid: JQuery;
  protected hasGraph: boolean;
  protected graph: JQuery;
  protected graphData: Chart.ChartData;
  protected graphTitle: string;
  protected mainColor: number[];
  protected table: JQuery;
  protected appResources: AppResourcesModel;
  protected isOwner: boolean;
  protected isSegmentEffortView: boolean;
  protected activityType: string;
  protected speedUnitsData: SpeedUnitDataModel;

  private readonly graphType: GraphTypes;
  private readonly logXAxis: boolean; // Only for scatter plot

  protected constructor(units?: string, graphType?: GraphTypes, logXAxis?: boolean) {
    this.content = "";
    this.viewTitle = "";
    this.units = units;
    this.hasGraph = true;
    this.mainColor = [0, 0, 0]; // Default ribbon color is black
    this.graphType = graphType || "histogram";
    this.logXAxis = logXAxis;
    this.canvasId = Helper.guid();
  }

  public abstract render(): void;

  public getContent(): string {
    return this.content;
  }

  public printNumber(value: number, decimals?: number): string {
    return _.isNumber(value) && !_.isNaN(value) && _.isFinite(value) ? value?.toFixed(decimals || 0) : "-";
  }

  public setIsSegmentEffortView(bool: boolean): void {
    this.isSegmentEffortView = bool;
  }

  public setIsAuthorOfViewedActivity(bool: boolean): void {
    this.isOwner = bool;
  }

  public setGraphTitleFromUnits(): void {
    this.graphTitle = ("" + this.units).toUpperCase() + " distribution in minutes";
  }

  public setActivityType(type: string): void {
    this.activityType = type;
  }

  public setAppResources(appResources: AppResourcesModel): void {
    this.appResources = appResources;
  }

  public displayGraph(): void {
    if (!this.canvasId) {
      console.error("View Id must exist in " + typeof this);
      return;
    }

    if (!this.hasGraph) {
      return;
    }

    // Generating the chart
    const canvas: HTMLCanvasElement = document.getElementById(this.canvasId) as HTMLCanvasElement;
    this.chart = this.graphType === "histogram" ? this.generateHistogram(canvas) : this.generateScatterLinePlot(canvas);
  }

  protected abstract insertDataIntoGrid(): void;

  protected generateSectionTitle(title: string): string {
    return (
      "<h2 style='background-color: rgb(" +
      this.mainColor[0] +
      ", " +
      this.mainColor[1] +
      ", " +
      this.mainColor[2] +
      "); color: white; margin-top: 10px; padding-bottom: 20px; padding-top: 20px;'><span style='padding-left: 10px;'>" +
      title +
      "</span></h2>"
    );
  }

  protected generateCanvasForGraph(): void {
    if (!this.units) {
      console.error("View must have unit");
      return;
    }

    const graphWidth: number = window.innerWidth * 0.45;
    let htmlCanvas = "";
    htmlCanvas += "<div>";
    htmlCanvas += "<div>";
    htmlCanvas += '<canvas id="' + this.canvasId + '" height="450" width="' + graphWidth + '"></canvas>';
    htmlCanvas += "</div>";
    this.graph = $(htmlCanvas);
  }

  protected setupDistributionGraph(zones: ZoneModel[], ratio?: number): void {
    if (!ratio) {
      ratio = 1;
    }

    const labelsData: string[] = [];
    let zone: any;

    for (zone in zones) {
      const label: string =
        "Z" +
        (parseInt(zone, 10) + 1) +
        " " +
        this.printNumber(zones[zone].from * ratio, 1).replace(".0", "") +
        " to " +
        this.printNumber(zones[zone].to * ratio, 1).replace(".0", "") +
        " " +
        this.units;
      labelsData.push(label);
    }

    const distributionArray = zones.map(z => Number(this.printNumber(z.s / 60, 2)));

    this.graphData = {
      labels: labelsData,
      datasets: [
        {
          label: this.graphTitle,
          backgroundColor: "rgba(" + this.mainColor[0] + ", " + this.mainColor[1] + ", " + this.mainColor[2] + ", 0.5)",
          borderColor: "rgba(" + this.mainColor[0] + ", " + this.mainColor[1] + ", " + this.mainColor[2] + ", 1)",
          borderWidth: 1,
          hoverBackgroundColor:
            "rgba(" + this.mainColor[0] + ", " + this.mainColor[1] + ", " + this.mainColor[2] + ", 0.8)",
          hoverBorderColor: "rgba(" + this.mainColor[0] + ", " + this.mainColor[1] + ", " + this.mainColor[2] + ", 1)",
          data: distributionArray
        }
      ]
    };
  }

  protected setupScatterLineGraph(chartPoints: ChartPoint[]): void {
    this.graphData = {
      datasets: [
        {
          label: this.graphTitle,
          backgroundColor: "rgba(" + this.mainColor[0] + ", " + this.mainColor[1] + ", " + this.mainColor[2] + ", 0.5)",
          borderColor: "rgba(" + this.mainColor[0] + ", " + this.mainColor[1] + ", " + this.mainColor[2] + ", 1)",
          borderWidth: 1,
          pointRadius: 0,
          hoverBackgroundColor:
            "rgba(" + this.mainColor[0] + ", " + this.mainColor[1] + ", " + this.mainColor[2] + ", 0.8)",
          hoverBorderColor: "rgba(" + this.mainColor[0] + ", " + this.mainColor[1] + ", " + this.mainColor[2] + ", 1)",
          data: chartPoints,
          fill: false,
          showLine: true
        }
      ]
    };
  }

  /**
   * Push grid, graph and table to content view
   */
  protected injectToContent() {
    this.content += "<div class='content'>";
    this.content += this.grid.html();
    this.content += this.graph.html();
    this.content += this.table.html();
    this.content += "</div>";
  }

  protected customTooltipsForZones(tooltip: any): void {
    // tooltip will be false if tooltip is not visible or should be hidden
    if (!tooltip || !tooltip.body || !tooltip.body[0] || !tooltip.body[0].lines || !tooltip.body[0].lines[0]) {
      return;
    }

    const lineValue: string = tooltip.body[0].lines[0];

    const timeInMinutes: any = _.first(
      lineValue.match(/[+-]?\d+(\.\d+)?/g).map((value: string) => {
        return parseFloat(value);
      })
    );

    tooltip.body[0].lines[0] = "Zone held during " + Time.secToMilitary(parseFloat(timeInMinutes) * 60);
  }

  protected setupPointDataTable(peaks: Peak[]): void {
    if (!this.units) {
      console.error("View must have units.");
      return;
    }

    let htmlTable = "";
    htmlTable += "<div>";
    htmlTable += '<div style="height:500px; overflow:auto;">';
    htmlTable += '<table class="distributionTable">';

    // Generate htmlTable header
    htmlTable += "<tr>";
    htmlTable += "<td>TIME</td>";
    htmlTable += "<td>" + this.units.toUpperCase() + "</td>";
    htmlTable += "</tr>";

    // Table body
    htmlTable += peaks
      .map(p => {
        return (
          "<tr>" +
          "<td>" +
          Time.secToMilitary(p.range) +
          "</td>" + // Time
          "<td>" +
          this.printNumber(p.result, 1) +
          "</td>" + // Value
          "</tr>"
        );
      })
      .join("");

    htmlTable += "</table>";
    htmlTable += "</div>";
    htmlTable += "</div>";
    this.table = $(htmlTable);
  }

  protected setupDistributionTable(zones: ZoneModel[], ratio?: number): void {
    if (!ratio) {
      ratio = 1;
    }

    if (!this.units) {
      console.error("View must have units.");
      return;
    }

    let htmlTable = "";
    htmlTable += "<div>";
    htmlTable += '<div style="height:500px; overflow:auto;">';
    htmlTable += '<table class="distributionTable">';

    // Generate htmlTable header
    htmlTable += "<tr>"; // Zone
    htmlTable += "<td>ZONE</td>"; // Zone
    htmlTable += "<td>FROM " + this.units.toUpperCase() + "</td>"; // bpm
    htmlTable += "<td>TO " + this.units.toUpperCase() + "</td>"; // bpm
    htmlTable += "<td>TIME</td>"; // Time
    htmlTable += "<td>% ZONE</td>"; // % in zone
    htmlTable += "</tr>";

    let zoneId = 1;
    let zone: any;
    for (zone in zones) {
      htmlTable += "<tr>"; // Zone
      htmlTable += "<td>Z" + zoneId + "</td>"; // Zone
      htmlTable += "<td>" + this.printNumber(zones[zone].from * ratio, 1) + "</th>"; // %HRR
      htmlTable += "<td>" + this.printNumber(zones[zone].to * ratio, 1) + "</th>"; // %HRR
      htmlTable += "<td>" + Time.secToMilitary(zones[zone].s) + "</td>"; // Time%
      htmlTable += "<td>" + this.printNumber(zones[zone].percent, 1) + "%</td>"; // % in zone
      htmlTable += "</tr>";
      zoneId++;
    }

    htmlTable += "</table>";
    htmlTable += "</div>";
    htmlTable += "</div>";
    this.table = $(htmlTable);
  }

  protected makeGrid(columns: number, rows: number): void {
    let grid = "";
    grid += "<div>";
    grid += '<div class="grid">';
    grid += "<table>";

    for (let i = 0; i < rows; i++) {
      grid += "<tr>";
      for (let j = 0; j < columns; j++) {
        grid += '<td data-column="' + j + '" data-row="' + i + '">';
        grid += "</td>";
      }
      grid += "</tr>";
    }
    grid += "</table>";
    grid += "</div>";
    grid += "</div>";
    this.grid = $(grid);
  }

  protected insertContentAtGridPosition(
    columnId: number,
    rowId: number,
    data: any,
    title: string,
    units: string,
    userSettingKey: string
  ): void {
    const onClickHtmlBehaviour: string =
      "onclick='javascript:window.open(\"" +
      this.appResources.settingsLink +
      "#/globalSettings?viewOptionHelperId=" +
      userSettingKey +
      '","_blank");\'';

    if (this.grid) {
      const content: string =
        '<span class="gridDataContainer" ' +
        onClickHtmlBehaviour +
        ">" +
        data +
        ' <span class="gridUnits">' +
        units +
        '</span><br /><span class="gridTitle">' +
        title +
        "</span></span>";
      this.grid.find("[data-column=" + columnId + "][data-row=" + rowId + "]").html(content);
    } else {
      console.error("Grid is not initialized");
    }
  }

  private generateHistogram(canvas: HTMLCanvasElement) {
    return new Chart(canvas.getContext("2d"), {
      type: "bar",
      data: this.graphData,
      options: {
        tooltips: {
          custom: this.customTooltipsForZones
        },
        scales: {
          yAxes: [
            {
              ticks: {
                beginAtZero: true
              }
            } as LinearTickOptions
          ]
        }
      }
    });
  }

  private generateScatterLinePlot(canvas: HTMLCanvasElement) {
    const maxXData = _.max(this.graphData.datasets.map(d => _.max((d.data as Chart.ChartPoint[]).map(p => p.x)))) || 1;

    return new Chart(canvas.getContext("2d"), {
      type: "scatter",
      data: this.graphData,
      options: {
        hover: {
          intersect: false,
          mode: "nearest"
        },
        tooltips: {
          intersect: false,
          mode: "nearest",
          callbacks: {
            label: item =>
              this.printNumber(Number(item.yLabel), 1) +
              this.units +
              " held during " +
              Time.secToMilitary(Number(item.xLabel))
          }
        },
        scales: {
          xAxes: [
            {
              type: this.logXAxis ? "logarithmic" : "linear",
              ticks: {
                min: 0,
                max: maxXData,
                callback: (tick: number) => {
                  const remain = tick / Math.pow(10, Math.floor(Math.log10(tick)));
                  if (remain === 1 || remain === 2 || remain === 5) {
                    return Time.secToMilitary(tick);
                  }
                  return "";
                }
              }
            }
          ]
        }
      }
    });
  }
}
