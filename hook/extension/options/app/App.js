/**
 * Declaring Angular App
 */
var app = angular.module("App", ['ngRoute', 'ngMaterial', 'ngSanitize', 'ngAnimate']);

app.constant('$colors', {
    strava: '#e94e1b'
});

app.config(function($mdThemingProvider, $colors) {
    var stravaOrange = $mdThemingProvider.extendPalette('orange', {
        '500': $colors.strava,
        'contrastDefaultColor': 'light'
    });
    $mdThemingProvider.definePalette('stravaOrange', stravaOrange);
    $mdThemingProvider.theme('default').primaryPalette('stravaOrange');
});

app.config(['$routeProvider', function($routeProvider) {

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
        templateUrl: 'views/zonesSettings.html',
        controller: 'XtdZonesSettingsController'
    });

    $routeProvider.when(routeMap.fitnessTrendRoute, {
        templateUrl: 'views/fitnessTrend.html',
        controller: 'FitnessTrendController'
    });

    $routeProvider.otherwise({
        redirectTo: routeMap.commonSettingsRoute
    });
}]);
