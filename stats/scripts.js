var app = angular.module("App", ['ngRoute', 'ngMaterial', 'chart.js']);
var $colors = {
    strava: '#e94e1b'
};
app.constant('$colors', $colors);
app.constant('$endPoint', 'https://stravistix-thomaschampagne.rhcloud.com/api/stats');
app.constant('$routes', {
    main: '/',
    login: '/login'
});
app.config(function ($mdThemingProvider, $colors) {
    var stravaOrange = $mdThemingProvider.extendPalette('orange', {
        '500': $colors.strava,
        'contrastDefaultColor': 'light'
    });
    $mdThemingProvider.definePalette('stravaOrange', stravaOrange);
    $mdThemingProvider.theme('default').primaryPalette('stravaOrange');
});
app.config(['$routeProvider', '$routes', function ($routeProvider, $routes) {
        $routeProvider.when($routes.login, {
            templateUrl: 'views/login.html',
            controller: 'LoginController'
        });
        $routeProvider.otherwise({
            templateUrl: 'views/main.html',
            controller: 'MainController'
        });
    }]);

var StatsService = (function () {
    function StatsService(q, http, endPoint) {
        this.stats = null;
        this.$q = q;
        this.$http = http;
        this.endPoint = endPoint;
    }
    StatsService.prototype.clearToken = function () {
        localStorage.removeItem('token');
    };
    StatsService.prototype.hasPreviousSession = function () {
        var cachedToken = localStorage.getItem('token');
        if (cachedToken) {
            this.token = cachedToken;
            return true;
        }
        return false;
    };
    StatsService.prototype.loginFetchRemoteStats = function (encodedCredentials) {
        var defer = this.$q.defer();
        this.$http.get(this.endPoint, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Basic ' + encodedCredentials
            }
        }).then(function (response) {
            defer.resolve(response.data);
            localStorage.setItem('token', encodedCredentials);
        }, function (err) {
            console.error(err);
            localStorage.removeItem('token');
            defer.reject(err);
        });
        return defer.promise;
    };
    Object.defineProperty(StatsService.prototype, "token", {
        get: function () {
            return this._token;
        },
        set: function (value) {
            this._token = value;
        },
        enumerable: true,
        configurable: true
    });
    return StatsService;
}());
app.factory('$statsService', ['$q', '$http', '$endPoint', function ($q, $http, $endPoint) {
        return new StatsService($q, $http, $endPoint);
    }]);

var LoginController = (function () {
    function LoginController($scope, $statsService, $location, $routes) {
        if ($statsService.hasPreviousSession()) {
            console.log('Use previous session');
            $location.path($routes.main);
        }
        $scope.logon = function () {
            if (!_.isEmpty($scope.login) && !_.isEmpty($scope.password)) {
                $statsService.token = btoa($scope.login + ':' + $scope.password);
                $location.path($routes.main);
            }
        };
    }
    LoginController.$inject = ['$scope', '$statsService', '$location', '$routes'];
    return LoginController;
}());
app.controller('LoginController', LoginController);

var MainController = (function () {
    function MainController($rootScope, $scope, $statsService, $colors, $window, $location, $routes, $mdMedia, $mdDialog) {
        if (!$statsService.token) {
            console.log('Not logged');
            $location.path($routes.login);
            return;
        }
        $scope.chartOptions = {
            legend: {
                display: true,
                position: 'bottom'
            },
            responsive: true
        };
        $scope.countByVersionsDataLabels = [];
        $scope.countByVersionsData = [];
        $scope.ready = false;
        $statsService.loginFetchRemoteStats($statsService.token).then(function (response) {
            console.log(response);
            $scope.response = response;
            response.countByVersions = _.filter(response.countByVersions, function (item) {
                return !item.version.startsWith('preview');
            });
            var labels = [];
            var data = [];
            _.each(response.countByVersions, function (item) {
                labels.push(item.version);
                data.push(item.count);
            });
            $scope.countByVersionsLabels = labels;
            $scope.countByVersionsData = data;
            response.countByCountry = _.filter(response.countByCountry, function (item) {
                return (item.percent > 0.5);
            });
            labels = [];
            data = [];
            _.each(response.countByCountry, function (item) {
                labels.push(item.country);
                data.push(item.count);
            });
            $scope.countByCountryLabels = labels;
            $scope.countByCountryData = data;
            data = [];
            _.each(response.pros, function (pro) {
                var m = moment(pro.lastSeen);
                pro.lastSeen = m.format('YYYY-MM-DD');
                data.push(pro);
            });
            $scope.pros = data;
            $scope.ready = true;
        }, function (err) {
            console.error(err);
            $location.path($routes.login);
            $mdDialog.show($mdDialog.alert().textContent("Error: " + err.statusText).ok('OK'));
        });
        $scope.viewPro = function (stravaId) {
            $window.open('https://www.strava.com/athletes/' + stravaId, '_blank');
        };
        $scope.logout = function () {
            $statsService.clearToken();
            $location.path($routes.login);
        };
    }
    MainController.$inject = ['$rootScope', '$scope', '$statsService', '$colors', '$window', '$location', '$routes', '$mdMedia', '$mdDialog'];
    return MainController;
}());
app.controller('MainController', MainController);
