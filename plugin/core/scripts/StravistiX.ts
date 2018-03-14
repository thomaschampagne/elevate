import * as _ from "lodash";
import { Helper } from "../../common/scripts/Helper";
import { ActivityBasicInfoModel } from "../../common/scripts/models/ActivityData";
import { SyncNotifyModel } from "../../common/scripts/models/Sync";
import { UserSettingsModel } from "../../common/scripts/models/UserSettings";
import { StorageManager } from "../../common/scripts/modules/StorageManager";
import { IReleaseNote, releaseNotes } from "../../common/scripts/ReleaseNotes";
import { env } from "../config/env";
import { AthleteUpdate } from "./Follow";
import { IAppResources } from "./interfaces/IAppResources";
import { IAthleteUpdate } from "./interfaces/IAthleteUpdate";
import { ActivitiesSyncModifier } from "./modifiers/ActivitiesSyncModifier";
import { ActivityBestSplitsModifier } from "./modifiers/ActivityBestSplitsModifier";
import { ActivityBikeOdoModifier } from "./modifiers/ActivityBikeOdoModifier";
import { ActivityQRCodeDisplayModifier } from "./modifiers/ActivityQRCodeDisplayModifier";
import { ActivitySegmentTimeComparisonModifier } from "./modifiers/ActivitySegmentTimeComparisonModifier";
import { ActivityStravaMapTypeModifier } from "./modifiers/ActivityStravaMapTypeModifier";
import { AthleteStatsModifier } from "./modifiers/AthleteStatsModifier";
import { DefaultLeaderBoardFilterModifier } from "./modifiers/DefaultLeaderBoardFilterModifier";
import { DisplayFlyByFeedModifier } from "./modifiers/DisplayFlyByFeedModifier";
import { AbstractExtendedDataModifier } from "./modifiers/extendedActivityData/AbstractExtendedDataModifier";
import { CyclingExtendedDataModifier } from "./modifiers/extendedActivityData/CyclingExtendedDataModifier";
import { RunningExtendedDataModifier } from "./modifiers/extendedActivityData/RunningExtendedDataModifier";
import { GoogleMapsModifier } from "./modifiers/GoogleMapsModifier";
import { HideFeedModifier } from "./modifiers/HideFeedModifier";
import { MenuModifier } from "./modifiers/MenuModifier";
import { NearbySegmentsModifier } from "./modifiers/NearbySegmentsModifier";
import { ReliveCCModifier } from "./modifiers/ReliveCCModifier";
import { RemoteLinksModifier } from "./modifiers/RemoteLinksModifier";
import {
	RunningCadenceModifier,
	RunningGradeAdjustedPaceModifier,
	RunningHeartRateModifier,
	RunningTemperatureModifier,
} from "./modifiers/RunningDataModifier";
import { SegmentRankPercentageModifier } from "./modifiers/SegmentRankPercentageModifier";
import { SegmentRecentEffortsHRATimeModifier } from "./modifiers/SegmentRecentEffortsHRATimeModifier";
import { VirtualPartnerModifier } from "./modifiers/VirtualPartnerModifier";
import { WindyTyModifier } from "./modifiers/WindyTyModifier";
import { ActivityProcessor } from "./processors/ActivityProcessor";
import { BikeOdoProcessor } from "./processors/BikeOdoProcessor";
import { ISegmentInfo, SegmentProcessor } from "./processors/SegmentProcessor";
import { VacuumProcessor } from "./processors/VacuumProcessor";
import { ActivitiesSynchronizer, ISyncResult } from "./synchronizer/ActivitiesSynchronizer";
import { HerokuEndpoints } from "../../common/scripts/modules/HerokuEndpoint";

export class StravistiX {
	public static instance: StravistiX = null;

	public static versionInstalledKey = "versionInstalled";
	protected isPro: boolean;

	protected isPremium: boolean;
	protected athleteName: string;
	protected activityAthleteId: number;
	protected activityId: number;
	protected athleteId: number;
	protected activityProcessor: ActivityProcessor;
	protected isActivityAuthor: boolean;
	protected extensionId: string;
	protected appResources: IAppResources;
	protected _userSettings: UserSettingsModel;
	protected vacuumProcessor: VacuumProcessor;
	protected activitiesSynchronizer: ActivitiesSynchronizer;

