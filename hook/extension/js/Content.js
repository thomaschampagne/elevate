var Loader = function() {};

Loader.prototype = {

    require: function(scripts, callback) {
        this.loadCount = 0;
        this.totalRequired = scripts.length;
        this.callback = callback;

        for (var i = 0; i < scripts.length; i++) {
            this.writeScript(chrome.extension.getURL(scripts[i]));
        }
    },
    loaded: function(evt) {
        this.loadCount++;
        if (this.loadCount == this.totalRequired && typeof this.callback == 'function') this.callback.call();
    },
    writeScript: function(src) {

        var ext = src.substr(src.lastIndexOf('.') + 1);

        var self = this;

        var head = document.getElementsByTagName('head')[0];

        if (ext === 'js') {
            var s = document.createElement('script');
            s.type = "text/javascript";
            s.async = false;
            s.src = src;
            s.addEventListener('load', function(e) {
                self.loaded(e);
            }, false);
            head.appendChild(s);
        } else if (ext === 'css') {
            var link = document.createElement('link');
            link.href = src;
            link.addEventListener('load', function(e) {
                self.loaded(e);
            }, false);
            link.async = false;
            link.type = 'text/css';
            link.rel = 'stylesheet';
            head.appendChild(link);
        }
    }
};

/**
 *   Content is responsible of ...
 */
function Content(jsDependencies, cssDependencies, userSettings, appResources) {
    this.jsDependencies_ = jsDependencies;
    this.cssDependencies = cssDependencies;
    this.userSettings_ = userSettings;
    this.appResources_ = appResources;
}

/**
 * Define prototype
 */
Content.prototype = {

    loadDependencies: function loadDependencies(finishLoading) {


        var loader = new Loader();
        var dependencies = _.union(this.jsDependencies_, this.cssDependencies);
        loader.require(dependencies, function() {
            finishLoading();
        });
    },

    isExtensionRunnableInThisContext_: function isExtensionRunnableInThisContext_() {

        var isRunnable = true;

        // Eject if http://www.strava.com/routes/new OR http://www.strava.com/routes/XXXX/edit
        if (window.location.pathname.match(/^\/routes\/new/) ||
            window.location.pathname.match(/^\/routes\/(\d+)\/edit$/) ||
            window.location.pathname.match(/^\/about/) ||
            window.location.pathname.match(/^\/running-app/) ||
            window.location.pathname.match(/^\/features/) ||
            window.location.pathname.match(/^\/store/) ||
            window.location.pathname.match(/^\/how-it-works/)) {

            isRunnable = false;
        }

        // Do not run extension if user not logged
        if (document.getElementsByClassName('btn-login').length > 0) {
            isRunnable = false;
        }

        return isRunnable;
    },

    start: function start() {

        // Skip execution if needed
        if (!this.isExtensionRunnableInThisContext_()) {
            console.log("Skipping StravistiX chrome extension execution in this page");
            return;
        }

        var self = this;

        this.loadDependencies(function() {

            chrome.storage.sync.get(this.userSettings_, function(chromeSettings) {

                var injectedScript = document.createElement('script');
                injectedScript.src = chrome.extension.getURL('js/StravistiX.js');
                injectedScript.onload = function() {

                    this.parentNode.removeChild(this);
                    var inner = document.createElement('script');

                    if (_.isEmpty(chromeSettings)) { // If settings from chrome sync storage are empty
                        chromeSettings = self.userSettings_;
                    }

                    inner.textContent = 'var $ = jQuery;';
                    inner.textContent += 'var stravistiX = new StravistiX(' + JSON.stringify(chromeSettings) + ', ' + JSON.stringify(self.appResources_) + ');';

                    inner.onload = function() {
                        this.parentNode.removeChild(this);
                    };
                    (document.head || document.documentElement).appendChild(inner);
                };
                (document.head || document.documentElement).appendChild(injectedScript);
            });

        });

    }
};

