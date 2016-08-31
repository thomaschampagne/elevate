app.directive('hrrCustomZones', ['ChromeStorageService', '$mdDialog', '$location', '$anchorScroll', function(ChromeStorageService, $mdDialog, $location, $anchorScroll) {

    var maxHrZonesCount = 50;
    var minHrZonesCount = 3;

    var linkFunction = function($scope, element, attrs) {};

    var controllerFunction = function($scope) {

        // Setup default step
        $scope.step = 0.1;

        $scope.addHrZone = function($event) {

            if ($scope.hrZones.length >= maxHrZonesCount) {

                $mdDialog.show(
                    $mdDialog.alert()
                    .clickOutsideToClose(true)
                    .title('Oups')
                    .textContent('You can\'t add more than ' + maxHrZonesCount + ' zones...')
                    .ok('Got it!')
                    .targetEvent($event)
                );

            } else {

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

                $scope.scrollToBottom();
            }

        };

        $scope.removeHrZone = function($event, hrZoneId) {

            if ($scope.hrZones.length <= minHrZonesCount) {

                $mdDialog.show(
                    $mdDialog.alert()
                    .clickOutsideToClose(true)
                    .title('Oups')
                    .textContent('You can\'t remove more than ' + minHrZonesCount + ' zones...')
                    .ok('Got it!')
                    .targetEvent($event)
                );

            } else {

                if (hrZoneId === 0) {

                    // First zone...
                    // just remove it...
                    $scope.hrZones.splice(hrZoneId, 1);

                } else if (hrZoneId && hrZoneId !== $scope.hrZones.length - 1) {

                    // Delete middle zone id here...

                    // Update next zone
                    $scope.hrZones[hrZoneId + 1].fromHrr = $scope.hrZones[hrZoneId - 1].toHrr;

                    // Remove zone
                    $scope.hrZones.splice(hrZoneId, 1);

                } else {

                    // Delete last zone
                    var oldLastZone = $scope.hrZones[$scope.hrZones.length - 1];
                    $scope.hrZones.pop();
                    $scope.hrZones[$scope.hrZones.length - 1].to = oldLastZone.to;
                    $scope.scrollToBottom();
                }

            }
        };

        $scope.resetHrZone = function($event) {

            var confirm = $mdDialog.confirm()
                .title('Reset zones')
                .textContent('You are going to reset your custom heart rate reserve zones to default factory values. Are you sure?')
                .targetEvent($event)
                .ok('Yes. Reset')
                .cancel('cancel');
            $mdDialog.show(confirm).then(function() {
                angular.copy(userSettings.userHrrZones, $scope.hrZones);
                $scope.saveHrZones();
            });
        };

        $scope.saveHrZones = function($event) {

            if (!$scope.areHrZonesCompliant($scope.hrZones)) {
                alert('Zones are not compliant');
                return;
            }

            if (!_.isUndefined($scope.hrZones)) {
                ChromeStorageService.updateUserSetting('userHrrZones', angular.fromJson(angular.toJson($scope.hrZones)), function() {

                    console.log('userHrrZones has been updated to: ' + angular.toJson($scope.hrZones));

                    $mdDialog.show(
                        $mdDialog.alert()
                        .clickOutsideToClose(true)
                        .title('Saved !')
                        .textContent('Your ' + $scope.hrZones.length + ' Heartrate reserve zones" have been saved.')
                        .ok('Got it!')
                        .openFrom('body')
                        .closeTo('body')
                        .targetEvent($event)
                    );

                    ChromeStorageService.updateUserSetting('localStorageMustBeCleared', true, function() {
                        console.log('localStorageMustBeCleared has been updated to: ' + true);
                    });
                });
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
                        localStep: $scope.step,
                        localZoneType: 'Heartrate Reserve'
                    },
                })
                .then(function(stepChoosen) {
                    if (stepChoosen) {
                        $scope.step = stepChoosen;
                    }
                });
        };

        $scope.export = function($event) {

            var exportData = angular.toJson($scope.hrZones);

            var exportPrompt = $mdDialog.prompt()
                .title('Exporting Heartrate Reserve Zones')
                .textContent('Copy data inside field.')
                .ariaLabel('Copy data inside field.')
                .initialValue(exportData)
                .targetEvent($event)
                .ok('Okay!');
            $mdDialog.show(exportPrompt);
        };

        $scope.import = function($event) {

            var importPrompt = $mdDialog.prompt()
                .title('Importing Heartrate Reserve Zones')
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

                            if ($scope.areHrZonesCompliant(jsonImportData)) {

                                $scope.hrZones = jsonImportData;
                                $scope.saveHrZones();

                            } else {
                                throw new error('not compliant');
                            }

                        } catch (e) {

                            $mdDialog.show(
                                $mdDialog.alert()
                                .clickOutsideToClose(true)
                                .title('Oups')
                                .textContent('Importing Heartrate Reserve Zones data is not well formated or zones are upper than ' + maxHrZonesCount)
                                .ok('Got it!')
                                .targetEvent($event)
                            );
                            return;
                        }
                    }
                });
        };

        $scope.showHelper = function($event) {


            $mdDialog.show({
                controller: function DialogController($scope, $mdDialog, userMaxHr, userRestHr) {

                    $scope.userMaxHr = userMaxHr;
                    $scope.userRestHr = userRestHr;

                    $scope.hide = function() {
                        $mdDialog.hide();
                    };
                    $scope.cancel = function() {
                        $mdDialog.cancel();
                    };
                },
                templateUrl: 'directives/hrZones/templates/hrrZonesHelper.html',
                parent: angular.element(document.body),
                targetEvent: $event,
                locals: {
                    userMaxHr: $scope.userMaxHr,
                    userRestHr: $scope.userRestHr
                },
                clickOutsideToClose: true,
                fullscreen: false
            });
        };

        $scope.areHrZonesCompliant = function(hrZones) {

            if (!hrZones) {
                return false;
            }

            if (hrZones.length > maxHrZonesCount) {
                return false;
            }

            if (hrZones.length < minHrZonesCount) {
                return false;
            }

            for (var i = 0; i < hrZones.length; i++) {

                if (i === 0) {
                    if (hrZones[i].toHrr != hrZones[i + 1].fromHrr) {
                        return false;
                    }

                } else if (i < (hrZones.length - 1)) { // Middle

                    if (hrZones[i].toHrr != hrZones[i + 1].fromHrr || hrZones[i].fromHrr != hrZones[i - 1].toHrr) {
                        return false;
                    }

                } else { // Last
                    if (hrZones[i].fromHrr != hrZones[i - 1].toHrr) {
                        return false;
                    }
                }
            }
            return true;
        };

        $scope.onZoneChange = function(hrZoneId, previousHrZone, newHrZone) {

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

        $scope.scrollToBottom = function() {
            setTimeout(function() {
                $anchorScroll($location.hash('tools_bottom'));
            });
        };

    };

    return {
        templateUrl: 'directives/hrZones/templates/hrrCustomZones.html',
        scope: {
            hrZones: "=",
            userMaxHr: "@userMaxHr",
            userRestHr: "@userRestHr"
        },
        controller: controllerFunction,
        link: linkFunction
    };
}]);
