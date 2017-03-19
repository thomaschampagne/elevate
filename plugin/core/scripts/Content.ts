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
            window.location.pathname.match(/^\/api/) ||
            window.location.pathname.match(/^\/premium/) ||
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
                injectedScript.src = chrome.extension.getURL('core/scripts/StravistiX.js');
                injectedScript.onload = () => {

                    injectedScript.remove();

                    let inner: HTMLScriptElement = document.createElement('script');

                    if (_.isEmpty(chromeSettings)) { // If settings from chrome sync storage are empty
                        chromeSettings = this.userSettings;
                    }

                    let defaultSettings = _.keys(userSettings)
                    let syncedSettings = _.keys(chromeSettings)
                    if(_.difference(defaultSettings, syncedSettings).length !== 0){ // If settings shape has changed
                       _.defaults(chromeSettings, userSettings)
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
    logoStravistix: chrome.extension.getURL('/core/icons/logo_stravistix_no_circle.svg'),
    menuIconBlack: chrome.extension.getURL('/core/icons/ic_menu_24px_black.svg'),
    menuIconOrange: chrome.extension.getURL('/core/icons/ic_menu_24px_orange.svg'),
    remoteViewIcon: chrome.extension.getURL('/core/icons/ic_open_in_new_24px.svg'),
    pollIcon: chrome.extension.getURL('/core/icons/ic_poll_24px.svg'),
    helpIcon: chrome.extension.getURL('/core/icons/ic_help_black_24px.svg'),
    veloviewerIcon: chrome.extension.getURL('/core/icons/veloviewer.ico'),
    raceshapeIcon: chrome.extension.getURL('/core/icons/raceshape.ico'),
    veloviewerDashboardIcon: chrome.extension.getURL('/core/icons/ic_dashboard_24px.svg'),
    veloviewerChallengesIcon: chrome.extension.getURL('/core/icons/ic_landscape_24px.svg'),
    labIcon: chrome.extension.getURL('/core/icons/lab.png'),
    settingsIcon: chrome.extension.getURL('/core/icons/ic_settings_24px.svg'),
    heartIcon: chrome.extension.getURL('/core/icons/ic_favorite_24px.svg'),
    zonesIcon: chrome.extension.getURL('/core/icons/ic_format_line_spacing_24px.svg'),
    komMapIcon: chrome.extension.getURL('/core/icons/ic_looks_one_24px.svg'),
    heatmapIcon: chrome.extension.getURL('/core/icons/ic_whatshot_24px.svg'),
    bugIcon: chrome.extension.getURL('/core/icons/ic_bug_report_24px.svg'),
    rateIcon: chrome.extension.getURL('/core/icons/ic_star_24px.svg'),
    aboutIcon: chrome.extension.getURL('/core/icons/ic_info_outline_24px.svg'),
    peopleIcon: chrome.extension.getURL('/core/icons/ic_supervisor_account_black_24px.svg'),
    eyeIcon: chrome.extension.getURL('/core/icons/ic_remove_red_eye_24px.svg'),
    bikeIcon: chrome.extension.getURL('/core/icons/ic_directions_bike_24px.svg'),
    mapIcon: chrome.extension.getURL('/core/icons/ic_map_24px.svg'),
    wheatherIcon: chrome.extension.getURL('/core/icons/ic_wb_sunny_24px.svg'),
    twitterIcon: chrome.extension.getURL('/core/icons/twitter.svg'),
    systemUpdatesIcon: chrome.extension.getURL('/core/icons/ic_system_update_24px.svg'),
    fitnessCenterIcon: chrome.extension.getURL('/core/icons/ic_fitness_center_black_24px.svg'),
    timelineIcon: chrome.extension.getURL('/core/icons/ic_timeline_black_24px.svg'),
    timelapseIcon: chrome.extension.getURL('/core/icons/ic_timelapse_black_24px.svg'),
    athleteIcon: chrome.extension.getURL('/core/icons/ic_accessibility_black_24px.svg'),
    donateIcon: chrome.extension.getURL('/core/icons/ic_attach_money_24px.svg'),
    shareIcon: chrome.extension.getURL('/core/icons/ic_share_24px.svg'),
    trackChangesIcon: chrome.extension.getURL('/core/icons/ic_track_changes_24px.svg'),
    trendingUpIcon: chrome.extension.getURL('/core/icons/ic_trending_up_black_24px.svg'),
    qrCodeIcon: chrome.extension.getURL('/core/icons/qrcode.svg'),
    lightbulbIcon: chrome.extension.getURL('/core/icons/fa-lightbulb-o.png'),
    heartBeatIcon: chrome.extension.getURL('/core/icons/fa-heartbeat.png'),
    areaChartIcon: chrome.extension.getURL('/core/icons/fa-area-chart.png'),
    tachometerIcon: chrome.extension.getURL('/core/icons/fa-tachometer.png'),
    boltIcon: chrome.extension.getURL('/core/icons/fa-bolt.png'),
    loadingIcon: chrome.extension.getURL('/core/icons/loading.gif'),
    circleNotchIcon: chrome.extension.getURL('/core/icons/fa-circle-o-notch.png'),
    lineChartIcon: chrome.extension.getURL('/core/icons/fa-line-chart.png'),
    logArrowUpIcon: chrome.extension.getURL('/core/icons/fa-long-arrow-up.png'),
    cogIcon: chrome.extension.getURL('/core/icons/fa-cog.png'),
    logoNoText: chrome.extension.getURL('/core/icons/logo_no_text.svg'),
    logoTextOnly: chrome.extension.getURL('/core/icons/logo_text_only.svg'),
    extVersion: chrome.runtime.getManifest().version,
    extVersionName: chrome.runtime.getManifest().version_name,
    extensionId: chrome.runtime.id,
};

let jsDependencies: Array<string> = [

    // Config
    'core/config/env.js',

    // Modules
	'node_modules/q/q.js',
    'node_modules/chart.js/dist/Chart.bundle.js',
    'node_modules/fancybox/dist/js/jquery.fancybox.pack.js',
    'node_modules/qrcode-js-package/qrcode.min.js',
    'node_modules/geodesy/dms.js',
    'node_modules/geodesy/latlon-spherical.js',
    'core/modules/StorageManager.js',
    'core/modules/jquery.appear.js',

    // Plugin stuff...
	'core/scripts/synchronizer/ActivitiesSynchronizer.js',
    'core/scripts/processors/VacuumProcessor.js',
    'core/scripts/processors/ActivityProcessor.js',
    'core/scripts/processors/ActivitiesProcessor.js',
    'core/scripts/processors/BikeOdoProcessor.js',
    'core/scripts/processors/SegmentProcessor.js',
    'core/scripts/Helper.js',
    'core/scripts/Follow.js',
    'core/scripts/modifiers/ActivityScrollingModifier.js',
    'core/scripts/modifiers/RemoteLinksModifier.js',
    'core/scripts/modifiers/WindyTyModifier.js',
    'core/scripts/modifiers/ReliveCCModifier.js',
    'core/scripts/modifiers/DefaultLeaderBoardFilterModifier.js',
    'core/scripts/modifiers/MenuModifier.js',
    'core/scripts/modifiers/SegmentRankPercentageModifier.js',
    'core/scripts/modifiers/SegmentRecentEffortsHRATimeModifier.js',
    'core/scripts/modifiers/VirtualPartnerModifier.js',
    'core/scripts/modifiers/ActivityStravaMapTypeModifier.js',
    'core/scripts/modifiers/HidePremiumModifier.js',
    'core/scripts/modifiers/AthleteStatsModifier.js',
    'core/scripts/modifiers/ActivitiesSummaryModifier.js',
    'core/scripts/modifiers/ActivitySegmentTimeComparisonModifier.js',
    'core/scripts/modifiers/ActivityBestSplitsModifier.js',
    'core/scripts/modifiers/GoalsModifier.js',
    'core/scripts/modifiers/ActivitiesSyncModifier.js',


    // ... with ... extended data views
    'core/scripts/modifiers/extendedActivityData/views/AbstractDataView.js',
    'core/scripts/modifiers/extendedActivityData/views/HeaderView.js',
    'core/scripts/modifiers/extendedActivityData/views/FeaturedDataView.js',
    'core/scripts/modifiers/extendedActivityData/views/SpeedDataView.js',
    'core/scripts/modifiers/extendedActivityData/views/PaceDataView.js',
    'core/scripts/modifiers/extendedActivityData/views/HeartRateDataView.js',
    'core/scripts/modifiers/extendedActivityData/views/AbstractCadenceDataView.js',
    'core/scripts/modifiers/extendedActivityData/views/CyclingCadenceDataView.js',
    'core/scripts/modifiers/extendedActivityData/views/RunningCadenceDataView.js',
    'core/scripts/modifiers/extendedActivityData/views/CyclingPowerDataView.js',
    'core/scripts/modifiers/extendedActivityData/views/RunningPowerDataView.js',
    'core/scripts/modifiers/extendedActivityData/views/ElevationDataView.js',
    'core/scripts/modifiers/extendedActivityData/views/AscentSpeedDataView.js',
    'core/scripts/modifiers/extendedActivityData/views/AbstractGradeDataView.js',
    'core/scripts/modifiers/extendedActivityData/views/CyclingGradeDataView.js',
    'core/scripts/modifiers/extendedActivityData/views/RunningGradeDataView.js',

    // ... Extended data modifiers
    'core/scripts/modifiers/extendedActivityData/AbstractExtendedDataModifier.js',
    'core/scripts/modifiers/extendedActivityData/CyclingExtendedDataModifier.js',
    'core/scripts/modifiers/extendedActivityData/RunningExtendedDataModifier.js',
    'core/scripts/modifiers/extendedActivityData/GenericExtendedDataModifier.js',
    'core/scripts/modifiers/HideFeedModifier.js',
    'core/scripts/modifiers/DisplayFlyByFeedModifier.js',
    'core/scripts/modifiers/ActivityBikeOdoModifier.js',
    'core/scripts/modifiers/ActivityQRCodeDisplayModifier.js',
    'core/scripts/modifiers/RunningDataModifier.js',
    'core/scripts/modifiers/NearbySegmentsModifier.js',
    'core/scripts/modifiers/GoogleMapsModifier.js',

    // ... workers
    'core/scripts/processors/ActivityComputer.js',
    'core/scripts/processors/workers/ComputeAnalysisWorker.js',

    // Release notes...
    'core/scripts/ReleaseNotes.js'
];

let cssDependencies: Array<string> = [
    'node_modules/fancybox/dist/css/jquery.fancybox.css',
    'core/css/core.css'
];

let content: Content = new Content(jsDependencies, cssDependencies, userSettings, appResources);
content.start();

// Inject constants
let constantsStr: string = 'var Constants = ' + JSON.stringify(Constants) + ';';
Content.loader.injectJS(constantsStr);
