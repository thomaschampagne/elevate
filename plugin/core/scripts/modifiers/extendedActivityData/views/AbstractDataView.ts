import * as Chart from "chart.js";
import { LinearTickOptions } from "chart.js";
import * as _ from "lodash";
import { Helper } from "../../../../../common/scripts/Helper";
import { SpeedUnitDataModel, ZoneModel } from "../../../../../common/scripts/models/ActivityData";
import { IAppResources } from "../../../interfaces/IAppResources";

export abstract class AbstractDataView {

	protected units: string;
	protected chart: any;
	protected canvasId: string;
	protected viewTitle: string;
	protected content: string;
	protected grid: JQuery;
	protected hasGraph: boolean;
	protected graph: JQuery;
	protected graphData: any;
	protected graphTitle: string;
	protected mainColor: number[];
	protected table: JQuery;
	protected appResources: IAppResources;
	protected isAuthorOfViewedActivity: boolean;
	protected isSegmentEffortView: boolean;
	protected activityType: string;
	protected speedUnitsData: SpeedUnitDataModel;

	constructor(units?: string) {
		this.content = "";
		this.viewTitle = "";
		this.units = units;
		this.hasGraph = true;
		this.mainColor = [0, 0, 0]; // Default ribbon color is black
		this.canvasId = Helper.guid();
	}

	public abstract render(): void;

	protected abstract insertDataIntoGrid(): void;

	public getContent(): string {
		return this.content;
	}

	public printNumber(value: number, decimals: number): string {
		return (value) ? value.toFixed(decimals) : "-";
	}

	public setIsSegmentEffortView(bool: boolean): void {
		this.isSegmentEffortView = bool;
	}

	public setIsAuthorOfViewedActivity(bool: boolean): void {
		this.isAuthorOfViewedActivity = bool;
	}

	public setGraphTitleFromUnits(): void {
		this.graphTitle = (("" + this.units).toUpperCase() + " distribution in minutes");
	}

	public setActivityType(type: string): void {
		this.activityType = type;
	}

	public setAppResources(appResources: IAppResources): void {
		this.appResources = appResources;
	}

	protected generateSectionTitle(title: string): string {
		return "<h2 style='background-color: rgb(" + this.mainColor[0] + ", " + this.mainColor[1] + ", " + this.mainColor[2] + "); color: white; margin-top: 10px; padding-bottom: 20px; padding-top: 20px;'><span style='padding-left: 10px;'>" + title + "</span></h2>";
	}

	protected generateCanvasForGraph(): void {

		if (!this.units) {
			console.error("View must have unit");
			return;
		}

		let graphWidth: number = window.innerWidth * 0.4;
		const screenRatio: number = window.innerWidth / window.innerHeight;

		// Apply bigger graph width if screen over 4/3...
		if (screenRatio - 0.1 > (4 / 3)) {
			graphWidth = graphWidth * 1.3;
		}

		let htmlCanvas: string = "";
		htmlCanvas += "<div>";
		htmlCanvas += "<div>";
		htmlCanvas += "<canvas id=\"" + this.canvasId + "\" height=\"450\" width=\"" + graphWidth + "\"></canvas>";
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
			const label: string = "Z" + (parseInt(zone) + 1) + " " + (zones[zone].from * ratio).toFixed(1).replace(".0", "") + " to " + (zones[zone].to * ratio).toFixed(1).replace(".0", "") + " " + this.units;
			labelsData.push(label);
		}

		const distributionArray: string[] = [];
		for (zone in zones) {
			distributionArray.push((zones[zone].s / 60).toFixed(2));
		}

