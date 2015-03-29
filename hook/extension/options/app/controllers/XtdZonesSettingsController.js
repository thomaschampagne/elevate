var devData = '[{"from":0,"to":2},{"from":2,"to":5},{"from":5,"to":27},{"from":27,"to":30},{"from":30,"to":35},{"from":35,"to":38},{"from":38,"to":41}]';

app.controller("XtdZonesSettingsController", ['$scope', 'Notifier', '$timeout', '$location', function($scope, Notifier, $timeout, $location) {

    // List of Xtended data to be customize
    $scope.xtdListOptions = [{
        name: 'Cyling Speed',
        value: 'speed',
        units: '',
        step: 1
    }, {
        name: 'Running Pace',
        value: 'pace',
        units: '',
        step: 1
    }, {
        name: 'Cyling Power',
        value: 'power',
        units: '',
        step: 1
    }, {
        name: 'Cycling Cadence',
        value: 'cyclingCadence',
        units: '',
        step: 1
    }, {
        name: 'Running Cadence',
        value: 'runningCadence',
        units: '',
        step: 1
    }, {
        name: 'Grade',
        value: 'grade',
        units: '',
        step: 1
    }];

    ChromeStorageModule.fetchUserSettings(function(userSettingsSynced) {

        $scope.zones = userSettingsSynced.zones;

        // Select cycling speed by default
        // $scope.xtdItem = $scope.xtdListOptions[0];
        // $scope.xtdZones = userSettingsSynced.zones[type];
        // console.warn($scope.zones);

        // First load
        $scope.switchZonesFromXtdItem($scope.xtdListOptions[0]);
        $scope.$apply();

    }.bind(this));

    $scope.switchZonesFromXtdItem = function(xtdItem) {
        // $scope.zones = userSettingsSynced.zones[xtdItem];

        // Select cycling speed by default
        $scope.xtdItem = xtdItem;
        $scope.xtdZones = $scope.zones[xtdItem.value];
        //$scope.$apply();

    };

    $scope.toggleSelectOption = function(listItem) {
        // Load source on toggle option
        // And inject
        // Mocking xtd source
        //$scope.xtdZones = angular.fromJson(devData); // Inject source on toggle change

        $scope.switchZonesFromXtdItem(listItem);
    };
}]);
