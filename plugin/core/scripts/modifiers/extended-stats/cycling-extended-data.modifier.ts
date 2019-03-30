import { Helper } from "../../helper";
import { ActivityInfoModel, UserSettingsModel } from "@elevate/shared/models";
import { AppResourcesModel } from "../../models/app-resources.model";
import { ActivityProcessor } from "../../processors/activity-processor";
import { AbstractExtendedDataModifier } from "./abstract-extended-data.modifier";
import { AscentSpeedDataView } from "./views/ascent-speed-data.view";
import { CyclingCadenceDataView } from "./views/cycling-cadence-data.view";
import { CyclingGradeDataView } from "./views/cycling-grade-data.view";
import { CyclingPowerDataView } from "./views/cycling-power-data.view";
import { ElevationDataView } from "./views/elevation-data.view";
import { SpeedDataView } from "./views/speed-data.view";
import * as _ from "lodash";

export class CyclingExtendedDataModifier extends AbstractExtendedDataModifier {

	constructor(activityProcessor: ActivityProcessor, activityInfo: ActivityInfoModel, appResources: AppResourcesModel, userSettings: UserSettingsModel, type: number) {
		super(activityProcessor, activityInfo, appResources, userSettings, type);
	}

	protected insertContentSummaryGridContent(): void {
		super.insertContentSummaryGridContent();

		// Speed and pace
		let relevantSpeed = "-";
		let title = "Best 20min Speed";
		let units = "";
		if (this.analysisData.speedData && this.userSettings.displayAdvancedSpeedData) {
			if (this.analysisData.speedData.best20min) {
				relevantSpeed = this.printNumber((this.analysisData.speedData.best20min * this.speedUnitsData.speedUnitFactor), 1);
				units = this.speedUnitsData.speedUnitPerHour;
			} else {
				relevantSpeed = this.printNumber((this.analysisData.speedData.upperQuartileSpeed * this.speedUnitsData.speedUnitFactor), 1);
				title = "75% Quartile Speed";
				units = this.speedUnitsData.speedUnitPerHour + " <span class=\"summarySubGridTitle\">(&sigma; :" + this.printNumber((this.analysisData.speedData.standardDeviationSpeed * this.speedUnitsData.speedUnitFactor), 1) + " )</span>";
			}
		}
		this.insertContentAtGridPosition(1, 0, relevantSpeed, title, units, "displayAdvancedSpeedData");

		// ...
		let climbSpeed = "-";
		if (this.analysisData.gradeData && this.userSettings.displayAdvancedGradeData) {
			climbSpeed = this.printNumber((this.analysisData.gradeData.upFlatDownMoveData.up * this.speedUnitsData.speedUnitFactor), 1);
		}
		this.insertContentAtGridPosition(1, 3, climbSpeed, "Avg climbing speed", this.speedUnitsData.speedUnitPerHour, "displayAdvancedGradeData");

		// Cadence
		let medianCadence = "-";
		let standardDeviationCadence = "-";
		if (this.analysisData.cadenceData && this.userSettings.displayCadenceData) {
			medianCadence = this.analysisData.cadenceData.medianCadence.toString();
			standardDeviationCadence = this.analysisData.cadenceData.standardDeviationCadence.toString();
		}
		this.insertContentAtGridPosition(0, 4, medianCadence, "Median Cadence", (standardDeviationCadence !== "-") ? " rpm <span class=\"summarySubGridTitle\">(&sigma; :" + standardDeviationCadence + " )</span>" : "", "displayCadenceData");

		let cadenceTimeMoving = "-";
		let cadencePercentageMoving = "-";
		if (this.analysisData.cadenceData && this.userSettings.displayCadenceData) {
			cadenceTimeMoving = Helper.secondsToHHMMSS(this.analysisData.cadenceData.cadenceTimeMoving);
			cadencePercentageMoving = this.printNumber(this.analysisData.cadenceData.cadencePercentageMoving);
		}
		this.insertContentAtGridPosition(1, 4, cadenceTimeMoving, "Pedaling Time", (cadencePercentageMoving !== "-") ? " <span class=\"summarySubGridTitle\">(" + cadencePercentageMoving + "% of activity)</span>" : "", "displayCadenceData");

		if (this.analysisData.powerData && this.userSettings.displayAdvancedPowerData) {
			let weightedPower = this.printNumber(this.analysisData.powerData.weightedPower);
			let labelWeightedPower = "Weighted Avg Power";
			if (!this.analysisData.powerData.hasPowerMeter) {
				weightedPower = "<span style='font-size: 14px;'>~</span>" + weightedPower;
				labelWeightedPower = "Estimated " + labelWeightedPower;
			}
			this.insertContentAtGridPosition(0, 5, weightedPower, labelWeightedPower, " w <span class=\"summarySubGridTitle\" style=\"font-size: 11px;\">(Dr. A. Coggan formula)</span>", "displayAdvancedPowerData");
		}

		if (this.analysisData.powerData && this.userSettings.displayAdvancedPowerData) {
			let avgWattsPerKg = this.printNumber(this.analysisData.powerData.avgWattsPerKg, 2);
			let labelWKg = "Watts Per Kilograms";
			if (!this.analysisData.powerData.hasPowerMeter) {
				avgWattsPerKg = "<span style='font-size: 14px;'>~</span>" + avgWattsPerKg;
				labelWKg = "Estimated " + labelWKg;
			}
			this.insertContentAtGridPosition(1, 5, avgWattsPerKg, labelWKg, " w/kg", "displayAdvancedPowerData");
		}

		if (this.analysisData.powerData && this.userSettings.displayAdvancedPowerData) {

			let label = "Best 20min Power";
			let best20min = "-";
			let best20minUnits = "";

			if (_.isNumber(this.analysisData.powerData.best20min)) {

				best20min = this.printNumber(this.analysisData.powerData.best20min);
				best20minUnits = "w";

				if (!this.analysisData.powerData.hasPowerMeter) {
					best20min = "<span style='font-size: 14px;'>~</span>" + best20min;
					label = "Estimated " + label;
				}
			}

			this.insertContentAtGridPosition(0, 6, best20min, label, best20minUnits, "displayAdvancedPowerData");
		}

		if (this.analysisData.powerData && this.userSettings.displayAdvancedPowerData && this.activityInfo.isOwner) {

			let powerStressScore = "-";
			let labelPSS = "Power Stress Score";

			if (!this.analysisData.moveRatio && !this.activityInfo.isTrainer) {
				powerStressScore = "";
				labelPSS = "This activity seems to have been performed indoor.<br/> Make sure to flag it as \"Indoor Cycling\" otherwise<br/> Power Stress Score will not be calculated.";
			} else if (_.isNumber(this.analysisData.powerData.powerStressScore)) {
				powerStressScore = this.printNumber(this.analysisData.powerData.powerStressScore) + " <span class=\"summarySubGridTitle\">(" + this.printNumber(this.analysisData.powerData.powerStressScorePerHour, 1) + " / hour)</span>";
				if (!this.analysisData.powerData.hasPowerMeter) {
					labelPSS = "Est. " + labelPSS;
				}

			} else {
				labelPSS = "<span style='cursor: not-allowed'><i>No cycling FTP found in athlete </br>settings for this activity date</i></span>";
			}

			this.insertContentAtGridPosition(1, 6, powerStressScore, labelPSS, "", null);
		}

	}

