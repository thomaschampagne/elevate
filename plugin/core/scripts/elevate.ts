import * as _ from "lodash";
import { Helper } from "./helper";
import {
	ActivityBasicInfoModel,
	AppStorageType,
	DatedAthleteSettingsModel,
	Gender,
	ReleaseNoteModel,
	SyncResultModel,
	UserSettingsModel
} from "@elevate/shared/models";
import { AppStorage } from "./app-storage";
import { CoreEnv } from "../config/core-env";
import { AppResourcesModel } from "./models/app-resources.model";
import { AthleteUpdateModel } from "./models/athlete-update.model";
import { ActivitiesSyncModifier } from "./modifiers/activities-sync.modifier";
import { ActivityBestSplitsModifier } from "./modifiers/activity-best-splits.modifier";
import { ActivityBikeOdoModifier } from "./modifiers/activity-bike-odo.modifier";
import { ActivityQRCodeDisplayModifier } from "./modifiers/activity-qrcode-display.modifier";
import { ActivitySegmentTimeComparisonModifier } from "./modifiers/activity-segment-time-comparison.modifier";
import { ActivityStravaMapTypeModifier } from "./modifiers/activity-strava-map-type.modifier";
import { AthleteStatsModifier } from "./modifiers/athlete-stats.modifier";
import { DefaultLeaderBoardFilterModifier } from "./modifiers/default-leader-board-filter.modifier";
import { DisplayFlyByFeedModifier } from "./modifiers/display-flyby-feed.modifier";
import { AbstractExtendedDataModifier } from "./modifiers/extended-stats/abstract-extended-data.modifier";
import { CyclingExtendedDataModifier } from "./modifiers/extended-stats/cycling-extended-data.modifier";
import { RunningExtendedDataModifier } from "./modifiers/extended-stats/running-extended-data.modifier";
import { GoogleMapsModifier } from "./modifiers/google-maps.modifier";
import { HideFeedModifier } from "./modifiers/hide-feed.modifier";
import { MenuModifier } from "./modifiers/menu.modifier";
import { NearbySegmentsModifier } from "./modifiers/nearby-segments.modifier";
import { ReliveCCModifier } from "./modifiers/relivecc.modifier";
import { RemoteLinksModifier } from "./modifiers/remote-links.modifier";
import {
	RunningCadenceModifier,
	RunningGradeAdjustedPaceModifier,
	RunningHeartRateModifier,
	RunningTemperatureModifier,
} from "./modifiers/running-data.modifier";
import { RunningAnalysisGraph } from "./modifiers/running-analysis-graph.modifier";
import { SegmentRankPercentageModifier } from "./modifiers/segment-rank-percentage.modifier";
import { SegmentRecentEffortsHRATimeModifier } from "./modifiers/segment-recent-efforts-hratime.modifier";
import { VirtualPartnerModifier } from "./modifiers/virtual-partner.modifier";
import { WindyTyModifier } from "./modifiers/windyty.modifier";
import { ActivityProcessor } from "./processors/activity-processor";
import { BikeOdoProcessor } from "./processors/bike-odo-processor";
import { ISegmentInfo, SegmentProcessor } from "./processors/segment-processor";
import { VacuumProcessor } from "./processors/vacuum-processor";
import { ActivitiesSynchronizer } from "./processors/activities-synchronizer";
import * as Q from "q";
import { AthleteUpdate } from "./utils/athlete-update";
import "./follow";
import * as Cookies from "js-cookie";
import { ActivityFeedModifier } from "./modifiers/activity-feed-modifier";
import { AthleteModelResolver } from "@elevate/shared/resolvers";
import { releaseNotesData } from "@elevate/shared/data";

export class Elevate {

	public static instance: Elevate = null;

	public static LOCAL_VERSION_INSTALLED_KEY = "versionInstalled";
	public static LOCAL_DATED_ATHLETE_SETTINGS_KEY = "datedAthleteSettings";

	public isPro: boolean;
	public isPremium: boolean;
	public athleteName: string;
	public activityAthleteId: number;
	public activityId: number;
	public athleteId: number;
	public athleteModelResolver: AthleteModelResolver;
	public isActivityAuthor: boolean;
	public extensionId: string;
	public appResources: AppResourcesModel;
	public userSettings: UserSettingsModel;
	public vacuumProcessor: VacuumProcessor;
	public activitiesSynchronizer: ActivitiesSynchronizer;

	constructor(userSettings: UserSettingsModel, appResources: AppResourcesModel) {

		this.userSettings = userSettings;
		this.appResources = appResources;

		if (Elevate.instance == null) {
			Elevate.instance = this;
		}
	}

