import {Helper} from "../../../../common/scripts/Helper";
import {IAppResources} from "../../interfaces/IAppResources";
import {IUserSettings} from "../../../../common/scripts/interfaces/IUserSettings";
import {ActivityProcessor} from "../../processors/ActivityProcessor";
import {AbstractExtendedDataModifier} from "./AbstractExtendedDataModifier";
import {AscentSpeedDataView} from "./views/AscentSpeedDataView";
import {CyclingCadenceDataView} from "./views/CyclingCadenceDataView";
import {CyclingGradeDataView} from "./views/CyclingGradeDataView";
import {CyclingPowerDataView} from "./views/CyclingPowerDataView";
import {ElevationDataView} from "./views/ElevationDataView";
import {SpeedDataView} from "./views/SpeedDataView";

export class CyclingExtendedDataModifier extends AbstractExtendedDataModifier {

    constructor(activityProcessor: ActivityProcessor, activityId: number, activityType: string, appResources: IAppResources, userSettings: IUserSettings, athleteId: number, athleteIdAuthorOfActivity: number, basicInfos: any, type: number) {
        super(activityProcessor, activityId, activityType, appResources, userSettings, athleteId, athleteIdAuthorOfActivity, basicInfos, type);
    }

    protected insertContentSummaryGridContent(): void {
        super.insertContentSummaryGridContent();

        // Speed and pace
        let q3Move: string = "-";
        if (this.analysisData.speedData && this.userSettings.displayAdvancedSpeedData) {
            q3Move = (this.analysisData.speedData.upperQuartileSpeed * this.speedUnitsData.speedUnitFactor).toFixed(1);
            this.insertContentAtGridPosition(1, 0, q3Move, "75% Quartile Speed", this.speedUnitsData.speedUnitPerHour + ' <span class="summarySubGridTitle">(&sigma; :' + (this.analysisData.speedData.standardDeviationSpeed * this.speedUnitsData.speedUnitFactor).toFixed(1) + " )</span>", "displayAdvancedSpeedData");
        }

        // ...
        let climbSpeed: string = "-";
        if (this.analysisData.gradeData && this.userSettings.displayAdvancedGradeData) {
            climbSpeed = (this.analysisData.gradeData.upFlatDownMoveData.up * this.speedUnitsData.speedUnitFactor).toFixed(1);
        }
        this.insertContentAtGridPosition(1, 2, climbSpeed, "Avg climbing speed", this.speedUnitsData.speedUnitPerHour, "displayAdvancedGradeData");

        // Cadence
        let medianCadence: string = "-";
        let standardDeviationCadence: string = "-";
        if (this.analysisData.cadenceData && this.userSettings.displayCadenceData) {
            medianCadence = this.analysisData.cadenceData.medianCadence.toString();
            standardDeviationCadence = this.analysisData.cadenceData.standardDeviationCadence.toString();
        }
        this.insertContentAtGridPosition(0, 3, medianCadence, "Median Cadence", (standardDeviationCadence !== "-") ? ' rpm <span class="summarySubGridTitle">(&sigma; :' + standardDeviationCadence + " )</span>" : "", "displayCadenceData");

        let cadenceTimeMoving: string = "-";
        let cadencePercentageMoving: string = "-";
        if (this.analysisData.cadenceData && this.userSettings.displayCadenceData) {
            cadenceTimeMoving = Helper.secondsToHHMMSS(this.analysisData.cadenceData.cadenceTimeMoving);
            cadencePercentageMoving = this.analysisData.cadenceData.cadencePercentageMoving.toFixed(0);
        }
        this.insertContentAtGridPosition(1, 3, cadenceTimeMoving, "Pedaling Time", (cadencePercentageMoving !== "-") ? ' <span class="summarySubGridTitle">(' + cadencePercentageMoving + "% of activity)</span>" : "", "displayCadenceData");

        let weightedPower: string = "-";
        if (this.analysisData.powerData && this.userSettings.displayAdvancedPowerData) {
            weightedPower = this.analysisData.powerData.weightedPower.toFixed(0);
            let labelWeightedPower: string = "Weighted Avg Power";
            if (!this.analysisData.powerData.hasPowerMeter) {
                labelWeightedPower = "Estimated " + labelWeightedPower;
            }
            this.insertContentAtGridPosition(0, 4, weightedPower, labelWeightedPower, ' w <span class="summarySubGridTitle" style="font-size: 11px;">(Dr. A. Coggan formula)</span>', "displayAdvancedPowerData");
        }

        let avgWattsPerKg: string = "-";
        if (this.analysisData.powerData && this.userSettings.displayAdvancedPowerData) {
            avgWattsPerKg = this.analysisData.powerData.avgWattsPerKg.toFixed(2);
            let labelWKg: string = "Watts Per Kilograms";
            if (!this.analysisData.powerData.hasPowerMeter) {
                labelWKg = "Estimated " + labelWKg;
            }
            this.insertContentAtGridPosition(1, 4, avgWattsPerKg, labelWKg, " w/kg", "displayAdvancedPowerData");
        }

        let powerStressScore: string = "-";
        if (this.analysisData.powerData && this.analysisData.powerData.hasPowerMeter && this.userSettings.displayAdvancedPowerData && this.isAuthorOfViewedActivity) {

            let labelPSS: string;
            if (this.analysisData.powerData.powerStressScore) {
                powerStressScore = this.analysisData.powerData.powerStressScore.toFixed(0) + ' <span class="summarySubGridTitle">(' + this.analysisData.powerData.powerStressScorePerHour.toFixed(1) + " / hour)</span>";
                labelPSS = "Power Stress Score";
                /* Uncomment this for power stress score estimation
                if (!this.analysisData.powerData.hasPowerMeter) {
                    labelPSS = 'Est. ' + labelPSS;
                }
                */
            } else {
                powerStressScore = "-";
                labelPSS = "<i>Configure FTP in athlete settings</i>";
            }

            this.insertContentAtGridPosition(0, 5, powerStressScore, labelPSS, "", "displayAdvancedPowerData");
        }

    }

