import { UserLactateThresholdModel } from "./user-lactate-threshold.model";
import { UserZonesModel } from "./user-zones.model";

export class UserSettingsModel {

	public static readonly SYSTEM_UNIT_METRIC_KEY = "metric";
	public static readonly SYSTEM_UNIT_IMPERIAL_KEY = "imperial";

	public autoSyncMinutes: number;
	public localStorageMustBeCleared: boolean;
	public systemUnit: string;
	public userGender: string;
	public userMaxHr: number;
	public userRestHr: number;
	public userLTHR: UserLactateThresholdModel;
	public userFTP: number;
	public userSwimFTP: number;
	public userWeight: number;
	public zones: UserZonesModel;
	public targetsYearRide: number;
	public targetsYearRun: number;
	public remoteLinks: boolean;
	public defaultLeaderBoardFilter: string;
	public activateRunningGradeAdjustedPace: boolean;
	public activateRunningHeartRate: boolean;
	public activateRunningCadence: boolean;
	public activateRunningTemperature: boolean;
	public activityStravaMapType: string;
	public displaySegmentRankPercentage: boolean;
	public displayNearbySegments: boolean;
	public displayMotivationScore: boolean;
	public displayActivityRatio: boolean;
	public displayAdvancedPowerData: boolean;
	public displayAdvancedSpeedData: boolean;
	public displayAdvancedHrData: boolean;
	public displayCadenceData: boolean;
	public displayAdvancedGradeData: boolean;
	public displayAdvancedElevationData: boolean;
	public displayBikeOdoInActivity: boolean;
	public enableBothLegsCadence: boolean;
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
	public bestSplitsConfiguration: any; // TODO Type this !
	public temperatureUnit: string;
	public showHiddenBetaFeatures: boolean;
	public displayReliveCCLink: boolean;
}