	public run(): void {

		this.init().then(() => {

			// Redirect app.strava.com/* to www.strava.com/*
			if (this.handleForwardToWWW()) {
				return; // Skip rest of init to be compliant with www.strava.com/* on next reload
			}

			// Handle some tasks when install/update occurs
			this.handlePluginInstallOrUpgrade();

			if (CoreEnv.preview) {
				this.handlePreviewRibbon();
			}

			if (this.userSettings.localStorageMustBeCleared) {

				localStorage.clear();

				AppStorage.getInstance().set<boolean>(AppStorageType.SYNC, "localStorageMustBeCleared", false).then(() => {
					return AppStorage.getInstance().get<boolean>(AppStorageType.SYNC, "localStorageMustBeCleared");
				}).then((result: boolean) => {
					console.log("localStorageMustBeCleared is now " + result);
				});

			}

			// Init "elevate bridge"
			window.__elevate_bridge__ = {}; // TODO Find another solution

			if (CoreEnv.debugMode) {
				console.log("Handling " + window.location.pathname);
			}

			// Common
			this.handleMenu();
			this.handleRemoteLinks();
			this.handleWindyTyModifier();
			this.handleReliveCCModifier();
			this.handleDefaultLeaderboardFilter();
			this.handleSegmentRankPercentage();
			this.handleSegmentHRAP();
			this.handleActivityStravaMapType();
			this.handleActivityFeedModifier();
			this.handleHideFeed();
			this.handleDisplayFlyByFeedModifier();
			this.handleOnFlyActivitiesSync();
			this.handleActivitiesSyncFromOutside();

			// Bike
			this.handleExtendedActivityData();
			this.handleExtendedSegmentEffortData();
			this.handleNearbySegments();
			this.handleActivityBikeOdo();
			this.handleActivitySegmentTimeComparison();
			this.handleActivityBestSplits();

			// Run
			this.handleRunningGradeAdjustedPace();
			this.handleRunningHeartRate();
			this.handleRunningCadence();
			this.handleRunningTemperature();
			this.handleRunningAnalysisGraph();

			// All activities
			this.handleActivityQRCodeDisplay();
			this.handleVirtualPartner();
			this.handleAthletesStats();
			this.handleActivitiesSummary();

			// Must be done at the end
			this.handleTrackTodayIncomingConnection();
			this.handleAthleteUpdate();
			this.saveAthleteId();
			this.handleGoogleMapsComeBackModifier();
		});
	}

	public init(): Promise<void> {

		this.extensionId = this.appResources.extensionId;

		if (!AppStorage.getInstance().hasExtensionId()) {
			AppStorage.getInstance().setExtensionId(this.extensionId);
		}

		return this.initAthleteModelResolver().then(() => {
			this.vacuumProcessor = new VacuumProcessor();
			this.athleteId = this.vacuumProcessor.getAthleteId();
			this.athleteName = this.vacuumProcessor.getAthleteName();
			this.activityAthleteId = this.vacuumProcessor.getActivityAthleteId();
			this.isActivityAuthor = (this.activityAthleteId === this.athleteId);
			this.isPremium = this.vacuumProcessor.getPremiumStatus();
			this.isPro = this.vacuumProcessor.getProStatus();
			this.activityId = this.vacuumProcessor.getActivityId();
			this.activitiesSynchronizer = new ActivitiesSynchronizer(this.appResources, this.userSettings, this.athleteModelResolver);

			return Promise.resolve();

		});

	}

	public initAthleteModelResolver(): Promise<void> {

		if (this.athleteModelResolver) {
			return Promise.resolve();
		} else {
			return this.createAthleteModelResolver(this.userSettings).then(athleteModelResolver => {
				this.athleteModelResolver = athleteModelResolver;
				return Promise.resolve();
			});
		}
	}

	public createAthleteModelResolver(userSettings: UserSettingsModel): Promise<AthleteModelResolver> {

		return new Promise((resolve, reject) => {
			AppStorage.getInstance().get<DatedAthleteSettingsModel[]>(AppStorageType.LOCAL, Elevate.LOCAL_DATED_ATHLETE_SETTINGS_KEY)
				.then((result: DatedAthleteSettingsModel[]) => {
					resolve(new AthleteModelResolver(userSettings, result));
				}, error => reject(error));
		});
	}

	public handleForwardToWWW(): boolean {

		if (_.isEqual(window.location.hostname, "app.strava.com")) {
			const forwardUrl: string = window.location.protocol + "//www.strava.com" + window.location.pathname;
			window.location.href = forwardUrl;
			return true;
		}
		return false;
	}

