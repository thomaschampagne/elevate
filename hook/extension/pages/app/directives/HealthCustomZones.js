app.directive('healthCustomZones', function() {

    var linkFunction = function($scope, element, attrs) {};

    var controllerFunction = function($scope) {

        // $scope.$watch('hrZones', function(newHrZones, previousHrZones) {

        //     console.debug(previousHrZones);
        //     console.debug(newHrZones);

        //     // var diff = _.difference(newHrZones, previousHrZones);
        //     // var intersection = _.intersection(previousHrZones, newHrZones);

        //     // console.debug(diff);
        //     // console.debug(intersection);

        //     /*
        //      * hrZones json object has change
        //      */
        //     // => Make sure fromHrr equals toHrr
        //     // angular.forEach($scope.hrZones, function(hrZone, zoneId) {
        //     // console.debug(zoneId);
        //     // console.debug(hrZone);
        //     // });

        // }, true);


        $scope.onZoneChange = function(hrZoneId, previousHrZone, newHrZone) {
            // console.debug(hrZoneId);
            // console.debug(previousHrZone);
            // console.debug(newHrZone);

            var fieldHasChanged = $scope.whichFieldHasChanged(previousHrZone, newHrZone);

            if (_.isUndefined(fieldHasChanged)) {
                return;
            }

            if (hrZoneId === 0) { // If first zone

                $scope.handleToHrrChange(hrZoneId);

            } else if (hrZoneId < $scope.hrZones.length - 1) { // If middle zone

                if (fieldHasChanged === 'toHrr') {

                    $scope.handleToHrrChange(hrZoneId);

                } else if (fieldHasChanged === 'fromHrr') {

                    $scope.handleFromHrrChange(hrZoneId);
                }

            } else { // If last zone

                $scope.handleFromHrrChange(hrZoneId);

            }

        };

        /**
         * @return 'fromHrr' or 'toHrr'
         */
        $scope.whichFieldHasChanged = function(previousHrZone, newHrZone) {

            if (previousHrZone.fromHrr !== newHrZone.fromHrr) {
                return 'fromHrr';
            }

            if (previousHrZone.toHrr !== newHrZone.toHrr) {
                return 'toHrr';
            }
        };

        $scope.handleToHrrChange = function(hrZoneId) {
            $scope.hrZones[hrZoneId + 1].fromHrr = $scope.hrZones[hrZoneId].toHrr; // User has changed toHrr value of the zone
        };

        $scope.handleFromHrrChange = function(hrZoneId) {
            $scope.hrZones[hrZoneId - 1].toHrr = $scope.hrZones[hrZoneId].fromHrr; // User has changed fromHrr value of the zone
        };

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
