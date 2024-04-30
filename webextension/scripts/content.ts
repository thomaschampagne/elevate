import _ from "lodash";
import { Loader } from "../modules/loader";
import { AppResourcesModel } from "./models/app-resources.model";
import { StartCoreDataModel } from "./models/start-core-data.model";
import { BrowserStorageType } from "./models/browser-storage-type.enum";
import { BrowserStorage } from "./browser-storage";
import { UserSettings } from "@elevate/shared/models/user-settings/user-settings.namespace";
import { CoreMessages } from "@elevate/shared/models/core-messages";
import ExtensionUserSettings = UserSettings.ExtensionUserSettings;

export class Content {
  public static loader: Loader = new Loader();

  protected appResources: AppResourcesModel;

  constructor(appResourcesModel: AppResourcesModel) {
    this.appResources = appResourcesModel;
  }

  public isExtensionRunnableInThisContext(): boolean {
    let isRunnable = true;

    // Eject if http://www.strava.com/routes/new OR http://www.strava.com/routes/XXXX/edit
    if (
      window.location.pathname.match(/^\/routes\/new/) ||
      window.location.pathname.match(/^\/routes\/(\d+)\/edit$/) ||
      window.location.pathname.match(/^\/about/) ||
      window.location.pathname.match(/^\/running-app/) ||
      window.location.pathname.match(/^\/features/) ||
      window.location.pathname.match(/^\/api/) ||
      window.location.pathname.match(/^\/premium/) ||
      window.location.pathname.match(/^\/gopremium/) ||
      window.location.pathname.match(/^\/store/) ||
      window.location.pathname.match(/^\/how-it-works/) ||
      window.location.pathname.match(/^\/careers/)
    ) {
      isRunnable = false;
    }

    // Do not run extension if user not logged
    if (document.body.classList.contains("is-home-page") || document.body.classList.contains("logged-out")) {
      isRunnable = false;
    }

    return isRunnable;
  }

  public start(): void {
    // Skip execution if needed
    if (!this.isExtensionRunnableInThisContext()) {
      console.log("Skipping Elevate chrome extension execution in this page");
      return;
    }

    BrowserStorage.getInstance()
      .get<ExtensionUserSettings>(BrowserStorageType.LOCAL, "userSettings", true)
      .then((userSettingsResult: ExtensionUserSettings) => {
        let userSettings: ExtensionUserSettings;

        const defaultUserSettingsData = ExtensionUserSettings.DEFAULT_MODEL;

        if (userSettingsResult) {
          userSettings = userSettingsResult;
        } else {
          userSettings = defaultUserSettingsData;
        }

        const defaultSettings = _.keys(defaultUserSettingsData);
        const syncedSettings = _.keys(userSettings);
        if (_.difference(defaultSettings, syncedSettings).length !== 0) {
          // If settings shape has changed
          _.defaults(userSettings, defaultUserSettingsData);
        }

        const startCoreData: StartCoreDataModel = {
          extensionId: chrome.runtime.id,
          userSettings: userSettings,
          appResources: this.appResources
        };
        Content.loader.require(["extension/boot.bundle.js"], () => {
          this.emitStartCoreEvent(startCoreData);
        });
      });
  }

  protected emitStartCoreEvent(startCoreData: StartCoreDataModel) {
    const startCorePluginEvent: CustomEvent = new CustomEvent(CoreMessages.ON_START_CORE_EVENT, {
      bubbles: true,
      cancelable: true,
      detail: startCoreData
    });
    dispatchEvent(startCorePluginEvent);
  }
}

