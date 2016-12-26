class FitnessTrendController {

    static $inject = ['$rootScope', '$scope', 'ChromeStorageService'];

    constructor($rootScope: any, $scope: any) {

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
    }
}
app.controller("FitnessTrendController", FitnessTrendController);
