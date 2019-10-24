import * as _ from "lodash";
import { Helper } from "../../../helper";
import { AbstractDataView } from "./abstract-data.view";
import { AthleteSnapshotModel, HeartRateDataModel } from "@elevate/shared/models";

export class HeartRateDataView extends AbstractDataView {

	public static instance: HeartRateDataView = null;

	protected heartRateData: HeartRateDataModel;
	protected athleteSnapshot: AthleteSnapshotModel;

	constructor(heartRateData: HeartRateDataModel, units: string, athleteSnapshot: AthleteSnapshotModel) {
		super(units);
		this.mainColor = [228, 76, 92];
		this.heartRateData = heartRateData;
		this.athleteSnapshot = athleteSnapshot;
		this.setGraphTitleFromUnits();
		this.setupDistributionGraph();
		this.setupDistributionTable();

		if (HeartRateDataView.instance == null) {
			HeartRateDataView.instance = this;
		}

	}

	protected setupDistributionTable(): void {

		let htmlTable = "";
		htmlTable += "<div>";
		htmlTable += "<div style=\"height:500px; overflow:auto;\">";
		htmlTable += "<table class=\"distributionTable\">";

		htmlTable += "<tr>"; // Zone
		htmlTable += "<td>ZONE</td>"; // Zone
		htmlTable += "<td>BPM</td>"; // bpm
		htmlTable += "<td>%HRR</td>"; // %HRR
		htmlTable += "<td>TIME</td>"; // Time
		htmlTable += "<td>% ZONE</td>"; // % in zone
		htmlTable += "</tr>";

		let zoneId = 1;
		for (const zone in this.heartRateData.heartRateZones) {

			let fromHRR = Helper.heartRateReserveFromHeartrate(this.heartRateData.heartRateZones[zone].from,
				this.athleteSnapshot.athleteSettings.maxHr, this.athleteSnapshot.athleteSettings.restHr) * 100;
			fromHRR = Math.round(fromHRR);
			let toHRR = Helper.heartRateReserveFromHeartrate(this.heartRateData.heartRateZones[zone].to,
				this.athleteSnapshot.athleteSettings.maxHr, this.athleteSnapshot.athleteSettings.restHr) * 100;
			toHRR = Math.round(toHRR);

			htmlTable += "<tr>"; // Zone
			htmlTable += "<td>Z" + zoneId + "</td>"; // Zone
			htmlTable += "<td>" + this.heartRateData.heartRateZones[zone].from + " - " + this.heartRateData.heartRateZones[zone].to + "</th>"; // BPM
			htmlTable += "<td>" + fromHRR + "% - " + toHRR + "%</td>"; // %HRR
			htmlTable += "<td>" + Helper.secondsToHHMMSS(this.heartRateData.heartRateZones[zone].s) + "</td>"; // Time%
			htmlTable += "<td>" + this.heartRateData.heartRateZones[zone].percentDistrib.toFixed(0) + "%</td>"; // % in zone
			htmlTable += "</tr>";
			zoneId++;
		}

		htmlTable += "</table>";
		htmlTable += "</div>";
		htmlTable += "</div>";
		this.table = $(htmlTable);

	}

