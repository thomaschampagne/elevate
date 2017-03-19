/// <reference path="../../../typings/index.d.ts" />
/// <reference path="../../../typings/plugin.d.ts" />

class StravistiX {

    public static instance: StravistiX = null;

    protected isPro: boolean;
    protected isPremium: boolean;
    protected athleteName: string;
    protected athleteIdAuthorOfActivity: number;
    protected activityId: number;
    protected athleteId: number;
    protected activityProcessor: ActivityProcessor;
    protected extensionId: string;
    protected appResources: IAppResources;
    protected _userSettings: IUserSettings;
    protected vacuumProcessor: VacuumProcessor;
    protected activitiesSynchronizer: ActivitiesSynchronizer;

    constructor(userSettings: IUserSettings, appResources: IAppResources) {

        this._userSettings = userSettings;
        this.appResources = appResources;
        this.extensionId = this.appResources.extensionId;
        this.vacuumProcessor = new VacuumProcessor();
        this.activityProcessor = new ActivityProcessor(this.appResources, this.vacuumProcessor, this._userSettings);
        this.athleteId = this.vacuumProcessor.getAthleteId();
        this.athleteName = this.vacuumProcessor.getAthleteName();
        this.athleteIdAuthorOfActivity = this.vacuumProcessor.getAthleteIdAuthorOfActivity();
        this.isPremium = this.vacuumProcessor.getPremiumStatus();
        this.isPro = this.vacuumProcessor.getProStatus();
        this.activityId = this.vacuumProcessor.getActivityId();
        this.activitiesSynchronizer = new ActivitiesSynchronizer(this.appResources, this._userSettings);

        this.init();

        if (StravistiX.instance == null) {
            StravistiX.instance = this;
        }
    }

    /**
     * Make the work...
     */
    protected init(): void {

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
            Helper.setToStorage(this.extensionId, StorageManager.storageSyncType, 'localStorageMustBeCleared', false, (response: any) => {
                console.log('localStorageMustBeCleared is now ' + response.data.localStorageMustBeCleared);
            });
        }

        if (env.debugMode) console.log("Handling " + window.location.pathname);

        // Common
        this.handleMenu();
        this.handleRemoteLinks();
        this.handleWindyTyModifier();
        this.handleReliveCCModifier();
        this.handleActivityScrolling();
        this.handleDefaultLeaderboardFilter();
        this.handleSegmentRankPercentage();
        this.handleSegmentHRAP();
        this.handleActivityStravaMapType();
        this.handleHidePremium();
        this.handleHideFeed();
        this.handleDisplayFlyByFeedModifier();
        this.handleGoalsModifier();
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

