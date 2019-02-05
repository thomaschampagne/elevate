import { AbstractExtendedDataModifier } from "./abstract-extended-data.modifier";
import { SpeedDataView } from "./views/speed-data.view";
import { CyclingGradeDataView } from "./views/cycling-grade-data.view";
import { AscentSpeedDataView } from "./views/ascent-speed-data.view";
import { ElevationDataView } from "./views/elevation-data.view";
import { PaceDataView } from "./views/pace-data.view";
import { RunningCadenceDataView } from "./views/running-cadence.data.view";
import { ActivityProcessor } from "../../processors/activity-processor";
import { AppResourcesModel } from "../../models/app-resources.model";
import { ActivityInfoModel, UserSettingsModel } from "@elevate/shared/models";

export class GenericExtendedDataModifier extends AbstractExtendedDataModifier {

	constructor(activityProcessor: ActivityProcessor, activityId: number, activityType: string, supportsGap: boolean,
				appResources: AppResourcesModel, userSettings: UserSettingsModel, isOwner: boolean, activityInfo: ActivityInfoModel, type: number) {
		super(activityProcessor, activityId, supportsGap, appResources, userSettings, isOwner, activityInfo, type);
	}

	protected placeSummaryPanel(panelAdded: () => void): void {
		this.makeSummaryGrid(2, 7);
		super.placeSummaryPanel(panelAdded);
	}

	protected setDataViewsNeeded(): void {
		super.setDataViewsNeeded();

		// Speed view
		if (this.analysisData.speedData && this.userSettings.displayAdvancedSpeedData) {
			const measurementPreference: string = window.currentAthlete.get("measurement_preference");
			const units: string = (measurementPreference == "meters") ? "kph" : "mph";
			const speedDataView: SpeedDataView = new SpeedDataView(this.analysisData.speedData, units);
			speedDataView.setAppResources(this.appResources);
			speedDataView.setIsAuthorOfViewedActivity(this.isOwner);
			speedDataView.setActivityType(this.activityType);
			speedDataView.setIsSegmentEffortView(this.type === AbstractExtendedDataModifier.TYPE_SEGMENT);
			this.dataViews.push(speedDataView);
		}

		if (this.analysisData.paceData && this.userSettings.displayAdvancedSpeedData) {

			const measurementPreference: string = window.currentAthlete.get("measurement_preference");
			const units: string = (measurementPreference == "meters") ? "/km" : "/mi";

			const paceDataView: PaceDataView = new PaceDataView(this.analysisData.paceData, units);
			paceDataView.setAppResources(this.appResources);
			paceDataView.setIsAuthorOfViewedActivity(this.isOwner);
			paceDataView.setIsSegmentEffortView(this.type === AbstractExtendedDataModifier.TYPE_SEGMENT);
			this.dataViews.push(paceDataView);
		}

		if (this.analysisData.cadenceData && this.userSettings.displayCadenceData) {
			const runningCadenceDataView: RunningCadenceDataView = new RunningCadenceDataView(this.analysisData.cadenceData, "spm", this.userSettings);
			runningCadenceDataView.setAppResources(this.appResources);
			runningCadenceDataView.setIsAuthorOfViewedActivity(this.isOwner);
			runningCadenceDataView.setIsSegmentEffortView(this.type === AbstractExtendedDataModifier.TYPE_SEGMENT);
			this.dataViews.push(runningCadenceDataView);
		}

		if (this.analysisData.gradeData && this.userSettings.displayAdvancedGradeData) {
			const cyclingGradeDataView: CyclingGradeDataView = new CyclingGradeDataView(this.analysisData.gradeData, "%");
			cyclingGradeDataView.setAppResources(this.appResources);
			cyclingGradeDataView.setIsAuthorOfViewedActivity(this.isOwner);
			cyclingGradeDataView.setActivityType(this.activityType);
			cyclingGradeDataView.setIsSegmentEffortView(this.type === AbstractExtendedDataModifier.TYPE_SEGMENT);
			this.dataViews.push(cyclingGradeDataView);
		}

		if (this.analysisData.elevationData && this.userSettings.displayAdvancedElevationData) {
			const elevationDataView: ElevationDataView = new ElevationDataView(this.analysisData.elevationData, "m");
			elevationDataView.setAppResources(this.appResources);
			elevationDataView.setIsAuthorOfViewedActivity(this.isOwner);
			elevationDataView.setActivityType(this.activityType);
			elevationDataView.setIsSegmentEffortView(this.type === AbstractExtendedDataModifier.TYPE_SEGMENT);
			this.dataViews.push(elevationDataView);

			if (this.analysisData.elevationData.ascentSpeed && this.analysisData.elevationData.ascentSpeedZones) {
				const ascentSpeedDataView: AscentSpeedDataView = new AscentSpeedDataView(this.analysisData.elevationData, "Vm/h");
				ascentSpeedDataView.setAppResources(this.appResources);
				ascentSpeedDataView.setIsAuthorOfViewedActivity(this.isOwner);
				ascentSpeedDataView.setActivityType(this.activityType);
				this.dataViews.push(ascentSpeedDataView);
			}
		}
	}
}
