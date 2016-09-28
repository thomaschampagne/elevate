class HrrZonesSettingsController {

    static $inject = ['$scope', 'ChromeStorageService', 'AvoidInputKeysService'];

    constructor($scope: any, ChromeStorageService: ChromeStorageService, AvoidInputKeysService: AvoidInputKeysService) {
        ChromeStorageService.fetchUserSettings((userSettingsSynced: UserSettings) => {
            $scope.userMaxHr = userSettingsSynced.userMaxHr;
            $scope.userRestHr = userSettingsSynced.userRestHr;
            $scope.zones = userSettingsSynced.userHrrZones;
            $scope.$apply();
        });

        $scope.localStorageMustBeCleared = () => {
            ChromeStorageService.updateUserSetting('localStorageMustBeCleared', true, () => {
                console.log('localStorageMustBeCleared has been updated to ' + true);
            });
        };

        $scope.avoidInputKeyEdit = (keyboardEvent: KeyboardEvent) => {
            AvoidInputKeysService.apply(keyboardEvent);
        };
    }
}

app.controller("HrrZonesSettingsController", HrrZonesSettingsController);
