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

    includeJs: function includeJs(scriptUrl) {
        var s = document.createElement('script');
        s.src = chrome.extension.getURL(scriptUrl);
        s.onload = function() {
            this.parentNode.removeChild(this);
        };
        (document.head || document.documentElement).appendChild(s);
    },

    includeCss: function includeJs(scriptUrl) {
        var link = document.createElement('link');
        link.href = chrome.extension.getURL(scriptUrl);
        link.type = 'text/css';
        link.rel = 'stylesheet';
        (document.head || document.documentElement).appendChild(link);
    },

    loadDependencies: function loadDependencies() {

        for (var i = 0; i < this.jsDependencies_.length; i++) {
            this.includeJs(this.jsDependencies_[i]);
        }

        for (var i = 0; i < this.cssDependencies.length; i++) {
            this.includeCss(this.cssDependencies[i]);
        }
    },

    isExtensionRunnableInThisContext_: function isExtensionRunnableInThisContext_() {

        var isRunnable = true;

        // Eject if http://www.strava.com/routes/new OR http://www.strava.com/routes/XXXX/edit
        if (window.location.pathname.match(/^\/routes\/new/) ||
            window.location.pathname.match(/^\/routes\/(\d+)\/edit$/) ||
            window.location.pathname.match(/^\/about/) ||
            window.location.pathname.match(/^\/running-app/) ||
            window.location.pathname.match(/^\/features/) ||
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
            console.log("Skipping StravaPlus chrome extension execution in this page");
            return;
        }

        this.loadDependencies();

        var self = this;

        chrome.storage.sync.get(this.userSettings_, function(items) {
            var injectedScript = document.createElement('script');
            injectedScript.src = chrome.extension.getURL('js/StravaPlus.js');
            injectedScript.onload = function() {
                this.parentNode.removeChild(this);
                var inner = document.createElement('script');

                if (_.isEmpty(items)) {
                    items = self.userSettings_;
                }

                inner.textContent = 'var stravaPlus = new StravaPlus(' + JSON.stringify(items) + ', ' + JSON.stringify(self.appResources_) + '); if(env.debugMode) console.log(stravaPlus);';

                inner.onload = function() {
                    this.parentNode.removeChild(this);
                };
                (document.head || document.documentElement).appendChild(inner);
            };
            (document.head || document.documentElement).appendChild(injectedScript);
        });
    }
};

var appResources = {
    settingsLink: chrome.extension.getURL('/options/app/index.html'),
    menuIconBlack: chrome.extension.getURL('/icons/ic_menu_24px_black.svg'),
    menuIconOrange: chrome.extension.getURL('/icons/ic_menu_24px_orange.svg'),
    remoteViewIcon: chrome.extension.getURL('/icons/ic_launch_24px.svg'),
    pollIcon: chrome.extension.getURL('/icons/ic_poll_24px.svg'),
    veloviewerIcon: chrome.extension.getURL('/icons/veloviewer.ico'),
    raceshapeIcon: chrome.extension.getURL('/icons/raceshape.ico'),
    veloviewerDashboardIcon: chrome.extension.getURL('/icons/ic_dashboard_24px.svg'),
    veloviewerChallengesIcon: chrome.extension.getURL('/icons/ic_landscape_24px.svg'),
    labIcon: chrome.extension.getURL('/icons/lab.png'),
    settingsIcon: chrome.extension.getURL('/icons/ic_settings_24px.svg'),
    heartIcon: chrome.extension.getURL('/icons/ic_favorite_24px.svg'),
    komMapIcon: chrome.extension.getURL('/icons/ic_looks_one_24px.svg'),
    heatmapIcon: chrome.extension.getURL('/icons/ic_whatshot_24px.svg'),
    bugIcon: chrome.extension.getURL('/icons/ic_bug_report_24px.svg'),
    rateIcon: chrome.extension.getURL('/icons/ic_star_24px.svg'),
    aboutIcon: chrome.extension.getURL('/icons/ic_info_outline_24px.svg'),
    eyeIcon: chrome.extension.getURL('/icons/ic_remove_red_eye_24px.svg'),
    bikeIcon: chrome.extension.getURL('/icons/ic_directions_bike_24px.svg'),
    twitterIcon: chrome.extension.getURL('/icons/twitter.svg'),
    systemUpdatesIcon: chrome.extension.getURL('/icons/ic_system_update_24px.svg'),
    donateIcon: chrome.extension.getURL('/icons/ic_attach_money_24px.svg'),
    shareIcon: chrome.extension.getURL('/icons/ic_share_24px.svg'),
    trackChangesIcon: chrome.extension.getURL('/icons/ic_track_changes_24px.svg'),
    qrCodeIcon: chrome.extension.getURL('/icons/qrcode.svg'),
    extVersion: chrome.runtime.getManifest().version,
    extensionId: chrome.runtime.id,
};

var jsDependencies = [
    'config/env.js',
    'node_modules/chart.js/Chart.min.js',
    'node_modules/fiber/src/fiber.min.js',
    'node_modules/fancybox/dist/js/jquery.fancybox.pack.js',
    'modules/StorageManager.js',
    'modules/geo.js',
    'modules/latlong.js',
    'modules/qrcode.min.js',
    'js/processors/VacuumProcessor.js',
    'js/processors/ActivityProcessor.js',
    'js/processors/BikeOdoProcessor.js',
    'js/processors/SegmentProcessor.js',
    'js/Helper.js',
    'js/Follow.js',
    'js/modifiers/ActivityScrollingModifier.js',
    'js/modifiers/RemoteLinksModifier.js',
    'js/modifiers/DefaultLeaderboardFilterModifier.js',
    'js/modifiers/MenuModifier.js',
    'js/modifiers/SegmentRankPercentageModifier.js',
    'js/modifiers/ActivityGoogleMapTypeModifier.js',
    'js/modifiers/HidePremiumModifier.js',
    'js/modifiers/ShopHeaderLinkModifier.js',

    // Extended data views
    'js/modifiers/extendedActivityData/views/AbstractDataView.js',
    'js/modifiers/extendedActivityData/views/FeaturedDataView.js',
    'js/modifiers/extendedActivityData/views/SpeedDataView.js',
    'js/modifiers/extendedActivityData/views/HeartRateDataView.js',
    'js/modifiers/extendedActivityData/views/CadenceDataView.js',
    'js/modifiers/extendedActivityData/views/PowerDataView.js',

    // Extended data modifiers
    'js/modifiers/extendedActivityData/AbstractExtendedActivityDataModifier.js',
    'js/modifiers/extendedActivityData/CyclingExtendedActivityDataModifier.js',
    'js/modifiers/extendedActivityData/RunningExtendedActivityDataModifier.js',
    'js/modifiers/extendedActivityData/GenericExtendedActivityDataModifier.js',
    
    'js/modifiers/HideFeedModifier.js',
    'js/modifiers/ActivityBikeOdoModifier.js',
    'js/modifiers/ActivityQRCodeDisplayModifier.js',
    'js/modifiers/RunningGradeAdjustedPaceModifier.js',
    'js/modifiers/RunningHeartRateModifier.js',
    'js/modifiers/NearbySegmentsModifier.js',
];

var cssDependencies = [
    'node_modules/fancybox/dist/css/jquery.fancybox.css',
    'css/extendedData.css'
];


var content = new Content(jsDependencies, cssDependencies, userSettings, appResources);
content.start();
