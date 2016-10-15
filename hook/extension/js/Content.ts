class Content {

    public static loader: Loader = new Loader();

    protected appResources: IAppResources;
    protected userSettings: IUserSettings;
    protected cssDependencies: string[];
    protected jsDependencies: string[];

    constructor(jsDependencies: Array<string>, cssDependencies: Array<string>, userSettings: IUserSettings, appResources: IAppResources) {
        this.jsDependencies = jsDependencies;
        this.cssDependencies = cssDependencies;
        this.userSettings = userSettings;
        this.appResources = appResources;
    }

    loadDependencies(finishLoading: Function): void {

        let dependencies: Array<string> = _.union(this.jsDependencies, this.cssDependencies);
        Content.loader.require(dependencies, () => {
            finishLoading();
        });
    }

    isExtensionRunnableInThisContext(): boolean {

        let isRunnable: boolean = true;

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
    }

    start(): void {

        // Skip execution if needed
        if (!this.isExtensionRunnableInThisContext()) {
            console.log("Skipping StravistiX chrome extension execution in this page");
            return;
        }

        this.loadDependencies(() => {

            chrome.storage.sync.get(this.userSettings, (chromeSettings: any) => {

                let node: HTMLElement = (document.head || document.documentElement);

                let injectedScript: HTMLScriptElement = document.createElement('script');
                injectedScript.src = chrome.extension.getURL('js/StravistiX.js');
                injectedScript.onload = () => {

                    injectedScript.remove();

                    let inner: HTMLScriptElement = document.createElement('script');

                    if (_.isEmpty(chromeSettings)) { // If settings from chrome sync storage are empty
                        chromeSettings = this.userSettings;
                    }

                    inner.textContent = 'var $ = jQuery;';
                    inner.textContent += 'var stravistiX = new StravistiX(' + JSON.stringify(chromeSettings) + ', ' + JSON.stringify(this.appResources) + ');';
                    inner.onload = () => {
                        inner.remove();
                    };

                    node.appendChild(inner);
                };
                node.appendChild(injectedScript);
            });

        });
    }
}

let appResources: IAppResources = {
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
    loadingIcon: chrome.extension.getURL('/icons/loading.gif'),
    circleNotchIcon: chrome.extension.getURL('/icons/fa-circle-o-notch.png'),
    lineChartIcon: chrome.extension.getURL('/icons/fa-line-chart.png'),
    logArrowUpIcon: chrome.extension.getURL('/icons/fa-long-arrow-up.png'),
    cogIcon: chrome.extension.getURL('/icons/fa-cog.png'),
    extVersion: chrome.runtime.getManifest().version,
    extVersionName: chrome.runtime.getManifest().version_name,
    extensionId: chrome.runtime.id,
};

let jsDependencies: Array<string> = [

    // Config
    'config/env.js',

    // Modules
    'node_modules/chart.js/dist/Chart.bundle.js',
    'node_modules/fancybox/dist/js/jquery.fancybox.pack.js',
    'node_modules/qrcode-js-package/qrcode.min.js',
    'node_modules/geodesy/dms.js',
    'node_modules/geodesy/latlon-spherical.js',
    'modules/StorageManager.js',
    'modules/jquery.appear.js',


    // Plugin stuff...
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
    'js/modifiers/DefaultLeaderBoardFilterModifier.js',
    'js/modifiers/MenuModifier.js',
    'js/modifiers/SegmentRankPercentageModifier.js',
    'js/modifiers/SegmentRecentEffortsHRATimeModifier.js',
    'js/modifiers/VirtualPartnerModifier.js',
    'js/modifiers/ActivityStravaMapTypeModifier.js',
    'js/modifiers/HidePremiumModifier.js',
    'js/modifiers/AthleteStatsModifier.js',
    'js/modifiers/ActivitiesSummaryModifier.js',
    'js/modifiers/ActivitySegmentTimeComparisonModifier.js',
    'js/modifiers/ActivityBestSplitsModifier.js',

    // ... with ... extended data views
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
    'js/modifiers/extendedActivityData/views/RunningGradeDataView.js',

    // ... Extended data modifiers
    'js/modifiers/extendedActivityData/AbstractExtendedDataModifier.js',
    'js/modifiers/extendedActivityData/CyclingExtendedDataModifier.js',
    'js/modifiers/extendedActivityData/RunningExtendedDataModifier.js',
    'js/modifiers/extendedActivityData/GenericExtendedDataModifier.js',
    'js/modifiers/HideFeedModifier.js',
    'js/modifiers/DisplayFlyByFeedModifier.js',
    'js/modifiers/ActivityBikeOdoModifier.js',
    'js/modifiers/ActivityQRCodeDisplayModifier.js',
    'js/modifiers/RunningDataModifier.js',
    'js/modifiers/NearbySegmentsModifier.js',
    'js/modifiers/GoogleMapsModifier.js',

    // ... workers
    'js/processors/ActivityComputer.js',
    'js/processors/workers/ComputeAnalysisWorker.js',

    // Release notes...
    'js/ReleaseNotes.js'
];

let cssDependencies: Array<string> = [
    'node_modules/fancybox/dist/css/jquery.fancybox.css',
    'css/extendedData.css'
];

let content: Content = new Content(jsDependencies, cssDependencies, userSettings, appResources);
content.start();

// Inject constants
let constantsStr: string = 'var Constants = ' + JSON.stringify(Constants) + ';';
Content.loader.injectJS(constantsStr);
