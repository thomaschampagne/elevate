app.controller("XtdZonesSettingsController", ['$scope', '$location', 'ChromeStorageService', 'TranslationService', function($scope, $location, ChromeStorageService, TranslationService) {

    TranslationService.init(function () {

        $scope.xtdListOptions = [{
            name: 'Cycling Speed',
            transKey: 'cyc_speed',
            value: 'speed',
            units: 'KPH',
            step: 0.1,
            min: 0,
            max: 9999
        }, {
            name: 'Running Pace',
            transKey: 'run_pace',
            value: 'pace',
            units: 'Seconds', // s/mi?!
            step: 1,
            min: 0,
            max: 9999
        }, {
            name: 'Cycling Power',
            transKey: 'cyc_power',
            value: 'power',
            units: 'Watts',
            step: 1,
            min: 0,
            max: 9999
        }, {
            name: 'Cycling Cadence',
            transKey: 'cyc_cadence',
            value: 'cyclingCadence',
            units: 'RPM',
            step: 1,
            min: 0,
            max: 9999
        }, {
            name: 'Running Cadence',
            transKey: 'run_cadence',
            value: 'runningCadence',
            units: 'SPM',
            step: 0.1,
            min: 0,
            max: 9999
        }, {
            name: 'Grade',
            transKey: 'grade',
            value: 'grade',
            units: '%',
            step: 0.1,
            min: -9999,
            max: 9999
        }, {
            name: 'Elevation',
            transKey: 'elevation',
            value: 'elevation',
            units: 'm',
            step: 5,
            min: 0,
            max: 9999
        }, {
            name: 'Ascent speed',
            transKey: 'asc_speed',
            value: 'ascent',
            units: 'Vm/h',
            step: 5,
            min: 0,
            max: 9999
        }];

        for (var i = 0; i < $scope.xtdListOptions.length; i++) {
            var transPath = 'settings/zoneSettings/' + $scope.xtdListOptions[i].transKey;
            var transText = TranslationService.formatMessage(transPath);
            $scope.xtdListOptions[i].name = transText;
        }

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

    });
    // List of Xtended data to be customize
}]);