var appResources = {
    settingsLink: chrome.extension.getURL('/options/app/index.html'),
    logoStravistix: chrome.extension.getURL('/icons/logo_stravistix_no_circle.svg'),
    menuIconBlack: chrome.extension.getURL('/icons/ic_menu_24px_black.svg'),
    menuIconOrange: chrome.extension.getURL('/icons/ic_menu_24px_orange.svg'),
    remoteViewIcon: chrome.extension.getURL('/icons/ic_open_in_new_24px.svg'),
    pollIcon: chrome.extension.getURL('/icons/ic_poll_24px.svg'),
    veloviewerIcon: chrome.extension.getURL('/icons/veloviewer.ico'),
    raceshapeIcon: chrome.extension.getURL('/icons/raceshape.ico'),
    veloviewerDashboardIcon: chrome.extension.getURL('/icons/ic_dashboard_24px.svg'),
    veloviewerChallengesIcon: chrome.extension.getURL('/icons/ic_landscape_24px.svg'),
    labIcon: chrome.extension.getURL('/icons/lab.png'),
    settingsIcon: chrome.extension.getURL('/icons/ic_settings_24px.svg'),
    heartIcon: chrome.extension.getURL('/icons/ic_favorite_24px.svg'),
    zonesIcon: chrome.extension.getURL('/icons/ic_format_line_spacing_24px.svg'),
    komMapIcon: chrome.extension.getURL('/icons/ic_looks_one_24px.svg'),
    heatmapIcon: chrome.extension.getURL('/icons/ic_whatshot_24px.svg'),
    bugIcon: chrome.extension.getURL('/icons/ic_bug_report_24px.svg'),
    rateIcon: chrome.extension.getURL('/icons/ic_star_24px.svg'),
    aboutIcon: chrome.extension.getURL('/icons/ic_info_outline_24px.svg'),
    eyeIcon: chrome.extension.getURL('/icons/ic_remove_red_eye_24px.svg'),
    bikeIcon: chrome.extension.getURL('/icons/ic_directions_bike_24px.svg'),
    mapIcon: chrome.extension.getURL('/icons/ic_map_24px.svg'),
    wheatherIcon: chrome.extension.getURL('/icons/ic_wb_sunny_24px.svg'),
    twitterIcon: chrome.extension.getURL('/icons/twitter.svg'),
    systemUpdatesIcon: chrome.extension.getURL('/icons/ic_system_update_24px.svg'),
    donateIcon: chrome.extension.getURL('/icons/ic_attach_money_24px.svg'),
    shareIcon: chrome.extension.getURL('/icons/ic_share_24px.svg'),
    trackChangesIcon: chrome.extension.getURL('/icons/ic_track_changes_24px.svg'),
    trendingUpIcon: chrome.extension.getURL('/icons/ic_trending_up_black_24px.svg'),
    qrCodeIcon: chrome.extension.getURL('/icons/qrcode.svg'),
    lightbulbIcon: chrome.extension.getURL('/icons/fa-lightbulb-o.png'),
    heartBeatIcon: chrome.extension.getURL('/icons/fa-heartbeat.png'),
    areaChartIcon: chrome.extension.getURL('/icons/fa-area-chart.png'),
    tachometerIcon: chrome.extension.getURL('/icons/fa-tachometer.png'),
    boltIcon: chrome.extension.getURL('/icons/fa-bolt.png'),
    circleNotchIcon: chrome.extension.getURL('/icons/fa-circle-o-notch.png'),
    lineChartIcon: chrome.extension.getURL('/icons/fa-line-chart.png'),
    logArrowUpIcon: chrome.extension.getURL('/icons/fa-long-arrow-up.png'),
    cogIcon: chrome.extension.getURL('/icons/fa-cog.png'),
    extVersion: chrome.runtime.getManifest().version,
    extVersionName: chrome.runtime.getManifest().version_name,
    extensionId: chrome.runtime.id,
};

