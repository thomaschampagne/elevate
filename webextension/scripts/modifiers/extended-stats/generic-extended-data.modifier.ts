import { AbstractExtendedDataModifier } from "./abstract-extended-data.modifier";
import { SpeedDataView } from "./views/speed-data.view";
import { CyclingGradeDataView } from "./views/cycling-grade-data.view";
import { ElevationDataView } from "./views/elevation-data.view";
import { PaceDataView } from "./views/pace-data.view";
import { ActivityProcessor } from "../../processors/activity-processor";
import { AppResourcesModel } from "../../models/app-resources.model";
import { UserSettings } from "@elevate/shared/models/user-settings/user-settings.namespace";
import { ActivityInfoModel } from "@elevate/shared/models/activity-data/activity-info.model";
import ExtensionUserSettings = UserSettings.ExtensionUserSettings;

export class GenericExtendedDataModifier extends AbstractExtendedDataModifier {
  constructor(
    activityProcessor: ActivityProcessor,
    activityInfo: ActivityInfoModel,
    appResources: AppResourcesModel,
    userSettings: ExtensionUserSettings,
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
    if (this.stats.speed && this.userSettings.displayAdvancedSpeedData) {
      const measurementPreference: string = window.currentAthlete.get("measurement_preference");
      const units: string = measurementPreference === "meters" ? "kph" : "mph";
      const speedDataView: SpeedDataView = new SpeedDataView(this.stats.speed, units);
      speedDataView.setAppResources(this.appResources);
      speedDataView.setIsAuthorOfViewedActivity(this.activityInfo.isOwner);
      speedDataView.setActivityType(this.activityType);
      speedDataView.setIsSegmentEffortView(this.type === AbstractExtendedDataModifier.TYPE_SEGMENT);
      this.dataViews.push(speedDataView);
    }

    if (this.stats.pace && this.userSettings.displayAdvancedSpeedData) {
      const measurementPreference: string = window.currentAthlete.get("measurement_preference");
      const units: string = measurementPreference === "meters" ? "/km" : "/mi";

      const paceView: PaceDataView = new PaceDataView(this.stats.pace, this.stats.scores.stress, units);
      paceView.setAppResources(this.appResources);
      paceView.setIsAuthorOfViewedActivity(this.activityInfo.isOwner);
      paceView.setIsSegmentEffortView(this.type === AbstractExtendedDataModifier.TYPE_SEGMENT);
      this.dataViews.push(paceView);
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
