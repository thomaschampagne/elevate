app.controller("HrrZonesSettingsController", ['$scope', 'ChromeStorageService', 'AvoidInputKeysService', function($scope, ChromeStorageService, AvoidInputKeysService) { // TODO rename to HRRZoneController...

    ChromeStorageService.fetchUserSettings(function(userSettingsSynced) {
        $scope.userMaxHr = parseInt(userSettingsSynced.userMaxHr);
        $scope.userRestHr = parseInt(userSettingsSynced.userRestHr);
        $scope.zones = userSettingsSynced.userHrrZones;
        $scope.$apply();
    });

    $scope.localStorageMustBeCleared = function() {
        ChromeStorageService.updateUserSetting('localStorageMustBeCleared', true, function() {
            console.log('localStorageMustBeCleared has been updated to ' + true);
        });
    };

    $scope.avoidInputKeyEdit = function(evt) {
        AvoidInputKeysService(evt);
    };

}]);
