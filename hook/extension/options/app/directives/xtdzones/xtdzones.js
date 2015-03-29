app.directive('xtdZones', ['Notifier', function(Notifier) {

    var maxHrZonesCount = 10;
    var minHrZonesCount = 3;

    var linkFunction = function($scope, element, attrs) {};

    var controllerFunction = function($scope) {

        console.warn($scope.zones);

        $scope.$watch('zones', function(newZones, oldHrZone) {

            // Save if zones are compliant and model has well changed (old and new zones are equals when the tab is loaded)
            if ($scope.areHrZonesCompliant() && (angular.toJson(newZones) !== angular.toJson(oldHrZone))) {
                // $scope.saveHrZones(); // Uncomment for saving...
            }

        }, true);

/*
        $scope.addHrZone = function() {

            if ($scope.zones.length >= maxHrZonesCount) {

                Notifier('Oups!', 'You can\'t add more than 10 heart rate zones...');

            } else {

                var oldLastZone = $scope.zones[$scope.zones.length - 1];

                // Computed middle value between oldLastZone.from and oldLastZone.to
                var betweenValue = parseInt(((oldLastZone.from + oldLastZone.to) / 2).toFixed(0));

                // Creating new Hr Zone
                var newLastHrZone = {
                    "from": betweenValue,
                    "to": oldLastZone.to
                };

                // Apply middle value computed to previous last zone (to)
                $scope.zones[$scope.zones.length - 1].to = betweenValue;

                // Add the new last zone
                $scope.zones.push(newLastHrZone);
            }

        };
*/
/*
        $scope.removeHrZone = function() {

            if ($scope.zones.length <= minHrZonesCount) {

                Notifier('Oups!', 'You can\'t remove more than 3 heart rate zones...');

            } else {
                var oldLastZone = $scope.zones[$scope.zones.length - 1];

                $scope.zones.pop();

                $scope.zones[$scope.zones.length - 1].to = oldLastZone.to;
            }
        };
*/
/*
        $scope.resetHrZone = function() {

            if (confirm("You are going to reset your custom heart rate zones to default factory value. Are you sure?")) {
                angular.copy(userSettings.userHrrZones, $scope.zones);
            }

        };
*/
/*
        $scope.saveHrZones = function() {

            setTimeout(function() {

                if (!_.isUndefined($scope.zones)) {

                    console.warn('Save is delayed');

                    
                    // ChromeStorageModule.updateUserSetting('testZones', angular.fromJson(angular.toJson($scope.zones)), function() {

                    //     console.log('userHrrZones has been updated to: ' + angular.toJson($scope.zones));

                    //     ChromeStorageModule.updateUserSetting('localStorageMustBeCleared', true, function() {
                    //         console.log('localStorageMustBeCleared has been updated to: ' + true);
                    //     });
                    // });
                }
            }, 250);
        };
*/
        $scope.areHrZonesCompliant = function() {
            
            if(!$scope.zones) {
                return false;
            }

            for (var i = 0; i < $scope.zones.length; i++) {

                if (i == 0) {
                    if ($scope.zones[i].to != $scope.zones[i + 1].from) {
                        return false;
                    }

                } else if (i < ($scope.zones.length - 1)) { // Middle

                    if ($scope.zones[i].to != $scope.zones[i + 1].from || $scope.zones[i].from != $scope.zones[i - 1].to) {
                        return false;
                    }

                } else { // Last
                    if ($scope.zones[i].from != $scope.zones[i - 1].to) {
                        return false;
                    }
                }
            }
            return true;
        };

        $scope.onZoneChange = function(zoneId, previousZone, newZone) {

            console.warn(zoneId);
            console.warn(previousZone);
            console.warn(newZone);

            var fieldHasChanged = $scope.whichFieldHasChanged(previousZone, newZone);

            if (_.isUndefined(fieldHasChanged)) {
                return;
            }

            if (zoneId === 0) { // If first zone

                $scope.handleToHrrChange(zoneId);

            } else if (zoneId < $scope.zones.length - 1) { // If middle zone

                if (fieldHasChanged === 'to') {

                    $scope.handleToHrrChange(zoneId);

                } else if (fieldHasChanged === 'from') {

                    $scope.handleFromHrrChange(zoneId);
                }

            } else { // If last zone
                $scope.handleFromHrrChange(zoneId);
            }

        };

        /**
         * @return 'from' or 'to'
         */
        $scope.whichFieldHasChanged = function(previousZone, newZone) {

            if (previousZone.from !== newZone.from) {
                return 'from';
            }

            if (previousZone.to !== newZone.to) {
                return 'to';
            }
        };

        $scope.handleToHrrChange = function(zoneId) {
            $scope.zones[zoneId + 1].from = $scope.zones[zoneId].to; // User has changed to value of the zone
        };

        $scope.handleFromHrrChange = function(zoneId) {
            $scope.zones[zoneId - 1].to = $scope.zones[zoneId].from; // User has changed from value of the zone
        };

    };

    return {
        templateUrl: 'directives/xtdzones/templates/xtdzones.html',
        scope: {
            zones: "="
        },
        controller: controllerFunction,
        link: linkFunction
    };
}]);
