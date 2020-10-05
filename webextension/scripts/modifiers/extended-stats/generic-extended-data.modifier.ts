import { AbstractExtendedDataModifier } from "./abstract-extended-data.modifier";
import { SpeedDataView } from "./views/speed-data.view";
import { CyclingGradeDataView } from "./views/cycling-grade-data.view";
import { ElevationDataView } from "./views/elevation-data.view";
import { PaceDataView } from "./views/pace-data.view";
import { ActivityProcessor } from "../../processors/activity-processor";
import { AppResourcesModel } from "../../models/app-resources.model";
import { ActivityInfoModel, UserSettings } from "@elevate/shared/models";
import ExtensionUserSettingsModel = UserSettings.ExtensionUserSettingsModel;

export class GenericExtendedDataModifier extends AbstractExtendedDataModifier {
    constructor(
        activityProcessor: ActivityProcessor,
        activityInfo: ActivityInfoModel,
        appResources: AppResourcesModel,
        userSettings: ExtensionUserSettingsModel,
        type: number
    ) {
        super(activityProcessor, activityInfo, appResources, userSettings, type);
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
            const units: string = measurementPreference == "meters" ? "kph" : "mph";
            const speedDataView: SpeedDataView = new SpeedDataView(this.analysisData.speedData, units);
            speedDataView.setAppResources(this.appResources);
            speedDataView.setIsAuthorOfViewedActivity(this.activityInfo.isOwner);
            speedDataView.setActivityType(this.activityType);
            speedDataView.setIsSegmentEffortView(this.type === AbstractExtendedDataModifier.TYPE_SEGMENT);
            this.dataViews.push(speedDataView);
        }

        if (this.analysisData.paceData && this.userSettings.displayAdvancedSpeedData) {
            const measurementPreference: string = window.currentAthlete.get("measurement_preference");
            const units: string = measurementPreference == "meters" ? "/km" : "/mi";

            const paceDataView: PaceDataView = new PaceDataView(this.analysisData.paceData, units);
            paceDataView.setAppResources(this.appResources);
            paceDataView.setIsAuthorOfViewedActivity(this.activityInfo.isOwner);
            paceDataView.setIsSegmentEffortView(this.type === AbstractExtendedDataModifier.TYPE_SEGMENT);
            this.dataViews.push(paceDataView);
        }

        if (this.analysisData.gradeData && this.userSettings.displayAdvancedGradeData) {
            const cyclingGradeDataView: CyclingGradeDataView = new CyclingGradeDataView(
                this.analysisData.gradeData,
                "%"
            );
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
        }
    }

    protected placeExtendedStatsButtonSegment(buttonAdded: () => void): void {
        let htmlButton = "<section>";
        htmlButton +=
            '<a class="btn-block btn-xs button raceshape-btn btn-primary" data-xtd-seg-effort-stats id="' +
            this.segmentEffortButtonId +
            '">';
        htmlButton += "Show extended statistics of effort";
        htmlButton += "</a>";
        htmlButton += "</section>";

        if ($("[data-xtd-seg-effort-stats]").length === 0) {
            $(".raceshape-btn")
                .last()
                .after(htmlButton)
                .each(() => {
                    super.placeExtendedStatsButtonSegment(buttonAdded);
                });
        }
    }
}
