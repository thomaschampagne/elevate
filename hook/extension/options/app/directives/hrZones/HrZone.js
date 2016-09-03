app.directive('hrZone', ['AvoidInputKeysService', function(AvoidInputKeysService) {

    var controllerFunction = function($scope) {

        $scope.avoidInputKeyEdit = function(evt) {
            AvoidInputKeysService(evt);
        };

        $scope.$watch('hrZone', function(newHrZone, oldHrZone) {
            // Notify parent scope when a zone has changed
            $scope.$parent.onZoneChange(parseInt($scope.hrZoneId), oldHrZone, newHrZone);

        }, true);

        $scope.removeZone = function($event) {
            $scope.$parent.removeHrZone($event, parseInt($scope.hrZoneId));
        };
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
            userRestHr: '@userRestHr',
            step: '@zoneStep'
        },
        controller: controllerFunction
    };
}]);
