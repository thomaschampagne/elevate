/*
 * Declaring Angular App
 */
var app = angular.module("App", ['ngRoute', 'ui.bootstrap', 'ui.checkbox', 'SettingsSectionsModule']);

app.config(['$routeProvider', function($routeProvider) {

    $routeProvider.when(Config.routeMap.activitiesStatsRoute, {
        templateUrl: 'views/activitiesStats.html',
        controller: 'ActivitiesStatsController'
    });

    $routeProvider.when(Config.routeMap.commonSettingsRoute, {
        templateUrl: 'views/commonSettings.html',
        controller: 'CommonSettingsController'
    });

    $routeProvider.when(Config.routeMap.healthSettingsRoute, {
        templateUrl: 'views/healthSettings.html',
        controller: 'HealthSettingsController'
    });

    $routeProvider.when(Config.routeMap.zonesSettingsRoute, {
        templateUrl: 'views/zonesSettings.html',
        controller: 'XtdZonesSettingsController'
    });

    $routeProvider.when(Config.routeMap.releaseNotesRoute, {
        templateUrl: 'views/releaseNotes.html'
    });

    $routeProvider.when(Config.routeMap.aboutRoute, {
        templateUrl: 'views/about.html'
    });

    $routeProvider.when(Config.routeMap.donateRoute, {
        templateUrl: 'views/donate.html',
        controller: 'DonateController'
    });

    $routeProvider.when(Config.routeMap.shareRoute, {
        templateUrl: 'views/share.html'
    });

    $routeProvider.otherwise({
        redirectTo: Config.routeMap.commonSettingsRoute
    })
}]);