var jsDependencies = [
    'config/env.js',
    'node_modules/chart.js/dist/Chart.bundle.js',
    'node_modules/fiber/src/fiber.min.js',
    'node_modules/fancybox/dist/js/jquery.fancybox.pack.js',
    'node_modules/qrcode-js-package/qrcode.min.js',
    'modules/StorageManager.js',
    'modules/geo.js',
    'modules/latlong.js',
    'modules/jquery.appear.js',
    'js/processors/VacuumProcessor.js',
    'js/processors/ActivityProcessor.js',
    'js/processors/BikeOdoProcessor.js',
    'js/processors/SegmentProcessor.js',
    'js/Helper.js',
    'js/Follow.js',
    'js/modifiers/ActivityScrollingModifier.js',
    'js/modifiers/RemoteLinksModifier.js',
    'js/modifiers/WindyTyModifier.js',
    'js/modifiers/ReliveCCModifier.js',
    'js/modifiers/DefaultLeaderboardFilterModifier.js',
    'js/modifiers/MenuModifier.js',
    'js/modifiers/SegmentRankPercentageModifier.js',
    'js/modifiers/VirtualPartnerModifier.js',
    'js/modifiers/ActivityStravaMapTypeModifier.js',
    'js/modifiers/HidePremiumModifier.js',
    'js/modifiers/AthleteStatsModifier.js',
    'js/modifiers/ActivitiesSummaryModifier.js',
    'js/modifiers/ActivitySegmentTimeComparisonModifier.js',
    'js/modifiers/ActivityBestSplitsModifier.js',

    // Extended data views
    'js/modifiers/extendedActivityData/views/AbstractDataView.js',
    'js/modifiers/extendedActivityData/views/FeaturedDataView.js',
    'js/modifiers/extendedActivityData/views/SpeedDataView.js',
    'js/modifiers/extendedActivityData/views/PaceDataView.js',
    'js/modifiers/extendedActivityData/views/HeartRateDataView.js',
    'js/modifiers/extendedActivityData/views/AbstractCadenceDataView.js',
    'js/modifiers/extendedActivityData/views/CyclingCadenceDataView.js',
    'js/modifiers/extendedActivityData/views/RunningCadenceDataView.js',
    'js/modifiers/extendedActivityData/views/PowerDataView.js',
    'js/modifiers/extendedActivityData/views/ElevationDataView.js',
    'js/modifiers/extendedActivityData/views/AscentSpeedDataView.js',
    'js/modifiers/extendedActivityData/views/AbstractGradeDataView.js',
    'js/modifiers/extendedActivityData/views/CyclingGradeDataView.js',
    'js/modifiers/extendedActivityData/views/RunnningGradeDataView.js',

    // Extended data modifiers
    'js/modifiers/extendedActivityData/AbstractExtendedDataModifier.js',
    'js/modifiers/extendedActivityData/CyclingExtendedDataModifier.js',
    'js/modifiers/extendedActivityData/RunningExtendedDataModifier.js',
    'js/modifiers/extendedActivityData/GenericExtendedDataModifier.js',

    'js/modifiers/HideFeedModifier.js',
    'js/modifiers/DisplayFlyByFeedModifier.js',
    'js/modifiers/ActivityBikeOdoModifier.js',
    'js/modifiers/ActivityQRCodeDisplayModifier.js',
    'js/modifiers/RunningGradeAdjustedPaceModifier.js',
    'js/modifiers/RunningHeartRateModifier.js',
    'js/modifiers/RunningCadenceModifier.js',
    'js/modifiers/RunningTemperatureModifier.js',
    'js/modifiers/NearbySegmentsModifier.js',
    'js/modifiers/GoogleMapsComeBackModifier.js',

    // workers
    'js/processors/workers/ComputeAnalysisWorker.js'
];

var cssDependencies = [
    'node_modules/fancybox/dist/css/jquery.fancybox.css',
    'css/extendedData.css'
];


var content = new Content(jsDependencies, cssDependencies, userSettings, appResources);
content.start();
