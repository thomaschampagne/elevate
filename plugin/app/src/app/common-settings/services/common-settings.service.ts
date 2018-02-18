import { Injectable } from "@angular/core";
import { SectionModel } from "../models/section.model";
import { UserSettingsModel } from "../../../../../common/scripts/models/UserSettings";

@Injectable()
export class CommonSettingsService {

	public static readonly TYPE_OPTION_CHECKBOX: string = "checkbox";
	public static readonly TYPE_OPTION_LIST: string = "list";
	public static readonly TYPE_OPTION_NUMBER: string = "number";

	public sections: SectionModel[] = [{
		title: "Units",
		options: [{
			key: "systemUnit",
			type: "list",
			labels: ["All"],
			list: [{
				key: UserSettingsModel.SYSTEM_UNIT_METRIC_KEY,
				name: "Metric",
			}, {
				key: UserSettingsModel.SYSTEM_UNIT_IMPERIAL_KEY,
				name: "Imperial",
			}],
			title: "App system units",
		}, {
			key: "temperatureUnit",
			type: "list",
			labels: ["All"],
			list: [{
				key: "F",
				name: "Fahrenheit",
			}, {
				key: "C",
				name: "Celsius",
			}],
			title: "Temperature",
		}],
	}, {
		title: "Athlete History Synchronisation",
		options: [{
			key: "autoSyncMinutes",
			type: "number",
			title: "Auto sync every X minutes while browsing strava.com",
			labels: ["All"],
			min: 10,
			max: 43200, // 30 days
			step: 1,
			disableTooltip: true,
		}],
	}, {
		title: "Activities Extended Statistics",
		options: [{
			key: "displayActivityRatio",
			type: "checkbox",
			title: "Move Ratio stat",
			labels: ["Cycling", "Running"],
		}, {
			key: "displayMotivationScore",
			type: "checkbox",
			title: "Toughness Factor stat",
			labels: ["Cycling"],
		}, {
			key: "displayAdvancedPowerData",
			type: "checkbox",
			title: "Power stats",
			enableSubOption: ["displayRunningPowerEstimation"],
			labels: ["Cycling", "Running"],
		}, {
			key: "displayRunningPowerEstimation",
			type: "checkbox",
			title: "Running power estimation (your activities only)",
			labels: ["Running"],
		}, {
			key: "displayAdvancedHrData",
			type: "checkbox",
			title: "Heart rate stats",
			labels: ["Cycling", "Running"],
		}, {
			key: "displayAdvancedSpeedData",
			type: "checkbox",
			title: "Speed/Pace stats",
			labels: ["Cycling", "Running"],
		}, {
			key: "displayCadenceData",
			type: "checkbox",
			title: "Cadence stats",
			labels: ["Cycling", "Running"],
		}, {
			key: "displayAdvancedGradeData",
			type: "checkbox",
			title: "Grade stats",
			labels: ["Cycling", "Running"],
		}, {
			key: "displayAdvancedElevationData",
			type: "checkbox",
			title: "Elevation stats",
			labels: ["Cycling", "Running"],
		}],
	}, {
		title: "Activity viewing options",
		options: [{
			key: "enableBothLegsCadence",
			type: "checkbox",
			title: "Enable both legs extended cadence data",
			labels: ["Running"],
		}, {
			key: "displayBikeOdoInActivity",
			type: "checkbox",
			title: "Enable bike odo display",
			labels: ["Cycling"],
		}, {
			key: "activateRunningGradeAdjustedPace",
			type: "checkbox",
			title: "Enable Grade Adjusted Pace graph",
			labels: ["Running"],
		}, {
			key: "activateRunningHeartRate",
			type: "checkbox",
			title: "Enable Heart Rate graph",
			labels: ["Running"],
		}, {
			key: "activateRunningTemperature",
			type: "checkbox",
			title: "Enable Temperature graph",
			labels: ["Running"],
		}, {
			key: "activateRunningCadence",
			type: "checkbox",
			title: "Enable Cadence graph",
			labels: ["Running"],
		}, {
			key: "activityStravaMapType",
			type: "list",
			labels: ["All"],
			list: [{
				key: "terrain",
				name: "Terrain",
			}, {
				key: "standard",
				name: "Standard",
			}, {
				key: "satellite",
				name: "Satellite",
			}],
			title: "Default Strava Map type displayed in activities",
		}, {
			key: "displaySegmentTimeComparisonToKOM",
			type: "checkbox",
			title: "Enabled segment time comparison to KOM/QOM display",
			labels: ["All"],
		}, {
			key: "displaySegmentTimeComparisonToPR",
			type: "checkbox",
			title: "Enabled segment time comparison to PR display",
			labels: ["All"],
		}, {
			key: "displaySegmentTimeComparisonToCurrentYearPR",
			type: "checkbox",
			title: "Enabled segment time comparison to current year PR display",
			labels: ["All"],
		}, {
			key: "displaySegmentTimeComparisonPosition",
			type: "checkbox",
			title: "Enabled segment time comparison rank column",
			labels: ["All"],
		}, {
			key: "reviveGoogleMaps",
			type: "checkbox",
			title: "Revive Google Maps on activities",
			labels: ["All"],
			enableSubOption: ["reviveGoogleMapsLayerType"],
		}, {
			key: "reviveGoogleMapsLayerType",
			type: "list",
			labels: ["All"],
			list: [{
				key: "roadmap",
				name: "Roadmap",
			}, {
				key: "satellite",
				name: "Satellite",
			}, {
				key: "hybrid",
				name: "Satellite + Legends",
			}, {
				key: "terrain",
				name: "Terrain",
			}],
			title: "Default Google Maps layer type",
		}, {
			key: "displayActivityBestSplits",
			type: "checkbox",
			title: "Enable best splits into your cycling activities",
			labels: ["Cycling"],
		}, {
			key: "defaultLeaderBoardFilter",
			type: "list",
			labels: ["All"],
			list: [{
				key: "overall",
				name: "Overall",
			}, {
				key: "men",
				name: "Men",
			}, {
				key: "women",
				name: "Women",
			}, {
				key: "following",
				name: "Following",
			}, {
				key: "my_results",
				name: "My Results",
			}],
			title: "Default Leaderboard Filter",
		}, {
			key: "displayReliveCCLink",
			type: "checkbox",
			title: "Relive your rides/runs with relive.cc",
			labels: ["Cycling", "Running"],
		}],
	}, {
		title: "Segments viewing options",
		options: [{
			key: "displaySegmentRankPercentage",
			type: "checkbox",
			title: "Segment Rank %",
			labels: ["All"],
		}, {
			key: "displayNearbySegments",
			type: "checkbox",
			title: "Nearby Segments",
			labels: ["Cycling", "Running"],
		}],

	}, {
		title: "Activities and Segments viewing options",
		options: [{
			key: "remoteLinks",
			type: "checkbox",
			title: "Enable Veloviewer & Segment details remote views",
			labels: ["All"],
		}],
	}, {
		title: "Dashboard",
		options: [{
			key: "feedHideChallenges",
			type: "checkbox",
			title: "Hide challenges",
			labels: ["All"],
		}, {
			key: "feedHideCreatedRoutes",
			type: "checkbox",
			title: "Hide created routes",
			labels: ["All"],
		}, {
			key: "feedHidePosts",
			type: "checkbox",
			title: "Hide posts",
			labels: ["All"],
		}, {
			key: "feedHideSuggestedAthletes",
			type: "checkbox",
			title: "Hide suggested athletes",
			labels: ["All"],
		}, {
			key: "feedHideVirtualRides",
			type: "checkbox",
			title: "Hide virtual rides.",
			labels: ["Cycling"],
			min: 0,
		}, {
			key: "feedHideRideActivitiesUnderDistance",
			type: "number",
			title: "Hide rides activities under distance.",
			labels: ["Cycling"],
			min: 0,
		}, {
			key: "feedHideRunActivitiesUnderDistance",
			type: "number",
			title: "Hide running activities under distance.",
			labels: ["Running"],
			min: 0,
		}],
	}, {
		title: "StravistiX Year progression targets for " + (new Date()).getFullYear(),
		options: [{
			key: "targetsYearRide",
			type: "number",
			title: "Cycling distance target for " + (new Date()).getFullYear(),
			labels: ["Cycling"],
			min: 0,
		}, {
			key: "targetsYearRun",
			type: "number",
			title: "Running distance target for " + (new Date()).getFullYear(),
			labels: ["Running"],
			min: 0,
		}],
	}, {
		title: "Hidden/Beta features",
		options: [{
			key: "showHiddenBetaFeatures",
			type: "checkbox",
			title: "Enable Hidden/Beta features",
			labels: ["All"],
			enableSubOption: ["displayRecentEffortsHRAdjustedPacePower"],
		}, {
			key: "displayRecentEffortsHRAdjustedPacePower",
			type: "checkbox",
			title: "Display running estimated paces & cycling estimated powers from most painful effort on a segment (Experimental)",
			labels: ["Cycling", "Running"],
		}]
	}];

}
