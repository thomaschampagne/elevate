import { UserZonesModel } from "./user-zones.model";
import { BuildTarget } from "../../enums";
import _ from "lodash";

export namespace UserSettings {
  export const SYSTEM_UNIT_METRIC_KEY = "metric";
  export const SYSTEM_UNIT_IMPERIAL_KEY = "imperial";
  export const DEFAULT_TEMP_KEY = "C"; // TODO use Enum "C" or "F"

  export const getDefaultsByBuildTarget = (buildTarget: BuildTarget): UserSettingsModel => {
    if (buildTarget === BuildTarget.DESKTOP) {
      return _.cloneDeep(DesktopUserSettingsModel.DEFAULT_MODEL);
    } else if (buildTarget === BuildTarget.EXTENSION) {
      return _.cloneDeep(ExtensionUserSettingsModel.DEFAULT_MODEL);
    } else {
      throw new Error("Unknown environment target");
    }
  };

  export abstract class UserSettingsModel {
    public abstract readonly buildTarget: BuildTarget;
    public systemUnit: string;
    public temperatureUnit: string;
    public zones: UserZonesModel;
  }

  export class DesktopUserSettingsModel extends UserSettingsModel {
    public static readonly DEFAULT_MODEL: DesktopUserSettingsModel = {
      buildTarget: BuildTarget.DESKTOP,
      systemUnit: UserSettings.SYSTEM_UNIT_METRIC_KEY,
      zones: UserZonesModel.DEFAULT_MODEL,
      temperatureUnit: UserSettings.DEFAULT_TEMP_KEY
    };

    public buildTarget: BuildTarget = BuildTarget.DESKTOP;
  }

  export class ExtensionUserSettingsModel extends UserSettingsModel {
    public static readonly DEFAULT_MODEL: ExtensionUserSettingsModel = {
      buildTarget: BuildTarget.EXTENSION,
      localStorageMustBeCleared: false,
      systemUnit: UserSettings.SYSTEM_UNIT_METRIC_KEY,
      zones: UserZonesModel.DEFAULT_MODEL,
      remoteLinks: true,
      defaultLeaderBoardFilter: "overall",
      activateRunningGradeAdjustedPace: true,
      activateRunningHeartRate: true,
      activateRunningCadence: true,
      activateRunningTemperature: true,
      activityStravaMapType: "terrain",
      displaySegmentRankPercentage: true,
      displayNearbySegments: true,
      displayActivityRatio: true,
      displayAdvancedPowerData: true,
      displayAdvancedSpeedData: true,
      displayAdvancedHrData: true,
      displayCadenceData: true,
      displayAdvancedGradeData: true,
      displayAdvancedElevationData: true,
      displayBikeOdoInActivity: true,
      enableBothLegsCadence: true,
      feedChronologicalOrder: false,
      feedHideChallenges: false,
      feedHideCreatedRoutes: false,
      feedHidePosts: false,
      feedHideSuggestedAthletes: false,
      feedHideVirtualRides: false,
      feedHideRideActivitiesUnderDistance: 0,
      feedHideRunActivitiesUnderDistance: 0,
      displaySegmentTimeComparisonToKOM: false,
      displaySegmentTimeComparisonToPR: false,
      displaySegmentTimeComparisonToCurrentYearPR: false,
      displaySegmentTimeComparisonPosition: false,
      displayRecentEffortsHRAdjustedPacePower: false,
      displayRunningPerformanceIndex: true,
      reviveGoogleMaps: true,
      displayRunningPowerEstimation: true,
      reviveGoogleMapsLayerType: "terrain",
      displayActivityBestSplits: true,
      temperatureUnit: UserSettings.DEFAULT_TEMP_KEY,
      showHiddenBetaFeatures: false,
      displayReliveCCLink: true,
      displayWindyOverlay: false
    };

    public buildTarget: BuildTarget = BuildTarget.EXTENSION;
    public localStorageMustBeCleared: boolean;
    public remoteLinks: boolean;
    public defaultLeaderBoardFilter: string;
    public activateRunningGradeAdjustedPace: boolean;
    public activateRunningHeartRate: boolean;
    public activateRunningCadence: boolean;
    public activateRunningTemperature: boolean;
    public activityStravaMapType: string;
    public displaySegmentRankPercentage: boolean;
    public displayNearbySegments: boolean;
    public displayActivityRatio: boolean;
    public displayAdvancedPowerData: boolean;
    public displayAdvancedSpeedData: boolean;
    public displayAdvancedHrData: boolean;
    public displayCadenceData: boolean;
    public displayAdvancedGradeData: boolean;
    public displayAdvancedElevationData: boolean;
    public displayBikeOdoInActivity: boolean;
    public enableBothLegsCadence: boolean;
    public feedChronologicalOrder: boolean;
    public feedHideChallenges: boolean;
    public feedHideCreatedRoutes: boolean;
    public feedHideSuggestedAthletes: boolean;
    public feedHidePosts: boolean;
    public feedHideVirtualRides: boolean;
    public feedHideRideActivitiesUnderDistance: number;
    public feedHideRunActivitiesUnderDistance: number;
    public displaySegmentTimeComparisonToKOM: boolean;
    public displaySegmentTimeComparisonToPR: boolean;
    public displaySegmentTimeComparisonToCurrentYearPR: boolean;
    public displaySegmentTimeComparisonPosition: boolean;
    public displayRunningPerformanceIndex: boolean;
    public reviveGoogleMaps: boolean;
    public displayRecentEffortsHRAdjustedPacePower: boolean;
    public displayRunningPowerEstimation: boolean;
    public reviveGoogleMapsLayerType: string;
    public displayActivityBestSplits: boolean;
    public showHiddenBetaFeatures: boolean;
    public displayReliveCCLink: boolean;
    public displayWindyOverlay: boolean;
  }
}
