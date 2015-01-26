/**
 *   StravaPlus is responsible of linking processors with modfiers and user settings/health data
 */
function StravaPlus(userSettings, appResources) {

    this.userSettings_ = userSettings;
    this.appResources_ = appResources;
    this.extensionId_ = this.appResources_.extensionId;
    this.vacuumProcessor_ = new VacuumProcessor();
    this.activityProcessor_ = new ActivityProcessor(this.vacuumProcessor_, this.userSettings_.userHrrZones);
    this.athleteId_ = this.vacuumProcessor_.getAthleteId();
    this.athleteName_ = this.vacuumProcessor_.getAthleteName();
    this.athleteIdAuthorOfActivity_ = this.vacuumProcessor_.getAthleteIdAuthorOfActivity();
    this.isPremium_ = this.vacuumProcessor_.getPremiumStatus();
    this.isPro_ = this.vacuumProcessor_.getProStatus();
    this.activityId_ = this.vacuumProcessor_.getActivityId();

    // Make the work...
    this.init_();
}

/**
 *   Static vars
 */
StravaPlus.getFromStorageMethod = 'getFromStorage';
StravaPlus.setToStorageMethod = 'setToStorage';
StravaPlus.defaultIntervalTimeMillis = 750;
StravaPlus.debugMode = false;

/**
 * Define prototype
 */
