import { Helper } from "../../helper";
import { AppResourcesModel } from "../../models/app-resources.model";
import { ActivityProcessor } from "../../processors/activity-processor";
import { AbstractExtendedDataModifier } from "./abstract-extended-data.modifier";
import { ElevationDataView } from "./views/elevation-data.view";
import { PaceDataView } from "./views/pace-data.view";
import { RunningCadenceDataView } from "./views/running-cadence.data.view";
import { RunningGradeDataView } from "./views/running-grade-data.view";
import { RunningPowerDataView } from "./views/running-power-data.view";
import $ from "jquery";
import _ from "lodash";
import { UserSettings } from "@elevate/shared/models/user-settings/user-settings.namespace";
import { Time } from "@elevate/shared/tools/time";
import { ActivityInfoModel } from "@elevate/shared/models/activity-data/activity-info.model";
import ExtensionUserSettings = UserSettings.ExtensionUserSettings;

export class RunningExtendedDataModifier extends AbstractExtendedDataModifier {
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
    let q3Move = "-";
    let units = "";
    if (this.stats.pace && this.userSettings.displayAdvancedSpeedData) {
      q3Move = Time.secToMilitary(this.stats.pace.upperQ / this.speedUnitsData.speedUnitFactor);
      units = "/" + this.speedUnitsData.units;
    }
    this.insertContentAtGridPosition(1, 0, q3Move, "75% Quartile Pace", units, "displayAdvancedSpeedData");

    // Avg climb pace
    let climbPaceDisplayed = "-";
    if (this.stats.grade && this.userSettings.displayAdvancedGradeData) {
      // Convert speed to pace
      const avgClimbPace: number = Helper.convertSpeedToPace(this.stats.grade.slopeSpeed.up);

      if (avgClimbPace !== -1) {
        const seconds: number = avgClimbPace / this.speedUnitsData.speedUnitFactor;
        if (seconds) {
          climbPaceDisplayed = Time.secToMilitary(seconds);
        }
      }

      this.insertContentAtGridPosition(
        1,
        3,
        climbPaceDisplayed,
        "Avg climbing pace",
        "/" + this.speedUnitsData.units,
        "displayAdvancedGradeData"
      );
    }

    if (this.userSettings.displayAdvancedPowerData) {
      let averageWatts = "-";
      let averageWattsTitle = "Average Power";
      const userSettingKey = "displayAdvancedPowerData";

      if (this.stats.power && this.stats.power.avg) {
        if (this.hasPowerMeter) {
          // Real running power data
          averageWatts = this.printNumber(this.stats.power.avg);
        } else {
          // Estimated power data..
          averageWattsTitle = "Estimated " + averageWattsTitle;
          averageWatts = "<span style='font-size: 14px;'>~</span>" + this.printNumber(this.stats.power.avg);
        }
      }

      this.insertContentAtGridPosition(0, 4, averageWatts, averageWattsTitle, "w", userSettingKey);
    }

    if (this.userSettings.displayAdvancedPowerData) {
      if (this.stats.power && this.stats.power.weighted && this.hasPowerMeter) {
        const weightedPower = this.printNumber(this.stats.power.weighted);
        this.insertContentAtGridPosition(1, 4, weightedPower, "Normalized Power®", "w", "displayAdvancedPowerData");
      }
    }

    if (this.userSettings.displayAdvancedSpeedData && this.activityInfo.isOwner && this.activityInfo.supportsGap) {
      let runningStressScore = "-";
      let labelRSS = "Running Stress Score";
      if (this.stats.pace && this.stats.scores?.stress?.rss) {
        runningStressScore =
          this.printNumber(this.stats.scores.stress.rss) +
          ' <span class="summarySubGridTitle">(' +
          this.printNumber(this.stats.scores.stress.rssPerHour, 1) +
          " / hour)</span>";
      } else if (this.stats.pace && !_.isNumber(this.athleteSnapshot.athleteSettings.runningFtp)) {
        labelRSS =
          "<span style='cursor: not-allowed'><i>No running FTP in dated athlete </br>settings for this activity date</i></span>";
      } else {
        labelRSS = 'Unable to display </br>"Running Stress Score"';
      }

      this.insertContentAtGridPosition(0, 5, runningStressScore, labelRSS, "", null);
    }