	public showPluginInstallOrUpgradeRibbon(): void {

		const latestRelease: ReleaseNoteModel = _.first(releaseNotesData);

		if (_.isBoolean(latestRelease.silent) && latestRelease.silent) {
			console.log("Silent update... skip update ribbon");
			return;
		}

		const ribbonHtml: string = "<div id=\"pluginInstallOrUpgrade\" style=\"display: flex; justify-content: flex-start; position: fixed; z-index: 999; width: 100%; background-color: rgba(0, 0, 0, 0.8); color: white; font-size: 12px; padding-left: 10px; padding-top: 10px; padding-bottom: 10px;\">" +
			"<div style=\"margin-right: 10px; line-height: 20px; white-space: nowrap;\"><strong>Elevate updated" + ((latestRelease.isPatch) ? " (patch " + this.appResources.extVersion + ")" : " to " + this.appResources.extVersion) + "</strong></div>" +
			"<div style=\"margin-right: 10px; line-height: 20px;\">" + latestRelease.message + "</div>" +
			"<div style=\"margin-right: 10px; white-space: nowrap; flex: 1; display: flex; justify-content: flex-end;\">" +
			"	<div>" +
			"		<div class=\"btn btn-primary btn-xs pluginInstallOrUpgrade_details\">View full release note</div>" +
			"		<div id=\"pluginInstallOrUpgrade_close\" class=\"btn btn-primary btn-xs\" style=\"margin-left: 10px;\">Close (<span id=\"pluginInstallOrUpgrade_counter\"></span>)</div>" +
			"	</div>" +
			"</div>" +
			"</div>";

		$("body").before(ribbonHtml).each(() => {

			const closeRibbon = function () {
				$("#pluginInstallOrUpgrade").slideUp(450, () => {
					$("#pluginInstallOrUpgrade").remove();
				});
				clearInterval(counterInterval);
			};

			// Display ribbon
			$("#pluginInstallOrUpgrade").hide();
			$("#pluginInstallOrUpgrade").slideDown(450);

			let counter = 25000;
			const refresh = 1000;
			$("#pluginInstallOrUpgrade_counter").html((("0" + (counter / 1000)).slice(-2)));
			const counterInterval = setInterval(() => {
				counter -= refresh;
				$("#pluginInstallOrUpgrade_counter").html((("0" + (counter / 1000)).slice(-2)));
			}, refresh);

			setTimeout(() => {
				closeRibbon();
			}, counter); // 10 sec auto hide

			$("#pluginInstallOrUpgrade_close").on("click", () => {
				closeRibbon();
			});

			$(".pluginInstallOrUpgrade_details").on("click", () => {
				window.open(this.appResources.settingsLink + "#/releasesNotes", "_blank");
			});
		});
	}

	public handlePluginInstallOrUpgrade(): void {

		if (!window.location.pathname.match(/^\/dashboard/)) {
			return;
		}

		if (window.location.search.match("elevateSync")) {
			console.log("Skip handlePluginInstallOrUpgrade since we are on a sync");
			return;
		}

		const saveCurrentVersionInstalled = (callback: Function) => {

			const toBeStored = {
				version: this.appResources.extVersion,
				on: Date.now(),
			};

			AppStorage.getInstance().set<any>(AppStorageType.LOCAL, Elevate.LOCAL_VERSION_INSTALLED_KEY, toBeStored).then(() => {
				console.log("Version has been saved to local storage");
				callback();
			});
		};

		// Check for previous version is installed
		AppStorage.getInstance().get<any>(AppStorageType.LOCAL, Elevate.LOCAL_VERSION_INSTALLED_KEY).then((response: any) => {

			// Override version with fake one to simulate update
			if (CoreEnv.simulateUpdate) {
				response = {
					data: {
						version: "fakeVersion",
						on: 0,
					},
				};
			}

			if (!response || !response.version) {

				// No previous version installed. It's an install of the plugin
				console.log("No previous version found. Should be an fresh install of " + this.appResources.extVersion);

				// Display ribbon update message
				this.showPluginInstallOrUpgradeRibbon();

				// Save current version to chrome local storage
				saveCurrentVersionInstalled(() => {
				});

			} else {

				// A version is already installed. It's an update
				if (response.version && response.version !== this.appResources.extVersion) {

					// Version has changed...
					console.log("Previous install found <" + response.version + "> installed on " + new Date(response.on));
					console.log("Moving to version <" + this.appResources.extVersion + ">");

					// Clear HTML5 local storage
					console.log("Plugin upgraded, clear browser local storage");
					localStorage.clear();

					// Display ribbon update message
					this.showPluginInstallOrUpgradeRibbon();

					// Save current version to chrome local storage
					saveCurrentVersionInstalled(() => {
					});

					// Send updated version info to
					const updatedToEvent: any = {
						categorie: "Exploitation",
						action: "updatedVersion",
						name: this.appResources.extVersion,
					};

					follow("send", "event", updatedToEvent.categorie, updatedToEvent.action, updatedToEvent.name);

					Cookies.remove("elevate_athlete_update_done"); // Remove elevate_athlete_update_done cookie to trigger athlete commit earlier

				} else {
					console.log("No install or update detected");
				}

			}
		});
	}

	public handleAthletesStats(): void {

		// If we are not on the athletes page then return...
		if (!window.location.pathname.match(new RegExp("/athletes/" + this.athleteId + "$", "g"))) {
			return;
		}

		if (CoreEnv.debugMode) {
			console.log("Execute handleAthletesStats()");
		}

		const athleteStatsModifier: AthleteStatsModifier = new AthleteStatsModifier(this.appResources, {
			Run: this.userSettings.targetsYearRun,
			Ride: this.userSettings.targetsYearRide,
		});
		athleteStatsModifier.modify();
	}

	public handleActivitiesSummary(): void {

		/* DISABLE WEEKLY TOTALS ACTIVITY SUMMARY. Coming soon inside dashboard.

         // If we are not on the athletes page then return...
         if (!window.location.pathname.match(new RegExp("/athletes/" + this.athleteId + "$", "g"))) {
         return;
         }

         if (env.debugMode) console.log("Execute handleActivitiesSummary()");

         let activitiesSummaryModifier: ActivitiesSummaryModifier = new ActivitiesSummaryModifier();
         activitiesSummaryModifier.modify();
         */
	}

