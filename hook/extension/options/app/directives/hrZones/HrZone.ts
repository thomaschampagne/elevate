class HrZone {

    static $inject: string[] = ['$scope','AvoidInputKeysService'];

    constructor(public $scope: any, public AvoidInputKeysService: AvoidInputKeysService) {

        $scope.avoidInputKeyEdit = (evt: KeyboardEvent) => {
            AvoidInputKeysService.apply(evt);
        };

        $scope.$watch('hrZone', (newHrZone: Zone, oldHrZone: Zone) => {
            $scope.$parent.onZoneChange(parseInt($scope.hrZoneId), oldHrZone, newHrZone);  // Notify parent scope when a zone has changed
        }, true);

        $scope.removeZone = ($event: Event) => {
            $scope.$parent.removeHrZone($event, parseInt($scope.hrZoneId));
        };

    }
}

app.directive('hrZone', [() => {

    return {

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
        controller: HrZone,
        templateUrl: 'directives/hrZones/templates/hrZone.html'
    };

}]);