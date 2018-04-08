import * as _ from "lodash";
import { Helper } from "../../../../../common/scripts/Helper";
import { UserSettingsModel } from "../../../../../common/scripts/models/user-settings/user-settings.model";
import { AbstractDataView } from "./AbstractDataView";
import { AnalysisDataModel } from "../../../../../common/scripts/models/activity-data/analysis-data.model";
import { ActivityBasicInfoModel } from "../../../../../common/scripts/models/activity-data/activity-basic-info.model";
import { SpeedUnitDataModel } from "../../../../../common/scripts/models/activity-data/speed-unit-data.model";

export class FeaturedDataView extends AbstractDataView {

	protected analysisData: AnalysisDataModel;
	protected basicInfo: ActivityBasicInfoModel;
	protected userSettings: UserSettingsModel;

	constructor(analysisData: AnalysisDataModel, userSettings: UserSettingsModel, basicInfo: any) {

		super(null);
		this.hasGraph = false;
		this.analysisData = analysisData;
		this.userSettings = userSettings;
		this.basicInfo = basicInfo;

		if (!this.analysisData || !this.userSettings) {
			console.error("analysisData and userSettings are required");
		}

		if (this.isSegmentEffortView && !_.isEmpty(this.basicInfo.segmentEffort)) {
			this.mainColor = [252, 76, 2];
		}
	}

	public render(): void {

		if (this.analysisData.moveRatio && this.userSettings.displayActivityRatio ||
			this.analysisData.toughnessScore && this.userSettings.displayMotivationScore ||
			this.analysisData.speedData && this.userSettings.displayAdvancedSpeedData ||
			this.analysisData.heartRateData && this.userSettings.displayAdvancedHrData ||
			this.analysisData.powerData && this.userSettings.displayAdvancedPowerData ||
			this.analysisData.gradeData && this.userSettings.displayAdvancedGradeData) {

			// Add a title
			this.makeGrid(7, 1); // (col, row)

			this.insertDataIntoGrid();

			this.content += "<div class=\"featuredData\">" + this.grid.html() + "</div>";
		}
	}

	protected insertDataIntoGrid(): void {

		const speedUnitsData: SpeedUnitDataModel = Helper.getSpeedUnitData();

		if (this.analysisData.moveRatio && this.userSettings.displayActivityRatio && _.isEmpty(this.basicInfo.segmentEffort)) {
			this.insertContentAtGridPosition(0, 0, this.printNumber(this.analysisData.moveRatio, 2), "Move Ratio", "", "displayActivityRatio"); // Move ratio
		}

		if (this.analysisData.speedData && this.userSettings.displayAdvancedSpeedData) {
			this.insertContentAtGridPosition(1, 0, this.printNumber((this.analysisData.speedData.upperQuartileSpeed * speedUnitsData.speedUnitFactor), 1), "75% Quartile Speed", speedUnitsData.speedUnitPerHour, "displayAdvancedSpeedData"); // Q3 Speed
		}

		if (this.analysisData.heartRateData && this.userSettings.displayAdvancedHrData) {
			this.insertContentAtGridPosition(2, 0, this.printNumber(this.analysisData.heartRateData.HRSS, 0), "HRSS <sup style='color:#FC4C02; font-size:12px; position: initial;'>NEW</sup>", "", "displayAdvancedHrData");
			this.insertContentAtGridPosition(3, 0, this.printNumber(this.analysisData.heartRateData.HRSSPerHour, 1), "HRSS / Hour <sup style='color:#FC4C02; font-size:12px; position: initial;'>NEW</sup>", "", "displayAdvancedHrData");
		}

		if (this.analysisData.powerData && this.userSettings.displayAdvancedPowerData) {

			if (_.isNumber(this.analysisData.powerData.ftp) && !this.isSegmentEffortView) {
				let label = "FTP";
				if (!this.analysisData.powerData.hasPowerMeter) {
					label = "Estimated " + label;
				}
				this.insertContentAtGridPosition(4, 0, this.printNumber(this.analysisData.powerData.ftp, 0), label + " <sup style='color:#FC4C02; font-size:12px; position: initial;'>NEW</sup>", "w", "displayAdvancedPowerData"); // Avg watt /kg
			}

			if (_.isNumber(this.analysisData.powerData.weightedWattsPerKg)) {
				let label = "Weighted Watts/kg";
				if (!this.analysisData.powerData.hasPowerMeter) {
					label = "Estimated " + label;
				}
				this.insertContentAtGridPosition(5, 0, this.printNumber(this.analysisData.powerData.weightedWattsPerKg, 2), label, "w/kg", "displayAdvancedPowerData"); // Avg watt /kg
			}
		}

		if (this.analysisData.gradeData && this.userSettings.displayAdvancedGradeData) {
			this.insertContentAtGridPosition(6, 0, this.analysisData.gradeData.gradeProfile, "Grade Profile", "", "displayAdvancedGradeData");
		}

		// Remove empty case in grid. This avoid unwanted padding on feature view rendering
		this.grid.find("td:empty").remove();
	}
}
