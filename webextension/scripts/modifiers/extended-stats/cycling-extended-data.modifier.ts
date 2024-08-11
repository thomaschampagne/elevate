import { AppResourcesModel } from "../../models/app-resources.model";
import { ActivityProcessor } from "../../processors/activity-processor";
import { AbstractExtendedDataModifier } from "./abstract-extended-data.modifier";
import { CyclingCadenceDataView } from "./views/cycling-cadence-data.view";
import { CyclingGradeDataView } from "./views/cycling-grade-data.view";
import { CyclingPowerDataView } from "./views/cycling-power-data.view";
import { ElevationDataView } from "./views/elevation-data.view";
import { SpeedDataView } from "./views/speed-data.view";
import _ from "lodash";
import { CyclingPowerCurveView } from "./views/cycling-power-curve.view";
import $ from "jquery";
import { ActivityInfoModel } from "@elevate/shared/models/activity-data/activity-info.model";
import { Time } from "@elevate/shared/tools/time";
import { UserSettings } from "@elevate/shared/models/user-settings/user-settings.namespace";
import ExtensionUserSettings = UserSettings.ExtensionUserSettings;

export class CyclingExtendedDataModifier extends AbstractExtendedDataModifier {
  constructor(
    activityProcessor: ActivityProcessor,
    activityInfo: ActivityInfoModel,
    appResources: AppResourcesModel,
    userSettings: ExtensionUserSettings,
    type: number
  ) {
    super(activityProcessor, activityInfo, appResources, userSettings, type);
  }

