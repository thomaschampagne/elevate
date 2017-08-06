import * as angular from "angular";
import {IControllerConstructor, Injectable} from "angular";
import "md.data.table";
import "ngAnimate";
import "ngAria";
import "ngMaterial";
import "ngRoute";
import "ngSanitize";
import "nvd3";
import {constants} from "../../common/scripts/Constants";
import {$colors} from "./Colors";
import {routeMap} from "./Config";
import {AthleteSettingsController} from "./controllers/AthleteSettingsController";
import {CommonSettingsController} from "./controllers/CommonSettingsController";
import {FitnessTrendController} from "./controllers/FitnessTrendController";
import {HrrZonesSettingsController} from "./controllers/HrrZonesSettingsController";
import {MainController} from "./controllers/MainController";
import {XtdZonesSettingsController} from "./controllers/XtdZonesSettingsController";
import {YearProgressController} from "./controllers/YearProgressController";
import {fitnessTrendGraph} from "./directives/fitnessTrend/fitnessTrendGraph";
import {fitnessTrendTable} from "./directives/fitnessTrend/fitnessTrendTable";
import {hrrZone} from "./directives/hrrZones/HrrZone";
import {hrrZones} from "./directives/hrrZones/HrrZones";
import {profileConfiguredRibbon} from "./directives/profileConfiguredRibbon";
import {restoreHistory} from "./directives/restoreHistory";
import {swimFtpCalculator} from "./directives/swimFTPCalculator";
import {xtdZone} from "./directives/xtdZones/XtdZone";
import {xtdZones} from "./directives/xtdZones/XtdZones";
import {hrrToBpmFilter} from "./filters/HrrToBpmFilter";
import {xtdDataFilter} from "./filters/XtdDataFilter";
import {avoidInputKeysService} from "./services/AvoidInputKeysService";
import {chromeStorageService} from "./services/ChromeStorageService";
import {commonSettingsService} from "./services/CommonSettingsService";
import {fitnessDataService} from "./services/FitnessDataService";
import {releaseNotesService} from "./services/ReleaseNotesService";

// Assign constants values
constants.VERSION = chrome.runtime.getManifest().version;
constants.EXTENSION_ID = chrome.runtime.id;
constants.OPTIONS_URL = "chrome-extension://" + constants.EXTENSION_ID + "/options/app/index.html";

const ngModules: string[] = [
    "ngRoute",
    "ngAria",
    "ngMaterial",
    "ngSanitize",
    "ngAnimate",
    "nvd3",
    "md.data.table",
];

// Define angular app
angular.module("App", ngModules)
    .constant("$colors", $colors) // Inject colors

    // Theme config
    .config(($mdThemingProvider: any, $colors: any) => {
        const stravaOrange: any = $mdThemingProvider.extendPalette("orange", {
            500: $colors.strava,
            contrastDefaultColor: "light",
        });
        $mdThemingProvider.definePalette("stravaOrange", stravaOrange);
        $mdThemingProvider.theme("default").primaryPalette("stravaOrange");
    })

    // Routing
    .config(["$routeProvider", ($routeProvider: any) => {

        $routeProvider.when(routeMap.commonSettingsRoute, {
            templateUrl: "views/commonSettings.html",
            controller: "CommonSettingsController",
        });

        $routeProvider.when(routeMap.athleteSettingsRoute, {
            templateUrl: "views/athleteSettings.html",
            controller: "AthleteSettingsController",
        });

        $routeProvider.when(routeMap.hrrZonesSettingsRoute, {
            templateUrl: "views/hrrZonesSettings.html",
            controller: "HrrZonesSettingsController",
        });

        $routeProvider.when(routeMap.zonesSettingsRoute + "/:zoneValue", {
            templateUrl: "views/XtdZonesSettingsController.html",
            controller: "XtdZonesSettingsController",
        });

        $routeProvider.when(routeMap.fitnessTrendRoute, {
            templateUrl: "views/fitnessTrend.html",
            controller: "FitnessTrendController",
        });

        $routeProvider.when(routeMap.yearProgressRoute, {
            templateUrl: "views/yearProgress.html",
            controller: "YearProgressController",
        });

        $routeProvider.otherwise({
            redirectTo: routeMap.commonSettingsRoute,
        });
    }])

    // Controllers
    .controller("MainController", MainController)
    .controller("AthleteSettingsController", AthleteSettingsController)
    .controller("CommonSettingsController", CommonSettingsController)
    .controller("FitnessTrendController", FitnessTrendController as Injectable<IControllerConstructor>)
    .controller("HrrZonesSettingsController", HrrZonesSettingsController)
    .controller("XtdZonesSettingsController", XtdZonesSettingsController)
    .controller("YearProgressController", YearProgressController)

    // Directives
    .directive("swimFtpCalculator", swimFtpCalculator)
    .directive("fitnessTrendTable", fitnessTrendTable)
    .directive("fitnessTrendGraph", fitnessTrendGraph)
    .directive("xtdZones", xtdZones)
    .directive("xtdZone", xtdZone)
    .directive("hrrZones", hrrZones)
    .directive("hrrZone", hrrZone)
    .directive("profileConfiguredRibbon", profileConfiguredRibbon)
    .directive("restoreHistory", restoreHistory)

    // Filters
    .filter("hrrToBpmFilter", hrrToBpmFilter)
    .filter("xtdDataFilter", xtdDataFilter)
    .factory("AvoidInputKeysService", avoidInputKeysService)
    .factory("ChromeStorageService", chromeStorageService)
    .factory("CommonSettingsService", commonSettingsService)
    .factory("ReleaseNotesService", releaseNotesService)
    .factory("FitnessDataService", fitnessDataService);