	public handlePreviewRibbon(): void {
		const globalStyle = "background-color: #FFF200; color: rgb(84, 84, 84); font-size: 12px; padding: 5px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; text-align: center;";
		const html: string = "<div id=\"updateRibbon\" style=\"" + globalStyle + "\"><strong>WARNING</strong> You are running a preview of <strong>Elevate</strong>, to remove it, open a new tab and type <strong>chrome://extensions</strong></div>";
		$("body").before(html);
	}

	public handleMenu(): void {

		if (CoreEnv.debugMode) {
			console.log("Execute handleMenu()");
		}

		const menuModifier: MenuModifier = new MenuModifier(this.athleteId, this.appResources);
		menuModifier.modify();
	}

	public handleRemoteLinks(): void {

		// If we are not on a segment or activity page then return...
		if (!window.location.pathname.match(/^\/segments\/(\d+)$/) && !window.location.pathname.match(/^\/activities/)) {
			return;
		}

		if (!this.userSettings.remoteLinks) {
			return;
		}

		if (CoreEnv.debugMode) {
			console.log("Execute handleRemoteLinks()");
		}

		const remoteLinksModifier: RemoteLinksModifier = new RemoteLinksModifier(this.appResources, (this.activityAthleteId === this.athleteId), this.activityId);
		remoteLinksModifier.modify();
	}

	public handleWindyTyModifier(): void {

		// If we are not on a segment or activity page then return...
		if (!window.location.pathname.match(/^\/activities/)) {
			return;
		}

		if (!window.pageView) {
			return;
		}

		// Avoid running Extended data at the moment
		if (window.pageView.activity().get("type") !== "Ride") {
			return;
		}

		// If home trainer skip (it will use gps data to locate weather data)
		if (window.pageView.activity().get("trainer")) {
			return;
		}

		if (CoreEnv.debugMode) {
			console.log("Execute handleWindyTyModifier()");
		}

		const windyTyModifier: WindyTyModifier = new WindyTyModifier(this.activityId, this.appResources, this.userSettings);
		windyTyModifier.modify();
	}

	public handleReliveCCModifier(): void {

		if (!this.userSettings.displayReliveCCLink) {
			return;
		}

		// If we are not on a segment or activity page then return...
		if (!window.location.pathname.match(/^\/activities/)) {
			return;
		}

		if (!window.pageView) {
			return;
		}

		const activityType: string = window.pageView.activity().get("type");

		// Avoid running Extended data at the moment
		if (activityType !== "Ride" && activityType !== "Run") {
			return;
		}

		// If home trainer skip
		if (window.pageView.activity().get("trainer")) {
			return;
		}

		if (CoreEnv.debugMode) {
			console.log("Execute handleReliveCCModifier()");
		}

		const reliveCCModifier: ReliveCCModifier = new ReliveCCModifier(this.activityId);
		reliveCCModifier.modify();
	}

	public handleDefaultLeaderboardFilter(): void {

		// If we are not on a segment or activity page then return...
		if (!window.location.pathname.match(/^\/activities/)) {
			return;
		}

		// Kick out if we are not on SegmentLeaderboardView
		const view: any = Strava.Labs.Activities.SegmentLeaderboardView;

		if (!view) {
			return;
		}

		if (CoreEnv.debugMode) {
			console.log("Execute handleDefaultLeaderboardFilter()");
		}

		const defaultLeaderBoardFilterModifier: DefaultLeaderBoardFilterModifier = new DefaultLeaderBoardFilterModifier(this.userSettings.defaultLeaderBoardFilter);
		defaultLeaderBoardFilterModifier.modify();
	}

	public handleSegmentRankPercentage(): void {

		if (!this.userSettings.displaySegmentRankPercentage) {
			return;
		}

		// If we are not on a segment page then return...
		if (!window.location.pathname.match(/^\/segments\/(\d+)$/)) {
			return;
		}

		if (CoreEnv.debugMode) {
			console.log("Execute handleSegmentRankPercentage()");
		}

		const segmentRankPercentage: SegmentRankPercentageModifier = new SegmentRankPercentageModifier();
		segmentRankPercentage.modify();
	}

	public handleSegmentHRAP() {

		if (!this.userSettings.showHiddenBetaFeatures || !this.userSettings.displayRecentEffortsHRAdjustedPacePower) {
			return;
		}

		// If we are not on a segment page then return...
		if (!window.location.pathname.match(/^\/segments\/(\d+)$/)) {
			return;
		}

		if (CoreEnv.debugMode) {
			console.log("Execute handleSegmentHRAP_()");
		}

		const athleteModel = this.athleteModelResolver.getCurrent(); // TODO Could be improved by using AthleteModel at each dates

		const segmentId: number = parseInt(/^\/segments\/(\d+)$/.exec(window.location.pathname)[1]);
		const segmentHRATime: SegmentRecentEffortsHRATimeModifier = new SegmentRecentEffortsHRATimeModifier(this.userSettings.displayRecentEffortsHRAdjustedPacePower,
			athleteModel,
			this.athleteId,
			segmentId);
		segmentHRATime.modify();

	}

