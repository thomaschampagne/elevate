app.directive('xtdZone', ['AvoidInputKeysService', function(AvoidInputKeysService) {

    var controllerFunction = function($scope) {

        $scope.zoneId = parseInt($scope.zoneId);

        $scope.avoidInputKeyEdit = function(evt) {
            AvoidInputKeysService(evt);
        };

        $scope.$watch('xtdZone', function(newZone, oldZone) {
            // Notify parent scope when a zone has changed
            $scope.$parent.onZoneChange(parseInt($scope.zoneId), oldZone, newZone);
        }, true);


        $scope.removeZone = function($event) {
            $scope.$parent.removeZone($event, parseInt($scope.zoneId));
        };
    };

    return {

        templateUrl: 'directives/xtdZones/templates/xtdZone.html',
        scope: {
            zoneId: '@zoneId',
            xtdZone: '=',
            xtdDataSelected: "=",
            previousFrom: '@previousFrom',
            nextTo: '@nextTo',
            xtdZoneFirst: '@xtdZoneFirst',
            xtdZoneLast: '@xtdZoneLast'
        },
        controller: controllerFunction
    };
}]);
