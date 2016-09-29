class HrrZonesSettingsController {

    static $inject = ['$scope', 'ChromeStorageService', 'AvoidInputKeysService'];

    constructor($scope: any, ChromeStorageService: IChromeStorageService, AvoidInputKeysService: IAvoidInputKeysService) {
        ChromeStorageService.fetchUserSettings((userSettingsSynced: IUserSettings) => {
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
