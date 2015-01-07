app.directive('healthCustomZones', function() {

    var linkFunction = function($scope, element, attrs) {
        //console.warn($scope.maxHr);

        /*        $scope.userMaxHr = parseInt(attrs.usermaxhr);
                $scope.userRestHr = parseInt(attrs.userresthr);*/

    };

    var controllerFunction = function($scope) {

        //console.warn($scope.hrZones);
        // console.warn($scope.userRestHr);

        // $scope.$watch('hrZones', function(a) {
        //     console.warn(a);
        // });
        // console.warn($scope.hrZones);
        // //$scope.hrZones = {};
        // console.warn($scope.hrZones);


        $scope.debugHrZones = function() {
            console.debug($scope.hrZones);
        }

    };

    return {
        templateUrl: 'views/hrZones/healthCustomZonesTemplate.html',
        scope: {
            hrZones: "=",
            userMaxHr: "@userMaxHr",
            userRestHr: "@userRestHr"
        },
        controller: controllerFunction,
        link: linkFunction
    };
});