	public handleActivityStravaMapType(): void {

		// Test where are on an activity...
		if (!window.location.pathname.match(/^\/activities/)) {
			return;
		}

		if (CoreEnv.debugMode) {
			console.log("Execute handleActivityStravaMapType()");
		}

		const activityStravaMapTypeModifier: ActivityStravaMapTypeModifier = new ActivityStravaMapTypeModifier(this.userSettings.activityStravaMapType);
		activityStravaMapTypeModifier.modify();
	}

	public handleHideFeed(): void {

		// Test if where are on dashboard page
		if (!window.location.pathname.match(/^\/dashboard/)) {
			return;
		}

		if (!this.userSettings.feedHideChallenges
			&& !this.userSettings.feedHideCreatedRoutes
			&& !this.userSettings.feedHidePosts
			&& !this.userSettings.feedHideRideActivitiesUnderDistance
			&& !this.userSettings.feedHideRunActivitiesUnderDistance
			&& !this.userSettings.feedHideVirtualRides
			&& !this.userSettings.feedHideSuggestedAthletes) {
			return;
		}

		if (CoreEnv.debugMode) {
			console.log("Execute handleHideFeed()");
		}

		const hideFeedModifier: HideFeedModifier = new HideFeedModifier(this.userSettings);
		hideFeedModifier.modify();
	}

	public handleActivityFeedModifier(): void {
		if (!window.location.pathname.match(/^\/dashboard/)) {
			return;
		}

		if (!this.userSettings.feedChronologicalOrder) {
			return;
		}

		if (CoreEnv.debugMode) {
			console.log("Execute handleActivityFeedModifier()");
		}

		const activityFeedModifier: ActivityFeedModifier = new ActivityFeedModifier(this.userSettings);
		activityFeedModifier.modify();
	}

	public handleDisplayFlyByFeedModifier(): void {

		// Test if where are on dashboard page
		if (!window.location.pathname.match(/^\/dashboard/)) {
			return;
		}

		if (CoreEnv.debugMode) {
			console.log("Execute handleDisplayFlyByFeedModifier()");
		}

		const displayFlyByFeedModifier: DisplayFlyByFeedModifier = new DisplayFlyByFeedModifier();
		displayFlyByFeedModifier.modify();
	}

	public handleExtendedActivityData(): void {

		if (_.isUndefined(window.pageView)) {
			return;
		}

		const activityType: string = window.pageView.activity().get("type");
		const supportsGap: boolean = window.pageView.activity().get("hasSupportsGap");
		const isTrainer: boolean = window.pageView.activity().get("trainer");

		// Skip manual activities
		if (activityType === "Manual") {
			return;
		}

		const activityStartDate = this.vacuumProcessor.getActivityStartDate();

		const activityProcessor = new ActivityProcessor(this.vacuumProcessor, this.athleteModelResolver, this.appResources, this.userSettings,
			this.activityId, activityType, activityStartDate, isTrainer, supportsGap, this.isActivityAuthor);

		if (CoreEnv.debugMode) {
			console.log("Execute handleExtendedData_()");
		}

		const basicInfo: ActivityBasicInfoModel = {
			activityName: this.vacuumProcessor.getActivityName(),
			activityTime: this.vacuumProcessor.getActivityTime(),
		};

		let extendedDataModifier: AbstractExtendedDataModifier;

		switch (activityType) {
			case "Ride":
				extendedDataModifier = new CyclingExtendedDataModifier(
					activityProcessor,
					this.activityId,
					supportsGap,
					this.appResources,
					this.userSettings,
					this.isActivityAuthor,
					basicInfo,
					AbstractExtendedDataModifier.TYPE_ACTIVITY);
				break;
			case "Run":
				extendedDataModifier = new RunningExtendedDataModifier(
					activityProcessor,
					this.activityId,
					supportsGap,
					this.appResources,
					this.userSettings,
					this.isActivityAuthor,
					basicInfo,
					AbstractExtendedDataModifier.TYPE_ACTIVITY);
				break;
			/*default:
            extendedDataModifier = new GenericExtendedDataModifier(
                this.activityProcessor,
                this.activityId,
                activityType,
                hasSupportsGap,
                this.appResources,
                this.userSettingsData,
                this.isActivityAuthor,
                basicInfo,
                AbstractExtendedDataModifier.TYPE_ACTIVITY);
            break;*/
		}

		// Send opened activity type to ga for stats
		const updatedToEvent: any = {
			categorie: "Analyse",
			action: "openedActivityType",
			name: activityType,
		};

		follow("send", "event", updatedToEvent.categorie, updatedToEvent.action, updatedToEvent.name);

	}