const getURL = (path: string): string => {
  return `chrome-extension://${chrome.runtime.id}/${path}`.replace(/\/\//g, "/");
};

export const appResources: AppResourcesModel = {
  settingsLink: getURL("/app/index.html"),
  logoElevate: getURL("/extension/icons/logo_elevate_no_circle.svg"),
  menuIconBlack: getURL("/extension/icons/ic_menu_24px_black.svg"),
  menuIconOrange: getURL("/extension/icons/ic_menu_24px_orange.svg"),
  remoteViewIcon: getURL("/extension/icons/ic_open_in_new_24px.svg"),
  pollIcon: getURL("/extension/icons/ic_poll_24px.svg"),
  helpIcon: getURL("/extension/icons/ic_help_black_24px.svg"),
  veloviewerIcon: getURL("/extension/icons/veloviewer.ico"),
  raceshapeIcon: getURL("/extension/icons/raceshape.ico"),
  veloviewerDashboardIcon: getURL("/extension/icons/ic_dashboard_24px.svg"),
  veloviewerChallengesIcon: getURL("/extension/icons/ic_landscape_24px.svg"),
  labIcon: getURL("/extension/icons/lab.png"),
  settingsIcon: getURL("/extension/icons/ic_settings_24px.svg"),
  heartIcon: getURL("/extension/icons/ic_favorite_24px.svg"),
  zonesIcon: getURL("/extension/icons/ic_format_line_spacing_24px.svg"),
  komMapIcon: getURL("/extension/icons/ic_looks_one_24px.svg"),
  heatmapIcon: getURL("/extension/icons/ic_whatshot_24px.svg"),
  bugIcon: getURL("/extension/icons/ic_bug_report_24px.svg"),
  rateIcon: getURL("/extension/icons/ic_star_24px.svg"),
  aboutIcon: getURL("/extension/icons/ic_info_outline_24px.svg"),
  peopleIcon: getURL("/extension/icons/ic_supervisor_account_black_24px.svg"),
  eyeIcon: getURL("/extension/icons/ic_remove_red_eye_24px.svg"),
  bikeIcon: getURL("/extension/icons/ic_directions_bike_24px.svg"),
  mapIcon: getURL("/extension/icons/ic_map_24px.svg"),
  wheatherIcon: getURL("/extension/icons/ic_wb_sunny_24px.svg"),
  twitterIcon: getURL("/extension/icons/twitter.svg"),
  systemUpdatesIcon: getURL("/extension/icons/ic_system_update_24px.svg"),
  fitnessCenterIcon: getURL("/extension/icons/ic_fitness_center_black_24px.svg"),
  timelineIcon: getURL("/extension/icons/ic_timeline_black_24px.svg"),
  viewListIcon: getURL("/extension/icons/baseline-view_list-24px.svg"),
  dateRange: getURL("/extension/icons/ic_date_range_black_24px.svg"),
  athleteIcon: getURL("/extension/icons/ic_accessibility_black_24px.svg"),
  donateIcon: getURL("/extension/icons/ic_attach_money_24px.svg"),
  shareIcon: getURL("/extension/icons/ic_share_24px.svg"),
  trackChangesIcon: getURL("/extension/icons/ic_track_changes_24px.svg"),
  trendingUpIcon: getURL("/extension/icons/ic_trending_up_black_24px.svg"),
  qrCodeIcon: getURL("/extension/icons/qrcode.svg"),
  lightbulbIcon: getURL("/extension/icons/fa-lightbulb-o.png"),
  heartBeatIcon: getURL("/extension/icons/fa-heartbeat.png"),
  areaChartIcon: getURL("/extension/icons/fa-area-chart.png"),
  tachometerIcon: getURL("/extension/icons/fa-tachometer.png"),
  boltIcon: getURL("/extension/icons/fa-bolt.png"),
  loadingIcon: getURL("/extension/icons/loading.gif"),
  circleNotchIcon: getURL("/extension/icons/fa-circle-o-notch.png"),
  lineChartIcon: getURL("/extension/icons/fa-line-chart.png"),
  logArrowUpIcon: getURL("/extension/icons/fa-long-arrow-up.png"),
  cogIcon: getURL("/extension/icons/fa-cog.png"),
  logoNoText: getURL("/extension/icons/logo_no_text.svg"),
  logoTextOnly: getURL("/extension/icons/logo_text_only.svg"),
  extVersion: chrome.runtime.getManifest().version_name,
  extVersionName: chrome.runtime.getManifest().version_name,
  extensionId: chrome.runtime.id
};

const content: Content = new Content(appResources);
content.start();