	protected placeSummaryPanel(panelAdded: () => void): void {
		this.makeSummaryGrid(2, 7);
		super.placeSummaryPanel(panelAdded);
	}

	protected placeExtendedStatsButtonSegment(buttonAdded: () => void): void {

		let htmlButton = "<section>";
		htmlButton += "<a class=\"btn-block btn-xs button raceshape-btn btn-primary\" data-xtd-seg-effort-stats id=\"" + this.segmentEffortButtonId + "\">";
		htmlButton += "Show extended statistics of effort";
		htmlButton += "</a>";
		htmlButton += "</section>";

		if ($("[data-xtd-seg-effort-stats]").length === 0) {
			$(".raceshape-btn").last().after(htmlButton).each(() => {
				super.placeExtendedStatsButtonSegment(buttonAdded);
			});
		}
	}

	protected setDataViewsNeeded(): void {

		super.setDataViewsNeeded();

		// Speed view
		if (this.analysisData.speedData && this.userSettings.displayAdvancedSpeedData) {

			const measurementPreference: string = window.currentAthlete.get("measurement_preference");
			const units: string = (measurementPreference == "meters") ? "kph" : "mph";

			const speedDataView: SpeedDataView = new SpeedDataView(this.analysisData.speedData, units);
			speedDataView.setAppResources(this.appResources);
			speedDataView.setIsAuthorOfViewedActivity(this.activityInfo.isOwner);
			speedDataView.setActivityType(this.activityType);
			speedDataView.setIsSegmentEffortView(this.type === AbstractExtendedDataModifier.TYPE_SEGMENT);
			this.dataViews.push(speedDataView);
		}

		if (this.analysisData.powerData && this.userSettings.displayAdvancedPowerData) {
			const powerDataView: CyclingPowerDataView = new CyclingPowerDataView(this.analysisData.powerData, "w");
			powerDataView.setAppResources(this.appResources);
			powerDataView.setIsAuthorOfViewedActivity(this.activityInfo.isOwner);
			powerDataView.setActivityType(this.activityType);
			powerDataView.setIsSegmentEffortView(this.type === AbstractExtendedDataModifier.TYPE_SEGMENT);
			this.dataViews.push(powerDataView);
		}

		if (this.analysisData.cadenceData && this.userSettings.displayCadenceData) {
			const cyclingCadenceDataView: CyclingCadenceDataView = new CyclingCadenceDataView(this.analysisData.cadenceData, "rpm");
			cyclingCadenceDataView.setAppResources(this.appResources);
			cyclingCadenceDataView.setIsAuthorOfViewedActivity(this.activityInfo.isOwner);
			cyclingCadenceDataView.setActivityType(this.activityType);
			cyclingCadenceDataView.setIsSegmentEffortView(this.type === AbstractExtendedDataModifier.TYPE_SEGMENT);
			this.dataViews.push(cyclingCadenceDataView);
		}

		if (this.analysisData.gradeData && this.userSettings.displayAdvancedGradeData) {
			const cyclingGradeDataView: CyclingGradeDataView = new CyclingGradeDataView(this.analysisData.gradeData, "%");
			cyclingGradeDataView.setAppResources(this.appResources);
			cyclingGradeDataView.setIsAuthorOfViewedActivity(this.activityInfo.isOwner);
			cyclingGradeDataView.setActivityType(this.activityType);
			cyclingGradeDataView.setIsSegmentEffortView(this.type === AbstractExtendedDataModifier.TYPE_SEGMENT);
			this.dataViews.push(cyclingGradeDataView);
		}

		if (this.analysisData.elevationData && this.userSettings.displayAdvancedElevationData) {
			const elevationDataView: ElevationDataView = new ElevationDataView(this.analysisData.elevationData, "m");
			elevationDataView.setAppResources(this.appResources);
			elevationDataView.setIsAuthorOfViewedActivity(this.activityInfo.isOwner);
			elevationDataView.setActivityType(this.activityType);
			elevationDataView.setIsSegmentEffortView(this.type === AbstractExtendedDataModifier.TYPE_SEGMENT);
			this.dataViews.push(elevationDataView);

			if (this.analysisData.elevationData.ascentSpeed && this.analysisData.elevationData.ascentSpeedZones) {
				const ascentSpeedDataView: AscentSpeedDataView = new AscentSpeedDataView(this.analysisData.elevationData, "Vm/h");
				ascentSpeedDataView.setAppResources(this.appResources);
				ascentSpeedDataView.setIsAuthorOfViewedActivity(this.activityInfo.isOwner);
				ascentSpeedDataView.setActivityType(this.activityType);
				this.dataViews.push(ascentSpeedDataView);
			}
		}
	}

}