	public handleExtendedSegmentEffortData(): void {

		if (_.isUndefined(window.pageView)) {
			return;
		}

		if (!Strava.Labs) {
			return;
		}

		const activityType: string = window.pageView.activity().get("type");
		const supportsGap: boolean = window.pageView.activity().get("hasSupportsGap");
		const isTrainer: boolean = window.pageView.activity().get("trainer");

		// Skip manual activities
		if (activityType === "Manual") {
			return;
		}

		const activityStartDate = this.vacuumProcessor.getActivityStartDate();
		const activityProcessor = new ActivityProcessor(this.vacuumProcessor, this.athleteModelResolver, this.appResources, this.userSettings,
			this.activityId, activityType, activityStartDate, isTrainer, supportsGap, this.isActivityAuthor);

		let view: any = Strava.Labs.Activities.SegmentLeaderboardView; // Strava.Labs.Activities.SegmentEffortDetailView

		if (activityType === ("Run" || "Hike" || "Walk")) {
			view = Strava.Labs.Activities.SegmentEffortDetailView;
		}

		if (!view) {
			return;
		}

		const functionRender: any = view.prototype.render;

		const that: Elevate = this;

		view.prototype.render = function () { // No arrow function here with! If yes loosing arguments

			const r: any = functionRender.apply(this, Array.prototype.slice.call(arguments));

			const basicInfo: ActivityBasicInfoModel = {
				activityName: that.vacuumProcessor.getActivityName(),
				activityTime: that.vacuumProcessor.getActivityTime(),
			};

			let extendedDataModifier: AbstractExtendedDataModifier;

			switch (activityType) {
				case "Ride":
					extendedDataModifier = new CyclingExtendedDataModifier(
						activityProcessor,
						that.activityId,
						supportsGap,
						that.appResources,
						that.userSettings,
						that.isActivityAuthor,
						basicInfo,
						AbstractExtendedDataModifier.TYPE_SEGMENT);
					break;
				case "Run":
					extendedDataModifier = new RunningExtendedDataModifier(
						activityProcessor,
						that.activityId,
						supportsGap,
						that.appResources,
						that.userSettings,
						that.isActivityAuthor,
						basicInfo,
						AbstractExtendedDataModifier.TYPE_SEGMENT);
					break;
				default:
					break;
			}
			return r;
		};

	}

	public handleNearbySegments(): void {

		if (!this.userSettings.displayNearbySegments) {
			return;
		}

		// If we are not on a segment page then return...
		const segmentData: string[] = window.location.pathname.match(/^\/segments\/(\d+)$/);
		if (_.isNull(segmentData)) {
			return;
		}

		if (CoreEnv.debugMode) {
			console.log("Execute handleNearbySegments()");
		}

		// Getting segment id
		const segmentId: number = parseInt(segmentData[1]);

		const segmentProcessor: SegmentProcessor = new SegmentProcessor(this.vacuumProcessor, segmentId);
		segmentProcessor.getNearbySegmentsAround((jsonSegments: ISegmentInfo[]) => {

			if (CoreEnv.debugMode) {
				console.log(jsonSegments);
			}

			const nearbySegmentsModifier: NearbySegmentsModifier = new NearbySegmentsModifier(jsonSegments, this.appResources);
			nearbySegmentsModifier.modify();

		});
	}

	public handleActivityBikeOdo(): void {

		if (!this.userSettings.displayBikeOdoInActivity) {
			return;
		}

		// Test where are on an activity...
		if (!window.location.pathname.match(/^\/activities/)) {
			return;
		}

		if (_.isUndefined(window.pageView)) {
			return;
		}

		// Avoid running Extended data at the moment
		if (window.pageView.activity().attributes.type != "Ride") {
			return;
		}

		if (CoreEnv.debugMode) {
			console.log("Execute handleActivityBikeOdo()");
		}

		const bikeOdoProcessor: BikeOdoProcessor = new BikeOdoProcessor(this.vacuumProcessor, this.activityAthleteId);
		bikeOdoProcessor.getBikeOdoOfAthlete((bikeOdoArray: string[]) => {
			const activityBikeOdoModifier: ActivityBikeOdoModifier = new ActivityBikeOdoModifier(bikeOdoArray, bikeOdoProcessor.getCacheKey());
			activityBikeOdoModifier.modify();
		});
	}

	public handleActivitySegmentTimeComparison(): void {

		// Test where are on an activity page... (note this includes activities/XXX/segments)
		if (!window.location.pathname.match(/^\/activities/)) {
			return;
		}

		if (_.isUndefined(window.pageView)) {
			return;
		}

		const activityType: string = window.pageView.activity().get("type");
		// PR only for my own activities
		const isMyOwn: boolean = (this.athleteId == this.activityAthleteId);

		if (CoreEnv.debugMode) {
			console.log("Execute handleActivitySegmentTimeComparison()");
		}

		const activitySegmentTimeComparisonModifier: ActivitySegmentTimeComparisonModifier = new ActivitySegmentTimeComparisonModifier(this.userSettings, this.appResources, activityType, isMyOwn);
		activitySegmentTimeComparisonModifier.modify();

	}

	public handleActivityBestSplits(): void {

		if (!this.userSettings.displayActivityBestSplits) {
			return;
		}

		// Test where are on an activity...
		if (!window.location.pathname.match(/^\/activities/)) {
			return;
		}

		if (_.isUndefined(window.pageView)) {
			return;
		}

		// Only cycling is supported
		if (window.pageView.activity().attributes.type != "Ride") {
			return;
		}

		if (CoreEnv.debugMode) {
			console.log("Execute handleActivityBestSplits()");
		}

		// TODO Implement cache here: get stream from cache if exist
		this.vacuumProcessor.getActivityStream((activityCommonStats: any, jsonResponse: any, athleteWeight: number, athleteGender: Gender, hasPowerMeter: boolean) => {

			AppStorage.getInstance().get<any>(AppStorageType.SYNC, "bestSplitsConfiguration").then((response: any) => {
				const activityBestSplitsModifier: ActivityBestSplitsModifier = new ActivityBestSplitsModifier(this.activityId, this.userSettings, jsonResponse, hasPowerMeter, response, (splitsConfiguration: any) => {
					AppStorage.getInstance().set<any>(AppStorageType.SYNC, "bestSplitsConfiguration", splitsConfiguration);
				});

				activityBestSplitsModifier.modify();

			});

		});
	}

