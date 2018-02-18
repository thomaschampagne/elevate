import { IScope } from "angular";
import * as _ from "lodash";
import { ZoneModel } from "../../../common/scripts/models/ActivityData";
import { UserSettingsModel } from "../../../common/scripts/models/UserSettings";
import { ChromeStorageService } from "../services/ChromeStorageService";

export interface IXtdData {
    name: string;
    value: string;
    units: string;
    step: number;
    min: number;
    max: number;
    hasConversion?: boolean;
}

export interface IXtdZonesSettingsScope extends IScope {
	zones: { speed: ZoneModel[], pace: ZoneModel[], power: ZoneModel[], cyclingCadence: ZoneModel[], runningCadence: ZoneModel[], grade: ZoneModel[], elevation: ZoneModel[], ascent: ZoneModel[] };
	xtdZones: ZoneModel[];
    xtdData: IXtdData;
    switchZonesFromXtdItem: (xtdData: IXtdData) => void;
    xtdListOptions: IXtdData[];
}

export class XtdZonesSettingsController {

    public static $inject = ["$scope", "$routeParams", "ChromeStorageService"];

    constructor($scope: IXtdZonesSettingsScope, $routeParams: any, chromeStorageService: ChromeStorageService) {

        // List of Xtended data to be customize
        $scope.xtdListOptions = [
            {
                name: "Cycling Speed",
                value: "speed",
                units: "KPH",
                step: 0.1,
                min: 0,
                max: 9999,
                hasConversion: true,
            }, {
                name: "Running Pace",
                value: "pace",
                units: "Seconds", // s/mi?!
                step: 1,
                min: 0,
                max: 9999,
                hasConversion: true,
            }, {
                name: "Heart Rate",
                value: "heartRate",
                units: "BPM",
                step: 1,
                min: 0,
                max: 9999,
            }, {
                name: "Cycling Power",
                value: "power",
                units: "Watts",
                step: 1,
                min: 0,
                max: 9999,
            }, {
                name: "Running Power",
                value: "runningPower",
                units: "Watts",
                step: 1,
                min: 0,
                max: 9999,
            }, {
                name: "Cycling Cadence",
                value: "cyclingCadence",
                units: "RPM",
                step: 1,
                min: 0,
                max: 9999,
            }, {
                name: "Running Cadence",
                value: "runningCadence",
                units: "SPM",
                step: 0.1,
                min: 0,
                max: 9999,
            }, {
                name: "Grade",
                value: "grade",
                units: "%",
                step: 0.1,
                min: -9999,
                max: 9999,
            }, {
                name: "Elevation",
                value: "elevation",
                units: "m",
                step: 5,
                min: 0,
                max: 9999,
            }, {
                name: "Ascent speed",
                value: "ascent",
                units: "Vm/h",
                step: 5,
                min: 0,
                max: 9999,
            }];

        $scope.switchZonesFromXtdItem = (xtdData: IXtdData) => {

            // Select cycling speed by default
            $scope.xtdData = xtdData;
            $scope.xtdZones = _.propertyOf($scope.zones)($scope.xtdData.value);

            $scope.$apply();
        };

		chromeStorageService.fetchUserSettings((userSettingsSynced: UserSettingsModel) => {

            $scope.zones = userSettingsSynced.zones;

            const zoneValue: string = $routeParams.zoneValue;

            const item: IXtdData = _.find($scope.xtdListOptions as IXtdData[], {
                value: zoneValue,
            });

            $scope.switchZonesFromXtdItem(item);
        });

    }
}
