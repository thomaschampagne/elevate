app.directive('healthCustomZones', ['Notifier', function(Notifier) {

    var maxHrZonesCount = 10;
    var minHrZonesCount = 3;

    var linkFunction = function($scope, element, attrs) {};

    var controllerFunction = function($scope) {

        $scope.addHrZone = function() {

            if ($scope.hrZones.length >= maxHrZonesCount) {
                Notifier('Oups!', 'You can\'t add more than 10 heart rate zones...');
                return;
            }

            var oldLastHrZone = $scope.hrZones[$scope.hrZones.length - 1];

            // Computed middle value between oldLastHrZone.fromHrr and oldLastHrZone.toHrr
            var betweenHrrValue = parseInt(((oldLastHrZone.fromHrr + oldLastHrZone.toHrr) / 2).toFixed(0));

            // Creating new Hr Zone
            var newLastHrZone = {
                "fromHrr": betweenHrrValue,
                "toHrr": oldLastHrZone.toHrr
            };

            // Apply middle value computed to previous last zone (toHrr)
            $scope.hrZones[$scope.hrZones.length - 1].toHrr = betweenHrrValue;

            // Add the new last zone
            $scope.hrZones.push(newLastHrZone);

        };

        $scope.removeHrZone = function() {

            if ($scope.hrZones.length <= minHrZonesCount) {
                Notifier('Oups!', 'You can\'t remove more than 3 heart rate zones...');
                return;
            }

            var oldLastHrZone = $scope.hrZones[$scope.hrZones.length - 1];

            $scope.hrZones.pop();

            $scope.hrZones[$scope.hrZones.length - 1].toHrr = oldLastHrZone.toHrr;
        };

        $scope.resetHrZone = function() {

            // TODO resetHrZone
            Notifier('TODO', '$scope.resetHrZone() to implement...');

        };


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
}]);