    if (
      this.userSettings.displayRunningPerformanceIndex &&
      this.activityInfo.isOwner &&
      _.isNumber(this.stats.scores?.runningRating)
    ) {
      const runIndex = this.printNumber(this.stats.scores.runningRating, 1);
      this.insertContentAtGridPosition(1, 4, runIndex, "Running Rating", "", "displayRunningPerformanceIndex");
    }
  }

  protected placeSummaryPanel(panelAdded: () => void): void {
    this.makeSummaryGrid(2, 6);
    super.placeSummaryPanel(panelAdded);
  }

  protected placeExtendedStatsButtonSegment(buttonAdded: () => void): void {
    setTimeout(() => {
      // Execute at the end to make sure DOM is ready
      let htmlButton = "<section>";
      htmlButton +=
        '<a class="btn-block btn-xs button raceshape-btn btn-primary" data-xtd-seg-effort-stats id="' +
        this.segmentEffortButtonId +
        '">';
      htmlButton += "Show extended statistics of effort";
      htmlButton += "</a>";
      htmlButton += "</section>";

      if ($("[data-xtd-seg-effort-stats]").length === 0) {
        $(".leaderboard-summary")
          .after(htmlButton)
          .each(() => {
            super.placeExtendedStatsButtonSegment(buttonAdded);
          });
      }
    });
  }

  protected setDataViewsNeeded(): void {
    super.setDataViewsNeeded();

    // Pace view
    if (this.stats.pace && this.userSettings.displayAdvancedSpeedData) {
      const measurementPreference: string = window.currentAthlete.get("measurement_preference");
      const units: string = measurementPreference === "meters" ? "/km" : "/mi";

      const paceView: PaceDataView = new PaceDataView(this.stats.pace, this.stats.scores.stress, units);
      paceView.setSupportsGap(this.activityInfo.supportsGap);
      paceView.setAppResources(this.appResources);
      paceView.setIsAuthorOfViewedActivity(this.activityInfo.isOwner);
      paceView.setIsSegmentEffortView(this.type === AbstractExtendedDataModifier.TYPE_SEGMENT);
      this.dataViews.push(paceView);
    }

    // Power data
    if (this.stats.power && this.userSettings.displayAdvancedPowerData) {
      // Is feature enable?

      if (this.hasPowerMeter) {
        const powerView: RunningPowerDataView = new RunningPowerDataView(this.stats.power, this.hasPowerMeter, "w");
        powerView.setAppResources(this.appResources);
        powerView.setIsAuthorOfViewedActivity(this.activityInfo.isOwner);
        powerView.setActivityType(this.activityType);
        powerView.setIsSegmentEffortView(this.type === AbstractExtendedDataModifier.TYPE_SEGMENT);
        this.dataViews.push(powerView);
      }
    }

    if (this.stats.cadence && this.userSettings.displayCadenceData) {
      const runningCadenceDataView: RunningCadenceDataView = new RunningCadenceDataView(
        this.stats.cadence,
        "spm",
        this.userSettings
      );
      runningCadenceDataView.setAppResources(this.appResources);
      runningCadenceDataView.setIsAuthorOfViewedActivity(this.activityInfo.isOwner);
      runningCadenceDataView.setIsSegmentEffortView(this.type === AbstractExtendedDataModifier.TYPE_SEGMENT);
      this.dataViews.push(runningCadenceDataView);
    }

    if (this.stats.grade && this.userSettings.displayAdvancedGradeData) {
      const runningGradeDataView: RunningGradeDataView = new RunningGradeDataView(this.stats.grade, "%");
      runningGradeDataView.setAppResources(this.appResources);
      runningGradeDataView.setIsAuthorOfViewedActivity(this.activityInfo.isOwner);
      runningGradeDataView.setIsSegmentEffortView(this.type === AbstractExtendedDataModifier.TYPE_SEGMENT);
      this.dataViews.push(runningGradeDataView);
    }

    if (this.stats.elevation && this.userSettings.displayAdvancedElevationData) {
      const elevationView: ElevationDataView = new ElevationDataView(this.stats.elevation, "m");
      elevationView.setAppResources(this.appResources);
      elevationView.setIsAuthorOfViewedActivity(this.activityInfo.isOwner);
      elevationView.setIsSegmentEffortView(this.type === AbstractExtendedDataModifier.TYPE_SEGMENT);
      this.dataViews.push(elevationView);
    }
  }
}