	public handleRunningGradeAdjustedPace(): void {

		if (!this.userSettings.activateRunningGradeAdjustedPace) {
			return;
		}

		if (_.isUndefined(window.pageView)) {
			return;
		}

		// Avoid bike activity
		if (window.pageView.activity().attributes.type != "Run") {
			return;
		}

		if (!window.location.pathname.match(/^\/activities/)) {
			return;
		}

		if (CoreEnv.debugMode) {
			console.log("Execute handleRunningGradeAdjustedPace()");
		}

		const runningGradeAdjustedPace: RunningGradeAdjustedPaceModifier = new RunningGradeAdjustedPaceModifier();
		runningGradeAdjustedPace.modify();
	}

	public handleRunningHeartRate(): void {

		if (!this.userSettings.activateRunningHeartRate) {
			return;
		}

		if (_.isUndefined(window.pageView)) {
			return;
		}

		// Avoid bike activity
		if (window.pageView.activity().attributes.type != "Run") {
			return;
		}

		if (!window.location.pathname.match(/^\/activities/)) {
			return;
		}

		if (CoreEnv.debugMode) {
			console.log("Execute handleRunningHeartRate()");
		}

		const runningHeartRateModifier: RunningHeartRateModifier = new RunningHeartRateModifier();
		runningHeartRateModifier.modify();
	}

	public handleRunningCadence(): void {

		if (!this.userSettings.activateRunningCadence) {
			return;
		}

		if (_.isUndefined(window.pageView)) {
			return;
		}

		// Avoid bike activity
		if (window.pageView.activity().attributes.type != "Run") {
			return;
		}

		if (!window.location.pathname.match(/^\/activities/)) {
			return;
		}

		if (CoreEnv.debugMode) {
			console.log("Execute handleRunningCadence()");
		}

		const runningCadenceModifier: RunningCadenceModifier = new RunningCadenceModifier();
		runningCadenceModifier.modify();
	}

	public handleRunningTemperature(): void {

		if (!this.userSettings.activateRunningTemperature) {
			return;
		}

		if (_.isUndefined(window.pageView)) {
			return;
		}

		// Avoid bike activity
		if (window.pageView.activity().attributes.type != "Run") {
			return;
		}

		if (!window.location.pathname.match(/^\/activities/)) {
			return;
		}

		if (CoreEnv.debugMode) {
			console.log("Execute handleRunningHeartRate()");
		}

		const runningTemperatureModifier: RunningTemperatureModifier = new RunningTemperatureModifier();
		runningTemperatureModifier.modify();
	}

	protected handleRunningAnalysisGraph(): void {

		if (_.isUndefined(window.pageView)) {
			return;
		}

		// Avoid bike activity
		if (window.pageView.activity().attributes.type != "Run") {
			return;
		}

		if (!window.location.pathname.match(/^\/activities/)) {
			return;
		}

		if (CoreEnv.debugMode) {
			console.log("Execute handleRunningAnalysisGraph()");
		}

		const runningAnalysisGraph: RunningAnalysisGraph = new RunningAnalysisGraph();
		runningAnalysisGraph.modify();
	}


	public handleActivityQRCodeDisplay(): void {

		// Test where are on an activity...
		if (!window.location.pathname.match(/^\/activities/)) {
			return;
		}

		if (_.isUndefined(window.pageView)) {
			return;
		}

		const activityQRCodeDisplayModifier: ActivityQRCodeDisplayModifier = new ActivityQRCodeDisplayModifier(this.appResources, this.activityId);
		activityQRCodeDisplayModifier.modify();

	}

	public handleVirtualPartner(): void {

		// Test where are on an activity...
		if (!window.location.pathname.match(/^\/activities/)) {
			return;
		}

		const virtualPartnerModifier: VirtualPartnerModifier = new VirtualPartnerModifier(this.activityId, this.vacuumProcessor);
		virtualPartnerModifier.modify();
	}

	public handleGoogleMapsComeBackModifier(): void {

		if (window.location.pathname.match(/\/truncate/)) { // Skipping on activity cropping
			return;
		}

		if (!this.userSettings.reviveGoogleMaps) {
			return;
		}

		// Test where are on an activity...
		if (!window.location.pathname.match(/^\/activities/)) {
			return;
		}

		const googleMapsModifier: GoogleMapsModifier = new GoogleMapsModifier(this.activityId, this.appResources, this.userSettings);
		googleMapsModifier.modify();
	}

