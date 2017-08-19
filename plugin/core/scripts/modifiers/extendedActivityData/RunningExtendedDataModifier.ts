import {Helper} from "../../../../common/scripts/Helper";
import {IUserSettings} from "../../../../common/scripts/interfaces/IUserSettings";
import {IAppResources} from "../../interfaces/IAppResources";
import {ActivityProcessor} from "../../processors/ActivityProcessor";
import {AbstractExtendedDataModifier} from "./AbstractExtendedDataModifier";
import {ElevationDataView} from "./views/ElevationDataView";
import {PaceDataView} from "./views/PaceDataView";
import {RunningCadenceDataView} from "./views/RunningCadenceDataView";
import {RunningGradeDataView} from "./views/RunningGradeDataView";
import {RunningPowerDataView} from "./views/RunningPowerDataView";

export class RunningExtendedDataModifier extends AbstractExtendedDataModifier {

    constructor(activityProcessor: ActivityProcessor, activityId: number, activityType: string, appResources: IAppResources, userSettings: IUserSettings, athleteId: number, athleteIdAuthorOfActivity: number, basicInfos: any, type: number) {
        super(activityProcessor, activityId, activityType, appResources, userSettings, athleteId, athleteIdAuthorOfActivity, basicInfos, type);
    }

    protected insertContentSummaryGridContent(): void {

        super.insertContentSummaryGridContent();

        // Speed and pace
        let q3Move: string = "-";
        if (this.analysisData.paceData && this.userSettings.displayAdvancedSpeedData) {
            q3Move = Helper.secondsToHHMMSS(this.analysisData.paceData.upperQuartilePace / this.speedUnitsData.speedUnitFactor, true);
            this.insertContentAtGridPosition(1, 0, q3Move, "75% Quartile Pace", "/" + this.speedUnitsData.units, "displayAdvancedSpeedData");
        }

        // Avg climb pace
        let climbPaceDisplayed: string = "-";
        if (this.analysisData.gradeData && this.userSettings.displayAdvancedGradeData) {

            // Convert speed to pace
            const avgClimbPace: number = this.convertSpeedToPace(this.analysisData.gradeData.upFlatDownMoveData.up);

            if (avgClimbPace !== -1) {
                // let seconds: number = parseInt((avgClimbPace / speedUnitFactor).toFixed(0));
                const seconds: number = avgClimbPace / this.speedUnitsData.speedUnitFactor; // / speedUnitFactor).toFixed(0));
                if (seconds) {
                    climbPaceDisplayed = Helper.secondsToHHMMSS(seconds, true);
                }
            }

            this.insertContentAtGridPosition(1, 2, climbPaceDisplayed, "Avg climbing pace", "/" + this.speedUnitsData.units, "displayAdvancedGradeData");
        }

        let averageWatts: string = "-";
        if (this.userSettings.displayAdvancedPowerData) {
            if (this.analysisData.powerData && this.analysisData.powerData.avgWatts && this.analysisData.powerData.hasPowerMeter) {
                averageWatts = this.analysisData.powerData.avgWatts.toFixed(0);
            }
            this.insertContentAtGridPosition(0, 3, averageWatts, "Running Average Power", "w", "displayAdvancedPowerData");
        }

        let weightedPower: string = "-";
        if (this.userSettings.displayAdvancedPowerData) {
            if (this.analysisData.powerData && this.analysisData.powerData.weightedPower && this.analysisData.powerData.hasPowerMeter) {
                weightedPower = this.analysisData.powerData.weightedPower.toFixed(0);
            }
            this.insertContentAtGridPosition(1, 3, weightedPower, "Running Weighted Power", "w", "displayAdvancedPowerData");
        }

    }

    protected placeSummaryPanel(panelAdded: () => void): void {
        this.makeSummaryGrid(2, 4);
        super.placeSummaryPanel(panelAdded);
    }

    protected placeExtendedStatsButtonSegment(buttonAdded: () => void): void {

        setTimeout(() => { // Execute at the end to make sure DOM is ready
            let htmlButton: string = "<section>";
            htmlButton += '<a class="btn-block btn-xs button raceshape-btn btn-primary" data-xtd-seg-effort-stats id="' + this.segmentEffortButtonId + '">';
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
            paceDataView.setAppResources(this.appResources);
            paceDataView.setIsAuthorOfViewedActivity(this.isAuthorOfViewedActivity);
            paceDataView.setIsSegmentEffortView(this.type === AbstractExtendedDataModifier.TYPE_SEGMENT);
            this.dataViews.push(paceDataView);
        }

        if (this.analysisData.powerData && this.analysisData.powerData.hasPowerMeter && this.userSettings.displayAdvancedPowerData) {
            const powerDataView: RunningPowerDataView = new RunningPowerDataView(this.analysisData.powerData, "w");
            powerDataView.setAppResources(this.appResources);
            powerDataView.setIsAuthorOfViewedActivity(this.isAuthorOfViewedActivity);
            powerDataView.setActivityType(this.activityType);
            powerDataView.setIsSegmentEffortView(this.type === AbstractExtendedDataModifier.TYPE_SEGMENT);
            this.dataViews.push(powerDataView);
        }

        if (this.analysisData.cadenceData && this.userSettings.displayCadenceData) {
            const runningCadenceDataView: RunningCadenceDataView = new RunningCadenceDataView(this.analysisData.cadenceData, "spm", this.userSettings);
            runningCadenceDataView.setAppResources(this.appResources);
            runningCadenceDataView.setIsAuthorOfViewedActivity(this.isAuthorOfViewedActivity);
            runningCadenceDataView.setIsSegmentEffortView(this.type === AbstractExtendedDataModifier.TYPE_SEGMENT);
            this.dataViews.push(runningCadenceDataView);
        }

        if (this.analysisData.gradeData && this.userSettings.displayAdvancedGradeData) {
            const runningGradeDataView: RunningGradeDataView = new RunningGradeDataView(this.analysisData.gradeData, "%");
            runningGradeDataView.setAppResources(this.appResources);
            runningGradeDataView.setIsAuthorOfViewedActivity(this.isAuthorOfViewedActivity);
            runningGradeDataView.setIsSegmentEffortView(this.type === AbstractExtendedDataModifier.TYPE_SEGMENT);
            this.dataViews.push(runningGradeDataView);
        }

        if (this.analysisData.elevationData && this.userSettings.displayAdvancedElevationData) {
            const elevationDataView: ElevationDataView = new ElevationDataView(this.analysisData.elevationData, "m");
            elevationDataView.setAppResources(this.appResources);
            elevationDataView.setIsAuthorOfViewedActivity(this.isAuthorOfViewedActivity);
            elevationDataView.setIsSegmentEffortView(this.type === AbstractExtendedDataModifier.TYPE_SEGMENT);
            this.dataViews.push(elevationDataView);
        }
    }
}
