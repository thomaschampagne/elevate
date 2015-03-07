/**
 * Declaring Angular App
 */
var app = angular.module("App", ['ngRoute', 'ui.bootstrap', 'ui.checkbox', 'SettingsSectionsModule']);

app.config(['$routeProvider', function($routeProvider) {

    $routeProvider.when(routeMap.commonSettingsRoute, {
        templateUrl: 'views/commonSettings.html',
        controller: 'CommonSettingsController'
    });

    $routeProvider.when(routeMap.healthSettingsRoute, {
        templateUrl: 'views/healthSettings.html',
        controller: 'HealthSettingsController'
    });

    $routeProvider.when(routeMap.releaseNotesRoute, {
        templateUrl: 'views/releaseNotes.html'
    });

    $routeProvider.when(routeMap.aboutRoute, {
        templateUrl: 'views/about.html'
    });

    $routeProvider.when(routeMap.donateRoute, {
        templateUrl: 'views/donate.html'
    });

    $routeProvider.when(routeMap.shareRoute, {
        templateUrl: 'views/share.html'
    });

    $routeProvider.otherwise({
        redirectTo: routeMap.commonSettingsRoute
    })
}]);