	/**
	 * Launch a track event once a day (is user use it once a day), to follow is account type
	 */
	public handleTrackTodayIncomingConnection(): void {

		const userHasConnectSince24Hour: boolean = (Cookies.get("elevate_daily_connection_done") === "true");

		if (CoreEnv.debugMode) {
			console.log("Cookie 'elevate_daily_connection_done' value found is: " + userHasConnectSince24Hour);
		}

		if (_.isNull(this.athleteId)) {
			if (CoreEnv.debugMode) {
				console.log("athleteId is empty value: " + this.athleteId);
			}
			return;
		}

		if (!userHasConnectSince24Hour) {

			let accountType = "Free";
			const accountName: string = this.athleteName;

			// We enter in that condition if user is premium or pro
			if (!_.isNull(this.isPremium) && this.isPremium === true) {
				accountType = "Premium";
			}

			// accountType is overridden with "pro" if that condition is true
			if (!_.isNull(this.isPro) && this.isPro === true) {
				accountType = "Pro";
			}

			const eventAction: string = "DailyConnection_Account_" + accountType;

			// Push IncomingConnection
			const eventName: string = accountName + " #" + this.athleteId + " v" + this.appResources.extVersion;

			if (CoreEnv.debugMode) {
				console.log("Cookie 'elevate_daily_connection_done' not found, send track <IncomingConnection> / <" + accountType + "> / <" + eventName + ">");
			}

			if (!CoreEnv.debugMode) {
				follow("send", "event", "DailyConnection", eventAction, eventName);
			}

			// Create cookie to avoid push during 1 day
			Cookies.set("elevate_daily_connection_done", "true", {expires: 1});

		} else {
			if (CoreEnv.debugMode) {
				console.log("Cookie 'elevate_daily_connection_done' exist, DO NOT TRACK IncomingConnection");
			}
		}
	}

	public handleAthleteUpdate(): void {
		if (!Cookies.get("elevate_athlete_update_done")) {
			this.commitAthleteUpdate().then((response: any) => {
				console.log("Updated", response);
				Cookies.set("elevate_athlete_update_done", "true", {expires: (1 / 4)}); // Don't update for 6 hours
			}, (err: any) => {
				console.error(err);
			});
		}
	}

	public saveAthleteId(): void {
		AppStorage.getInstance().set<number>(AppStorageType.LOCAL, "athleteId", this.athleteId).then(() => {
			console.debug("athlete id set to " + this.athleteId);
		}, error => console.error(error));
	}

	public handleOnFlyActivitiesSync(): void {

		// Skipping on fly sync because a dedicated sync has been asked by user
		if (window.location.search.match("elevateSync")) {
			return;
		}

		if (window.location.pathname.match("login") || window.location.pathname.match("upload")) {
			console.log("Login or upload page. Skip handleOnFlyActivitiesSync()");
			return;
		}

		if (window.location.search.match("elevateSync")) {
			console.log("Sync Popup. Skip handleOnFlyActivitiesSync()");
			return;
		}

		const waitBeforeFastSyncSeconds = 2;
		setTimeout(() => {

			// Allow activities sync if previous sync exists and has been done 12 hours or more ago.
			AppStorage.getInstance().get<number>(AppStorageType.LOCAL, ActivitiesSynchronizer.lastSyncDateTime).then((lastSyncDateTime: number) => {

				if (_.isNumber(lastSyncDateTime)) {

					console.log("A previous sync exists on " + new Date(lastSyncDateTime).toString());

					// At first perform a fast sync to get the "just uploaded ride/run" ready
					const fastSync = true;
					const fastSyncPromise: Q.Promise<SyncResultModel> = this.activitiesSynchronizer.sync(fastSync);
					fastSyncPromise.then((syncResult: SyncResultModel) => {

						console.log("Fast sync finished", syncResult);
						ActivitiesSynchronizer.notifyBackgroundSyncDone.call(this, this.extensionId, syncResult); // Notify background page that sync is finished

					}).catch((err: any) => {
						console.warn(err);
					});

				} else {
					console.log("No previous sync found. A first sync must be performed");
				}
			});

		}, 1000 * waitBeforeFastSyncSeconds); // Wait for before starting the auto-sync

	}

	public handleActivitiesSyncFromOutside() {

		if (!window.location.search.match("elevateSync")) { // Skipping is we are not on sync popup
			return;
		}

		const urlParams = Helper.params(window.location);

		const syncingAllowed = (urlParams.elevateSync === "true");
		if (!syncingAllowed) {
			return;
		}

		const forceSync = (urlParams.forceSync === "true");
		const fastSync = (urlParams.fastSync === "true" && !forceSync);
		const sourceTabId = (urlParams.sourceTabId) ? parseInt(urlParams.sourceTabId) : -1;

		const activitiesSyncModifier: ActivitiesSyncModifier = new ActivitiesSyncModifier(this.extensionId, this.activitiesSynchronizer, fastSync, forceSync, sourceTabId);
		activitiesSyncModifier.modify();
	}

	public commitAthleteUpdate(): Q.IPromise<any> {

		const athleteModel = this.athleteModelResolver.getCurrent();

		const athleteUpdate: AthleteUpdateModel = AthleteUpdate.create(this.athleteId, this.athleteName,
			(this.appResources.extVersion !== "0") ? this.appResources.extVersion : this.appResources.extVersionName,
			this.isPremium, this.isPro, window.navigator.language, athleteModel.athleteSettings.restHr, athleteModel.athleteSettings.maxHr);
		return AthleteUpdate.commit(athleteUpdate);
	}
}
