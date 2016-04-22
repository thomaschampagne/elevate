app.directive('xtdZones', ['NotifierService', 'ChromeStorageService', function(NotifierService, ChromeStorageService) {

    var maxZonesCount = 20;
    var minZonesCount = 3;

    var linkFunction = function($scope, element, attrs) {};

    var controllerFunction = function($scope) {

        $scope.addZone = function() {

            if ($scope.xtdZones.length >= maxZonesCount) {

                NotifierService('Oups!', 'You can\'t add more than ' + maxZonesCount + ' xtdZones...');

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

                NotifierService('Oups!', 'You can\'t remove more than ' + minZonesCount + ' xtdZones...');

            } else {
                var oldLastZone = $scope.xtdZones[$scope.xtdZones.length - 1];

                $scope.xtdZones.pop();

                $scope.xtdZones[$scope.xtdZones.length - 1].to = oldLastZone.to;
            }
        };


        $scope.resetZone = function() {

            if (confirm("You are going to reset your custom heart rate xtdZones to default factory value. Are you sure?")) {
                angular.copy(userSettings.zones[$scope.xtdDataSelected.value], $scope.xtdZones);
                $scope.saveZones();
            }

        };

        $scope.saveZones = function() {
            if (!$scope.areZonesCompliant($scope.xtdZones)) {
                console.error('Zones are not compliant');
                return;
            }

            if (!_.isUndefined($scope.xtdZones)) {

                ChromeStorageService.fetchUserSettings(function(userSettingsSynced) {
                    // Update zones with new one
                    var zones = userSettingsSynced.zones;
                    zones[$scope.xtdDataSelected.value] = angular.fromJson(angular.toJson($scope.xtdZones));

                    chrome.storage.sync.set(userSettingsSynced, function() {
                        ChromeStorageService.updateUserSetting('localStorageMustBeCleared', true, function() {
                            console.log('localStorageMustBeCleared has been updated to: ' + true);
                        });
                        alert($scope.xtdDataSelected.name + ' zone saved');
                    });
                }.bind(this));
            }
        };

        $scope.export = function() {
            var exportData = angular.toJson($scope.xtdZones); //.replace(/"/g, '');
            prompt("Exporting " + $scope.xtdDataSelected.name + " zones:\r\nCopy data inside field", exportData);
        };

        $scope.import = function() {

            var importData = prompt("Importing " + $scope.xtdDataSelected.name + " zones\r\nCopy and paste zones. should be like:\r\n[{ \"from\": a, \"to\": b }, { \"from\": b, \"to\": c }, { \"from\": c, 'to': d }] ", '');

            if (importData) {

                try {

                    var jsonImportData = angular.fromJson(importData);

                    if ($scope.areZonesCompliant(jsonImportData)) {

                        $scope.xtdZones = jsonImportData;
                        $scope.saveZones();

                    } else {
                        throw new error('not compliant');
                    }

                } catch (e) {
                    alert($scope.xtdDataSelected.name + ' zones data is not well formated or zones are upper than ' + maxZonesCount);
                    return;
                }

            }
        };

        $scope.areZonesCompliant = function(zones) {

            if (!zones) {
                return false;
            }

            if (zones.length > maxZonesCount) {
                return false;
            }

            for (var i = 0; i < zones.length; i++) {

                if (i === 0) {
                    if (zones[i].to != zones[i + 1].from) {
                        return false;
                    }

                } else if (i < (zones.length - 1)) { // Middle

                    if (zones[i].to != zones[i + 1].from || zones[i].from != zones[i - 1].to) {
                        return false;
                    }

                } else { // Last
                    if (zones[i].from != zones[i - 1].to) {
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