		this.graphData = {
			labels: labelsData,
			datasets: [{
				label: this.graphTitle,
				backgroundColor: "rgba(" + this.mainColor[0] + ", " + this.mainColor[1] + ", " + this.mainColor[2] + ", 0.5)",
				borderColor: "rgba(" + this.mainColor[0] + ", " + this.mainColor[1] + ", " + this.mainColor[2] + ", 1)",
				borderWidth: 1,
				hoverBackgroundColor: "rgba(" + this.mainColor[0] + ", " + this.mainColor[1] + ", " + this.mainColor[2] + ", 0.8)",
				hoverBorderColor: "rgba(" + this.mainColor[0] + ", " + this.mainColor[1] + ", " + this.mainColor[2] + ", 1)",
				data: distributionArray,
			}],
		};
	}

	/**
	 * Push grid, graph and table to content view
	 */
	protected injectToContent() {
		this.content += this.grid.html();
		this.content += this.graph.html();
		this.content += this.table.html();
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
		this.chart = new Chart(canvas.getContext("2d"), {
			type: "bar",
			data: this.graphData,
			options: {
				tooltips: {
					custom: this.customTooltips,
				},
				scales: {
					yAxes: [{
						ticks: {
							beginAtZero: true,
						},
					} as LinearTickOptions],
				},
			},
		});
		this.chart = this.chart.clear();
	}

	protected customTooltips(tooltip: any): void {

		// tooltip will be false if tooltip is not visible or should be hidden
		if (!tooltip || !tooltip.body || !tooltip.body[0] || !tooltip.body[0].lines || !tooltip.body[0].lines[0]) {
			return;
		}

		const lineValue: string = tooltip.body[0].lines[0];

		const timeInMinutes: any = _.first(lineValue.match(/[+-]?\d+(\.\d+)?/g).map((value: string) => {
			return parseFloat(value);
		}));

		tooltip.body[0].lines[0] = "Zone held during " + Helper.secondsToHHMMSS(parseFloat(timeInMinutes) * 60);
	}

	protected setupDistributionTable(zones: ZoneModel[], ratio?: number): void {

		if (!ratio) {
			ratio = 1;
		}

		if (!this.units) {
			console.error("View must have units.");
			return;
		}

		let htmlTable: string = "";
		htmlTable += "<div>";
		htmlTable += "<div style=\"height:500px; overflow:auto;\">";
		htmlTable += "<table class=\"distributionTable\">";

		// Generate htmlTable header
		htmlTable += "<tr>"; // Zone
		htmlTable += "<td>ZONE</td>"; // Zone
		htmlTable += "<td>FROM " + this.units.toUpperCase() + "</td>"; // bpm
		htmlTable += "<td>TO " + this.units.toUpperCase() + "</td>"; // bpm
		htmlTable += "<td>TIME</td>"; // Time
		htmlTable += "<td>% ZONE</td>"; // % in zone
		htmlTable += "</tr>";

		let zoneId: number = 1;
		let zone: any;
		for (zone in zones) {
			htmlTable += "<tr>"; // Zone
			htmlTable += "<td>Z" + zoneId + "</td>"; // Zone
			htmlTable += "<td>" + (zones[zone].from * ratio).toFixed(1) + "</th>"; // %HRR
			htmlTable += "<td>" + (zones[zone].to * ratio).toFixed(1) + "</th>"; // %HRR
			htmlTable += "<td>" + Helper.secondsToHHMMSS(zones[zone].s) + "</td>"; // Time%
			htmlTable += "<td>" + zones[zone].percentDistrib.toFixed(1) + "%</td>"; // % in zone
			htmlTable += "</tr>";
			zoneId++;
		}

		htmlTable += "</table>";
		htmlTable += "</div>";
		htmlTable += "</div>";
		this.table = $(htmlTable);
	}

	protected makeGrid(columns: number, rows: number): void {

		let grid: string = "";
		grid += "<div>";
		grid += "<div class=\"grid\">";
		grid += "<table>";

		for (let i: number = 0; i < rows; i++) {
			grid += "<tr>";
			for (let j: number = 0; j < columns; j++) {
				grid += "<td data-column=\"" + j + "\" data-row=\"" + i + "\">";
				grid += "</td>";
			}
			grid += "</tr>";
		}
		grid += "</table>";
		grid += "</div>";
		grid += "</div>";
		this.grid = $(grid);
	}

	protected insertContentAtGridPosition(columnId: number, rowId: number, data: any, title: string, units: string, userSettingKey: string): void {

		const onClickHtmlBehaviour: string = "onclick='javascript:window.open(\"" + this.appResources.settingsLink + "#/commonSettings?viewOptionHelperId=" + userSettingKey + "\",\"_blank\");'";

		if (this.grid) {
			const content: string = "<span class=\"gridDataContainer\" " + onClickHtmlBehaviour + ">" + data + " <span class=\"gridUnits\">" + units + "</span><br /><span class=\"gridTitle\">" + title + "</span></span>";
			this.grid.find("[data-column=" + columnId + "][data-row=" + rowId + "]").html(content);
		} else {
			console.error("Grid is not initialized");
		}
	}

	/**
	 * @param speed in kph
	 * @return pace in seconds/km, if NaN/Infinite then return -1
	 */
	protected convertSpeedToPace(speed: number): number {
		if (_.isNaN(speed)) {
			return -1;
		}
		return (speed === 0) ? -1 : 1 / speed * 60 * 60;
	}
}
