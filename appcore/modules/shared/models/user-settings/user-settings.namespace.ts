import { UserZonesModel } from "./user-zones.model";
import _ from "lodash";
import { Temperature } from "../../enums/temperature.enum";
import { MeasureSystem } from "../../enums/measure-system.enum";
import { BuildTarget } from "../../enums/build-target.enum";
import { MapBoxType } from "@elevate/shared/enums/mapbox-type.enum";

export namespace UserSettings {
  export const DEFAULT_TEMPERATURE = Temperature.CELSIUS;
  export const DISABLE_MISSING_STRESS_SCORES_WARNING = false;
  export const DISABLE_ACTIVITIES_NEED_RECALCULATION_WARNING = false;
  export const DEFAULT_MAP_TYPE = MapBoxType.OUTDOOR;

  export type Props =
    | keyof UserSettings.BaseUserSettings
    | keyof UserSettings.DesktopUserSettings
    | keyof UserSettings.ExtensionUserSettings;

  export const getDefaultsByBuildTarget = (buildTarget: BuildTarget): BaseUserSettings => {
    if (buildTarget === BuildTarget.DESKTOP) {
      return _.cloneDeep(DesktopUserSettings.DEFAULT_MODEL);
    } else if (buildTarget === BuildTarget.EXTENSION) {
      return _.cloneDeep(ExtensionUserSettings.DEFAULT_MODEL);
    } else {
      throw new Error("Unknown environment target");
    }
  };

  export abstract class BaseUserSettings {
    public abstract readonly buildTarget: BuildTarget;
    public systemUnit: MeasureSystem;
    public temperatureUnit: Temperature;
    public disableMissingStressScoresWarning: boolean;
    public disableActivitiesNeedRecalculationWarning: boolean;
    public zones: UserZonesModel;
  }

  export class DesktopUserSettings extends BaseUserSettings {
    public static readonly DEFAULT_MODEL: DesktopUserSettings = {
      buildTarget: BuildTarget.DESKTOP,
      systemUnit: MeasureSystem.METRIC,
      temperatureUnit: UserSettings.DEFAULT_TEMPERATURE,
      disableMissingStressScoresWarning: DISABLE_MISSING_STRESS_SCORES_WARNING,
      disableActivitiesNeedRecalculationWarning: DISABLE_ACTIVITIES_NEED_RECALCULATION_WARNING,
      zones: UserZonesModel.DEFAULT_MODEL,
      defaultMapType: DEFAULT_MAP_TYPE,
      mapToken: null
    };

    public buildTarget: BuildTarget = BuildTarget.DESKTOP;

    public defaultMapType: MapBoxType = DEFAULT_MAP_TYPE;
    public mapToken: string = null;
  }

  export class ExtensionUserSettings extends BaseUserSettings {
    public static readonly DEFAULT_MODEL: ExtensionUserSettings = {
      buildTarget: BuildTarget.EXTENSION,
      localStorageMustBeCleared: false,
      systemUnit: MeasureSystem.METRIC,
      disableMissingStressScoresWarning: DISABLE_MISSING_STRESS_SCORES_WARNING,
      disableActivitiesNeedRecalculationWarning: DISABLE_ACTIVITIES_NEED_RECALCULATION_WARNING,
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
      reviveGoogleMapsLayerType: "terrain",
      displayActivityBestSplits: true,
      temperatureUnit: UserSettings.DEFAULT_TEMPERATURE,
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
    public reviveGoogleMapsLayerType: string;
    public displayActivityBestSplits: boolean;
    public showHiddenBetaFeatures: boolean;
    public displayReliveCCLink: boolean;
    public displayWindyOverlay: boolean;
  }
}
