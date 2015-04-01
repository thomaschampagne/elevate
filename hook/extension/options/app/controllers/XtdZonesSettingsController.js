// var devData = '[{"from":0,"to":2},{"from":2,"to":5},{"from":5,"to":27},{"from":27,"to":30},{"from":30,"to":35},{"from":35,"to":38},{"from":38,"to":41}]';

app.controller("XtdZonesSettingsController", function($scope) {
    
    // List of Xtended data to be customize
    $scope.xtdListOptions = [{
        name: 'Cyling Speed',
        value: 'speed',
        units: 'kph',
        step: 0.01,
        min: 0,
        max: 9999
    }, {
        name: 'Running Pace',
        value: 'pace',
        units: 's', // s/mi?!
        step: 1,
        min: 0,
        max: 9999
    }, {
        name: 'Cyling Power',
        value: 'power',
        units: 'W',
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
        step: 0.01,
        min: 0,
        max: 9999
    }, {
        name: 'Grade',
        value: 'grade',
        units: '%',
        step: 0.1,
        min: -9999,
        max: 9999
    }];

    ChromeStorageModule.fetchUserSettings(function(userSettingsSynced) {

        $scope.zones = userSettingsSynced.zones;
        // Select cycling speed by default
        $scope.switchZonesFromXtdItem(_.first($scope.xtdListOptions));

    }.bind(this));

    $scope.switchZonesFromXtdItem = function(xtdData) {

        // Select cycling speed by default
        $scope.xtdData = xtdData;
        $scope.xtdZones = $scope.zones[xtdData.value];
    };

    $scope.toggleSelectOption = function(listItem) {
        // Load source on toggle option
        // And inject
        // Mocking xtd source
        console.warn($scope.xtdListOptions);
        $scope.switchZonesFromXtdItem(listItem);
    };
});