StravaPlus.prototype = {

    init_: function init_() {

        // Redirect app.strava.com/* to www.strava.com/*
        if (this.handleForwardToWWW_()) {
            return; // Skip rest of init to be compliant with www.strava.com/* on next reload
        }

        // Handle some tasks to od when update occurs
        if (this.userSettings_.extensionHasJustUpdated) {
            this.handleExtensionHasJustUpdated_();
        }

        if (this.userSettings_.localStorageMustBeCleared) {
            localStorage.clear();
            Helper.setToStorage(this.extensionId_, StorageManager.storageSyncType, 'localStorageMustBeCleared', false, function(response) {
                console.log('localStorageMustBeCleared is now ' + response.data.localStorageMustBeCleared);
            });
        }

        // Common
        this.handleMenu_();
        this.handleRemoteLinks_();
        this.handleActivityScrolling_();
        this.handleDefaultLeaderboardFilter_();
        this.handleSegmentRankPercentage_();
        this.handleActivityGoogleMapType_();
        this.handleHidePremium_();
        this.handleShopHeaderLink_();
        this.handleHideFeed_();

        // Bike
        this.handleExtendedActivityData_();
        this.handleNearbySegments_();
        this.handleActivityBikeOdo_();

        // Run
        this.handleRunningGradeAdjustedPace_();
        this.handleRunningHeartRate_();

        // Must be done at the end
        this.handleTrackTodayIncommingConnection_();
    },

    /**
     *
     */
    handleForwardToWWW_: function handleForwardToWWW_() {

        if (_.isEqual(window.location.hostname, 'app.strava.com')) {
            var forwardUrl = window.location.protocol + "//www.strava.com" + window.location.pathname;
            window.location.href = forwardUrl;
            return true;
        }
        return false;
    },

    /**
     *
     */
    handleExtensionHasJustUpdated_: function handleExtensionHasJustUpdated_() {
        // Clear localstorage 
        // Especially for activies data stored in cache
        if (StravaPlus.debugMode) console.log("ExtensionHasJustUpdated, localstorage clear");

        localStorage.clear();
        Helper.setToStorage(this.extensionId_, StorageManager.storageSyncType, 'extensionHasJustUpdated', false, function(response) {});
    },

    /**
     *
     */
    handleMenu_: function handleMenu_() {

        if (StravaPlus.debugMode) console.log("Execute handleMenu_()");

        var menuModifier = new MenuModifier(this.athleteId_, this.userSettings_.highLightStravaPlusFeature, this.appResources_);
        menuModifier.modify();
    },

    /**
     *
     */
    handleRemoteLinks_: function handleRemoteLinks_() {

        // If we are not on a segment or activity page then return...
        if (!window.location.pathname.match(/^\/segments\/(\d+)$/) && !window.location.pathname.match(/^\/activities/)) {
            return;
        }

        if (!this.userSettings_.remoteLinks) {
            return;
        }

        if (StravaPlus.debugMode) console.log("Execute handleRemoteLinks_()");

        var remoteLinksModifier = new RemoteLinksModifier(this.userSettings_.highLightStravaPlusFeature, this.appResources_);
        remoteLinksModifier.modify();
    },

    /**
     *
     */
    handleActivityScrolling_: function handleActivityScrolling_() {

        if (!this.userSettings_.feedAutoScroll) {
            return;
        }

        if (StravaPlus.debugMode) console.log("Execute handleActivityScrolling_()");

        var activityScrollingModifier = new ActivityScrollingModifier();
        activityScrollingModifier.modify();
    },

    /**
     *
     */
    handleDefaultLeaderboardFilter_: function handleDefaultLeaderboardFilter_() {

        // If we are not on a segment or activity page then return...
        if (!window.location.pathname.match(/^\/segments\/(\d+)$/) && !window.location.pathname.match(/^\/activities/)) {
            return;
        }

        // Kick out if we are not on SegmentLeaderboardView
        try {
            eval('Strava.Labs.Activities.SegmentLeaderboardView');
        } catch (err) {
            if (StravaPlus.debugMode) console.log('Kick out no Strava.Labs.Activities.SegmentLeaderboardView available');
            return;
        }

        if (StravaPlus.debugMode) console.log("Execute handleDefaultLeaderboardFilter_()");

        var defaultLeaderboardFilterModifier = new DefaultLeaderboardFilterModifier(this.userSettings_.defaultLeaderboardFilter);
        defaultLeaderboardFilterModifier.modify();
    },

    /**
     *
     */
    handleSegmentRankPercentage_: function handleSegmentRankPercentage_() {

        if (!this.userSettings_.displaySegmentRankPercentage) {
            return;
        }

        // If we are not on a segment page then return...
        if (!window.location.pathname.match(/^\/segments\/(\d+)$/)) {
            return;
        }

        if (StravaPlus.debugMode) console.log("Execute handleSegmentRankPercentage_()");

        var segmentRankPercentage = new SegmentRankPercentageModifier();
        segmentRankPercentage.modify();
    },

    /**
     *
     */
    handleActivityGoogleMapType_: function handleActivityGoogleMapType_() {

        // Test where are on an activity...
        if (!window.location.pathname.match(/^\/activities/)) {
            return;
        }

        if (StravaPlus.debugMode) console.log("Execute handleActivityGoogleMapType_()");

        var activityGoogleMapTypeModifier = new ActivityGoogleMapTypeModifier(this.userSettings_.activityGoogleMapType);
        activityGoogleMapTypeModifier.modify();
    },

    /**
     *
     */
    handleHidePremium_: function handleHidePremium_() {

        // Eject premium users of this "Hiding" feature
        // Even if they checked "ON" the hide premium option
        if (this.isPremium_) {
            return;
        }

        if (!this.userSettings_.hidePremiumFeatures) {
            return;
        }

        if (StravaPlus.debugMode) console.log("Execute handleHidePremium_()");

        var hidePremiumModifier = new HidePremiumModifier();
        hidePremiumModifier.modify();
    },

    /**
     *
     */
    handleShopHeaderLink_: function handleShopHeaderLink_() {

        if (!this.userSettings_.displayShopHeaderLink) {
            return;
        }

        if (StravaPlus.debugMode) console.log("Execute handleShopHeaderLink_()");

        var shopHeaderLinkModifier = new ShopHeaderLinkModifier();
        shopHeaderLinkModifier.modify();
    },

    handleHideFeed_: function handleHideFeed_() {

        // Test if where are on dashboard page
        if (!window.location.pathname.match(/^\/dashboard/)) {
            return;
        }

        if (StravaPlus.debugMode) console.log("Execute handleHideFeed_()");

        if (!this.userSettings_.feedHideChallenges && !this.userSettings_.feedHideCreatedRoutes) {
            return;
        }

        var hideFeedModifier = new HideFeedModifier(this.userSettings_.feedHideChallenges, this.userSettings_.feedHideCreatedRoutes);
        hideFeedModifier.modify();
    },

    /**
     *
     */
    handleExtendedActivityData_: function handleExtendedActivityData_() {

        if (_.isUndefined(window.pageView)) {
            return;
        }

        // Avoid running Extended data at the moment
        if (pageView.activity().attributes.type != "Ride") {
            return;
        }

        if (StravaPlus.debugMode) console.log("Execute handleExtendedActivityData_()");

        this.activityProcessor_.getAnalysisData(
            this.activityId_,
            this.userSettings_.userGender,
            this.userSettings_.userRestHr,
            this.userSettings_.userMaxHr,
            this.userSettings_.userFTP,
            function(analysisData) { // Callback when analysis data has been computed
                var extendedActivityDataModifier = new ExtendedActivityDataModifier(analysisData, this.appResources_, this.userSettings_, this.athleteId_, this.athleteIdAuthorOfActivity_);
                extendedActivityDataModifier.modify();
            }.bind(this)
        );
    },

    /**
     *
     */
    handleNearbySegments_: function handleNearbySegments_() {

        if (!this.userSettings_.displayNearbySegments) {
            return;
        }

        // If we are not on a segment page then return...
        var segmentData = window.location.pathname.match(/^\/segments\/(\d+)$/);
        if (_.isNull(segmentData)) {
            return;
        }

        if (StravaPlus.debugMode) console.log("Execute handleNearbySegments_()");

        // Getting segment id
        var segmentId = parseInt(segmentData[1]);

        var segmentProcessor = new SegmentProcessor(this.vacuumProcessor_, segmentId);

        var arrayOfNearbySegments = segmentProcessor.getNearbySegmentsAround(function(jsonSegments) {

            if (StravaPlus.debugMode) console.log(jsonSegments);

            var nearbySegmentsModifier = new NearbySegmentsModifier(jsonSegments, this.appResources_, this.userSettings_.highLightStravaPlusFeature);
            nearbySegmentsModifier.modify();

        }.bind(this));
    },

    /**
     *
     */
    handleActivityBikeOdo_: function handleActivityBikeOdo_() {

        if (!this.userSettings_.displayBikeOdoInActivity) {
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

        if (StravaPlus.debugMode) console.log("Execute handleActivityBikeOdo_()");

        var bikeOdoProcessor = new BikeOdoProcessor(this.vacuumProcessor_, this.athleteIdAuthorOfActivity_);
        bikeOdoProcessor.getBikeOdoOfAthlete(function(bikeOdoArray) {

            var activityBikeOdoModifier = new ActivityBikeOdoModifier(bikeOdoArray, bikeOdoProcessor.getCacheAgingTimeCookieKey());
            activityBikeOdoModifier.modify();

        }.bind(this));
    },

    /**
     *
     */
    handleRunningGradeAdjustedPace_: function handleRunningGradeAdjustedPace_() {

        if (!this.userSettings_.activateRunningGradeAdjustedPace) {
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

        if (StravaPlus.debugMode) console.log("Execute handleRunningGradeAdjustedPace_()");

        var runningGradeAdjustedPace = new RunningGradeAdjustedPaceModifier();
        runningGradeAdjustedPace.modify();
    },

    /**
     *
     */
    handleRunningHeartRate_: function handleRunningHeartRate_() {

        if (!this.userSettings_.activateRunningHeartRate) {
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

        if (StravaPlus.debugMode) console.log("Execute handleRunningHeartRate_()");

        var runningHeartRateModifier = new RunningHeartRateModifier();
        runningHeartRateModifier.modify();
    },


    /**
     * Launch a track event once a day (is user use it once a day), to follow is account type
     */
    handleTrackTodayIncommingConnection_: function handleTrackTodayIncommingConnection_() {

        var userHasConnectSince24Hour = StorageManager.getCookie('stravaplus_daily_connection_done');

        if (StravaPlus.debugMode) console.log("Cookie 'stravaplus_daily_connection_done' value found is: " + userHasConnectSince24Hour);

        if (_.isNull(this.athleteId_)) {
            if (StravaPlus.debugMode) console.log("athleteId is empty value: " + this.athleteId_);
            return;
        }

        if (_.isNull(userHasConnectSince24Hour) || _.isEmpty(userHasConnectSince24Hour)) {

            var accountType = 'Free';
            var accountName = this.athleteName_;

            // We enter in that condition if user is premium or pro
            if (!_.isNull(this.isPremium_) && this.isPremium_ === true) {
                accountType = 'Premium';
            }

            // accountType is overridden with "pro" if that condition is true
            if (!_.isNull(this.isPro_) && this.isPro_ === true) {
                accountType = 'Pro';
            }

            var eventAction = 'DailyConnection_Account_' + accountType;

            // Push IncomingConnection to piwik
            var eventName = accountName + ' #' + this.athleteId_;

            if (StravaPlus.debugMode) console.log("Cookie 'stravaplus_daily_connection_done' not found, send track <IncomingConnection> / <" + accountType + "> / <" + eventName + ">");

            if (!StravaPlus.debugMode) {
                _paq.push(['trackEvent', 'DailyConnection', eventAction, eventName]);
            }

            // Create cookie to avoid push during 1 day
            StorageManager.setCookie('stravaplus_daily_connection_done', true, 1);

        } else {

            if (StravaPlus.debugMode) console.log("Cookie 'stravaplus_daily_connection_done' exist, DO NOT TRACK IncomingConnection");

        }
    }
};
