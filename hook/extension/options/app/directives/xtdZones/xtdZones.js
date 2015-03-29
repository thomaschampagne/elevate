app.directive('xtdZones', ['Notifier', function(Notifier) {

    var maxZonesCount = 10;
    var minZonesCount = 3;

    var linkFunction = function($scope, element, attrs) {};

    var controllerFunction = function($scope) {

        // $scope.$watch('xtdZones', function(newZones, oldZone) {

        //     console.debug($scope.xtdDataSelected);

        //     // Save if xtdZones are compliant and model has well changed (old and new xtdZones are equals when the tab is loaded)
        //     if ($scope.areZonesCompliant() && (angular.toJson(newZones) !== angular.toJson(oldZone))) {
        //         $scope.saveZones(); // Uncomment for saving...
        //     }

        // }, true);


        $scope.addZone = function() {

            if ($scope.xtdZones.length >= maxZonesCount) {

                Notifier('Oups!', 'You can\'t add more than ' + maxZonesCount + ' xtdZones...');

            } else {

                var oldLastZone = $scope.xtdZones[$scope.xtdZones.length - 1];

                // Computed middle value between oldLastZone.from and oldLastZone.to
                var betweenValue = parseInt(((oldLastZone.from + oldLastZone.to) / 2).toFixed(0));

                // Creating new Zone
                var newLastZone = {
                    "from": betweenValue,
                    "to": oldLastZone.to
                };

                // Apply middle value computed to previous last zone (to)
                $scope.xtdZones[$scope.xtdZones.length - 1].to = betweenValue;

                // Add the new last zone
                $scope.xtdZones.push(newLastZone);
            }

        };


        $scope.removeZone = function() {

            if ($scope.xtdZones.length <= minZonesCount) {

                Notifier('Oups!', 'You can\'t remove more than ' + minZonesCount + ' xtdZones...');

            } else {
                var oldLastZone = $scope.xtdZones[$scope.xtdZones.length - 1];

                $scope.xtdZones.pop();

                $scope.xtdZones[$scope.xtdZones.length - 1].to = oldLastZone.to;
            }
        };


        $scope.resetZone = function() {

            if (confirm("You are going to reset your custom heart rate xtdZones to default factory value. Are you sure?")) {
                //angular.copy(userSettings.userHrrZones, $scope.xtdZones);
                console.error('to be done...');
            }

        };

        $scope.saveZones = function() {
            if (!$scope.areZonesCompliant()) {
                console.error('Zones are not compliant');
                return;
            }

            if (!_.isUndefined($scope.xtdZones)) {

                /*
                ChromeStorageModule.updateUserSetting('???', angular.fromJson(angular.toJson($scope.xtdZones)), function() {

                    console.log('userHrrZones has been updated to: ' + angular.toJson($scope.xtdZones));

                    ChromeStorageModule.updateUserSetting('localStorageMustBeCleared', true, function() {
                        console.log('localStorageMustBeCleared has been updated to: ' + true);
                    });
                });
                */
            }
        };


        /*
                $scope.saveZones = function() {

                    setTimeout(function() {

                        if (!_.isUndefined($scope.xtdZones)) {

                            // console.warn('Save is delayed');
                            // console.warn($scope.xtdZones);


                            // ChromeStorageModule.updateUserSetting('testZones', angular.fromJson(angular.toJson($scope.xtdZones)), function() {

                            //     console.log('userHrrZones has been updated to: ' + angular.toJson($scope.xtdZones));

                            //     ChromeStorageModule.updateUserSetting('localStorageMustBeCleared', true, function() {
                            //         console.log('localStorageMustBeCleared has been updated to: ' + true);
                            //     });
                            // });
                        }
                    }, 250);
                };
                */

        $scope.areZonesCompliant = function() {

            if (!$scope.xtdZones) {
                return false;
            }

            for (var i = 0; i < $scope.xtdZones.length; i++) {

                if (i == 0) {
                    if ($scope.xtdZones[i].to != $scope.xtdZones[i + 1].from) {
                        return false;
                    }

                } else if (i < ($scope.xtdZones.length - 1)) { // Middle

                    if ($scope.xtdZones[i].to != $scope.xtdZones[i + 1].from || $scope.xtdZones[i].from != $scope.xtdZones[i - 1].to) {
                        return false;
                    }

                } else { // Last
                    if ($scope.xtdZones[i].from != $scope.xtdZones[i - 1].to) {
                        return false;
                    }
                }
            }
            return true;
        };

        $scope.onZoneChange = function(zoneId, previousZone, newZone) {



            var fieldHasChanged = $scope.whichFieldHasChanged(previousZone, newZone);

            if (_.isUndefined(fieldHasChanged)) {
                return;
            }

            if (zoneId === 0) { // If first zone

                $scope.handleToChange(zoneId);

            } else if (zoneId < $scope.xtdZones.length - 1) { // If middle zone

                if (fieldHasChanged === 'to') {

                    $scope.handleToChange(zoneId);

                } else if (fieldHasChanged === 'from') {

                    $scope.handleFromChange(zoneId);
                }

            } else { // If last zone
                $scope.handleFromChange(zoneId);
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

        $scope.handleToChange = function(zoneId) {
            $scope.xtdZones[zoneId + 1].from = $scope.xtdZones[zoneId].to; // User has changed to value of the zone
        };

        $scope.handleFromChange = function(zoneId) {
            $scope.xtdZones[zoneId - 1].to = $scope.xtdZones[zoneId].from; // User has changed from value of the zone
        };

    };

    return {
        templateUrl: 'directives/xtdZones/templates/xtdZones.html',
        scope: {
            xtdZones: "=",
            xtdDataSelected: "="
        },
        controller: controllerFunction,
        link: linkFunction
    };
}]);
