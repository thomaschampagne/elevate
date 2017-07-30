import * as angular from "angular";
import 'ngRoute';
import 'ngAria';
import 'ngMaterial';
import 'ngSanitize';
import 'ngAnimate';
import 'nvd3';
import 'md.data.table';

import {routeMap} from "./Config";
import {IControllerConstructor, IModule, Injectable} from "angular";
import {MainController} from "./controllers/MainController";
import {AthleteSettingsController} from "./controllers/AthleteSettingsController";
import {CommonSettingsController} from "./controllers/CommonSettingsController";
import {FitnessTrendController} from "./controllers/FitnessTrendController";
import {HrrZonesSettingsController} from "./controllers/HrrZonesSettingsController";
import {XtdZonesSettingsController} from "./controllers/XtdZonesSettingsController";
import {YearProgressController} from "./controllers/YearProgressController";
import {swimFtpCalculator} from "./directives/swimFTPCalculator";
import {fitnessTrendTable} from "./directives/fitnessTrend/fitnessTrendTable";
import {fitnessTrendGraph} from "./directives/fitnessTrend/fitnessTrendGraph";
import {xtdZones} from "./directives/xtdZones/XtdZones";
import {xtdZone} from "./directives/xtdZones/XtdZone";
import {hrrZones} from "./directives/hrrZones/HrrZones";
import {hrrZone} from "./directives/hrrZones/HrrZone";
import {profileConfiguredRibbon} from "./directives/profileConfiguredRibbon";
import {restoreHistory} from "./directives/restoreHistory";
import {chromeStorageService} from "./services/ChromeStorageService";
import {hrrToBpmFilter} from "./filters/HrrToBpmFilter";
import {releaseNotesService} from "./services/ReleaseNotesService";
import {fitnessDataService} from "./services/FitnessDataService";
import {avoidInputKeysService} from "./services/AvoidInputKeysService";
import {xtdDataFilter} from "./filters/XtdDataFilter";
import {commonSettingsService} from "./services/CommonSettingsService";
import {$colors} from "./Colors";
import {constants} from "../../core/scripts/Constants";

// Assign constants values
constants.VERSION = chrome.runtime.getManifest().version;
constants.EXTENSION_ID = chrome.runtime.id;
constants.OPTIONS_URL = 'chrome-extension://' + constants.EXTENSION_ID + '/options/app/index.html';

let ngModules: Array<string> = [
    'ngRoute',
    'ngAria',
    'ngMaterial',
    'ngSanitize',
    'ngAnimate',
    'nvd3',
    'md.data.table',
];

// Define angular app
angular.module('App', ngModules)
    .constant('$colors', $colors) // Inject colors

    // Theme config
    .config(($mdThemingProvider: any, $colors: any) => {
        let stravaOrange: any = $mdThemingProvider.extendPalette('orange', {
            '500': $colors.strava,
            'contrastDefaultColor': 'light'
        });
        $mdThemingProvider.definePalette('stravaOrange', stravaOrange);
        $mdThemingProvider.theme('default').primaryPalette('stravaOrange');
    })

    // Routing
    .config(['$routeProvider', ($routeProvider: any) => {

        $routeProvider.when(routeMap.commonSettingsRoute, {
            templateUrl: 'views/commonSettings.html',
            controller: 'CommonSettingsController'
        });

        $routeProvider.when(routeMap.athleteSettingsRoute, {
            templateUrl: 'views/athleteSettings.html',
            controller: 'AthleteSettingsController'
        });

        $routeProvider.when(routeMap.hrrZonesSettingsRoute, {
            templateUrl: 'views/hrrZonesSettings.html',
            controller: 'HrrZonesSettingsController'
        });

        $routeProvider.when(routeMap.zonesSettingsRoute + '/:zoneValue', {
            templateUrl: 'views/XtdZonesSettingsController.html',
            controller: 'XtdZonesSettingsController'
        });

        $routeProvider.when(routeMap.fitnessTrendRoute, {
            templateUrl: 'views/fitnessTrend.html',
            controller: 'FitnessTrendController'
        });

        $routeProvider.when(routeMap.yearProgressRoute, {
            templateUrl: 'views/yearProgress.html',
            controller: 'YearProgressController'
        });

        $routeProvider.otherwise({
            redirectTo: routeMap.commonSettingsRoute
        });
    }])

    // Controllers
    .controller('MainController', MainController)
    .controller("AthleteSettingsController", AthleteSettingsController)
    .controller('CommonSettingsController', CommonSettingsController)
    .controller("FitnessTrendController", <Injectable<IControllerConstructor>>FitnessTrendController)
    .controller("HrrZonesSettingsController", HrrZonesSettingsController)
    .controller("XtdZonesSettingsController", XtdZonesSettingsController)
    .controller("YearProgressController", YearProgressController)

    // Directives
    .directive('swimFtpCalculator', swimFtpCalculator)
    .directive('fitnessTrendTable', fitnessTrendTable)
    .directive('fitnessTrendGraph', fitnessTrendGraph)
    .directive('xtdZones', xtdZones)
    .directive('xtdZone', xtdZone)
    .directive('hrrZones', hrrZones)
    .directive('hrrZone', hrrZone)
    .directive('profileConfiguredRibbon', profileConfiguredRibbon)
    .directive('restoreHistory', restoreHistory)

    // Filters
    .filter('hrrToBpmFilter', hrrToBpmFilter)
    .filter('xtdDataFilter', xtdDataFilter)
    .factory('AvoidInputKeysService', avoidInputKeysService)
    .factory('ChromeStorageService', chromeStorageService)
    .factory('CommonSettingsService', commonSettingsService)
    .factory('ReleaseNotesService', releaseNotesService)
    .factory('FitnessDataService', fitnessDataService);
