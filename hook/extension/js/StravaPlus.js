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
    this.activityName_ = this.vacuumProcessor_.getActivityName();
    this.activityTime_ = this.vacuumProcessor_.getActivityTime();

    // Make the work...
    this.init_();
}

/**
 *   Static vars
 */
StravaPlus.getFromStorageMethod = 'getFromStorage';
StravaPlus.setToStorageMethod = 'setToStorage';
StravaPlus.defaultIntervalTimeMillis = 750;

/**
 * Define prototype
 */
StravaPlus.prototype = {

    init_: function() {

        // Redirect app.strava.com/* to www.strava.com/*
        if (this.handleForwardToWWW_()) {
            return; // Skip rest of init to be compliant with www.strava.com/* on next reload
        }

        // Handle some tasks to od when update occurs
        if (this.userSettings_.extensionHasJustUpdated || env.forceUpdated) {
            this.handleExtensionHasJustUpdated_();
        }

        if (env.preview) {
            this.handlePreviewRibbon_();
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
        this.handleHideFeed_();

        // Bike
        this.handleExtendedActivityData_();
        this.handleNearbySegments_();
        this.handleActivityBikeOdo_();

        // Run
        this.handleRunningGradeAdjustedPace_();
        this.handleRunningHeartRate_();

        // All activities
        this.handleActivityQRCodeDisplay_();

        // Must be done at the end
        this.handleTrackTodayIncommingConnection_();
    },

    /**
     *
     */
    handleForwardToWWW_: function() {

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
    handleExtensionHasJustUpdated_: function() {

        // Clear localstorage 
        // Especially for activies data stored in cache
        console.log("ExtensionHasJustUpdated, localstorage clear");
        localStorage.clear();

        if (!window.location.pathname.match(/^\/dashboard/)) {
            return;
        }

        // Display ribbon update message
        this.handleUpdateRibbon_();

        // Send update info to ga
        var updatedToEvent = {
            categorie: 'Exploitation',
            action: 'updatedVersion',
            name: this.appResources_.extVersion
        };

        _spTrack('send', 'event', updatedToEvent.categorie, updatedToEvent.action, updatedToEvent.name);

        // Now mark extension "just updated" to false...
        Helper.setToStorage(this.extensionId_, StorageManager.storageSyncType, 'extensionHasJustUpdated', false, function(response) {});
    },

    /**
     *
     */
    handleUpdateRibbon_: function() {
        var globalStyle = 'background-color: #FFF200; color: #333; font-size: 14px; padding: 20px; font-family: \'Helvetica Neue\', Helvetica, Arial, sans-serif; text-align: center;';
        var socialButton = '<strong><a style="color: #FC4C02;" target="_blank" href="https://twitter.com/champagnethomas">What\'s in the next update?</a></strong>';

        var newNameMessage = 'StravaPlus name has to change, please give your opinion for the new one <a target="_blank" href="http://goo.gl/forms/q5qVN6z4fm">Here</a>';

        var html = '<div id="updateRibbon" style="' + globalStyle + '">StravaPlus updated to <strong>v' + this.appResources_.extVersion + '</strong>, ' + socialButton + '<br/><br/>' + newNameMessage + '<a style="float: right; color: #333;" href="#" onclick="$(\'#updateRibbon\').slideUp()">Close</a></div>';
        // var html += '<div></div>';
        $('body').before(html);
    },

    /**
     *
     */
    handlePreviewRibbon_: function() {
        var globalStyle = 'background-color: #FFF200; color: rgb(84, 84, 84); font-size: 12px; padding: 5px; font-family: \'Helvetica Neue\', Helvetica, Arial, sans-serif; text-align: center;';
        var html = '<div id="updateRibbon" style="' + globalStyle + '"><strong>WARNING</strong> You are running a preview of <strong>StravaPlus</strong>, to remove it, open a new tab and type <strong>chrome://extensions</strong></div>';
        $('body').before(html);
    },

    /**
     *
     */
    handleMenu_: function() {

        if (env.debugMode) console.log("Execute handleMenu_()");

        var menuModifier = new MenuModifier(this.athleteId_, this.userSettings_.highLightStravaPlusFeature, this.appResources_);
        menuModifier.modify();
    },

    /**
     *
     */
    handleRemoteLinks_: function() {

        // If we are not on a segment or activity page then return...
        if (!window.location.pathname.match(/^\/segments\/(\d+)$/) && !window.location.pathname.match(/^\/activities/)) {
            return;
        }

        if (!this.userSettings_.remoteLinks) {
            return;
        }

        if (env.debugMode) console.log("Execute handleRemoteLinks_()");

        var remoteLinksModifier = new RemoteLinksModifier(this.userSettings_.highLightStravaPlusFeature, this.appResources_, (this.athleteIdAuthorOfActivity_ === this.athleteId_));
        remoteLinksModifier.modify();
    },

    /**
     *
     */
    handleActivityScrolling_: function() {

        if (!this.userSettings_.feedAutoScroll) {
            return;
        }

        if (env.debugMode) console.log("Execute handleActivityScrolling_()");

        var activityScrollingModifier = new ActivityScrollingModifier();
        activityScrollingModifier.modify();
    },

    /**
     *
     */
    handleDefaultLeaderboardFilter_: function() {

        // If we are not on a segment or activity page then return...
        if (!window.location.pathname.match(/^\/segments\/(\d+)$/) && !window.location.pathname.match(/^\/activities/)) {
            return;
        }

        // Kick out if we are not on SegmentLeaderboardView
        try {
            eval('Strava.Labs.Activities.SegmentLeaderboardView');
        } catch (err) {
            if (env.debugMode) console.log('Kick out no Strava.Labs.Activities.SegmentLeaderboardView available');
            return;
        }

        if (env.debugMode) console.log("Execute handleDefaultLeaderboardFilter_()");

        var defaultLeaderboardFilterModifier = new DefaultLeaderboardFilterModifier(this.userSettings_.defaultLeaderboardFilter);
        defaultLeaderboardFilterModifier.modify();
    },

    /**
     *
     */
    handleSegmentRankPercentage_: function() {

        if (!this.userSettings_.displaySegmentRankPercentage) {
            return;
        }

        // If we are not on a segment page then return...
        if (!window.location.pathname.match(/^\/segments\/(\d+)$/)) {
            return;
        }

        if (env.debugMode) console.log("Execute handleSegmentRankPercentage_()");

        var segmentRankPercentage = new SegmentRankPercentageModifier();
        segmentRankPercentage.modify();
    },

    /**
     *
     */
    handleActivityGoogleMapType_: function() {

        // Test where are on an activity...
        if (!window.location.pathname.match(/^\/activities/)) {
            return;
        }

        if (env.debugMode) console.log("Execute handleActivityGoogleMapType_()");

        var activityGoogleMapTypeModifier = new ActivityGoogleMapTypeModifier(this.userSettings_.activityGoogleMapType);
        activityGoogleMapTypeModifier.modify();
    },

    /**
     *
     */
    handleHidePremium_: function() {

        // Eject premium users of this "Hiding" feature
        // Even if they checked "ON" the hide premium option
        if (this.isPremium_) {
            return;
        }

        if (!this.userSettings_.hidePremiumFeatures) {
            return;
        }

        if (env.debugMode) console.log("Execute handleHidePremium_()");

        var hidePremiumModifier = new HidePremiumModifier();
        hidePremiumModifier.modify();
    },

    handleHideFeed_: function() {

        // Test if where are on dashboard page
        if (!window.location.pathname.match(/^\/dashboard/)) {
            return;
        }

        if (env.debugMode) console.log("Execute handleHideFeed_()");

        if (!this.userSettings_.feedHideChallenges && !this.userSettings_.feedHideCreatedRoutes) {
            return;
        }

        var hideFeedModifier = new HideFeedModifier(this.userSettings_.feedHideChallenges, this.userSettings_.feedHideCreatedRoutes);
        hideFeedModifier.modify();
    },

    /**
     *
     */
    handleExtendedActivityData_: function() {

        if (_.isUndefined(window.pageView)) {
            return;
        }

        var activityType = pageView.activity().get('type');

        // Skip manual activities
        if (activityType === 'Manual') {
            return;
        }

        if (env.debugMode) console.log("Execute handleExtendedActivityData_()");

        this.activityProcessor_.getAnalysisData(
            this.activityId_,
            this.userSettings_.userGender,
            this.userSettings_.userRestHr,
            this.userSettings_.userMaxHr,
            this.userSettings_.userFTP,

            function(analysisData) { // Callback when analysis data has been computed
//console.log("Analysis done; TRIMP:"+analysisData.heartRateData.TRIMP.toFixed(0));
                var extendedActivityDataModifier = null;

                // tell activity type for other than Ride/Run activities
				if ( (activityType !== "Ride") && (activityType !== "Run") ) {
                    var html = '<div  style="padding: 0px 0px 0px 0px;background: #FFFFFF;font-size: 9px;color: rgb(103, 103, 103);">&nbsp&nbsp&nbspActivity type: '+window.pageView.activity().attributes.type+'</div>';
                    $('.inset').parent().children().first().before(html);
				}

                switch (activityType) {
                    case 'Ride':
                        extendedActivityDataModifier = new CyclingExtendedActivityDataModifier(analysisData, this.appResources_, this.userSettings_, this.athleteId_, this.athleteIdAuthorOfActivity_);
                        break;
                    case 'Run':
                        extendedActivityDataModifier = new RunningExtendedActivityDataModifier(analysisData, this.appResources_, this.userSettings_, this.athleteId_, this.athleteIdAuthorOfActivity_);
                        break;

                    // for Workout, Rowing,...
                    case 'StationaryOther':
                        extendedActivityDataModifier = new GenericExtendedActivityDataModifier(analysisData, this.appResources_, this.userSettings_, this.athleteId_, this.athleteIdAuthorOfActivity_);
                        break;

                    default:
                        // extendedActivityDataModifier = new GenericExtendedActivityDataModifier(analysisData, this.appResources_, this.userSettings_, this.athleteId_, this.athleteIdAuthorOfActivity_); // DELAYED_FOR_TESTING
                        var html = '<p style="padding: 10px;background: #FFF0A0;font-size: 12px;color: rgb(103, 103, 103);">StravaPlus don\'t support <strong>Extended Data Features</strong> for this type of activity at the moment. Feature will be available in version 0.6.x. Working hard! Please wait... ;).</br></br>Stay tunned via <a href="https://twitter.com/champagnethomas">@champagnethomas</a></p>';
                        $('.inline-stats.section').parent().children().last().after(html);
                        break;
                }

                if (extendedActivityDataModifier) {
                    extendedActivityDataModifier.modify();


										// print HIGHLIGHTED STATS under inline-stats section
                    var html = '<div style="font-size: 15px; padding: 10px 0px 10px 0px;">';

									if (analysisData.heartRateData != null) {
                    html += '<span style="color: rgb(200, 80, 80);font-size: 18px;" title="TRIMP = TRaining IMPulse"> TRIMP: <strong>'+analysisData.heartRateData.TRIMP.toFixed(0)+'</strong></span>';
                    
								 	if (analysisData.toughnessScore != null) {
                    	html += '<span style="font-size: 18px;" title="TS = Toughness Score = sqrt( sqrt( elevation^2 * avgPower * avgSpeed^2 * distance^2 * moveRatio ) ) /20"><font size=-2>&nbsp&nbsp&nbsp&nbsp&nbspToughness Score: </font><font size=-1><strong>'+analysisData.toughnessScore.toFixed(0)+'</strong></font></span>';
								 	}

                    html += '<br><span style="font-size: 18px;" title="TRIMP/hour = Effort estimate\n =<  50  Sure this was a Workout?!\n   \>  50  Easy-Recovery\n   \> 100  Lower Medium\n   \> 117  Medium\n   \> 133  Upper Medium\n   \> 150  Hard\n   \> 175  Very Hard\n   \> 200  Extremely Hard\n   \> 225  Hard as Hell!\n   \> 250  How could You survive this?!?">[ <strong>'+analysisData.heartRateData.TRIMP_hr.toFixed(0)+'</strong> / hour ]';
                    html += ' &nbsp<font size=-2>Effort Estimate:</font> <strong><font size=-1 style="color: rgb(227, 68, 2);">';
                    if (analysisData.heartRateData.TRIMP_hr <= 50) {       	html+=' Sure this was a Workout?! [RPE <1]';
                    } else if (analysisData.heartRateData.TRIMP_hr <= 100) {	html+=' Easy-Recovery [RPE 1-2]';
                    } else if (analysisData.heartRateData.TRIMP_hr <= 117) {	html+=' Lower Medium [RPE 3]';
                    } else if (analysisData.heartRateData.TRIMP_hr <= 133) {	html+=' Medium [RPE 4]';
                    } else if (analysisData.heartRateData.TRIMP_hr <= 150) {	html+=' Upper Medium [RPE 5]';
                    } else if (analysisData.heartRateData.TRIMP_hr <= 175) {	html+=' Hard [RPE 6]';
                    } else if (analysisData.heartRateData.TRIMP_hr <= 200) {	html+=' Very Hard [RPE 7]';
                    } else if (analysisData.heartRateData.TRIMP_hr <= 225) {	html+=' Extremely Hard [RPE 8]';
                    } else if (analysisData.heartRateData.TRIMP_hr <= 250) {	html+=' Hard as Hell! [RPE 9]';
                    } else if (analysisData.heartRateData.TRIMP_hr > 250){	html+=' How could You survive This?!? [RPE 9+]';
                    }
                    
                    html+='</font></strong></span>';
									 	
                    $('.inline-stats.section').first().after(html);
                  }

                    html = '<style>.statsplus td {text-align:center; border: 0px 0px 0px 1px; padding: 2px;}</style>';
                    html += '<table class="statsplus" style="margin: 0px; width:100%;">';
                    html += '<tr><td>Move Ratio<br><strong>'+analysisData.moveRatio.toFixed(2)+'</strong></td>';
                    html += '<td>Real<br>Average</td><td>Lower Quart<br>Q25%</td><td>Median<br>Q50%</td><td>Upper Quart<br>Q75%</td></tr>';
									if (analysisData.heartRateData != null) {
                    html += '<tr style="color: rgb(200, 80, 80)"><td>HRR% <strong>'+analysisData.heartRateData.activityHeartRateReserve.toFixed(0)+'</strong></td>';
                    html += '<td><strong>'+analysisData.heartRateData.averageHeartRate.toFixed(0)+'</strong></td>';
                    html += '<td><strong>'+analysisData.heartRateData.lowerQuartileHeartRate.toFixed(0)+'</strong></td>';
                    html += '<td><strong>'+analysisData.heartRateData.medianHeartRate.toFixed(0)+'</strong></td>';
                    html += '<td><strong>'+analysisData.heartRateData.upperQuartileHeartRate.toFixed(0)+'</strong></td></tr>';
                  }
									if (analysisData.gradeData != null && !(analysisData.gradeData.lowerQuartileGrade == 0 && analysisData.gradeData.upperQuartileGrade == 0)) {
                    html += '<tr style="color: rgb(80, 200, 80)"><td><strong>'+analysisData.gradeData.gradeProfile+'</strong> Grade%</td>';
                    html += '<td><strong>'+analysisData.gradeData.avgGrade.toFixed(1)+'</strong></td>';
                    html += '<td><strong>'+analysisData.gradeData.lowerQuartileGrade.toFixed(1)+'</strong></td>';
                    html += '<td><strong>'+analysisData.gradeData.medianGrade.toFixed(1)+'</strong></td>';
                    html += '<td><strong>'+analysisData.gradeData.upperQuartileGrade.toFixed(1)+'</strong></td></tr>';
                  }
									if (analysisData.speedData != null) {
                    html += '<tr style="color: rgb(80, 80, 200)"><td>Speed</td>';
                    html += '<td><strong>'+(3600*window.distance/window.elapsedTime).toFixed(1)+'</strong></td>';
                    html += '<td><strong>'+analysisData.speedData.lowerQuartileSpeed.toFixed(1)+'</strong></td>';
                    html += '<td><strong>'+analysisData.speedData.medianSpeed.toFixed(1)+'<br>'+'</strong></td>';
                    html += '<td><strong>'+analysisData.speedData.upperQuartileSpeed.toFixed(1)+'</strong></td></tr>';
                    html += '<tr style="color: rgb(80, 80, 200)"><td>Pace</td>';
                    html += '<td><strong>'+Helper.secondsToHHMMSS((window.elapsedTime/window.distance).toFixed(0)).replace('00:','')+'</strong></td>';
                    html += '<td><strong>'+Helper.secondsToHHMMSS((3600/analysisData.speedData.lowerQuartileSpeed).toFixed(0)).replace('00:','')+'</strong></td>';
                    html += '<td><strong>'+Helper.secondsToHHMMSS((3600/analysisData.speedData.medianSpeed).toFixed(0)).replace('00:','')+'</strong></td>';
                    html += '<td><strong>'+Helper.secondsToHHMMSS((3600/analysisData.speedData.upperQuartileSpeed).toFixed(0)).replace('00:','')+'</strong></td></tr>';
									}
                    html += '</table></div>';
                    $('.details').first().next().after(html);
//                    $('.inline-stats.section').first().next().next().after(html);


							
                }

            }.bind(this)
        );
    },

    /**
     *
     */
    handleNearbySegments_: function() {

        if (!this.userSettings_.displayNearbySegments) {
            return;
        }

        // If we are not on a segment page then return...
        var segmentData = window.location.pathname.match(/^\/segments\/(\d+)$/);
        if (_.isNull(segmentData)) {
            return;
        }

        if (env.debugMode) console.log("Execute handleNearbySegments_()");

        // Getting segment id
        var segmentId = parseInt(segmentData[1]);

        var segmentProcessor = new SegmentProcessor(this.vacuumProcessor_, segmentId);

        var arrayOfNearbySegments = segmentProcessor.getNearbySegmentsAround(function(jsonSegments) {

            if (env.debugMode) console.log(jsonSegments);

            var nearbySegmentsModifier = new NearbySegmentsModifier(jsonSegments, this.appResources_, this.userSettings_.highLightStravaPlusFeature);
            nearbySegmentsModifier.modify();

        }.bind(this));
    },

    /**
     *
     */
    handleActivityBikeOdo_: function() {

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

        if (env.debugMode) console.log("Execute handleActivityBikeOdo_()");

        var bikeOdoProcessor = new BikeOdoProcessor(this.vacuumProcessor_, this.athleteIdAuthorOfActivity_);
        bikeOdoProcessor.getBikeOdoOfAthlete(function(bikeOdoArray) {

            var activityBikeOdoModifier = new ActivityBikeOdoModifier(bikeOdoArray, bikeOdoProcessor.getCacheKey());
            activityBikeOdoModifier.modify();

        }.bind(this));
    },

    /**
     *
     */
    handleRunningGradeAdjustedPace_: function() {

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

        if (env.debugMode) console.log("Execute handleRunningGradeAdjustedPace_()");

        var runningGradeAdjustedPace = new RunningGradeAdjustedPaceModifier();
        runningGradeAdjustedPace.modify();
    },

    /**
     *
     */
    handleRunningHeartRate_: function() {

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

        if (env.debugMode) console.log("Execute handleRunningHeartRate_()");

        var runningHeartRateModifier = new RunningHeartRateModifier();
        runningHeartRateModifier.modify();
    },

    /**
     *
     */
    handleActivityQRCodeDisplay_: function() {

        // Test where are on an activity...
        if (!window.location.pathname.match(/^\/activities/)) {
            return;
        }

        if (_.isUndefined(window.pageView)) {
            return;
        }

        var activityQRCodeDisplayModifier = new ActivityQRCodeDisplayModifier(this.appResources_, this.activityId_);
        activityQRCodeDisplayModifier.modify();

    },

    /**
     * Launch a track event once a day (is user use it once a day), to follow is account type
     */
    handleTrackTodayIncommingConnection_: function() {

        var userHasConnectSince24Hour = StorageManager.getCookie('stravaplus_daily_connection_done');

        if (env.debugMode) console.log("Cookie 'stravaplus_daily_connection_done' value found is: " + userHasConnectSince24Hour);

        if (_.isNull(this.athleteId_)) {
            if (env.debugMode) console.log("athleteId is empty value: " + this.athleteId_);
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
            var eventName = accountName + ' #' + this.athleteId_ + ' v' + this.appResources_.extVersion;

            if (env.debugMode) console.log("Cookie 'stravaplus_daily_connection_done' not found, send track <IncomingConnection> / <" + accountType + "> / <" + eventName + ">");

            if (!env.debugMode) {
                _spTrack('send', 'event', 'DailyConnection', eventAction, eventName);
            }

            // Create cookie to avoid push during 1 day
            StorageManager.setCookie('stravaplus_daily_connection_done', true, 1);

        } else {

            if (env.debugMode) console.log("Cookie 'stravaplus_daily_connection_done' exist, DO NOT TRACK IncomingConnection");

        }
    }
};
