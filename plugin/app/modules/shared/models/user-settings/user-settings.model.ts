import { UserZonesModel } from "./user-zones.model";
import { AthleteModel } from "../athlete";

export class UserSettingsModel {

	public static readonly SYSTEM_UNIT_METRIC_KEY = "metric";
	public static readonly SYSTEM_UNIT_IMPERIAL_KEY = "imperial";

	public localStorageMustBeCleared: boolean;
	public systemUnit: string;
	public hasDatedAthleteSettings: boolean;
	public athleteModel: AthleteModel;
	public zones: UserZonesModel;
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
	public temperatureUnit: string;
	public showHiddenBetaFeatures: boolean;
	public displayReliveCCLink: boolean;
	public displayWindyOverlay: boolean;
}