	protected setupDistributionGraph(): void {

		const labelsData: string[] = [];
		let zone: any;

		for (zone in this.heartRateData.heartRateZones) {
			const label: string = "Z" + (parseInt(zone) + 1) + " " + this.heartRateData.heartRateZones[zone].from + "-" + this.heartRateData.heartRateZones[zone].to + " bpm";
			labelsData.push(label);
		}

		const hrDistributionInMinutesArray: string[] = [];
		for (zone in this.heartRateData.heartRateZones) {
			hrDistributionInMinutesArray.push((this.heartRateData.heartRateZones[zone].s / 60).toFixed(2));
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
				data: hrDistributionInMinutesArray,
			}],
		};
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

		const hr: string[] = tooltip.title[0].split(" ")[1].replace(/%/g, "").split("-");

		tooltip.body[0].lines[0] = Math.round(Helper.heartRateReserveFromHeartrate(parseInt(hr[0]),
			HeartRateDataView.instance.athleteSnapshot.athleteSettings.maxHr, HeartRateDataView.instance.athleteSnapshot.athleteSettings.restHr) * 100) +
			" - " + Math.round(Helper.heartRateReserveFromHeartrate(parseInt(hr[1]),
				HeartRateDataView.instance.athleteSnapshot.athleteSettings.maxHr,
				HeartRateDataView.instance.athleteSnapshot.athleteSettings.restHr) * 100) +
			" %HRR during " + Helper.secondsToHHMMSS(timeInMinutes * 60);
	}

	public render(): void {

		// Add a title
		this.content += this.generateSectionTitle("<img src=\"" + this.appResources.heartBeatIcon + "\" style=\"vertical-align: baseline; height:20px;\"/> HEART RATE <a target=\"_blank\" href=\"" + this.appResources.settingsLink + "#/zonesSettings/heartRate\" style=\"float: right;margin-right: 10px;\"><img src=\"" + this.appResources.cogIcon + "\" style=\"vertical-align: baseline; height:20px;\"/></a>");

		// Creates a grid
		this.makeGrid(3, 4); // (col, row)

		this.insertDataIntoGrid();
		this.generateCanvasForGraph();
		this.setupDistributionTable();

		if (!this.isOwner) {
			this.content += "<u>Note:</u> You don't own this activity. Notice that <strong>TRaining IMPulse</strong>, <strong>%HRR Average</strong> and <strong>distribution graph</strong> are computed from your Elevate health settings.<br/>";
			this.content += "This allows you to analyse your heart capacity with the data recorded on the activity of this athlete.<br/><br/>";
		}

		// Push grid, graph and table to content view
		this.injectToContent();
	}

	protected insertDataIntoGrid(): void {

		// Insert some data inside grid
		this.insertContentAtGridPosition(0, 0, this.printNumber(this.heartRateData.HRSS, 0), "<strong>H</strong>eart <strong>R</strong>ate <strong>S</strong>tress <strong>S</strong>core", "", "displayAdvancedHrData");
		this.insertContentAtGridPosition(1, 0, this.printNumber(this.heartRateData.HRSSPerHour, 1), "<strong>HRSS</strong> / Hour", "", "displayAdvancedHrData"); // Usefull for running
		this.insertContentAtGridPosition(2, 0, this.printNumber(this.heartRateData.activityHeartRateReserve, 0), "Heart Rate Reserve Avg", "%", "displayAdvancedHrData");

		// Trimp
		this.insertContentAtGridPosition(0, 1, this.printNumber(this.heartRateData.TRIMP, 0), "TRaining IMPulse", "", "displayAdvancedHrData");
		this.insertContentAtGridPosition(1, 1, this.printNumber(this.heartRateData.TRIMPPerHour, 1), "TRaining IMPulse / Hour", "", "displayAdvancedHrData");

		this.insertContentAtGridPosition(0, 2, this.printNumber(this.heartRateData.best20min, 0), "Best 20min Heart Rate", "bpm", "displayAdvancedHrData");
		this.insertContentAtGridPosition(1, 2, this.printNumber(this.heartRateData.best60min, 0), "Best 60min Heart Rate <sup style='color:#FC4C02; font-size:12px; position: initial;'>NEW</sup>", "bpm", "displayAdvancedHrData");

		// Quartiles
		this.insertContentAtGridPosition(0, 3, this.heartRateData.lowerQuartileHeartRate, "25% Quartile HeartRate", "bpm", "displayAdvancedHrData");
		this.insertContentAtGridPosition(1, 3, this.heartRateData.medianHeartRate, "50% Quartile HeartRate", "bpm", "displayAdvancedHrData");
		this.insertContentAtGridPosition(2, 3, this.heartRateData.upperQuartileHeartRate, "75% Quartile HeartRate", "bpm", "displayAdvancedHrData");

	}

}