	constructor(userSettings: UserSettingsModel, appResources: IAppResources) {

		this._userSettings = userSettings;
		this.appResources = appResources;
		this.extensionId = this.appResources.extensionId;
		this.vacuumProcessor = new VacuumProcessor();
		this.athleteId = this.vacuumProcessor.getAthleteId();
		this.athleteName = this.vacuumProcessor.getAthleteName();
		this.activityAthleteId = this.vacuumProcessor.getActivityAthleteId();
		this.isActivityAuthor = (this.activityAthleteId == this.athleteId);
		this.activityProcessor = new ActivityProcessor(this.appResources, this.vacuumProcessor, this._userSettings, this.isActivityAuthor);
		this.isPremium = this.vacuumProcessor.getPremiumStatus();
		this.isPro = this.vacuumProcessor.getProStatus();
		this.activityId = this.vacuumProcessor.getActivityId();
		this.activitiesSynchronizer = new ActivitiesSynchronizer(this.appResources, this._userSettings);

		if (StravistiX.instance == null) {
			StravistiX.instance = this;
		}

		this.init();
	}

	/**
	 * Make the work...
	 */
	public init(): void {

		// Redirect app.strava.com/* to www.strava.com/*
		if (this.handleForwardToWWW()) {
			return; // Skip rest of init to be compliant with www.strava.com/* on next reload
		}

		// Handle some tasks when install/update occurs
		this.handlePluginInstallOrUpgrade();

		if (env.preview) {
			this.handlePreviewRibbon();
		}

		if (this._userSettings.localStorageMustBeCleared) {
			localStorage.clear();
			Helper.setToStorage(this.extensionId, StorageManager.storageSyncType, "localStorageMustBeCleared", false, (response: any) => {
				console.log("localStorageMustBeCleared is now " + response.data.localStorageMustBeCleared);
			});
		}

		// Init "stravistix bridge"
		window.__stravistix_bridge__ = {};

		if (env.debugMode) {
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

		// All activities
		this.handleActivityQRCodeDisplay();
		this.handleVirtualPartner();
		this.handleAthletesStats();
		this.handleActivitiesSummary();

		// Must be done at the end
		this.handleTrackTodayIncomingConnection();
		this.handleAthleteUpdate();
		this.handleGoogleMapsComeBackModifier();
	}

	/**
	 *
	 */
	protected handleForwardToWWW(): boolean {

		if (_.isEqual(window.location.hostname, "app.strava.com")) {
			const forwardUrl: string = window.location.protocol + "//www.strava.com" + window.location.pathname;
			window.location.href = forwardUrl;
			return true;
		}
		return false;
	}

	/**
	 *
	 */
	protected showPluginInstallOrUpgradeRibbon(): void {

		const latestRelease: IReleaseNote = _.first(releaseNotes);

		if (_.isBoolean(latestRelease.silent) && latestRelease.silent) {
			console.log("Silent update... skip update ribbon");
			return;
		}

		const ribbonMessage: string = "<img style=\"width: 24px;\" src=\"" + this.appResources.systemUpdatesIcon + "\" /><strong>" + ((latestRelease.isPatch) ? "[Patch] " : "") + "<a href=\"#\" class=\"pluginInstallOrUpgrade_details\">StravistiX v" + this.appResources.extVersion + ":</a></strong> " + latestRelease.message + ".";
		const ribbonHtml: string = "<div id=\"pluginInstallOrUpgrade\" style=\"position: absolute;z-index: 999; width: 100%; background-color: rgba(255, 212, 1, 1); text-align: left; padding-left: 4%; padding-top: 18px; padding-bottom: 18px;\">" +
			"<div style=\"display:inline; font-size: 14px;\">" + ribbonMessage + "</div>" +
			"<div style=\"display:inline; float: right; font-size: 14px; padding-right: 10px;\">" +
			"<a href=\"#\" style=\"padding-right: 15px;\" class=\"pluginInstallOrUpgrade_details\">[show details]</a>" +
			"<a href=\"#\" id=\"pluginInstallOrUpgrade_close\">[close (<span id=\"pluginInstallOrUpgrade_counter\"></span>)]</a>" +
			"</div></div>";

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
				this.handleUpdatePopup();
			});
		});
	}

	/**
	 *
	 */
	protected handlePluginInstallOrUpgrade(): void {

		if (!window.location.pathname.match(/^\/dashboard/)) {
			return;
		}

		if (window.location.search.match("stravistixSync")) {
			console.log("Skip handlePluginInstallOrUpgrade since we are on a sync");
			return;
		}

		const saveCurrentVersionInstalled = (callback: Function) => {

			const toBeStored = {
				version: this.appResources.extVersion,
				on: Date.now(),
			};

			Helper.setToStorage(this.extensionId, StorageManager.storageLocalType, StravistiX.versionInstalledKey, toBeStored, () => {
				console.log("Version has been saved to local storage");
				callback();
			});
		};

		// Check for previous version is installed
		Helper.getFromStorage(this.extensionId, StorageManager.storageLocalType, StravistiX.versionInstalledKey, (response: any) => {

			// Override version with fake one to simulate update
			if (env.simulateUpdate) {
				response = {
					data: {
						version: "fakeVersion",
						on: 0,
					},
				};
			}

			if (!response.data || !response.data.version) {

				// No previous version installed. It's an install of the plugin
				console.log("No previous version found. Should be an fresh install of " + this.appResources.extVersion);

				// Display ribbon update message
				this.showPluginInstallOrUpgradeRibbon();

				// Save current version to chrome local storage
				saveCurrentVersionInstalled(() => {
				});

			} else {

				// A version is already installed. It's an update
				if (response.data.version && response.data.version !== this.appResources.extVersion) {

					// Version has changed...
					console.log("Previous install found <" + response.data.version + "> installed on " + new Date(response.data.on));
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

					StorageManager.setCookieSeconds("stravistix_athlete_update_done", false, 0); // Remove stravistix_athlete_update_done cookie to trigger athlete commit earlier

				} else {
					console.log("No install or update detected");
				}

			}
		});
	}

	/**
	 *
	 */
	protected handleUpdatePopup(): void {

		let previewBuild = false;
		if (this.appResources.extVersionName.indexOf("preview@") !== -1) {
			previewBuild = true;
		}

		const latestRelease: IReleaseNote = _.first(releaseNotes);

		const updateMessageObj: any = {
			logo: "<img src=\"" + this.appResources.logoStravistix + "\"/>",
			title: "This browser was just updated to <strong>v" + this.appResources.extVersionName + "</strong> :)",
			hotFixes: (latestRelease.hotFixes) ? latestRelease.hotFixes : [],
			features: (latestRelease.features) ? latestRelease.features : [],
			fixes: (latestRelease.fixes) ? latestRelease.fixes : [],
			upcomingFixes: [],
			/* upcomingFeatures: [
                 // 'Years progressions reworked',
                 "Dashboard: Interrogate any stats of your history on a period. By sports, by bike, by shoes... Fully customisable.",
                 "Grid: All your activities in a table including stravistix extended stats as columns.",
                 //'3D display of an activity ?! I\'ve skills in video games development. Looking to do something clean with WebGL ;)',
                 "Stay tunned via <a target=\"_blank\" href=\"https://twitter.com/champagnethomas\">My Twitter</a> // Just created <a target=\"_blank\" href=\"https://www.strava.com/clubs/stravistix\">Strava Club</a>",
             ],*/
		};

		let message = "";
		if (!_.isEmpty(latestRelease.message) && !previewBuild) {
			message += "<div style=\"background: #eee; padding: 8px;\">";
			message += latestRelease.message;
			message += "</div>";
		}

		const baseVersion: string[] = this.appResources.extVersion.split(".");
		if (!_.isEmpty(updateMessageObj.features) && !previewBuild) {
			message += "<h5><strong>NEW in " + baseVersion[0] + "." + baseVersion[1] + ".x" + ":</strong></h5>";
			_.forEach(updateMessageObj.features, (feature: string) => {
				message += "<h6 style=\"margin-top: 12px;\">- " + feature + "</h6>";
			});
		}

		if (!_.isEmpty(updateMessageObj.hotFixes) && !previewBuild) {
			message += "<h5><strong>HOTFIXES " + this.appResources.extVersion + ":</strong></h5>";
			_.forEach(updateMessageObj.hotFixes, (hotFix: string) => {
				message += "<h6 style=\"margin-top: 12px;\">- " + hotFix + "</h6>";
			});
		}

		if (!_.isEmpty(updateMessageObj.fixes) && !previewBuild) {
			message += "<h5><strong>FIXED / IMPROVED in " + baseVersion[0] + "." + baseVersion[1] + "." + baseVersion[2] + ":</strong></h5>";
			_.forEach(updateMessageObj.fixes, (fix: string) => {
				message += "<h6 style=\"margin-top: 12px;\">- " + fix + "</h6>";
			});
		}

		if (!_.isEmpty(updateMessageObj.upcomingFixes) && !previewBuild) {
			message += "<h5><strong>Upcoming Fixes:</strong></h5>";
			_.forEach(updateMessageObj.upcomingFixes, (upcomingFixes: string) => {
				message += "<h6 style=\"margin-top: 12px;\">- " + upcomingFixes + "</h6>";
			});
		}

		if (!_.isEmpty(updateMessageObj.upcomingFeatures) && !previewBuild) {
			message += "<h5><strong>Upcoming Features:</strong></h5>";
			_.forEach(updateMessageObj.upcomingFeatures, (upcomingFeatures: string) => {
				message += "<h6 style=\"margin-top: 12px;\">- " + upcomingFeatures + "</h6>";
			});
		}

		if (previewBuild) {
			updateMessageObj.title = this.appResources.extVersionName;
			const shortSha1Commit: string = this.appResources.extVersionName.slice(this.appResources.extVersionName.indexOf("@") + 1);
			message += "<a href=\"https://github.com/thomaschampagne/stravistix/compare/master..." + shortSha1Commit + "\" target=\"_blank\">Git diff between " + this.appResources.extVersionName + " and master (code in production)</a></br></br> ";
		}

		// Donate button
		message += "<a class=\"button btn-primary\" target=\"_blank\" id=\"extendedStatsButton\" href=\"" + this.appResources.settingsLink + "#/donate\">";
		message += "<button style=\"font-size: 18px; width: 100%;\" class=\"btn btn-primary btn-sm\">Push this project higher !!!</button>";
		message += "</a>";

		$.fancybox("<div style=\"margin-left: auto; margin-right: auto; width: 25%;\">" + updateMessageObj.logo + "</div><h2>" + updateMessageObj.title + "</h2>" + message);
	}

	/**
	 *
	 */
	protected handleAthletesStats(): void {

		// If we are not on the athletes page then return...
		if (!window.location.pathname.match(new RegExp("/athletes/" + this.athleteId + "$", "g"))) {
			return;
		}

		if (env.debugMode) {
			console.log("Execute handleAthletesStats()");
		}

		const athleteStatsModifier: AthleteStatsModifier = new AthleteStatsModifier(this.appResources, {
			Run: this._userSettings.targetsYearRun,
			Ride: this._userSettings.targetsYearRide,
		});
		athleteStatsModifier.modify();
	}

	/**
	 *
	 */
	protected handleActivitiesSummary(): void {

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

	/**
	 *
	 */
	protected handlePreviewRibbon(): void {
		const globalStyle = "background-color: #FFF200; color: rgb(84, 84, 84); font-size: 12px; padding: 5px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; text-align: center;";
		const html: string = "<div id=\"updateRibbon\" style=\"" + globalStyle + "\"><strong>WARNING</strong> You are running a preview of <strong>StravistiX</strong>, to remove it, open a new tab and type <strong>chrome://extensions</strong></div>";
		$("body").before(html);
	}

	/**
	 *
	 */
	protected handleMenu(): void {

		if (env.debugMode) {
			console.log("Execute handleMenu()");
		}

		const menuModifier: MenuModifier = new MenuModifier(this.athleteId, this.appResources);
		menuModifier.modify();
	}

	/**
	 *
	 */
	protected handleRemoteLinks(): void {

		// If we are not on a segment or activity page then return...
		if (!window.location.pathname.match(/^\/segments\/(\d+)$/) && !window.location.pathname.match(/^\/activities/)) {
			return;
		}

		if (!this._userSettings.remoteLinks) {
			return;
		}

		if (env.debugMode) {
			console.log("Execute handleRemoteLinks()");
		}

		const remoteLinksModifier: RemoteLinksModifier = new RemoteLinksModifier(this.appResources, (this.activityAthleteId === this.athleteId), this.activityId);
		remoteLinksModifier.modify();
	}

	protected handleWindyTyModifier(): void {

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

		if (env.debugMode) {
			console.log("Execute handleWindyTyModifier()");
		}

		const windyTyModifier: WindyTyModifier = new WindyTyModifier(this.activityId, this.appResources, this._userSettings);
		windyTyModifier.modify();
	}

	protected handleReliveCCModifier(): void {

		if (!this._userSettings.displayReliveCCLink) {
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

		if (env.debugMode) {
			console.log("Execute handleReliveCCModifier()");
		}

		const reliveCCModifier: ReliveCCModifier = new ReliveCCModifier(this.activityId);
		reliveCCModifier.modify();
	}

	/**
	 *
	 */
	protected handleDefaultLeaderboardFilter(): void {

		// If we are not on a segment or activity page then return...
		if (!window.location.pathname.match(/^\/activities/)) {
			return;
		}

		// Kick out if we are not on SegmentLeaderboardView
		const view: any = Strava.Labs.Activities.SegmentLeaderboardView;

		if (!view) {
			return;
		}

		if (env.debugMode) {
			console.log("Execute handleDefaultLeaderboardFilter()");
		}

		const defaultLeaderBoardFilterModifier: DefaultLeaderBoardFilterModifier = new DefaultLeaderBoardFilterModifier(this._userSettings.defaultLeaderBoardFilter);
		defaultLeaderBoardFilterModifier.modify();
	}

	/**
	 *
	 */
	protected handleSegmentRankPercentage(): void {

		if (!this._userSettings.displaySegmentRankPercentage) {
			return;
		}

		// If we are not on a segment page then return...
		if (!window.location.pathname.match(/^\/segments\/(\d+)$/)) {
			return;
		}

		if (env.debugMode) {
			console.log("Execute handleSegmentRankPercentage()");
		}

		const segmentRankPercentage: SegmentRankPercentageModifier = new SegmentRankPercentageModifier();
		segmentRankPercentage.modify();
	}

	protected handleSegmentHRAP() {

		if (!this._userSettings.showHiddenBetaFeatures || !this.userSettings.displayRecentEffortsHRAdjustedPacePower) {
			return;
		}

		// If we are not on a segment page then return...
		if (!window.location.pathname.match(/^\/segments\/(\d+)$/)) {
			return;
		}

		if (env.debugMode) {
			console.log("Execute handleSegmentHRAP_()");
		}

		const segmentId: number = parseInt(/^\/segments\/(\d+)$/.exec(window.location.pathname)[1]);

		const segmentHRATime: SegmentRecentEffortsHRATimeModifier = new SegmentRecentEffortsHRATimeModifier(this.userSettings, this.athleteId, segmentId);
		segmentHRATime.modify();
	}

	/**
	 *
	 */
	protected handleActivityStravaMapType(): void {

		// Test where are on an activity...
		if (!window.location.pathname.match(/^\/activities/)) {
			return;
		}

		if (env.debugMode) {
			console.log("Execute handleActivityStravaMapType()");
		}

		const activityStravaMapTypeModifier: ActivityStravaMapTypeModifier = new ActivityStravaMapTypeModifier(this._userSettings.activityStravaMapType);
		activityStravaMapTypeModifier.modify();
	}

	protected handleHideFeed(): void {

		// Test if where are on dashboard page
		if (!window.location.pathname.match(/^\/dashboard/)) {
			return;
		}

		if (!this._userSettings.feedHideChallenges
			&& !this._userSettings.feedHideCreatedRoutes
			&& !this._userSettings.feedHidePosts
			&& !this._userSettings.feedHideRideActivitiesUnderDistance
			&& !this._userSettings.feedHideRunActivitiesUnderDistance
			&& !this._userSettings.feedHideVirtualRides
			&& !this._userSettings.feedHideSuggestedAthletes) {
			return;
		}

		if (env.debugMode) {
			console.log("Execute handleHideFeed()");
		}

		const hideFeedModifier: HideFeedModifier = new HideFeedModifier(this._userSettings);
		hideFeedModifier.modify();
	}

	protected handleDisplayFlyByFeedModifier(): void {

		// Test if where are on dashboard page
		if (!window.location.pathname.match(/^\/dashboard/)) {
			return;
		}

		if (env.debugMode) {
			console.log("Execute handleDisplayFlyByFeedModifier()");
		}

		const displayFlyByFeedModifier: DisplayFlyByFeedModifier = new DisplayFlyByFeedModifier();
		displayFlyByFeedModifier.modify();
	}

	/**
	 *
	 */
	protected handleExtendedActivityData(): void {

		if (_.isUndefined(window.pageView)) {
			return;
		}

		const activityType: string = window.pageView.activity().get("type");
		const isTrainer: boolean = window.pageView.activity().get("trainer");

		// Skip manual activities
		if (activityType === "Manual") {
			return;
		}

		this.activityProcessor.setActivityType(activityType);
		this.activityProcessor.setTrainer(isTrainer);

		if (env.debugMode) {
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
					this.activityProcessor,
					this.activityId,
					activityType,
					this.appResources,
					this._userSettings,
					this.isActivityAuthor,
					basicInfo,
					AbstractExtendedDataModifier.TYPE_ACTIVITY);
				break;
			case "Run":
				extendedDataModifier = new RunningExtendedDataModifier(
					this.activityProcessor,
					this.activityId,
					activityType,
					this.appResources,
					this._userSettings,
					this.isActivityAuthor,
					basicInfo,
					AbstractExtendedDataModifier.TYPE_ACTIVITY);
				break;
			default:
				break;
		}

		// Send opened activity type to ga for stats
		const updatedToEvent: any = {
			categorie: "Analyse",
			action: "openedActivityType",
			name: activityType,
		};

		follow("send", "event", updatedToEvent.categorie, updatedToEvent.action, updatedToEvent.name);
	}

	protected handleExtendedSegmentEffortData(): void {

		if (_.isUndefined(window.pageView)) {
			return;
		}

		if (!Strava.Labs) {
			return;
		}

		const activityType: string = window.pageView.activity().get("type");
		const isTrainer: boolean = window.pageView.activity().get("trainer");

		// Skip manual activities
		if (activityType === "Manual") {
			return;
		}

		this.activityProcessor.setActivityType(activityType);
		this.activityProcessor.setTrainer(isTrainer);

		let view: any = Strava.Labs.Activities.SegmentLeaderboardView; // Strava.Labs.Activities.SegmentEffortDetailView

		if (activityType === ("Run" || "Hike" || "Walk")) {
			view = Strava.Labs.Activities.SegmentEffortDetailView;
		}

		if (!view) {
			return;
		}

		const functionRender: any = view.prototype.render;

		const that: StravistiX = this;

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
						that.activityProcessor,
						that.activityId,
						activityType,
						that.appResources,
						that._userSettings,
						that.isActivityAuthor,
						basicInfo,
						AbstractExtendedDataModifier.TYPE_SEGMENT);
					break;
				case "Run":
					extendedDataModifier = new RunningExtendedDataModifier(
						that.activityProcessor,
						that.activityId,
						activityType,
						that.appResources,
						that._userSettings,
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

	/**
	 *
	 */
	protected handleNearbySegments(): void {

		if (!this._userSettings.displayNearbySegments) {
			return;
		}

		// If we are not on a segment page then return...
		const segmentData: string[] = window.location.pathname.match(/^\/segments\/(\d+)$/);
		if (_.isNull(segmentData)) {
			return;
		}

		if (env.debugMode) {
			console.log("Execute handleNearbySegments()");
		}

		// Getting segment id
		const segmentId: number = parseInt(segmentData[1]);

		const segmentProcessor: SegmentProcessor = new SegmentProcessor(this.vacuumProcessor, segmentId);
		segmentProcessor.getNearbySegmentsAround((jsonSegments: ISegmentInfo[]) => {

			if (env.debugMode) {
				console.log(jsonSegments);
			}

			const nearbySegmentsModifier: NearbySegmentsModifier = new NearbySegmentsModifier(jsonSegments, this.appResources);
			nearbySegmentsModifier.modify();

		});
	}

	/**
	 *
	 */
	protected handleActivityBikeOdo(): void {

		if (!this._userSettings.displayBikeOdoInActivity) {
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

		if (env.debugMode) {
			console.log("Execute handleActivityBikeOdo()");
		}

		const bikeOdoProcessor: BikeOdoProcessor = new BikeOdoProcessor(this.vacuumProcessor, this.activityAthleteId);
		bikeOdoProcessor.getBikeOdoOfAthlete((bikeOdoArray: string[]) => {
			const activityBikeOdoModifier: ActivityBikeOdoModifier = new ActivityBikeOdoModifier(bikeOdoArray, bikeOdoProcessor.getCacheKey());
			activityBikeOdoModifier.modify();
		});
	}

	/**
	 *
	 */
	protected handleActivitySegmentTimeComparison(): void {

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

		if (env.debugMode) {
			console.log("Execute handleActivitySegmentTimeComparison()");
		}

		const activitySegmentTimeComparisonModifier: ActivitySegmentTimeComparisonModifier = new ActivitySegmentTimeComparisonModifier(this._userSettings, this.appResources, activityType, isMyOwn);
		activitySegmentTimeComparisonModifier.modify();

	}

	/**
	 *
	 */
	protected handleActivityBestSplits(): void {

		if (!this._userSettings.displayActivityBestSplits) {
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

		if (env.debugMode) {
			console.log("Execute handleActivityBestSplits()");
		}

		// TODO Implement cache here: get stream from cache if exist
		this.vacuumProcessor.getActivityStream((activityCommonStats: any, jsonResponse: any, athleteWeight: number, hasPowerMeter: boolean) => {

			Helper.getFromStorage(this.extensionId, StorageManager.storageSyncType, "bestSplitsConfiguration", (response: any) => {

				const activityBestSplitsModifier: ActivityBestSplitsModifier = new ActivityBestSplitsModifier(this.activityId, this._userSettings, jsonResponse, hasPowerMeter, response.data, (splitsConfiguration: any) => {
					Helper.setToStorage(this.extensionId, StorageManager.storageSyncType, "bestSplitsConfiguration", splitsConfiguration);
				});

				activityBestSplitsModifier.modify();

			});

		});
	}

	/**
	 *
	 */
	protected handleRunningGradeAdjustedPace(): void {

		if (!this._userSettings.activateRunningGradeAdjustedPace) {
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

		if (env.debugMode) {
			console.log("Execute handleRunningGradeAdjustedPace()");
		}

		const runningGradeAdjustedPace: RunningGradeAdjustedPaceModifier = new RunningGradeAdjustedPaceModifier();
		runningGradeAdjustedPace.modify();
	}

	/**
	 *
	 */
	protected handleRunningHeartRate(): void {

		if (!this._userSettings.activateRunningHeartRate) {
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

		if (env.debugMode) {
			console.log("Execute handleRunningHeartRate()");
		}

		const runningHeartRateModifier: RunningHeartRateModifier = new RunningHeartRateModifier();
		runningHeartRateModifier.modify();
	}

	protected handleRunningCadence(): void {

		if (!this._userSettings.activateRunningCadence) {
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

		if (env.debugMode) {
			console.log("Execute handleRunningCadence()");
		}

		const runningCadenceModifier: RunningCadenceModifier = new RunningCadenceModifier();
		runningCadenceModifier.modify();
	}

	protected handleRunningTemperature(): void {

		if (!this._userSettings.activateRunningTemperature) {
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

		if (env.debugMode) {
			console.log("Execute handleRunningHeartRate()");
		}

		const runningTemperatureModifier: RunningTemperatureModifier = new RunningTemperatureModifier();
		runningTemperatureModifier.modify();
	}

	/**
	 *
	 */
	protected handleActivityQRCodeDisplay(): void {

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

	protected handleVirtualPartner(): void {

		// Test where are on an activity...
		if (!window.location.pathname.match(/^\/activities/)) {
			return;
		}

		const virtualPartnerModifier: VirtualPartnerModifier = new VirtualPartnerModifier(this.activityId, this.vacuumProcessor);
		virtualPartnerModifier.modify();
	}

	protected handleGoogleMapsComeBackModifier(): void {

		if (window.location.pathname.match(/\/truncate/)) { // Skipping on activity cropping
			return;
		}

		if (!this._userSettings.reviveGoogleMaps) {
			return;
		}

		// Test where are on an activity...
		if (!window.location.pathname.match(/^\/activities/)) {
			return;
		}

		const googleMapsModifier: GoogleMapsModifier = new GoogleMapsModifier(this.activityId, this.appResources, this._userSettings);
		googleMapsModifier.modify();
	}

	/**
	 * Launch a track event once a day (is user use it once a day), to follow is account type
	 */
	protected handleTrackTodayIncomingConnection(): void {

		const userHasConnectSince24Hour: boolean = (StorageManager.getCookie("stravistix_daily_connection_done") == "true");

		if (env.debugMode) {
			console.log("Cookie 'stravistix_daily_connection_done' value found is: " + userHasConnectSince24Hour);
		}

		if (_.isNull(this.athleteId)) {
			if (env.debugMode) {
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

			if (env.debugMode) {
				console.log("Cookie 'stravistix_daily_connection_done' not found, send track <IncomingConnection> / <" + accountType + "> / <" + eventName + ">");
			}

			if (!env.debugMode) {
				follow("send", "event", "DailyConnection", eventAction, eventName);
			}

			// Create cookie to avoid push during 1 day
			StorageManager.setCookie("stravistix_daily_connection_done", true, 1);

		} else {
			if (env.debugMode) {
				console.log("Cookie 'stravistix_daily_connection_done' exist, DO NOT TRACK IncomingConnection");
			}
		}
	}

	protected handleAthleteUpdate(): void {
		if (!StorageManager.getCookie("stravistix_athlete_update_done")) {
			this.commitAthleteUpdate().then((response: any) => {
				console.log("Updated", response);
				StorageManager.setCookieSeconds("stravistix_athlete_update_done", true, 6 * 60 * 60); // Don't update for 6 hours
			}, (err: any) => {
				console.error(err);
			});
		}
	}

	public get userSettings(): UserSettingsModel {
		return this._userSettings;
	}

	protected handleOnFlyActivitiesSync(): void {

		if (window.location.pathname.match("login") || window.location.pathname.match("upload")) {
			console.log("Login or upload page. Skip handleOnFlyActivitiesSync()");
			return;
		}

		if (window.location.search.match("stravistixSync")) {
			console.log("Sync Popup. Skip handleOnFlyActivitiesSync()");
			return;
		}

		setTimeout(() => { // Wait for 15s before starting the auto-sync

			// Allow activities sync if previous sync exists and has been done 12 hours or more ago.
			Helper.getFromStorage(this.extensionId, StorageManager.storageLocalType, ActivitiesSynchronizer.lastSyncDateTime, (response: any) => {

				const lastSyncDateTime: number = response.data;

				if (lastSyncDateTime) {

					console.log("A previous sync exists on " + new Date(lastSyncDateTime).toString());

					if (Date.now() > (lastSyncDateTime + 1000 * 60 * this.userSettings.autoSyncMinutes)) {

						console.log("Last sync performed more than " + this.userSettings.autoSyncMinutes + " minutes. auto-sync now");

						// Start sync
						this.activitiesSynchronizer.sync().then((syncResult: ISyncResult) => {

							console.log("Sync finished", syncResult);

							// Remove auto-sync lock
							StorageManager.setCookieSeconds("stravistix_auto_sync_locker", true, 0);

						}, (err: any) => {

							console.error("Sync error", err);

							// Remove auto-sync lock
							StorageManager.setCookieSeconds("stravistix_auto_sync_locker", true, 0);

							const errorUpdate: any = {
								stravaId: this.athleteId,
								error: {path: window.location.href, date: new Date(), content: err},
							};

							const endPoint = HerokuEndpoints.resolve(env.endPoint) + "/api/errorReport";

							$.post({
								url: endPoint,
								data: JSON.stringify(errorUpdate),
								dataType: "json",
								contentType: "application/json",
								success: (response: any) => {
									console.log("Commited: ", response);
								},
								error: (jqXHR: JQueryXHR, textStatus: string, errorThrown: string) => {
									console.warn("Endpoint <" + endPoint + "> not reachable", jqXHR);
								},
							});

						}, (progress: SyncNotifyModel) => {
							// console.log(progress);
						});

					} else {
						console.log("Do not auto-sync. Last sync done under than " + this.userSettings.autoSyncMinutes + " minute(s) ago");
					}

				} else {
					console.log("No previous sync found. A first sync must be performed");
				}
			});

		}, 1000 * 10); // Wait for 10s before starting the auto-sync

	}

	protected handleActivitiesSyncFromOutside() {

		if (!window.location.search.match("stravistixSync")) { // Skipping is we are not on sync popup
			return;
		}

		const urlParams = Helper.params(window.location);

		const allowSync = (urlParams.stravistixSync === "true") ? true : false;
		if (!allowSync) {
			return;
		}

		const sourceTabId = (urlParams.sourceTabId) ? parseInt(urlParams.sourceTabId) : -1;
		const forceSync = (urlParams.forceSync === "true") ? true : false;

		const activitiesSyncModifier: ActivitiesSyncModifier = new ActivitiesSyncModifier(this.appResources, this.userSettings, forceSync, sourceTabId);
		activitiesSyncModifier.modify();
	}

	protected commitAthleteUpdate(): Q.IPromise<any> {
		const athleteUpdate: IAthleteUpdate = AthleteUpdate.create(this.athleteId, this.athleteName, (this.appResources.extVersion !== "0") ? this.appResources.extVersion : this.appResources.extVersionName, this.isPremium, this.isPro, window.navigator.language, this.userSettings.userRestHr, this.userSettings.userMaxHr);
		return AthleteUpdate.commit(athleteUpdate);
	}
}
