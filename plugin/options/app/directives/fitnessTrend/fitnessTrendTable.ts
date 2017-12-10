import { IWindowService } from "angular";
import * as _ from "lodash";
import { FitnessTrendController } from "../../controllers/FitnessTrendController";
import { IFitnessActivity, IFitnessActivityTable } from "../../services/FitnessDataService";

export class FitnessTrendTable {

    public static $inject: string[] = ["$scope", "$window"];

    constructor(public $scope: any, public $window: IWindowService) {

        // Init directives constants
        $scope.const = {};
        $scope.const.fitnessDataForTable = null;

        $scope.$on(FitnessTrendController.fitnessDataLoaded, (event: any, message: any) => {

            console.log("FitnessTrendTable: message " + FitnessTrendController.fitnessDataLoaded + " received");

            const fitnessDataForTable: IFitnessActivityTable[] = [];

            $scope.usePowerMeter = message.usePowerMeter;
            $scope.useSwimStressScore = message.useSwimStressScore;

            // Filter fitnessData: remove preview days
            const fitnessData = _.filter(message.fitnessData, {
                previewDay: false,
            });

            _.forEach(fitnessData, (fitnessObj: IFitnessActivity) => {

                const newFitnessObj: IFitnessActivityTable = _.clone(fitnessObj) as IFitnessActivityTable;

                if (newFitnessObj.activitiesName.length) {

                    let finalActivityName = "";
                    _.forEach(newFitnessObj.activitiesName, (name, index) => {
                        if (index !== 0) {
                            finalActivityName += " <strong>+</strong> ";
                        }
                        finalActivityName += name;
                    });

                    let finalTypeName = "";
                    _.forEach(newFitnessObj.type, (type, index) => {
                        if (index > 0) {
                            finalTypeName += " <strong>+</strong> ";
                        }
                        finalTypeName += type;
                    });

                    newFitnessObj.activitiesNameStr = finalActivityName;
                    newFitnessObj.type = [finalTypeName];
                    newFitnessObj.trimpScore = (_.isNumber(newFitnessObj.trimpScore)) ? parseInt(newFitnessObj.trimpScore.toFixed(0)) : -1;
                    newFitnessObj.powerStressScore = (_.isNumber(newFitnessObj.powerStressScore)) ? parseInt(newFitnessObj.powerStressScore.toFixed(0)) : -1;
                    newFitnessObj.swimStressScore = (_.isNumber(newFitnessObj.swimStressScore)) ? parseInt(newFitnessObj.swimStressScore.toFixed(0)) : -1;
                    newFitnessObj.finalStressScore = (_.isNumber(newFitnessObj.finalStressScore)) ? parseInt(newFitnessObj.finalStressScore.toFixed(0)) : -1;
                } else {
                    newFitnessObj.activitiesNameStr = "-";
                    newFitnessObj.type = ["-"];
                    newFitnessObj.trimpScore = -1;
                    newFitnessObj.powerStressScore = -1;
                    newFitnessObj.swimStressScore = -1;
                    newFitnessObj.finalStressScore = -1;
                }

                fitnessDataForTable.push(newFitnessObj);
            });

            $scope.const.fitnessDataForTable = fitnessDataForTable;

            $scope.refreshFitnessDataForTable();
        });

        $scope.limitOptions = [5, 10, 15, 25, 50, 100];

        $scope.options = {
            rowSelection: false,
            multiSelect: false,
            autoSelect: true,
            decapitate: false,
            largeEditDialog: false,
            boundaryLinks: true,
            limitSelect: true,
            pageSelect: true,
        };

        $scope.query = {
            filter: "",
            order: "-timestamp",
            limit: 10,
            page: 1,
        };

        $scope.filter = {
            options: {
                debounce: 500,
            },
        };

        /**
         * Keep page after searching for activities
         */
        $scope.$watch("query.filter", (newValue: any, oldValue: any) => {

            if (!oldValue) {
                $scope.bookmarkPage = $scope.query.page;
            }

            if (newValue !== oldValue) {
                $scope.query.page = 1;
            }

            if (!newValue) {
                $scope.query.page = $scope.bookmarkPage;
            }

            $scope.refreshFitnessDataForTable();
        });

        $scope.removeFilter = () => {
            $scope.filter.show = false;
            $scope.query.filter = "";
        };

        $scope.refreshFitnessDataForTable = () => {

            let filter: string = $scope.query.filter;
            filter = filter.replace(" ", ".*");
            filter = filter.trim();

            $scope.fitnessDataForTableFiltered = _.filter($scope.const.fitnessDataForTable, (item: any) => {
                return (item.activitiesName + item.type).match(new RegExp(filter, "ig"));
            });
        };

        $scope.openActivities = (fitnessObject: IFitnessActivityTable) => {
            _.forEach(fitnessObject.ids, (activityId: number) => {
                $window.open("https://www.strava.com/activities/" + activityId, "_blank");
            });
        };

        $scope.logPagination = (page: number, pageCount: number) => {

        };
    }

}

export let fitnessTrendTable = [() => {
    return {
        templateUrl: "directives/fitnessTrend/templates/fitnessTrendTable.html",
        controller: FitnessTrendTable,
    } as any;
}];
