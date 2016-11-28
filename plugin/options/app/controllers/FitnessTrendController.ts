class FitnessTrendController {

    static $inject = ['$rootScope', '$scope', 'ChromeStorageService'];

    constructor($rootScope: any, $scope: any, chromeStorageService: ChromeStorageService) {

        $scope.enableFitnessTabs = false;
        $scope.loadFitnessTrendTable = false;
        $scope.hasFitnessData = true;

        $scope.fitnessTrendGraphDataLoaded = (hasFitnessData: boolean) => {
            $scope.hasFitnessData = hasFitnessData;
            $scope.loadFitnessTrendTable = true;
        };

        // If a sync exists...
        if ($rootScope.lastSyncDate !== -1) {
            $scope.enableFitnessTabs = true;
        }

        /////////////// Checking if alpha feature is enabled ////////////////
        chromeStorageService.fetchUserSettings().then((userSettings: IUserSettings) => { // TODO Must be removed in future when fitness feature is stable
            $scope.enableAlphaFitnessTrend = userSettings.enableAlphaFitnessTrend;
        });

        $scope.onEnableAlphaFitnessTrend = () => { // TODO Must be removed in future when fitness feature is stable

            chromeStorageService.fetchUserSettings().then((userSettings: IUserSettings) => {
                return chromeStorageService.updateUserSetting('enableAlphaFitnessTrend', !userSettings.enableAlphaFitnessTrend); // Toggle enableAlphaFitnessTrend
            }).then(() => {
                return chromeStorageService.fetchUserSettings();
            }).then((userSettings: IUserSettings) => {
                console.log('ALPHA FITNESS FEATURE is now: ' + userSettings.enableAlphaFitnessTrend);
            });
        };
        /////////////// Checking if alpha feature is enabled ////////////////

    }
}
app.controller("FitnessTrendController", FitnessTrendController);
