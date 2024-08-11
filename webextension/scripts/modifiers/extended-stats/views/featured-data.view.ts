import _ from "lodash";
import { Helper } from "../../../helper";
import { AbstractDataView } from "./abstract-data.view";
import { UserSettings } from "@elevate/shared/models/user-settings/user-settings.namespace";
import { ActivityStats } from "@elevate/shared/models/sync/activity.model";
import { SpeedUnitDataModel } from "@elevate/shared/models/activity-data/speed-unit-data.model";
import { ActivityInfoModel } from "@elevate/shared/models/activity-data/activity-info.model";
import ExtensionUserSettings = UserSettings.ExtensionUserSettings;

export class FeaturedDataView extends AbstractDataView {
  constructor(
    protected stats: ActivityStats,
    protected activityInfo: ActivityInfoModel,
    protected userSettings: ExtensionUserSettings,
    protected hasPowerMeter: boolean
  ) {
    super(null);
    this.hasGraph = false;
    this.stats = stats;
    this.userSettings = userSettings;
    this.activityInfo = activityInfo;

    if (!this.stats || !this.userSettings) {
      console.error("stats and userSettingsData are required");
    }

    if (this.isSegmentEffortView && !_.isEmpty(this.activityInfo.segmentEffort)) {
      this.mainColor = [252, 76, 2];
    }
  }

  public render(): void {
    if (
      (this.stats.moveRatio && this.userSettings.displayActivityRatio) ||
      (this.stats.speed && this.userSettings.displayAdvancedSpeedData) ||
      (this.stats.heartRate && this.userSettings.displayAdvancedHrData) ||
      (this.stats.power && this.userSettings.displayAdvancedPowerData) ||
      (this.stats.grade && this.userSettings.displayAdvancedGradeData)
    ) {
      // Add a title
      this.makeGrid(9, 1); // (col, row)

      this.insertDataIntoGrid();

      this.content += '<div class="featuredData">' + this.grid.html() + "</div>";
    }
  }

  protected insertDataIntoGrid(): void {
    const speedUnitsData: SpeedUnitDataModel = Helper.getSpeedUnitData(
      window.currentAthlete.get("measurement_preference")
    );

    if (this.stats.moveRatio && this.userSettings.displayActivityRatio && _.isEmpty(this.activityInfo.segmentEffort)) {
      this.insertContentAtGridPosition(
        0,
        0,
        this.printNumber(this.stats.moveRatio, 2),
        "Move Ratio",
        "",
        "displayActivityRatio"
      ); // Move ratio
    }

    if (this.stats.speed && this.userSettings.displayAdvancedSpeedData) {
      this.insertContentAtGridPosition(
        1,
        0,
        this.printNumber(this.stats.speed.upperQ * speedUnitsData.speedUnitFactor, 1),
        "75% Quartile Speed",
        speedUnitsData.speedUnitPerHour,
        "displayAdvancedSpeedData"
      ); // Q3 Speed
    }

    if (this.stats.heartRate && this.stats.scores?.stress?.hrss && this.userSettings.displayAdvancedHrData) {
      this.insertContentAtGridPosition(
        2,
        0,
        this.printNumber(this.stats.scores.stress.hrss, 0),
        "HRSS",
        "",
        "displayAdvancedHrData"
      );
      this.insertContentAtGridPosition(
        3,
        0,
        this.printNumber(this.stats.scores.stress.hrssPerHour, 1),
        "HRSS / Hour",
        "",
        "displayAdvancedHrData"
      );
    }

    if (this.stats.power && this.userSettings.displayAdvancedPowerData) {
      if (_.isNumber(this.stats.power.best20min) && !this.isSegmentEffortView) {
        let label = "Best 20min Power";
        if (!this.hasPowerMeter) {
          label = "Estimated " + label;
        }
        this.insertContentAtGridPosition(
          4,
          0,
          this.printNumber(this.stats.power.best20min, 0),
          label,
          "w",
          "displayAdvancedPowerData"
        ); // Avg watt /kg
      }

      if (_.isNumber(this.stats.power.weightedKg)) {
        let label = "Normalized Power®/kg";
        if (!this.activityInfo) {
          label = "Estimated " + label;
        }
        this.insertContentAtGridPosition(
          5,
          0,
          this.printNumber(this.stats.power.weightedKg, 2),
          label,
          "w/kg",
          "displayAdvancedPowerData"
        ); // Avg watt /kg
      }
    }

    if (this.stats.grade && this.userSettings.displayAdvancedGradeData) {
      this.insertContentAtGridPosition(
        6,
        0,
        this.stats.grade.slopeProfile,
        "Slope Profile",
        "",
        "displayAdvancedGradeData"
      );
    }
    if (this.stats?.scores?.efficiency && this.userSettings.displayAdvancedPowerData) {
      this.insertContentAtGridPosition(
        7,
        0,
        this.stats.scores.efficiency,
        "Efficiency Factor <sup style='color:#FC4C02; font-size:12px; position: initial;'>NEW</sup>",
        "",
        "displayAdvancedPowerData"
      );
    }

    if (this.stats?.scores?.powerHr && this.userSettings.displayAdvancedPowerData) {
      this.insertContentAtGridPosition(8, 0, this.stats.scores.powerHr, "Power / HR", "", "displayAdvancedPowerData");
    }

    // Remove empty case in grid. This avoids unwanted padding on feature view rendering
    this.grid.find("td:empty").remove();
  }
}
