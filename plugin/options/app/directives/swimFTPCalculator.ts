class SwimFTPCalculator {

    public static $inject: string[] = ['$scope'];

    constructor(public $scope: any) {

    }
}

app.directive('swimFtpCalculator', [() => {

    return {
        controller: SwimFTPCalculator,
        templateUrl: 'directives/templates/swimFTPCalculator.html'
    };
}]);