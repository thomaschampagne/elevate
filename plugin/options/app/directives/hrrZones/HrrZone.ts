class HrrZone {

    static $inject: string[] = ['$scope','AvoidInputKeysService'];

    constructor(public $scope: any, public AvoidInputKeysService: IAvoidInputKeysService) {

        $scope.avoidInputKeyEdit = (evt: KeyboardEvent) => {
            AvoidInputKeysService.apply(evt);
        };

        $scope.$watch('hrrZone', (newHrZone: IZone, oldHrZone: IZone) => {
            $scope.$parent.onZoneChange(parseInt($scope.hrrZoneId), oldHrZone, newHrZone);  // Notify parent scope when a zone has changed
        }, true);

        $scope.removeZone = ($event: Event) => {
            $scope.$parent.removeHrZone($event, parseInt($scope.hrrZoneId));
        };

    }
}

app.directive('hrrZone', [() => {

    return {

        scope: {
            hrrZoneId: '@hrrZoneId',
            hrrZone: '=',
            previousFromHrr: '@previousFromHrr',
            nextToHrr: '@nextToHrr',
            hrrZoneFirst: '@hrrZoneFirst',
            hrrZoneLast: '@hrrZoneLast',
            userMaxHr: '@userMaxHr',
            userRestHr: '@userRestHr',
            step: '@zoneStep'
        },
        controller: HrrZone,
        templateUrl: 'directives/hrrZones/templates/hrrZone.html'
    };

}]);