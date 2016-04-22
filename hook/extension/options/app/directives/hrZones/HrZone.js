app.directive('hrZone', ['AvoidInputKeysService', function(AvoidInputKeysService) {

    var linkFunction = function($scope, element, attrs) {
        $scope.printableZoneId = parseInt($scope.hrZoneId) + 1;
    };

    var controllerFunction = function($scope) {

        $scope.avoidInputKeyEdit = function(evt) {
            AvoidInputKeysService(evt);
        };

        $scope.$watch('hrZone', function(newHrZone, oldHrZone) {
            // Notify parent scope when a zone has changed
            $scope.$parent.onZoneChange(parseInt($scope.hrZoneId), oldHrZone, newHrZone);

        }, true);
    };

    return {

        templateUrl: 'directives/hrZones/templates/hrZone.html',
        scope: {
            hrZoneId: '@hrZoneId',
            hrZone: '=',
            previousFromHrr: '@previousFromHrr',
            nextToHrr: '@nextToHrr',
            hrZoneFirst: '@hrZoneFirst',
            hrZoneLast: '@hrZoneLast',
            userMaxHr: '@userMaxHr',
            userRestHr: '@userRestHr'
        },
        controller: controllerFunction,
        link: linkFunction
    };
}]);
