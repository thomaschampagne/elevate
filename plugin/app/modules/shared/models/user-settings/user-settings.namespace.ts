import { UserZonesModel } from "./user-zones.model";
import { EnvTarget } from "../env-target";

export namespace UserSettings {

	export const SYSTEM_UNIT_METRIC_KEY: string = "metric";
	export const SYSTEM_UNIT_IMPERIAL_KEY: string = "imperial";
	export const DEFAULT_TEMP_KEY: string = "C"; // TODO use Enum "C" or "F"

	export const getDefaultsByEnvTarget = (envTarget: EnvTarget): UserSettingsModel => {

		if (envTarget === EnvTarget.DESKTOP) {
			return DesktopUserSettingsModel.DEFAULT_MODEL;
		} else if (envTarget === EnvTarget.EXTENSION) {
			return ExtensionUserSettingsModel.DEFAULT_MODEL;
		} else {
			throw new Error("Unknown environment target");
		}
	};

	export abstract class UserSettingsModel {
		public abstract readonly envTarget: EnvTarget;
		public systemUnit: string;
		public temperatureUnit: string;
		public zones: UserZonesModel;
	}

	export class DesktopUserSettingsModel extends UserSettingsModel {

		public static readonly DEFAULT_MODEL: DesktopUserSettingsModel = {
			envTarget: EnvTarget.DESKTOP,
			systemUnit: UserSettings.SYSTEM_UNIT_METRIC_KEY,
			zones: UserZonesModel.DEFAULT_MODEL,
			temperatureUnit: UserSettings.DEFAULT_TEMP_KEY,
		};

		public envTarget: EnvTarget = EnvTarget.DESKTOP;

	}

	export class ExtensionUserSettingsModel extends UserSettingsModel {

		public static readonly DEFAULT_MODEL: ExtensionUserSettingsModel = {
			envTarget: EnvTarget.EXTENSION,
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
			displaySegmentTimeComparisonToKOM: true,
			displaySegmentTimeComparisonToPR: true,
			displaySegmentTimeComparisonToCurrentYearPR: true,
			displaySegmentTimeComparisonPosition: true,
			displayRecentEffortsHRAdjustedPacePower: false,
			reviveGoogleMaps: true,
			displayRunningPowerEstimation: true,
			reviveGoogleMapsLayerType: "terrain",
			displayActivityBestSplits: true,
			temperatureUnit: UserSettings.DEFAULT_TEMP_KEY,
			showHiddenBetaFeatures: false,
			displayReliveCCLink: true,
			displayWindyOverlay: false
		};

		public envTarget: EnvTarget = EnvTarget.EXTENSION;
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