    protected placeSummaryPanel(panelAdded: () => void): void {
        this.makeSummaryGrid(2, 6);
        super.placeSummaryPanel(panelAdded);
    }

    protected placeExtendedStatsButtonSegment(buttonAdded: () => void): void {

        let htmlButton: string = "<section>";
        htmlButton += '<a class="btn-block btn-xs button raceshape-btn btn-primary" data-xtd-seg-effort-stats id="' + this.segmentEffortButtonId + '">';
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
            speedDataView.setIsAuthorOfViewedActivity(this.isAuthorOfViewedActivity);
            speedDataView.setActivityType(this.activityType);
            speedDataView.setIsSegmentEffortView(this.type === AbstractExtendedDataModifier.TYPE_SEGMENT);
            this.dataViews.push(speedDataView);
        }

        if (this.analysisData.powerData && this.userSettings.displayAdvancedPowerData) {
            const powerDataView: CyclingPowerDataView = new CyclingPowerDataView(this.analysisData.powerData, "w");
            powerDataView.setAppResources(this.appResources);
            powerDataView.setIsAuthorOfViewedActivity(this.isAuthorOfViewedActivity);
            powerDataView.setActivityType(this.activityType);
            powerDataView.setIsSegmentEffortView(this.type === AbstractExtendedDataModifier.TYPE_SEGMENT);
            this.dataViews.push(powerDataView);
        }

        if (this.analysisData.cadenceData && this.userSettings.displayCadenceData) {
            const cyclingCadenceDataView: CyclingCadenceDataView = new CyclingCadenceDataView(this.analysisData.cadenceData, "rpm");
            cyclingCadenceDataView.setAppResources(this.appResources);
            cyclingCadenceDataView.setIsAuthorOfViewedActivity(this.isAuthorOfViewedActivity);
            cyclingCadenceDataView.setActivityType(this.activityType);
            cyclingCadenceDataView.setIsSegmentEffortView(this.type === AbstractExtendedDataModifier.TYPE_SEGMENT);
            this.dataViews.push(cyclingCadenceDataView);
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