  protected insertContentSummaryGridContent(): void {
    super.insertContentSummaryGridContent();

    // Speed and pace
    let relevantSpeed = "-";
    let title = "Best 20min Speed";
    let units = "";
    if (this.stats.speed && this.userSettings.displayAdvancedSpeedData) {
      if (this.stats.speed.best20min) {
        relevantSpeed = this.printNumber(this.stats.speed.best20min * this.speedUnitsData.speedUnitFactor, 1);
        units = this.speedUnitsData.speedUnitPerHour;
      } else {
        relevantSpeed = this.printNumber(this.stats.speed.upperQ * this.speedUnitsData.speedUnitFactor, 1);
        title = "75% Quartile Speed";
        units =
          this.speedUnitsData.speedUnitPerHour +
          ' <span class="summarySubGridTitle">(&sigma; :' +
          this.printNumber(this.stats.speed.stdDev * this.speedUnitsData.speedUnitFactor, 1) +
          " )</span>";
      }
    }
    this.insertContentAtGridPosition(1, 0, relevantSpeed, title, units, "displayAdvancedSpeedData");

    // ...
    let climbSpeed = "-";
    if (this.stats.grade && this.userSettings.displayAdvancedGradeData) {
      climbSpeed = this.printNumber(this.stats.grade.slopeSpeed.up * this.speedUnitsData.speedUnitFactor, 1);
    }
    this.insertContentAtGridPosition(
      1,
      3,
      climbSpeed,
      "Avg climbing speed",
      this.speedUnitsData.speedUnitPerHour,
      "displayAdvancedGradeData"
    );

    // Cadence
    let medianCadence = "-";
    let standardDeviationCadence = "-";
    if (this.stats.cadence && this.userSettings.displayCadenceData) {
      medianCadence = this.stats.cadence.median.toString();
      standardDeviationCadence = this.stats.cadence.stdDev.toString();
    }
    this.insertContentAtGridPosition(
      0,
      4,
      medianCadence,
      "Median Cadence",
      standardDeviationCadence !== "-"
        ? ' rpm <span class="summarySubGridTitle">(&sigma; :' + standardDeviationCadence + " )</span>"
        : "",
      "displayCadenceData"
    );

    let cadenceTimeMoving = "-";
    let cadenceRatioMoving = "-";
    if (this.stats.cadence && this.userSettings.displayCadenceData) {
      cadenceTimeMoving = Time.secToMilitary(this.stats.cadence.activeTime);
      cadenceRatioMoving = this.printNumber(this.stats.cadence.activeRatio);
    }
    this.insertContentAtGridPosition(
      1,
      4,
      cadenceTimeMoving,
      "Pedaling Time",
      cadenceRatioMoving !== "-"
        ? ' <span class="summarySubGridTitle">(' + cadenceRatioMoving + " of activity)</span>"
        : "",
      "displayCadenceData"
    );

    if (this.stats.power && this.userSettings.displayAdvancedPowerData) {
      let weightedPower = this.printNumber(this.stats.power.weighted);
      let labelNormalizedPower = "Avg Normalized Power®";
      if (!this.hasPowerMeter) {
        weightedPower = "<span style='font-size: 14px;'>~</span>" + weightedPower;
        labelNormalizedPower = "Estimated " + labelNormalizedPower;
      }
      this.insertContentAtGridPosition(
        0,
        5,
        weightedPower,
        labelNormalizedPower,
        ' w <span class="summarySubGridTitle" style="font-size: 11px;">(Dr. A. Coggan formula)</span>',
        "displayAdvancedPowerData"
      );
    }

    if (this.stats.power && this.userSettings.displayAdvancedPowerData) {
      let avgWattsPerKg = this.printNumber(this.stats.power.avgKg, 2);
      let labelWKg = "Watts Per Kilograms";
      if (!this.hasPowerMeter) {
        avgWattsPerKg = "<span style='font-size: 14px;'>~</span>" + avgWattsPerKg;
        labelWKg = "Estimated " + labelWKg;
      }
      this.insertContentAtGridPosition(1, 5, avgWattsPerKg, labelWKg, " w/kg", "displayAdvancedPowerData");
    }

    if (this.stats.power && this.userSettings.displayAdvancedPowerData) {
      let label = "Best 20min Power";
      let best20min = "-";
      let best20minUnits = "";

      if (_.isNumber(this.stats.power.best20min)) {
        best20min = this.printNumber(this.stats.power.best20min);
        best20minUnits = "w";

        if (!this.hasPowerMeter) {
          best20min = "<span style='font-size: 14px;'>~</span>" + best20min;
          label = "Estimated " + label;
        }
      }

      this.insertContentAtGridPosition(0, 6, best20min, label, best20minUnits, "displayAdvancedPowerData");
    }

    if (this.stats.power && this.userSettings.displayAdvancedPowerData && this.activityInfo.isOwner) {
      let powerStressScore = "-";
      let labelPSS = "Power Stress Score";

      if (!this.stats.moveRatio && !this.activityInfo.isTrainer) {
        powerStressScore = "";
        labelPSS =
          'This activity seems to have been performed indoor.<br/> Make sure to flag it as "Indoor Cycling" otherwise<br/> Power Stress Score will not be calculated.';
      } else if (_.isNumber(this.stats.scores?.stress?.pss)) {
        powerStressScore =
          this.printNumber(this.stats.scores?.stress?.pss) +
          ' <span class="summarySubGridTitle">(' +
          this.printNumber(this.stats.scores?.stress?.pssPerHour, 1) +
          " / hour)</span>";
        if (!this.hasPowerMeter) {
          labelPSS = "Est. " + labelPSS;
        }
      } else {
        labelPSS =
          "<span style='cursor: not-allowed'><i>No cycling FTP found in athlete </br>settings for this activity date</i></span>";
      }

      this.insertContentAtGridPosition(1, 6, powerStressScore, labelPSS, "", null);
    }

    if (this.stats.scores.efficiency && this.userSettings.displayAdvancedPowerData) {
      let label = "Efficiency Factor";
      let efficiency = "-";
      let efficiencyUnits = "";

      if (_.isNumber(this.stats.scores.efficiency)) {
        efficiency = this.printNumber(this.stats.scores.efficiency, 2);
        efficiencyUnits = "";

        if (!this.hasPowerMeter) {
          efficiency = "<span style='font-size: 14px;'>~</span>" + efficiency;
          label = "Estimated " + label;
        }
      }
      this.insertContentAtGridPosition(0, 7, efficiency, label, efficiencyUnits, "displayAdvancedPowerData");
    }

    if (this.stats.power.intensityFactor && this.userSettings.displayAdvancedPowerData) {
      let label = "Intensity Factor";
      let intensityFactor = "-";
      let intensityFactorUnits = "";

      if (_.isNumber(this.stats.power.intensityFactor)) {
        intensityFactor = this.printNumber(this.stats.power.intensityFactor, 2);
        intensityFactorUnits = "";

        if (!this.hasPowerMeter) {
          intensityFactor = "<span style='font-size: 14px;'>~</span>" + intensityFactor;
          label = "Estimated " + label;
        }
      }
      this.insertContentAtGridPosition(1, 7, intensityFactor, label, intensityFactorUnits, "displayAdvancedPowerData");
    }
  }

