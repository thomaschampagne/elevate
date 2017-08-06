import * as angular from "angular";
import {IAnchorScrollService, ILocationService} from "angular";
import * as _ from "lodash";
import {ChromeStorageService} from "../../services/ChromeStorageService";

import {IHrrZone} from "../../../../common/scripts/interfaces/IActivityData";
import {userSettings} from "../../../../common/scripts/UserSettings";

export class HrrZones {

    public static maxHrZonesCount: number = 50;
    public static minHrZonesCount: number = 3;

    public static $inject: string[] = ["$scope", "ChromeStorageService", "$mdDialog", "$location", "$anchorScroll"];

    constructor(public $scope: any, public chromeStorageService: ChromeStorageService, public $mdDialog: angular.material.IDialogService, public $location: ILocationService, public $anchorScroll: IAnchorScrollService) {

        // Setup default step
        $scope.step = 0.1;

        $scope.addHrZone = ($event: MouseEvent) => {

            if ($scope.hrrZones.length >= HrrZones.maxHrZonesCount) {

                $mdDialog.show(
                    $mdDialog.alert()
                        .clickOutsideToClose(true)
                        .title("Oups")
                        .textContent("You can't add more than " + HrrZones.maxHrZonesCount + " zones...")
                        .ok("Got it!")
                        .targetEvent($event),
                );

            } else {

                const oldLastHrZone: IHrrZone = $scope.hrrZones[$scope.hrrZones.length - 1];

                // Computed middle value between oldLastHrZone.fromHrr and oldLastHrZone.toHrr
                const betweenHrrValue: number = parseInt(((oldLastHrZone.fromHrr + oldLastHrZone.toHrr) / 2).toFixed(0));

                // Creating new Hr Zone
                const newLastHrZone: any = {
                    fromHrr: betweenHrrValue,
                    toHrr: oldLastHrZone.toHrr,
                };

                // Apply middle value computed to previous last zone (toHrr)
                $scope.hrrZones[$scope.hrrZones.length - 1].toHrr = betweenHrrValue;

                // Add the new last zone
                $scope.hrrZones.push(newLastHrZone);

                $scope.scrollToBottom();
            }

        };

        $scope.removeHrZone = ($event: MouseEvent, hrrZoneId: number) => {

            if ($scope.hrrZones.length <= HrrZones.minHrZonesCount) {

                $mdDialog.show(
                    $mdDialog.alert()
                        .clickOutsideToClose(true)
                        .title("Oups")
                        .textContent("You can't remove more than " + HrrZones.minHrZonesCount + " zones...")
                        .ok("Got it!")
                        .targetEvent($event),
                );

            } else {

                if (hrrZoneId === 0) {

                    // First zone...
                    // just remove it...
                    $scope.hrrZones.splice(hrrZoneId, 1);

                } else if (hrrZoneId && hrrZoneId !== $scope.hrrZones.length - 1) {

                    // Delete middle zone id here...

                    // Update next zone
                    $scope.hrrZones[hrrZoneId + 1].fromHrr = $scope.hrrZones[hrrZoneId - 1].toHrr;

                    // Remove zone
                    $scope.hrrZones.splice(hrrZoneId, 1);

                } else {

                    // Delete last zone
                    $scope.hrrZones.pop();

                    // Uncomment bellow to get two latest zone merged on deletion. Else last zone will just popup...
                    // let oldLastZone = $scope.hrrZones[$scope.hrrZones.length - 1];
                    // $scope.hrrZones[$scope.hrrZones.length - 1].to = oldLastZone.to;
                    $scope.scrollToBottom();
                }

            }
        };

        $scope.resetHrZone = ($event: MouseEvent) => {

            const confirm: angular.material.IConfirmDialog = $mdDialog.confirm()
                .title("Reset zones")
                .textContent("You are going to reset your custom heart rate reserve zones to default factory values. Are you sure?")
                .targetEvent($event)
                .ok("Yes. Reset")
                .cancel("cancel");
            $mdDialog.show(confirm).then(() => {
                angular.copy(userSettings.userHrrZones, $scope.hrrZones);
                $scope.saveHrZones();
            });
        };

        $scope.saveHrZones = ($event: MouseEvent) => {

            if (!$scope.areHrrZonesCompliant($scope.hrrZones)) {
                alert("Zones are not compliant");
                return;
            }

            if (!_.isUndefined($scope.hrrZones)) {
                chromeStorageService.updateUserSetting("userHrrZones", angular.fromJson(angular.toJson($scope.hrrZones)), () => {

                    console.log("userHrrZones has been updated to: " + angular.toJson($scope.hrrZones));

                    $mdDialog.show(
                        $mdDialog.alert()
                            .clickOutsideToClose(true)
                            .title("Saved !")
                            .textContent("Your " + $scope.hrrZones.length + ' Heartrate reserve zones" have been saved.')
                            .ok("Got it!")
                            .targetEvent($event),
                    );

                    chromeStorageService.updateUserSetting("localStorageMustBeCleared", true, () => {
                        console.log("localStorageMustBeCleared has been updated to: " + true);
                    });
                });
            }
        };

        $scope.setupStep = ($event: MouseEvent) => {

            $mdDialog.show({
                controller: ($scope: any, $mdDialog: angular.material.IDialogService, localStep: number, localZoneType: string) => {

                    $scope.step = localStep;
                    $scope.zoneType = localZoneType;

                    $scope.hide = () => {
                        $mdDialog.hide();
                    };

                    $scope.answer = (stepChoosen: number) => {
                        $mdDialog.hide(stepChoosen);
                    };
                },
                templateUrl: "directives/templates/dialogs/stepDialog.html",
                parent: angular.element(document.body),
                targetEvent: $event,
                clickOutsideToClose: true,
                fullscreen: false,
                locals: {
                    localStep: $scope.step,
                    localZoneType: "Heartrate Reserve",
                },
            }).then((stepChoosen) => {
                if (stepChoosen) {
                    $scope.step = stepChoosen;
                }
            });
        };

        $scope.export = ($event: MouseEvent) => {

            const exportData: string = angular.toJson($scope.hrrZones);

            const exportPrompt: angular.material.IPromptDialog = $mdDialog.prompt()
                .title("Exporting Heartrate Reserve Zones")
                .textContent("Copy data inside field.")
                .ariaLabel("Copy data inside field.")
                .initialValue(exportData)
                .targetEvent($event)
                .ok("Okay!");
            $mdDialog.show(exportPrompt);
        };

        $scope.import = ($event: MouseEvent) => {

            const importPrompt = $mdDialog.prompt()
                .title("Importing Heartrate Reserve Zones")
                .textContent("Paste exported zones in input field.")
                .ariaLabel("Paste exported zones in input field.")
                .initialValue("")
                .placeholder('Enter here something like [{ "from": a, "to": b }, { "from": b, "to": c }, { "from": c, "to": d }]')
                .targetEvent($event)
                .ok("Import");

            $mdDialog.show(importPrompt)
                .then((importData) => {

                    if (importData) {

                        try {
                            const jsonImportData: IHrrZone[] = angular.fromJson(importData);

                            if ($scope.areHrrZonesCompliant(jsonImportData)) {

                                $scope.hrrZones = jsonImportData;
                                $scope.saveHrZones();

                            } else {
                                throw new Error("not compliant");
                            }

                        } catch (e) {

                            $mdDialog.show(
                                $mdDialog.alert()
                                    .clickOutsideToClose(true)
                                    .title("Oups")
                                    .textContent("Importing Heartrate Reserve Zones data is not well formated or zones are upper than " + HrrZones.maxHrZonesCount)
                                    .ok("Got it!")
                                    .targetEvent($event),
                            );
                            return;
                        }
                    }
                });
        };

        $scope.showHelper = ($event: MouseEvent) => {

            $mdDialog.show({
                controller: ($scope: any, $mdDialog: angular.material.IDialogService, userMaxHr: number, userRestHr: number) => {

                    $scope.userMaxHr = userMaxHr;
                    $scope.userRestHr = userRestHr;

                    $scope.hide = () => {
                        $mdDialog.hide();
                    };
                    $scope.cancel = () => {
                        $mdDialog.cancel();
                    };
                },
                templateUrl: "directives/hrrZones/templates/hrrZonesHelper.html",
                parent: angular.element(document.body),
                targetEvent: $event,
                locals: {
                    userMaxHr: $scope.userMaxHr,
                    userRestHr: $scope.userRestHr,
                },
                clickOutsideToClose: true,
                fullscreen: false,
            });
        };

        $scope.areHrrZonesCompliant = (hrrZones: IHrrZone[]) => {

            if (!hrrZones) {
                return false;
            }

            if (hrrZones.length > HrrZones.maxHrZonesCount) {
                return false;
            }

            if (hrrZones.length < HrrZones.minHrZonesCount) {
                return false;
            }

            for (let i: number = 0; i < hrrZones.length; i++) {

                if (i === 0) {
                    if (hrrZones[i].toHrr != hrrZones[i + 1].fromHrr) {
                        return false;
                    }

                } else if (i < (hrrZones.length - 1)) { // Middle

                    if (hrrZones[i].toHrr != hrrZones[i + 1].fromHrr || hrrZones[i].fromHrr != hrrZones[i - 1].toHrr) {
                        return false;
                    }

                } else { // Last
                    if (hrrZones[i].fromHrr != hrrZones[i - 1].toHrr) {
                        return false;
                    }
                }
            }
            return true;
        };

        $scope.onZoneChange = (hrrZoneId: number, previousHrrZone: IHrrZone, newHrrZone: IHrrZone) => {

            const fieldHasChanged: string = $scope.whichFieldHasChanged(previousHrrZone, newHrrZone);

            if (_.isUndefined(fieldHasChanged)) {
                return;
            }

            if (hrrZoneId === 0) { // If first zone

                $scope.handleToHrrChange(hrrZoneId);

            } else if (hrrZoneId < $scope.hrrZones.length - 1) { // If middle zone

                if (fieldHasChanged === "toHrr") {

                    $scope.handleToHrrChange(hrrZoneId);

                } else if (fieldHasChanged === "fromHrr") {

                    $scope.handleFromHrrChange(hrrZoneId);
                }

            } else { // If last zone
                $scope.handleFromHrrChange(hrrZoneId);
            }

        };

        /**
         * @return 'fromHrr' or 'toHrr'
         */
        $scope.whichFieldHasChanged = (previousHrZone: IHrrZone, newHrZone: IHrrZone) => {

            if (previousHrZone.fromHrr !== newHrZone.fromHrr) {
                return "fromHrr";
            }

            if (previousHrZone.toHrr !== newHrZone.toHrr) {
                return "toHrr";
            }
        };

        $scope.handleToHrrChange = (hrrZoneId: number) => {
            $scope.hrrZones[hrrZoneId + 1].fromHrr = $scope.hrrZones[hrrZoneId].toHrr; // User has changed toHrr value of the zone
        };

        $scope.handleFromHrrChange = (hrrZoneId: number) => {
            $scope.hrrZones[hrrZoneId - 1].toHrr = $scope.hrrZones[hrrZoneId].fromHrr; // User has changed fromHrr value of the zone
        };

        $scope.scrollToBottom = () => {
            setTimeout(() => {
                $anchorScroll($location.hash("tools_bottom").hash());
            });
        };

    }
}

export let hrrZones = [() => {

    return {
        templateUrl: "directives/hrrZones/templates/hrrZones.html",
        scope: {
            hrrZones: "=",
            userMaxHr: "@userMaxHr",
            userRestHr: "@userRestHr",
        },
        controller: HrrZones,
    } as any;

}];
