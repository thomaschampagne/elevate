import { ZoneModel } from "./ActivityData";

export interface UserZonesModel {
	speed: ZoneModel[];
	pace: ZoneModel[];
	heartRate: ZoneModel[];
	power: ZoneModel[];
	runningPower: ZoneModel[];
	cyclingCadence: ZoneModel[];
	runningCadence: ZoneModel[];
	grade: ZoneModel[];
	elevation: ZoneModel[];
	ascent: ZoneModel[];
}

export interface UserSettingsModel {
	autoSyncMinutes: number;
	localStorageMustBeCleared: boolean;
	systemUnit: string;
	userGender: string;
	userMaxHr: number;
	userRestHr: number;
	userFTP: number;
	userSwimFTP: number;
	userWeight: number;
	zones: UserZonesModel;
	targetsYearRide: number;
	targetsYearRun: number;
	remoteLinks: boolean;
	feedAutoScroll: boolean;
	defaultLeaderBoardFilter: string;
	activateRunningGradeAdjustedPace: boolean;
	activateRunningHeartRate: boolean;
	activateRunningCadence: boolean;
	activateRunningTemperature: boolean;
	activityStravaMapType: string;
	displaySegmentRankPercentage: boolean;
	displayNearbySegments: boolean;
	displayMotivationScore: boolean;
	displayActivityRatio: boolean;
	displayAdvancedPowerData: boolean;
	displayAdvancedSpeedData: boolean;
	displayAdvancedHrData: boolean;
	displayCadenceData: boolean;
	displayAdvancedGradeData: boolean;
	displayAdvancedElevationData: boolean;
	displayBikeOdoInActivity: boolean;
	enableBothLegsCadence: boolean;
	feedHideChallenges: boolean;
	feedHideCreatedRoutes: boolean;
	feedHideSuggestedAthletes: boolean;
	feedHideVirtualRides: boolean;
	feedHideRideActivitiesUnderDistance: number;
	feedHideRunActivitiesUnderDistance: number;
	displaySegmentTimeComparisonToKOM: boolean;
	displaySegmentTimeComparisonToPR: boolean;
	displaySegmentTimeComparisonToCurrentYearPR: boolean;
	displaySegmentTimeComparisonPosition: boolean;
	reviveGoogleMaps: boolean;
	displayRecentEffortsHRAdjustedPacePower: boolean;
	displayRunningPowerEstimation: boolean;
	reviveGoogleMapsLayerType: string;
	displayActivityBestSplits: boolean;
	bestSplitsConfiguration: any; // TODO Type this !
	temperatureUnit: string;
	showHiddenBetaFeatures: boolean;
	displayReliveCCLink: boolean;
}