  protected placeSummaryPanel(panelAdded: () => void): void {
    this.makeSummaryGrid(2, 8);
    super.placeSummaryPanel(panelAdded);
  }

  protected placeExtendedStatsButtonSegment(buttonAdded: () => void): void {
    let htmlButton = "<section>";
    htmlButton +=
      '<div class="analysis-link-js btn-block button btn-primary" data-xtd-seg-effort-stats id="' +
      this.segmentEffortButtonId +
      '">';
    htmlButton += "Show extended statistics of effort";
    htmlButton += "</div>";
    htmlButton += "</section>";

    if ($("[data-xtd-seg-effort-stats]").length === 0) {
      $(".effort-actions")
        .first()
        .append(htmlButton)
        .each(() => {
          super.placeExtendedStatsButtonSegment(buttonAdded);
        });
    }
  }

  protected setDataViewsNeeded(): void {
    super.setDataViewsNeeded();

    // Speed view
    if (this.stats.speed && this.userSettings.displayAdvancedSpeedData) {
      const measurementPreference: string = window.currentAthlete.get("measurement_preference");
      const units: string = measurementPreference === "meters" ? "kph" : "mph";

      const speedView: SpeedDataView = new SpeedDataView(this.stats.speed, units);
      speedView.setAppResources(this.appResources);
      speedView.setIsAuthorOfViewedActivity(this.activityInfo.isOwner);
      speedView.setActivityType(this.activityType);
      speedView.setIsSegmentEffortView(this.type === AbstractExtendedDataModifier.TYPE_SEGMENT);
      this.dataViews.push(speedView);
    }

    if (this.stats.power && this.userSettings.displayAdvancedPowerData) {
      const powerView: CyclingPowerDataView = new CyclingPowerDataView(this.stats.power, this.stats.scores.stress, "w");
      powerView.setAppResources(this.appResources);
      powerView.setIsAuthorOfViewedActivity(this.activityInfo.isOwner);
      powerView.setActivityType(this.activityType);
      powerView.setIsSegmentEffortView(this.type === AbstractExtendedDataModifier.TYPE_SEGMENT);
      this.dataViews.push(powerView);

      const powerCurveView: CyclingPowerCurveView = new CyclingPowerCurveView(this.stats.power, "w");
      powerCurveView.setAppResources(this.appResources);
      powerCurveView.setIsAuthorOfViewedActivity(this.activityInfo.isOwner);
      powerCurveView.setActivityType(this.activityType);
      powerCurveView.setIsSegmentEffortView(this.type === AbstractExtendedDataModifier.TYPE_SEGMENT);
      this.dataViews.push(powerCurveView);
    }

    if (this.stats.cadence && this.userSettings.displayCadenceData) {
      const cyclingCadenceDataView: CyclingCadenceDataView = new CyclingCadenceDataView(this.stats.cadence, "rpm");
      cyclingCadenceDataView.setAppResources(this.appResources);
      cyclingCadenceDataView.setIsAuthorOfViewedActivity(this.activityInfo.isOwner);
      cyclingCadenceDataView.setActivityType(this.activityType);
      cyclingCadenceDataView.setIsSegmentEffortView(this.type === AbstractExtendedDataModifier.TYPE_SEGMENT);
      this.dataViews.push(cyclingCadenceDataView);
    }

    if (this.stats.grade && this.userSettings.displayAdvancedGradeData) {
      const cyclingGradeDataView: CyclingGradeDataView = new CyclingGradeDataView(this.stats.grade, "%");
      cyclingGradeDataView.setAppResources(this.appResources);
      cyclingGradeDataView.setIsAuthorOfViewedActivity(this.activityInfo.isOwner);
      cyclingGradeDataView.setActivityType(this.activityType);
      cyclingGradeDataView.setIsSegmentEffortView(this.type === AbstractExtendedDataModifier.TYPE_SEGMENT);
      this.dataViews.push(cyclingGradeDataView);
    }

    if (this.stats.elevation && this.userSettings.displayAdvancedElevationData) {
      const elevationView: ElevationDataView = new ElevationDataView(this.stats.elevation, "m");
      elevationView.setAppResources(this.appResources);
      elevationView.setIsAuthorOfViewedActivity(this.activityInfo.isOwner);
      elevationView.setActivityType(this.activityType);
      elevationView.setIsSegmentEffortView(this.type === AbstractExtendedDataModifier.TYPE_SEGMENT);
      this.dataViews.push(elevationView);
    }
  }
}
