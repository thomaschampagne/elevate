class FitnessTrendTable {

    static $inject: string[] = ['$scope', 'FitnessDataService', '$window'];

    constructor(public $scope: any, public fitnessDataService: IFitnessDataService, public $window: IWindowService) {

        // Init directives constants
        $scope.const = {};
        $scope.const.fitnessDataForTable = null;

        fitnessDataService.getFitnessData().then((fitnessData) => {

            let fitnessDataForTable: Array<IFitnessTrimpObjectTable> = [];

            // Filter fitnessData: remove preview days
            fitnessData = _.where(fitnessData, {
                previewDay: false
            });

            _.each(fitnessData, (fitnessObj: IFitnessTrimpObject) => {

                let newFitnessObj: IFitnessTrimpObjectTable = <IFitnessTrimpObjectTable> _.clone(fitnessObj);

                if (newFitnessObj.activitiesName.length) {

                    let finalActivityName = '';
                    _.each(newFitnessObj.activitiesName, (name, index) => {
                        if (index !== 0) {
                            finalActivityName += ' <strong>+</strong> ';
                        }
                        finalActivityName += name;
                    });

                    let finalTypeName = '';
                    _.each(newFitnessObj.type, (type, index) => {
                        if (index > 0) {
                            finalTypeName += ' <strong>+</strong> ';
                        }
                        finalTypeName += type;
                    });

                    newFitnessObj.activitiesNameStr = finalActivityName;
                    newFitnessObj.type = [finalTypeName];
                } else {
                    newFitnessObj.activitiesNameStr = '-';
                    newFitnessObj.type = ['-'];
                    newFitnessObj.trimp = -1;
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
            pageSelect: true
        };

        $scope.query = {
            filter: '',
            order: '-timestamp',
            limit: 10,
            page: 1
        };

        $scope.filter = {
            options: {
                debounce: 500
            }
        };

        /**
         * Keep page after searching for activities
         */
        $scope.$watch('query.filter', (newValue: any, oldValue: any) => {

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
            $scope.query.filter = '';
        };


        $scope.refreshFitnessDataForTable = () => {

            let filter = $scope.query.filter;
            filter = filter.replace(' ', '.*');
            filter = filter.trim();

            $scope.fitnessDataForTableFiltered = _.filter($scope.const.fitnessDataForTable, (item: any) => {
                return (item.activitiesName + item.type).match(new RegExp(filter, 'ig'));
            });
        };

        $scope.openActivities = (fitnessObject: IFitnessTrimpObjectTable) => {
            _.each(fitnessObject.ids, (activityId: number) => {
                $window.open('https://www.strava.com/activities/' + activityId, '_blank');
            });
        }

        $scope.logPagination = (page: number, pageCount:number) => {
            
        };
    }

}

app.directive('fitnessTrendTable', [() => {
    return {
        templateUrl: 'directives/fitnessTrend/templates/fitnessTrendTable.html',
        controller: FitnessTrendTable
    };
}]);

