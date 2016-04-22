app.controller("XtdZonesSettingsController", ['$scope', '$location', 'ChromeStorageService', function($scope, $location, ChromeStorageService) {

    // List of Xtended data to be customize
    $scope.xtdListOptions = [{
        name: 'Cycling Speed',
        value: 'speed',
        units: 'KPH',
        step: 0.1,
        min: 0,
        max: 9999
    }, {
        name: 'Running Pace',
        value: 'pace',
        units: 'Seconds', // s/mi?!
        step: 1,
        min: 0,
        max: 9999
    }, {
        name: 'Cycling Power',
        value: 'power',
        units: 'Watts',
        step: 1,
        min: 0,
        max: 9999
    }, {
        name: 'Cycling Cadence',
        value: 'cyclingCadence',
        units: 'RPM',
        step: 1,
        min: 0,
        max: 9999
    }, {
        name: 'Running Cadence',
        value: 'runningCadence',
        units: 'SPM',
        step: 0.1,
        min: 0,
        max: 9999
    }, {
        name: 'Grade',
        value: 'grade',
        units: '%',
        step: 0.1,
        min: -9999,
        max: 9999
    }, {
        name: 'Elevation',
        value: 'elevation',
        units: 'm',
        step: 5,
        min: 0,
        max: 9999
    }, {
        name: 'Ascent speed',
        value: 'ascent',
        units: 'Vm/h',
        step: 5,
        min: 0,
        max: 9999
    }];

    ChromeStorageService.fetchUserSettings(function(userSettingsSynced) {

        $scope.zones = userSettingsSynced.zones;

        $scope.switchZonesFromXtdItem = function(xtdData) {

            // Select cycling speed by default
            $scope.xtdData = xtdData;
            $scope.xtdZones = $scope.zones[$scope.xtdData.value];
        };

        $scope.toggleSelectOption = function(listItem) {
            // Load source on toggle option
            // And inject
            // Mocking xtd source
            $scope.switchZonesFromXtdItem(listItem);
        };

        // // Apply search text if searchText GET param exist
        if ($location.search().selectZoneValue) {

            var selectZoneValue = $location.search().selectZoneValue;

            var item = _.findWhere($scope.xtdListOptions, {
                value: selectZoneValue
            });

            $scope.switchZonesFromXtdItem(item);
        }

    }.bind(this));
}]);
