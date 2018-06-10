import { AbstractExtendedDataModifier } from "./AbstractExtendedDataModifier";
import { SpeedDataView } from "./views/SpeedDataView";
import { CyclingGradeDataView } from "./views/CyclingGradeDataView";
import { AscentSpeedDataView } from "./views/AscentSpeedDataView";
import { ElevationDataView } from "./views/ElevationDataView";
import { PaceDataView } from "./views/PaceDataView";
import { RunningCadenceDataView } from "./views/RunningCadenceDataView";

export class GenericExtendedDataModifier extends AbstractExtendedDataModifier {

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
			speedDataView.setIsAuthorOfViewedActivity(this.isAuthorOfViewedActivity);
			speedDataView.setActivityType(this.activityType);
			speedDataView.setIsSegmentEffortView(this.type === AbstractExtendedDataModifier.TYPE_SEGMENT);
			this.dataViews.push(speedDataView);
		}

		if (this.analysisData.paceData && this.userSettings.displayAdvancedSpeedData) {

			const measurementPreference: string = window.currentAthlete.get("measurement_preference");
			const units: string = (measurementPreference == "meters") ? "/km" : "/mi";

			const paceDataView: PaceDataView = new PaceDataView(this.analysisData.paceData, units);
			paceDataView.setAppResources(this.appResources);
			paceDataView.setIsAuthorOfViewedActivity(this.isAuthorOfViewedActivity);
			paceDataView.setIsSegmentEffortView(this.type === AbstractExtendedDataModifier.TYPE_SEGMENT);
			this.dataViews.push(paceDataView);
		}

		if (this.analysisData.cadenceData && this.userSettings.displayCadenceData) {
			const runningCadenceDataView: RunningCadenceDataView = new RunningCadenceDataView(this.analysisData.cadenceData, "spm", this.userSettings);
			runningCadenceDataView.setAppResources(this.appResources);
			runningCadenceDataView.setIsAuthorOfViewedActivity(this.isAuthorOfViewedActivity);
			runningCadenceDataView.setIsSegmentEffortView(this.type === AbstractExtendedDataModifier.TYPE_SEGMENT);
			this.dataViews.push(runningCadenceDataView);
		}

		if (this.analysisData.gradeData && this.userSettings.displayAdvancedGradeData) {
			const cyclingGradeDataView: CyclingGradeDataView = new CyclingGradeDataView(this.analysisData.gradeData, "%");
			cyclingGradeDataView.setAppResources(this.appResources);
			cyclingGradeDataView.setIsAuthorOfViewedActivity(this.isAuthorOfViewedActivity);
			cyclingGradeDataView.setActivityType(this.activityType);
			cyclingGradeDataView.setIsSegmentEffortView(this.type === AbstractExtendedDataModifier.TYPE_SEGMENT);
			this.dataViews.push(cyclingGradeDataView);
		}

		if (this.analysisData.elevationData && this.userSettings.displayAdvancedElevationData) {
			const elevationDataView: ElevationDataView = new ElevationDataView(this.analysisData.elevationData, "m");
			elevationDataView.setAppResources(this.appResources);
			elevationDataView.setIsAuthorOfViewedActivity(this.isAuthorOfViewedActivity);
			elevationDataView.setActivityType(this.activityType);
			elevationDataView.setIsSegmentEffortView(this.type === AbstractExtendedDataModifier.TYPE_SEGMENT);
			this.dataViews.push(elevationDataView);

			if (this.analysisData.elevationData.ascentSpeed && this.analysisData.elevationData.ascentSpeedZones) {
				const ascentSpeedDataView: AscentSpeedDataView = new AscentSpeedDataView(this.analysisData.elevationData, "Vm/h");
				ascentSpeedDataView.setAppResources(this.appResources);
				ascentSpeedDataView.setIsAuthorOfViewedActivity(this.isAuthorOfViewedActivity);
				ascentSpeedDataView.setActivityType(this.activityType);
				this.dataViews.push(ascentSpeedDataView);
			}
		}
	}
}
