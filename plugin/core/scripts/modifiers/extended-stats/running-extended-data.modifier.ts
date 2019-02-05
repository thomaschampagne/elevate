import { Helper } from "../../helper";
import { ActivityInfoModel, UserSettingsModel } from "@elevate/shared/models";
import { AppResourcesModel } from "../../models/app-resources.model";
import { ActivityProcessor } from "../../processors/activity-processor";
import { AbstractExtendedDataModifier } from "./abstract-extended-data.modifier";
import { ElevationDataView } from "./views/elevation-data.view";
import { PaceDataView } from "./views/pace-data.view";
import { RunningCadenceDataView } from "./views/running-cadence.data.view";
import { RunningGradeDataView } from "./views/running-grade-data.view";
import { RunningPowerDataView } from "./views/running-power-data.view";
import { GradeAdjustedPaceDataView } from "./views/grade-adjusted-pace-data.view";
import * as $ from "jquery";

export class RunningExtendedDataModifier extends AbstractExtendedDataModifier {

	constructor(activityProcessor: ActivityProcessor, activityInfo: ActivityInfoModel, appResources: AppResourcesModel,
				userSettings: UserSettingsModel, type: number) {
		super(activityProcessor, activityInfo, appResources, userSettings, type);
	}

	protected insertContentSummaryGridContent(): void {

		super.insertContentSummaryGridContent();

		// Speed and pace
		let q3Move = "-";
		let units = "";
		if (this.analysisData.paceData && this.userSettings.displayAdvancedSpeedData) {
			q3Move = Helper.secondsToHHMMSS(this.analysisData.paceData.upperQuartilePace / this.speedUnitsData.speedUnitFactor, true);
			units = "/" + this.speedUnitsData.units;
		}
		this.insertContentAtGridPosition(1, 0, q3Move, "75% Quartile Pace", units, "displayAdvancedSpeedData");

		// Avg climb pace
		let climbPaceDisplayed = "-";
		if (this.analysisData.gradeData && this.userSettings.displayAdvancedGradeData) {

			// Convert speed to pace
			const avgClimbPace: number = Helper.convertSpeedToPace(this.analysisData.gradeData.upFlatDownMoveData.up);

			if (avgClimbPace !== -1) {
				const seconds: number = avgClimbPace / this.speedUnitsData.speedUnitFactor;
				if (seconds) {
					climbPaceDisplayed = Helper.secondsToHHMMSS(seconds, true);
				}
			}

			this.insertContentAtGridPosition(1, 3, climbPaceDisplayed, "Avg climbing pace", "/" + this.speedUnitsData.units, "displayAdvancedGradeData");
		}

		if (this.userSettings.displayAdvancedPowerData) {

			let averageWatts = "-";
			let averageWattsTitle = "Average Power";
			let userSettingKey = "displayAdvancedPowerData";

			if (this.analysisData.powerData && this.analysisData.powerData.avgWatts) {

				if (this.analysisData.powerData.hasPowerMeter) {

					// Real running power data
					averageWatts = this.printNumber(this.analysisData.powerData.avgWatts);
					userSettingKey = "displayAdvancedPowerData";

				} else {

					// Estimated running power data..
					if (this.userSettings.displayRunningPowerEstimation) {
						averageWattsTitle = "Estimated " + averageWattsTitle;
						userSettingKey = "displayRunningPowerEstimation";
						averageWatts = "<span style='font-size: 14px;'>~</span>" + this.printNumber(this.analysisData.powerData.avgWatts);
					}
				}
			}

			this.insertContentAtGridPosition(0, 4, averageWatts, averageWattsTitle, "w", userSettingKey);
		}


		if (this.userSettings.displayAdvancedPowerData) {

			if (this.analysisData.powerData
				&& this.analysisData.powerData.weightedPower
				&& this.analysisData.powerData.hasPowerMeter
			) {
				const weightedPower = this.printNumber(this.analysisData.powerData.weightedPower);
				this.insertContentAtGridPosition(1, 4, weightedPower, "Weighted Power", "w", "displayAdvancedPowerData");
			}
		}

		if (this.userSettings.displayAdvancedSpeedData && this.activityInfo.isOwner && this.activityInfo.supportsGap) {

			let runningStressScore = "-";
			let labelRSS = "Running Stress Score";
			if (this.analysisData.paceData
				&& this.analysisData.paceData.runningStressScore) {
				runningStressScore = this.printNumber(this.analysisData.paceData.runningStressScore) + " <span class=\"summarySubGridTitle\">(" + this.printNumber(this.analysisData.paceData.runningStressScorePerHour, 1) + " / hour)</span>";
			} else {
				labelRSS = "<span style='cursor: not-allowed'>" + ((this.userSettings.hasDatedAthleteSettings) ? "<i>No running FTP found in athlete </br>settings for this activity date</i>"
					: "<i>Please configure running FTP</br>in athlete settings </br>to see \"Running Stress Score\"</i>") + "</span>";
			}

			this.insertContentAtGridPosition(0, 5, runningStressScore, labelRSS, "", null);
		}
	}

