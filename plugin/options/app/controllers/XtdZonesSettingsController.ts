interface IXtdData {
    name: string;
    value: string;
    units: string;
    step: number;
    min: number;
    max: number;
    hasConvertion?: boolean;
}

interface IXtdZonesSettingsScope extends IScope {
    zones: {speed: Array<IZone>, pace: Array<IZone>, power: Array<IZone>, cyclingCadence: Array<IZone>, runningCadence: Array<IZone>, grade: Array<IZone>, elevation: Array<IZone>, ascent: Array<IZone>};
    xtdZones: Array<IZone>;
    xtdData: IXtdData;
    switchZonesFromXtdItem: (xtdData: IXtdData) => void;
    xtdListOptions: Array<IXtdData>;
}

class XtdZonesSettingsController {

    static $inject = ['$scope', '$location', '$routeParams', 'ChromeStorageService'];

    constructor($scope: IXtdZonesSettingsScope, $location: ILocationService, $routeParams: any, chromeStorageService: ChromeStorageService) {

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
            name: 'Running Power',
            value: 'runningPower',
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

        $scope.switchZonesFromXtdItem = (xtdData: IXtdData) => {

            // Select cycling speed by default
            $scope.xtdData = xtdData;
            $scope.xtdZones = _.propertyOf($scope.zones)($scope.xtdData.value);

            $scope.$apply();
        };

        chromeStorageService.fetchUserSettings((userSettingsSynced: IUserSettings) => {

            $scope.zones = userSettingsSynced.zones;

            let zoneValue: string = $routeParams.zoneValue;

            let item: IXtdData = _.findWhere($scope.xtdListOptions as Array<IXtdData>, {
                value: zoneValue
            });

            $scope.switchZonesFromXtdItem(item);
        });

    }
}

app.controller("XtdZonesSettingsController", XtdZonesSettingsController);
