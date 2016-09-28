interface XtdData {
    name: string;
    value: string;
    units: string;
    step: number;
    min: number;
    max: number;
    hasConvertion?: boolean;
}

interface XtdZonesSettingsScope extends IScope {
    zones: {speed: Array<Zone>, pace: Array<Zone>, power: Array<Zone>, cyclingCadence: Array<Zone>, runningCadence: Array<Zone>, grade: Array<Zone>, elevation: Array<Zone>, ascent: Array<Zone>};
    xtdZones: Array<Zone>;
    xtdData: XtdData;
    switchZonesFromXtdItem: (xtdData: XtdData) => void;
    xtdListOptions: Array<XtdData>;
}

class XtdZonesSettingsController {

    static $inject = ['$scope', '$location', '$routeParams', 'ChromeStorageService'];

    constructor($scope: XtdZonesSettingsScope, $location: ILocationService, $routeParams: any, ChromeStorageService: ChromeStorageService) {

        // List of Xtended data to be customize
        $scope.xtdListOptions = [{
            name: 'Cycling Speed',
            value: 'speed',
            units: 'KPH',
            step: 0.1,
            min: 0,
            max: 9999,
            hasConvertion: true
        }, {
            name: 'Running Pace',
            value: 'pace',
            units: 'Seconds', // s/mi?!
            step: 1,
            min: 0,
            max: 9999,
            hasConvertion: true
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

        $scope.switchZonesFromXtdItem = (xtdData: XtdData) => {

            // Select cycling speed by default
            $scope.xtdData = xtdData;
            $scope.xtdZones = _.propertyOf($scope.zones)($scope.xtdData.value);

            $scope.$apply();
        };

        ChromeStorageService.fetchUserSettings((userSettingsSynced: UserSettings) => {

            $scope.zones = userSettingsSynced.zones;

            let zoneValue: string = $routeParams.zoneValue;

            let item: XtdData = _.findWhere($scope.xtdListOptions as Array<XtdData>, {
                value: zoneValue
            });

            $scope.switchZonesFromXtdItem(item);
        });

    }
}

app.controller("XtdZonesSettingsController", XtdZonesSettingsController);
