app.directive('xtdzone', ['AvoidInputKeys', function(avoidInputKeys) {

    var linkFunction = function($scope, element, attrs) {
        $scope.printableZoneId = parseInt($scope.zoneId) + 1;
    };

    var controllerFunction = function($scope) {

        $scope.avoidInputKeyEdit = function(evt) {
            avoidInputKeys(evt);
        };

        $scope.$watch('xtdzone', function(newZone, oldZone) {
            // Notify parent scope when a zone has changed
            $scope.$parent.onZoneChange(parseInt($scope.zoneId), oldZone, newZone);

        }, true);
    };

    return {

        templateUrl: 'directives/xtdzones/templates/xtdzone.html',
        scope: {
            zoneId: '@zoneId',
            hrZone: '=',
            previousFrom: '@previousFrom',
            nextTo: '@nextTo',
            zoneFirst: '@zoneFirst',
            zoneLast: '@zoneLast'
        },
        controller: controllerFunction,
        link: linkFunction
    };
}]);