	protected placeSummaryPanel(panelAdded: () => void): void {
		this.makeSummaryGrid(2, 6);
		super.placeSummaryPanel(panelAdded);
	}

	protected placeExtendedStatsButtonSegment(buttonAdded: () => void): void {

		setTimeout(() => { // Execute at the end to make sure DOM is ready
			let htmlButton = "<section>";
			htmlButton += "<a class=\"btn-block btn-xs button raceshape-btn btn-primary\" data-xtd-seg-effort-stats id=\"" + this.segmentEffortButtonId + "\">";
			htmlButton += "Show extended statistics of effort";
			htmlButton += "</a>";
			htmlButton += "</section>";

			if ($("[data-xtd-seg-effort-stats]").length === 0) {
				$(".leaderboard-summary").after(htmlButton).each(() => {
					super.placeExtendedStatsButtonSegment(buttonAdded);
				});
			}
		});
	}

	protected setDataViewsNeeded(): void {

		super.setDataViewsNeeded();

		// Pace view
		if (this.analysisData.paceData && this.userSettings.displayAdvancedSpeedData) {

			const measurementPreference: string = window.currentAthlete.get("measurement_preference");
			const units: string = (measurementPreference == "meters") ? "/km" : "/mi";

			const paceDataView: PaceDataView = new PaceDataView(this.analysisData.paceData, units);
			paceDataView.setSupportsGap(this.activityInfo.supportsGap);
			paceDataView.setAppResources(this.appResources);
			paceDataView.setIsAuthorOfViewedActivity(this.activityInfo.isOwner);
			paceDataView.setIsSegmentEffortView(this.type === AbstractExtendedDataModifier.TYPE_SEGMENT);
			this.dataViews.push(paceDataView);
		}

		// Grade Adjusted Pace view
		if (this.analysisData.paceData && this.analysisData.paceData.gradeAdjustedPaceZones && this.userSettings.displayAdvancedSpeedData) {

			const measurementPreference: string = window.currentAthlete.get("measurement_preference");
			const units: string = (measurementPreference == "meters") ? "/km" : "/mi";

			const gradeAdjustedPaceDataView: GradeAdjustedPaceDataView = new GradeAdjustedPaceDataView(this.analysisData.paceData, units);
			gradeAdjustedPaceDataView.setAppResources(this.appResources);
			gradeAdjustedPaceDataView.setIsAuthorOfViewedActivity(this.activityInfo.isOwner);
			gradeAdjustedPaceDataView.setIsSegmentEffortView(this.type === AbstractExtendedDataModifier.TYPE_SEGMENT);
			this.dataViews.push(gradeAdjustedPaceDataView);
		}

		// Power data
		if (this.analysisData.powerData && this.userSettings.displayAdvancedPowerData) { // Is feature enable?

			// Is beta estimated running power activated?
			const isEstimatedRunningPowerFeatureEnabled = this.userSettings.displayRunningPowerEstimation;

			if (this.analysisData.powerData.hasPowerMeter || isEstimatedRunningPowerFeatureEnabled) {

				const powerDataView: RunningPowerDataView = new RunningPowerDataView(this.analysisData.powerData, "w");
				powerDataView.setAppResources(this.appResources);
				powerDataView.setIsAuthorOfViewedActivity(this.activityInfo.isOwner);
				powerDataView.setActivityType(this.activityType);
				powerDataView.setIsSegmentEffortView(this.type === AbstractExtendedDataModifier.TYPE_SEGMENT);
				this.dataViews.push(powerDataView);
			}
		}

		if (this.analysisData.cadenceData && this.userSettings.displayCadenceData) {
			const runningCadenceDataView: RunningCadenceDataView = new RunningCadenceDataView(this.analysisData.cadenceData, "spm", this.userSettings);
			runningCadenceDataView.setAppResources(this.appResources);
			runningCadenceDataView.setIsAuthorOfViewedActivity(this.activityInfo.isOwner);
			runningCadenceDataView.setIsSegmentEffortView(this.type === AbstractExtendedDataModifier.TYPE_SEGMENT);
			this.dataViews.push(runningCadenceDataView);
		}

		if (this.analysisData.gradeData && this.userSettings.displayAdvancedGradeData) {
			const runningGradeDataView: RunningGradeDataView = new RunningGradeDataView(this.analysisData.gradeData, "%");
			runningGradeDataView.setAppResources(this.appResources);
			runningGradeDataView.setIsAuthorOfViewedActivity(this.activityInfo.isOwner);
			runningGradeDataView.setIsSegmentEffortView(this.type === AbstractExtendedDataModifier.TYPE_SEGMENT);
			this.dataViews.push(runningGradeDataView);
		}

		if (this.analysisData.elevationData && this.userSettings.displayAdvancedElevationData) {
			const elevationDataView: ElevationDataView = new ElevationDataView(this.analysisData.elevationData, "m");
			elevationDataView.setAppResources(this.appResources);
			elevationDataView.setIsAuthorOfViewedActivity(this.activityInfo.isOwner);
			elevationDataView.setIsSegmentEffortView(this.type === AbstractExtendedDataModifier.TYPE_SEGMENT);
			this.dataViews.push(elevationDataView);
		}
	}
}