        if (_.isEqual(window.location.hostname, 'app.strava.com')) {
            let forwardUrl: string = window.location.protocol + "//www.strava.com" + window.location.pathname;
            window.location.href = forwardUrl;
            return true;
        }
        return false;
    }

    /**
     *
     */
    protected showPluginInstallOrUpgradeRibbon(): void {

        let latestRelease: IReleaseNote = _.first(releaseNotes);

        if (_.isBoolean(latestRelease.silent) && latestRelease.silent) {
            console.log('Silent update... skip update ribbon');
            return;
        }

        let ribbonMessage: string = '<a href="#" class="pluginInstallOrUpgrade_details"><img style="width: 24px;" src="' + this.appResources.systemUpdatesIcon + '" /> StravistiX ' + this.appResources.extVersion + ' update</a> ' + latestRelease.message + '. <a href="#" class="pluginInstallOrUpgrade_details">[show update details]</a>';
        let ribbonHtml: string = '<div id="pluginInstallOrUpgrade" style=\"background-color: rgba(255, 212, 1, 0.57); text-align: center; padding-top: 10px; padding-bottom: 10px;\"><div style="display:inline; font-size: 14px;">' + ribbonMessage + '</div><div style="display:inline; float: right; font-size: 14px; padding-right: 10px;"><a href="#" id="pluginInstallOrUpgrade_close">close (<span id="pluginInstallOrUpgrade_counter"></span>)</a></div></div>';

        $('body').before(ribbonHtml).each(() => {

            let closeRibbon = function () {
                $('#pluginInstallOrUpgrade').slideUp(450, () => {
                    $('#pluginInstallOrUpgrade').remove();
                });
                clearInterval(counterInterval);
            };

            // Display ribbon
            $('#pluginInstallOrUpgrade').hide();
            $('#pluginInstallOrUpgrade').slideDown(450);

            let counter = 15000;
            let refresh = 1000;
            $('#pluginInstallOrUpgrade_counter').html((counter / 1000).toString())
            let counterInterval = setInterval(() => {
                counter -= refresh;
                $('#pluginInstallOrUpgrade_counter').html((counter / 1000).toString());
            }, refresh);

            setTimeout(() => {
                closeRibbon();
            }, counter); // 10 sec auto hide

            $('#pluginInstallOrUpgrade_close').on('click', () => {
                closeRibbon();
            });

            $('.pluginInstallOrUpgrade_details').on('click', () => {
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

        if (window.location.search.match('stravistixSync')) {
            console.log('Skip handlePluginInstallOrUpgrade since we are on a sync');
            return;
        }

        let saveCurrentVersionInstalled = (callback: Function) => {

            let toBeStored = {
                version: this.appResources.extVersion,
                on: Date.now()
            };

            Helper.setToStorage(this.extensionId, StorageManager.storageLocalType, 'versionInstalled', toBeStored, () => { // TODO make versionInstalled static
                console.log("Version has been saved to local storage");
                callback();
            });
        };

        // Check for previous version is installed
        Helper.getFromStorage(this.extensionId, StorageManager.storageLocalType, 'versionInstalled', (response: any) => {

            // Override version with fake one to simulate update
            if (env.simulateUpdate) {
                response = {
                    data: {
                        version: 'fakeVersion',
                        on: 0
                    }
                }
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
                    let updatedToEvent: any = {
                        categorie: 'Exploitation',
                        action: 'updatedVersion',
                        name: this.appResources.extVersion
                    };

                    follow('send', 'event', updatedToEvent.categorie, updatedToEvent.action, updatedToEvent.name);

                    StorageManager.setCookieSeconds('stravistix_athlete_update_done', false, 0); // Remove stravistix_athlete_update_done cookie to trigger athlete commit earlier

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

        let previewBuild: boolean = false;
        if (this.appResources.extVersionName.indexOf('preview@') !== -1) {
            previewBuild = true;
        }

        let latestRelease: IReleaseNote = _.first(releaseNotes);

        let updateMessageObj: any = {
            logo: '<img src="' + this.appResources.logoStravistix + '"/>',
            title: 'This browser was just updated to <strong>v' + this.appResources.extVersionName + '</strong> :)',
            hotFixes: (latestRelease.hotFixes) ? latestRelease.hotFixes : [],
            features: (latestRelease.features) ? latestRelease.features : [],
            fixes: (latestRelease.fixes) ? latestRelease.fixes : [],
            upcomingFixes: [],
            upcomingFeatures: [
                'Years progressions reworked',
                'Dashboard: Interrogate any stats of your history on a period. By sports, by bike, by shoes... Fully customisable.',
                'Grid: All your activities in a table including stravistix extended stats as columns.',
                //'3D display of an activity ?! I\'ve skills in video games development. Looking to do something clean with WebGL ;)',
                'Stay tunned via <a target="_blank" href="https://twitter.com/champagnethomas">My Twitter</a> // Just created <a target="_blank" href="https://www.strava.com/clubs/stravistix">Strava Club</a>',
            ]
        };

        let message: string = '';
        if (!_.isEmpty(latestRelease.message) && !previewBuild) {
            message += '<div style="background: #eee; padding: 8px;">';
            message += latestRelease.message;
            message += '</div>';
        }

        let baseVersion: Array<string> = this.appResources.extVersion.split('.');
        if (!_.isEmpty(updateMessageObj.features) && !previewBuild) {
            message += '<h5><strong>NEW in ' + baseVersion[0] + '.' + baseVersion[1] + '.x' + ':</strong></h5>';
            _.each(updateMessageObj.features, (feature: string) => {
                message += '<h6 style="margin-top: 12px;">- ' + feature + '</h6>';
            });
        }

        if (!_.isEmpty(updateMessageObj.hotFixes) && !previewBuild) {
            message += '<h5><strong>HOTFIXES ' + this.appResources.extVersion + ':</strong></h5>';
            _.each(updateMessageObj.hotFixes, (hotFix: string) => {
                message += '<h6 style="margin-top: 12px;">- ' + hotFix + '</h6>';
            });
        }

        if (!_.isEmpty(updateMessageObj.fixes) && !previewBuild) {
            message += '<h5><strong>FIXED in ' + baseVersion[0] + '.' + baseVersion[1] + '.' + baseVersion[2] + ':</strong></h5>';
            _.each(updateMessageObj.fixes, (fix: string) => {
                message += '<h6 style="margin-top: 12px;">- ' + fix + '</h6>';
            });
        }

        if (!_.isEmpty(updateMessageObj.upcomingFixes) && !previewBuild) {
            message += '<h5><strong>Upcoming Fixes:</strong></h5>';
            _.each(updateMessageObj.upcomingFixes, (upcomingFixes: string) => {
                message += '<h6 style="margin-top: 12px;">- ' + upcomingFixes + '</h6>';
            });
        }

        if (!_.isEmpty(updateMessageObj.upcomingFeatures) && !previewBuild) {
            message += '<h5><strong>Upcoming Features:</strong></h5>';
            _.each(updateMessageObj.upcomingFeatures, (upcomingFeatures: string) => {
                message += '<h6 style="margin-top: 12px;">- ' + upcomingFeatures + '</h6>';
            });
        }

        if (previewBuild) {
            updateMessageObj.title = this.appResources.extVersionName;
            let shortSha1Commit: string = this.appResources.extVersionName.slice(this.appResources.extVersionName.indexOf('@') + 1);
            message += '<a href="https://github.com/thomaschampagne/stravistix/compare/master...' + shortSha1Commit + '" target="_blank">Git diff between ' + this.appResources.extVersionName + ' and master (code in production)</a></br></br> ';
        }

        // Donate button
        message += '<a class="button btn-primary" target="_blank" id="extendedStatsButton" href="' + this.appResources.settingsLink + '#/?showDonation=true">';
        message += '<button style="font-size: 18px; width: 100%;" class="btn btn-primary btn-sm">Push this project higher !!!</button>';
        message += '</a>';

        $.fancybox('<div style="margin-left: auto; margin-right: auto; width: 25%;">' + updateMessageObj.logo + '</div><h2>' + updateMessageObj.title + '</h2>' + message);
    }

    /**
     *
     */
    protected handleAthletesStats(): void {

        // If we are not on the athletes page then return...
        if (!window.location.pathname.match(new RegExp("/athletes/" + this.athleteId + "$", "g"))) {
            return;
        }

        if (env.debugMode) console.log("Execute handleAthletesStats()");

        let athleteStatsModifier: AthleteStatsModifier = new AthleteStatsModifier(this.appResources, {
            Run: this._userSettings.targetsYearRun,
            Ride: this._userSettings.targetsYearRide
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
        let globalStyle: string = 'background-color: #FFF200; color: rgb(84, 84, 84); font-size: 12px; padding: 5px; font-family: \'Helvetica Neue\', Helvetica, Arial, sans-serif; text-align: center;';
        let html: string = '<div id="updateRibbon" style="' + globalStyle + '"><strong>WARNING</strong> You are running a preview of <strong>StravistiX</strong>, to remove it, open a new tab and type <strong>chrome://extensions</strong></div>';
        $('body').before(html);
    }

    /**
     *
     */
    protected handleMenu(): void {

        if (env.debugMode) console.log("Execute handleMenu()");

        let menuModifier: MenuModifier = new MenuModifier(this.athleteId, this.appResources);
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

        if (env.debugMode) console.log("Execute handleRemoteLinks()");

        let remoteLinksModifier: RemoteLinksModifier = new RemoteLinksModifier(this.appResources, (this.athleteIdAuthorOfActivity === this.athleteId), this.activityId);
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
        if (window.pageView.activity().get('type') !== "Ride") {
            return;
        }

        // If home trainer skip (it will use gps data to locate weather data)
        if (window.pageView.activity().get('trainer')) {
            return;
        }

        if (env.debugMode) console.log("Execute handleWindyTyModifier()");

        let windyTyModifier: WindyTyModifier = new WindyTyModifier(this.activityId, this.appResources, this._userSettings);
        windyTyModifier.modify();
    }

    protected handleReliveCCModifier(): void {

        if (!this._userSettings.showHiddenBetaFeatures || !this._userSettings.displayReliveCCLink) {
            return;
        }

        // If we are not on a segment or activity page then return...
        if (!window.location.pathname.match(/^\/activities/)) {
            return;
        }

        if (!window.pageView) {
            return;
        }

        // Avoid running Extended data at the moment
        if (window.pageView.activity().get('type') != "Ride") {
            return;
        }

        // If home trainer skip (it will use gps data to locate weather data)
        if (window.pageView.activity().get('trainer')) {
            return;
        }

        if (env.debugMode) console.log("Execute handleReliveCCModifier()");

        let reliveCCModifier: ReliveCCModifier = new ReliveCCModifier(this.activityId);
        reliveCCModifier.modify();
    }


    /**
     *
     */
    protected handleActivityScrolling(): void {

        if (!this._userSettings.feedAutoScroll) {
            return;
        }

        if (env.debugMode) console.log("Execute handleActivityScrolling_()");


        let activityScrollingModifier: ActivityScrollingModifier = new ActivityScrollingModifier();
        activityScrollingModifier.modify();
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
        let view: any = Strava.Labs.Activities.SegmentLeaderboardView;

        if (!view) {
            return;
        }

        if (env.debugMode) console.log("Execute handleDefaultLeaderboardFilter()");

        let defaultLeaderBoardFilterModifier: DefaultLeaderBoardFilterModifier = new DefaultLeaderBoardFilterModifier(this._userSettings.defaultLeaderBoardFilter);
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

        if (env.debugMode) console.log("Execute handleSegmentRankPercentage()");

        let segmentRankPercentage: SegmentRankPercentageModifier = new SegmentRankPercentageModifier();
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

        if (env.debugMode) console.log("Execute handleSegmentHRAP_()");

        let segmentId: number = parseInt(/^\/segments\/(\d+)$/.exec(window.location.pathname)[1]);

        let segmentHRATime: SegmentRecentEffortsHRATimeModifier = new SegmentRecentEffortsHRATimeModifier(this.userSettings, this.athleteId, segmentId);
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

        if (env.debugMode) console.log("Execute handleActivityStravaMapType()");

        let activityStravaMapTypeModifier: ActivityStravaMapTypeModifier = new ActivityStravaMapTypeModifier(this._userSettings.activityStravaMapType);
        activityStravaMapTypeModifier.modify();
    }

    /**
     *
     */
    protected handleHidePremium(): void {

        // Eject premium users of this "Hiding" feature
        // Even if they checked "ON" the hide premium option
        if (this.isPremium) {
            return;
        }

        if (!this._userSettings.hidePremiumFeatures) {
            return;
        }

        if (env.debugMode) console.log("Execute handleHidePremium()");

        let hidePremiumModifier: HidePremiumModifier = new HidePremiumModifier();
        hidePremiumModifier.modify();
    }

    protected handleHideFeed(): void {

        // Test if where are on dashboard page
        if (!window.location.pathname.match(/^\/dashboard/)) {
            return;
        }


        if (!this._userSettings.feedHideChallenges && !this._userSettings.feedHideCreatedRoutes && !this._userSettings.feedHideRideActivitiesUnderDistance && !this._userSettings.feedHideRunActivitiesUnderDistance && !this._userSettings.feedHideVirtualRides) {
            return;
        }

        if (env.debugMode) console.log("Execute handleHideFeed()");

        let hideFeedModifier: HideFeedModifier = new HideFeedModifier(this._userSettings);
        hideFeedModifier.modify();
    }

    protected handleDisplayFlyByFeedModifier(): void {

        // Test if where are on dashboard page
        if (!window.location.pathname.match(/^\/dashboard/)) {
            return;
        }

        if (env.debugMode) console.log("Execute handleDisplayFlyByFeedModifier()");

        let displayFlyByFeedModifier: DisplayFlyByFeedModifier = new DisplayFlyByFeedModifier();
        displayFlyByFeedModifier.modify();
    }

    /**
     *
     */
    protected handleExtendedActivityData(): void {

        if (_.isUndefined(window.pageView)) {
            return;
        }

        let activityType: string = window.pageView.activity().get('type');
        let isTrainer: boolean = window.pageView.activity().get('trainer');

        // Skip manual activities
        if (activityType === 'Manual') {
            return;
        }

        this.activityProcessor.setActivityType(activityType);
        this.activityProcessor.setTrainer(isTrainer);

        if (env.debugMode) console.log("Execute handleExtendedData_()");

        let basicInfo: IActivityBasicInfo = {
            activityName: this.vacuumProcessor.getActivityName(),
            activityTime: this.vacuumProcessor.getActivityTime()
        };

        let extendedDataModifier: AbstractExtendedDataModifier;

        switch (activityType) {
            case 'Ride':
                extendedDataModifier = new CyclingExtendedDataModifier(
                    this.activityProcessor,
                    this.activityId,
                    activityType,
                    this.appResources,
                    this._userSettings,
                    this.athleteId,
                    this.athleteIdAuthorOfActivity,
                    basicInfo,
                    AbstractExtendedDataModifier.TYPE_ACTIVITY);
                break;
            case 'Run':
                extendedDataModifier = new RunningExtendedDataModifier(
                    this.activityProcessor,
                    this.activityId,
                    activityType,
                    this.appResources,
                    this._userSettings,
                    this.athleteId,
                    this.athleteIdAuthorOfActivity,
                    basicInfo,
                    AbstractExtendedDataModifier.TYPE_ACTIVITY);
                break;
            default:
                break;
        }

        // Send opened activity type to ga for stats
        let updatedToEvent: any = {
            categorie: 'Analyse',
            action: 'openedActivityType',
            name: activityType
        };

        follow('send', 'event', updatedToEvent.categorie, updatedToEvent.action, updatedToEvent.name);
    }

    protected handleExtendedSegmentEffortData(): void {

        if (_.isUndefined(window.pageView)) {
            return;
        }

        if (!Strava.Labs) {
            return;
        }

        let activityType: string = window.pageView.activity().get('type');
        let isTrainer: boolean = window.pageView.activity().get('trainer');

        // Skip manual activities
        if (activityType === 'Manual') {
            return;
        }

        this.activityProcessor.setActivityType(activityType);
        this.activityProcessor.setTrainer(isTrainer);

        let view: any = Strava.Labs.Activities.SegmentLeaderboardView; // Strava.Labs.Activities.SegmentEffortDetailView

        if (activityType === ('Run' || 'Hike' || 'Walk')) {
            view = Strava.Labs.Activities.SegmentEffortDetailView;
        }

        if (!view) {
            return;
        }

        let functionRender: any = view.prototype.render;

        let that: StravistiX = this;

        view.prototype.render = function () { // No arrow function here with! If yes loosing arguments

            let r: any = functionRender.apply(this, Array.prototype.slice.call(arguments));

            let basicInfo: IActivityBasicInfo = {
                activityName: that.vacuumProcessor.getActivityName(),
                activityTime: that.vacuumProcessor.getActivityTime()
            };

            let extendedDataModifier: AbstractExtendedDataModifier;

            switch (activityType) {
                case 'Ride':
                    extendedDataModifier = new CyclingExtendedDataModifier(
                        that.activityProcessor,
                        that.activityId,
                        activityType,
                        that.appResources,
                        that._userSettings,
                        that.athleteId,
                        that.athleteIdAuthorOfActivity,
                        basicInfo,
                        AbstractExtendedDataModifier.TYPE_SEGMENT);
                    break;
                case 'Run':
                    extendedDataModifier = new RunningExtendedDataModifier(
                        that.activityProcessor,
                        that.activityId,
                        activityType,
                        that.appResources,
                        that._userSettings,
                        that.athleteId,
                        that.athleteIdAuthorOfActivity,
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
        let segmentData: Array<string> = window.location.pathname.match(/^\/segments\/(\d+)$/);
        if (_.isNull(segmentData)) {
            return;
        }

        if (env.debugMode) console.log("Execute handleNearbySegments()");

        // Getting segment id
        let segmentId: number = parseInt(segmentData[1]);

        let segmentProcessor: SegmentProcessor = new SegmentProcessor(this.vacuumProcessor, segmentId);
        segmentProcessor.getNearbySegmentsAround((jsonSegments: Array<ISegmentInfo>) => {

            if (env.debugMode) console.log(jsonSegments);

            let nearbySegmentsModifier: NearbySegmentsModifier = new NearbySegmentsModifier(jsonSegments, this.appResources);
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

        if (env.debugMode) console.log("Execute handleActivityBikeOdo()");

        let bikeOdoProcessor: BikeOdoProcessor = new BikeOdoProcessor(this.vacuumProcessor, this.athleteIdAuthorOfActivity);
        bikeOdoProcessor.getBikeOdoOfAthlete((bikeOdoArray: Array<string>) => {
            let activityBikeOdoModifier: ActivityBikeOdoModifier = new ActivityBikeOdoModifier(bikeOdoArray, bikeOdoProcessor.getCacheKey());
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

        let activityType: string = window.pageView.activity().get('type');
        // PR only for my own activities
        let isMyOwn: boolean = (this.athleteId == this.athleteIdAuthorOfActivity);

        if (env.debugMode) console.log("Execute handleActivitySegmentTimeComparison()");

        let activitySegmentTimeComparisonModifier: ActivitySegmentTimeComparisonModifier = new ActivitySegmentTimeComparisonModifier(this._userSettings, this.appResources, activityType, isMyOwn);

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

        if (env.debugMode) console.log("Execute handleActivityBestSplits()");

        // TODO Implement cache here: get stream from cache if exist
        this.vacuumProcessor.getActivityStream((activityCommonStats: any, jsonResponse: any, athleteWeight: number, hasPowerMeter: boolean) => {

            Helper.getFromStorage(this.extensionId, StorageManager.storageSyncType, 'bestSplitsConfiguration', (response: any) => {

                let activityBestSplitsModifier: ActivityBestSplitsModifier = new ActivityBestSplitsModifier(this.activityId, this._userSettings, jsonResponse, hasPowerMeter, response.data, (splitsConfiguration: any) => {
                    Helper.setToStorage(this.extensionId, StorageManager.storageSyncType, 'bestSplitsConfiguration', splitsConfiguration);
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

        if (env.debugMode) console.log("Execute handleRunningGradeAdjustedPace()");

        let runningGradeAdjustedPace: RunningGradeAdjustedPaceModifier = new RunningGradeAdjustedPaceModifier();
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

        if (env.debugMode) console.log("Execute handleRunningHeartRate()");

        let runningHeartRateModifier: RunningHeartRateModifier = new RunningHeartRateModifier();
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

        if (env.debugMode) console.log("Execute handleRunningCadence()");

        let runningCadenceModifier: RunningCadenceModifier = new RunningCadenceModifier();
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

        if (env.debugMode) console.log("Execute handleRunningHeartRate()");

        let runningTemperatureModifier: RunningTemperatureModifier = new RunningTemperatureModifier();
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

        let activityQRCodeDisplayModifier: ActivityQRCodeDisplayModifier = new ActivityQRCodeDisplayModifier(this.appResources, this.activityId);
        activityQRCodeDisplayModifier.modify();

    }

    protected handleVirtualPartner(): void {

        // Test where are on an activity...
        if (!window.location.pathname.match(/^\/activities/)) {
            return;
        }

        let virtualPartnerModifier: VirtualPartnerModifier = new VirtualPartnerModifier(this.activityId);
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

        let googleMapsModifier: GoogleMapsModifier = new GoogleMapsModifier(this.activityId, this.appResources, this._userSettings);
        googleMapsModifier.modify();
    }

    /**
     * Launch a track event once a day (is user use it once a day), to follow is account type
     */
    protected handleTrackTodayIncomingConnection(): void {

        let userHasConnectSince24Hour: boolean = (StorageManager.getCookie('stravistix_daily_connection_done') == 'true');

        if (env.debugMode) console.log("Cookie 'stravistix_daily_connection_done' value found is: " + userHasConnectSince24Hour);

        if (_.isNull(this.athleteId)) {
            if (env.debugMode) console.log("athleteId is empty value: " + this.athleteId);
            return;
        }

        if (!userHasConnectSince24Hour) {

            let accountType: string = 'Free';
            let accountName: string = this.athleteName;

            // We enter in that condition if user is premium or pro
            if (!_.isNull(this.isPremium) && this.isPremium === true) {
                accountType = 'Premium';
            }

            // accountType is overridden with "pro" if that condition is true
            if (!_.isNull(this.isPro) && this.isPro === true) {
                accountType = 'Pro';
            }

            let eventAction: string = 'DailyConnection_Account_' + accountType;

            // Push IncomingConnection
            let eventName: string = accountName + ' #' + this.athleteId + ' v' + this.appResources.extVersion;

            if (env.debugMode) console.log("Cookie 'stravistix_daily_connection_done' not found, send track <IncomingConnection> / <" + accountType + "> / <" + eventName + ">");

            if (!env.debugMode) {
                follow('send', 'event', 'DailyConnection', eventAction, eventName);
            }

            // Create cookie to avoid push during 1 day
            StorageManager.setCookie('stravistix_daily_connection_done', true, 1);

        } else {
            if (env.debugMode) console.log("Cookie 'stravistix_daily_connection_done' exist, DO NOT TRACK IncomingConnection");
        }
    }

    protected handleAthleteUpdate(): void {
        if (!StorageManager.getCookie('stravistix_athlete_update_done')) {
            this.commitAthleteUpdate();
            StorageManager.setCookieSeconds('stravistix_athlete_update_done', true, 6 * 60 * 60); // Don't update for 6 hours
        }
    }

    /**
     * Check for goals element and enable GoalsModifier.
     *
     * This checks the document for a #progress-goals-v2 element. If
     * found then the GoalsModifier is enabled and bound to the element.
     * However, note that the modifier only works for the current athelete,
     * and hence is only enabled on the dashboard and current user's profile
     * pages.
     *
     * If the `displayExtendedGoals` user setting is false then this
     * handler does nothing.
     */
    protected handleGoalsModifier(): void {
        if (!this._userSettings.showHiddenBetaFeatures || !this._userSettings.displayExtendedGoals) {
            return;
        }
        let goals = $('#progress-goals-v2');
        if (goals.length > 0) {
            let pageProfile = new RegExp(`^/athletes/${this.athleteId}$`);
            let pageDashboard = new RegExp('^/dashboard');
            if (window.location.pathname.match(pageProfile)
                || window.location.pathname.match(pageDashboard)) {
                new GoalsModifier(goals).modify();
            }
        }
    }

    public get userSettings(): IUserSettings {
        return this._userSettings;
    }

    protected handleOnFlyActivitiesSync(): void {

        if (window.location.pathname.match('login') || window.location.pathname.match('upload')) {
            console.log('Login or upload page. Skip handleOnFlyActivitiesSync()');
            return;
        }

        if (window.location.search.match('stravistixSync')) {
            console.log('Sync Popup. Skip handleOnFlyActivitiesSync()');
            return;
        }

        setTimeout(() => { // Wait for 15s before starting the auto-sync

            // Allow activities sync if previous sync exists and has been done 12 hours or more ago.
            Helper.getFromStorage(this.extensionId, StorageManager.storageLocalType, ActivitiesSynchronizer.lastSyncDateTime, (response: any) => {

                let lastSyncDateTime: number = response.data;

                if (lastSyncDateTime) {

                    console.log('A previous sync exists on ' + new Date(lastSyncDateTime).toString());

                    if (Date.now() > (lastSyncDateTime + 1000 * 60 * this.userSettings.autoSyncMinutes)) {

                        console.log('Last sync performed more than ' + this.userSettings.autoSyncMinutes + ' minutes. auto-sync now');

                        // Avoid concurrent auto-sync when several tabs opened
                        if (StorageManager.getCookie('stravistix_auto_sync_locker')) {
                            let warnMessage = 'Auto-sync locked for 10 minutes. Skipping auto-sync. Why? another tab/window may have started the sync. ';
                            warnMessage += 'If auto-sync has been interrupted (eg. tab closed), auto-sync will be available back in 10 minutes.';
                            console.warn(warnMessage);
                            return;
                        } else {
                            console.log('Auto-sync started, set stravistix_auto_sync_locker to true.')
                            StorageManager.setCookieSeconds('stravistix_auto_sync_locker', true, 60 * 10); // 10 minutes
                        }

                        // Start sync
                        this.activitiesSynchronizer.sync().then((syncResult: ISyncResult) => {

                            console.log('Sync finished', syncResult);

                            // Remove auto-sync lock
                            StorageManager.setCookieSeconds('stravistix_auto_sync_locker', true, 0);

                        }, (err: any) => {

                            console.error('Sync error', err);

                            // Remove auto-sync lock
                            StorageManager.setCookieSeconds('stravistix_auto_sync_locker', true, 0);

                            let errorUpdate: any = {
                                stravaId: this.athleteId,
                                error: {path: window.location.href, date: new Date(), content: err}
                            };

                            $.post({
                                url: env.endPoint + '/api/errorReport',
                                data: JSON.stringify(errorUpdate),
                                dataType: 'json',
                                contentType: 'application/json',
                                success: (response: any) => {
                                    console.log('Commited: ', response);
                                },
                                error: (jqXHR: JQueryXHR, textStatus: string, errorThrown: string) => {
                                    console.warn('Endpoint <' + env.endPoint + '> not reachable', jqXHR);
                                }
                            });


                        }, (progress: ISyncNotify) => {
                            // console.log(progress);
                        });

                    } else {
                        console.log('Do not auto-sync. Last sync done under than ' + this.userSettings.autoSyncMinutes + ' minute(s) ago');
                    }

                } else {
                    console.log('No previous sync found. A first sync must be performed');
                }
            });

        }, 1000 * 15); // Wait for 15s before starting the auto-sync

    }

    protected handleActivitiesSyncFromOutside() {

        if (!window.location.search.match('stravistixSync')) { // Skipping is we are not on sync popup
            return;
        }

        let urlParams = Helper.params(window.location);

        let allowSync = (urlParams.stravistixSync === 'true') ? true : false;
        if (!allowSync) {
            return;
        }

        let sourceTabId = (urlParams.sourceTabId) ? parseInt(urlParams.sourceTabId) : -1;
        let forceSync = (urlParams.forceSync === 'true') ? true : false;

        let activitiesSyncModifier: ActivitiesSyncModifier = new ActivitiesSyncModifier(this.appResources, this.userSettings, forceSync, sourceTabId);
        activitiesSyncModifier.modify();
    }

    protected commitAthleteUpdate() {
        let athleteUpdate: IAthleteUpdate = AthleteUpdate.create(this.athleteId, this.athleteName, (this.appResources.extVersion !== '0') ? this.appResources.extVersion : this.appResources.extVersionName, this.isPremium, this.isPro, window.navigator.language, this.userSettings.userRestHr, this.userSettings.userMaxHr);
        AthleteUpdate.commit(athleteUpdate);
    }
}
