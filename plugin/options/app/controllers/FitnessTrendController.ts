import {IControllerConstructor, Injectable} from "angular";
import * as _ from "lodash";
import {ChromeStorageService} from "../services/ChromeStorageService";
import {FitnessDataService, IFitnessActivity} from "../services/FitnessDataService";

import {IUserSettings} from "../../../common/scripts/interfaces/IUserSettings";

export class FitnessTrendController {

    public static $inject = ["$rootScope", "$scope", "ChromeStorageService", "FitnessDataService"];

    public static fitnessDataLoaded: string = "fitnessDataLoaded";

    constructor($rootScope: any, $scope: any, public chromeStorageService: ChromeStorageService, public fitnessDataService: FitnessDataService) {

        $scope.enableFitnessTabs = false;
        $scope.hasFitnessData = true;

        $scope.loadFitnessData = () => {

            let userFTP: number = null;
            let usePowerMeter: boolean = false;
            let userSwimFTP: number = null;
            let useSwimStressScore: boolean = false;

            // Load user FTP and fitness data
            chromeStorageService.fetchUserSettings().then((userSettings: IUserSettings) => {

                userFTP = userSettings.userFTP;
                userSwimFTP = userSettings.userSwimFTP;

                // Check usePowerMeter stored cfg
                usePowerMeter = (!_.isEmpty(localStorage.getItem("usePowerMeter")) && localStorage.getItem("usePowerMeter") === "1" && _.isNumber(userFTP));

                // Check useSwimStressScore stored cfg
                useSwimStressScore = (!_.isEmpty(localStorage.getItem("useSwimStressScore")) && localStorage.getItem("useSwimStressScore") === "1" && _.isNumber(userSwimFTP));

                return fitnessDataService.getFitnessData(usePowerMeter, userFTP, useSwimStressScore, userSwimFTP);

            }).then((fitnessData: IFitnessActivity[]) => {

                $scope.hasFitnessData = !_.isEmpty(fitnessData);

                // Broadcast to graph & table
                $rootScope.$broadcast(FitnessTrendController.fitnessDataLoaded, {
                    fitnessData,
                    usePowerMeter,
                    userFTP,
                    useSwimStressScore,
                    userSwimFTP,
                });
            });
        };

        setTimeout(() => {
            $scope.loadFitnessData(); // Exec !
        });

        // If a sync exists...
        if ($rootScope.lastSyncDate !== -1) {
            $scope.enableFitnessTabs = true;
        }
    }
}
