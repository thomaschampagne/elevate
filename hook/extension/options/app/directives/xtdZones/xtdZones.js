app.directive('xtdZones', ['ChromeStorageService', '$mdDialog', '$location', '$anchorScroll', function(ChromeStorageService, $mdDialog, $location, $anchorScroll) {

    var maxZonesCount = 50;
    var minZonesCount = 3;

    var linkFunction = function($scope, element, attrs) {};

    var controllerFunction = function($scope) {

        $scope.addZone = function($event) {

            if ($scope.xtdZones.length >= maxZonesCount) {

                $mdDialog.show(
                    $mdDialog.alert()
                    .clickOutsideToClose(true)
                    .title('Oups')
                    .textContent('You can\'t add more than ' + maxZonesCount + ' zones...')
                    .ok('Got it!')
                    .targetEvent($event)
                );

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

                $scope.scrollToBottom();

            }
        };

        $scope.removeZone = function($event, zoneId) {

            if ($scope.xtdZones.length <= minZonesCount) {

                $mdDialog.show(
                    $mdDialog.alert()
                    .clickOutsideToClose(true)
                    .title('Oups')
                    .textContent('You can\'t remove more than ' + minZonesCount + ' zones...')
                    .ok('Got it!')
                    .targetEvent($event)
                );

            } else {

                if (zoneId === 0) {

                    // First zone...
                    // just remove it...
                    $scope.xtdZones.splice(zoneId, 1);

                } else if (zoneId && zoneId !== $scope.xtdZones.length - 1) {

                    // Delete middle zone id here...

                    // Update next zone
                    $scope.xtdZones[zoneId + 1].from = $scope.xtdZones[zoneId - 1].to;

                    // Remove zone
                    $scope.xtdZones.splice(zoneId, 1);

                } else {

                    // Delete last zone
                    var oldLastZone = $scope.xtdZones[$scope.xtdZones.length - 1];
                    $scope.xtdZones.pop();
                    $scope.xtdZones[$scope.xtdZones.length - 1].to = oldLastZone.to;
                    $scope.scrollToBottom();
                }

            }
        };

        $scope.resetZone = function($event) {

            var confirm = $mdDialog.confirm()
                .title('Reset zones')
                .textContent('You are going to reset ' + $scope.xtdDataSelected.name + ' zones to default factory values. Are you sure?')
                .targetEvent($event)
                .ok('Yes. Reset')
                .cancel('cancel');
            $mdDialog.show(confirm).then(function() {
                angular.copy(userSettings.zones[$scope.xtdDataSelected.value], $scope.xtdZones);
                $scope.saveZones();
            });
        };

        $scope.saveZones = function($event) {
            if (!$scope.areZonesCompliant($scope.xtdZones)) {
                alert('Zones are not compliant');
                return;
            }

            if (!_.isUndefined($scope.xtdZones)) {

                ChromeStorageService.fetchUserSettings(function(userSettingsSynced) {
                    // Update zones with new one
                    var zones = userSettingsSynced.zones;
                    zones[$scope.xtdDataSelected.value] = angular.fromJson(angular.toJson($scope.xtdZones));

                    chrome.storage.sync.set(userSettingsSynced, function() {

                        $mdDialog.show(
                            $mdDialog.alert()
                            .clickOutsideToClose(true)
                            .title('Saved !')
                            .textContent('Your ' + $scope.xtdZones.length + ' "' + $scope.xtdDataSelected.name + ' zones" have been saved.')
                            .ok('Got it!')
                            .openFrom('body')
                            .closeTo('body')
                            .targetEvent($event)
                        );

                        ChromeStorageService.updateUserSetting('localStorageMustBeCleared', true, function() {
                            console.log('localStorageMustBeCleared has been updated to: ' + true);
                        });
                    });
                }.bind(this));
            }
        };

        $scope.setupStep = function($event) {

            $mdDialog.show({
                    controller: function DialogController($scope, $mdDialog, localStep, localZoneType) {

                        $scope.step = localStep;
                        $scope.zoneType = localZoneType;

                        $scope.hide = function() {
                            $mdDialog.hide();
                        };

                        $scope.answer = function(stepChoosen) {
                            $mdDialog.hide(stepChoosen);
                        };
                    },
                    templateUrl: 'directives/templates/dialogs/stepDialog.html',
                    parent: angular.element(document.body),
                    targetEvent: $event,
                    clickOutsideToClose: true,
                    fullscreen: false,
                    locals: {
                        localStep: $scope.xtdDataSelected.step,
                        localZoneType: $scope.xtdDataSelected.name
                    },
                })
                .then(function(stepChoosen) {
                    if (stepChoosen) {
                        $scope.xtdDataSelected.step = stepChoosen;
                    }
                });
        };

        $scope.export = function($event) {

            var exportData = angular.toJson($scope.xtdZones);

            var exportPrompt = $mdDialog.prompt()
                .title('Exporting ' + $scope.xtdDataSelected.name + ' zones')
                .textContent('Copy data inside field.')
                .ariaLabel('Copy data inside field.')
                .initialValue(exportData)
                .targetEvent($event)
                .ok('Okay!');
            $mdDialog.show(exportPrompt);
        };

        $scope.import = function($event) {

            var importPrompt = $mdDialog.prompt()
                .title('Importing ' + $scope.xtdDataSelected.name + ' zones')
                .textContent('Paste exported zones in input field.')
                .ariaLabel('Paste exported zones in input field.')
                .initialValue('')
                .placeholder('Enter here something like [{ "from": a, "to": b }, { "from": b, "to": c }, { "from": c, "to": d }]')
                .targetEvent($event)
                .ok('Import');

            $mdDialog.show(importPrompt)
                .then(function(importData) {

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

                            $mdDialog.show(
                                $mdDialog.alert()
                                .clickOutsideToClose(true)
                                .title('Oups')
                                .textContent($scope.xtdDataSelected.name + ' zones data is not well formated or zones are upper than ' + maxZonesCount)
                                .ok('Got it!')
                                .targetEvent($event)
                            );
                            return;
                        }
                    }
                });
        };

        $scope.areZonesCompliant = function(zones) {

            if (!zones) {
                return false;
            }

            if (zones.length > maxZonesCount) {
                return false;
            }

            if (zones.length < minZonesCount) {
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

        $scope.scrollToBottom = function() {
            setTimeout(function() {
                $anchorScroll($location.hash('tools_bottom'));
            });
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
