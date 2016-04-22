app.directive('xtdZone', ['AvoidInputKeysService', function(AvoidInputKeysService) {

    var linkFunction = function($scope, element, attrs) {
        $scope.printableZoneId = parseInt($scope.zoneId) + 1;
    };

    var controllerFunction = function($scope) {

        $scope.avoidInputKeyEdit = function(evt) {
            AvoidInputKeysService(evt);
        };

        $scope.$watch('xtdZone', function(newZone, oldZone) {
            // Notify parent scope when a zone has changed
            $scope.$parent.onZoneChange(parseInt($scope.zoneId), oldZone, newZone);
        }, true);
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
        controller: controllerFunction,
        link: linkFunction
    };
}]);
