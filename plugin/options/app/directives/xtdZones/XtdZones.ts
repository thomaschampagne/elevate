import * as angular from "angular";
import { IAnchorScrollService, ILocationService } from "angular";
import * as _ from "lodash";
import { ZoneModel } from "../../../../common/scripts/models/ActivityData";
import { UserSettingsModel } from "../../../../common/scripts/models/UserSettings";
import { userSettings } from "../../../../common/scripts/UserSettings";
import { ChromeStorageService } from "../../services/ChromeStorageService";

export class XtdZones {

    public static maxZonesCount: number = 50;
    public static minZonesCount: number = 3;

    public static $inject: string[] = ["$scope", "ChromeStorageService", "$mdDialog", "$location", "$anchorScroll"];

    constructor(public $scope: any, public chromeStorageService: ChromeStorageService, public $mdDialog: angular.material.IDialogService, public $location: ILocationService, public $anchorScroll: IAnchorScrollService) {

        $scope.addZone = ($event: MouseEvent) => {

            if ($scope.xtdZones.length >= XtdZones.maxZonesCount) {

                $mdDialog.show(
                    $mdDialog.alert()
                        .clickOutsideToClose(true)
                        .title("Oups")
                        .textContent("You can't add more than " + XtdZones.maxZonesCount + " zones...")
                        .ok("Got it!")
                        .targetEvent($event),
                );

            } else {

				const oldLastZone: ZoneModel = $scope.xtdZones[$scope.xtdZones.length - 1];

                // Computed middle value between oldLastZone.from and oldLastZone.to
                const betweenValue: number = parseInt(((oldLastZone.from + oldLastZone.to) / 2).toFixed(0));

                // Creating new Zone
				const newLastZone: ZoneModel = {
                    from: betweenValue,
                    to: oldLastZone.to,
                };

                // Apply middle value computed to previous last zone (to)
                $scope.xtdZones[$scope.xtdZones.length - 1].to = betweenValue;

                // Add the new last zone
                $scope.xtdZones.push(newLastZone);

                $scope.scrollToBottom();

            }
        };

        $scope.removeZone = ($event: MouseEvent, zoneId: number) => {

            if ($scope.xtdZones.length <= XtdZones.minZonesCount) {

                $mdDialog.show(
                    $mdDialog.alert()
                        .clickOutsideToClose(true)
                        .title("Oups")
                        .textContent("You can't remove more than " + XtdZones.minZonesCount + " zones...")
                        .ok("Got it!")
                        .targetEvent($event),
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
                    $scope.xtdZones.pop();

                    // Uncomment bellow to get two latest zone merged on deletion. Else last zone will just popup...
                    // let oldLastZone = $scope.xtdZones[$scope.xtdZones.length - 1];
                    // $scope.xtdZones[$scope.xtdZones.length - 1].to = oldLastZone.to;
                    $scope.scrollToBottom();
                }

            }
        };

        $scope.resetZone = ($event: MouseEvent) => {

            const confirm: angular.material.IConfirmDialog = $mdDialog.confirm()
                .title("Reset zones")
                .textContent("You are going to reset " + $scope.xtdDataSelected.name + " zones to default factory values. Are you sure?")
                .targetEvent($event)
                .ok("Yes. Reset")
                .cancel("cancel");

            $mdDialog.show(confirm).then(() => {
                angular.copy(_.propertyOf(userSettings.zones)($scope.xtdDataSelected.value), $scope.xtdZones);
                $scope.saveZones();
            });
        };

        $scope.saveZones = ($event: MouseEvent) => {

            if (!$scope.areZonesCompliant($scope.xtdZones)) {
                alert("Zones are not compliant");
                return;
            }

            if (!_.isUndefined($scope.xtdZones)) {

				chromeStorageService.fetchUserSettings((userSettingsSynced: UserSettingsModel) => {
                    // Update zones with new one
                    const zones: any = userSettingsSynced.zones;
                    zones[$scope.xtdDataSelected.value] = angular.fromJson(angular.toJson($scope.xtdZones));

                    chrome.storage.sync.set(userSettingsSynced, () => {

                        $mdDialog.show(
                            $mdDialog.alert()
                                .clickOutsideToClose(true)
                                .title("Saved !")
                                .textContent("Your " + $scope.xtdZones.length + " \"" + $scope.xtdDataSelected.name + " zones\" have been saved.")
                                .ok("Got it!")
                                .targetEvent($event),
                        );

                        chromeStorageService.updateUserSetting("localStorageMustBeCleared", true, () => {
                            console.log("localStorageMustBeCleared has been updated to: " + true);
                        });
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
                    localStep: $scope.xtdDataSelected.step,
                    localZoneType: $scope.xtdDataSelected.name,
                },
            }).then((stepChoosen: number) => {
                if (stepChoosen) {
                    $scope.xtdDataSelected.step = stepChoosen;
                }
            });
        };

        $scope.export = ($event: MouseEvent) => {

            const exportData = angular.toJson($scope.xtdZones);

            const exportPrompt: angular.material.IPromptDialog = $mdDialog.prompt()
                .title("Exporting " + $scope.xtdDataSelected.name + " zones")
                .textContent("Copy data inside field.")
                .ariaLabel("Copy data inside field.")
                .initialValue(exportData)
                .targetEvent($event)
                .ok("Okay!");
            $mdDialog.show(exportPrompt);
        };

        $scope.import = ($event: MouseEvent) => {

            const importPrompt = $mdDialog.prompt()
                .title("Importing " + $scope.xtdDataSelected.name + " zones")
                .textContent("Paste exported zones in input field.")
                .ariaLabel("Paste exported zones in input field.")
                .initialValue("")
                .placeholder("Enter here something like [{ \"from\": a, \"to\": b }, { \"from\": b, \"to\": c }, { \"from\": c, \"to\": d }]")
                .targetEvent($event)
                .ok("Import");

            $mdDialog.show(importPrompt)
                .then((importData) => {

                    if (importData) {

                        try {
							const jsonImportData: ZoneModel[] = angular.fromJson(importData);

                            if ($scope.areZonesCompliant(jsonImportData)) {

                                $scope.xtdZones = jsonImportData;
                                $scope.saveZones();

                            } else {
                                throw new Error("not compliant");
                            }

                        } catch (e) {

                            $mdDialog.show(
                                $mdDialog.alert()
                                    .clickOutsideToClose(true)
                                    .title("Oups")
                                    .textContent($scope.xtdDataSelected.name + " zones data is not well formated or zones are upper than " + XtdZones.maxZonesCount)
                                    .ok("Got it!")
                                    .targetEvent($event),
                            );
                            return;
                        }
                    }
                });
        };

		$scope.areZonesCompliant = (zones: ZoneModel[]) => {

            if (!zones) {
                return false;
            }

            if (zones.length > XtdZones.maxZonesCount) {
                return false;
            }

            if (zones.length < XtdZones.minZonesCount) {
                return false;
            }

            for (let i = 0; i < zones.length; i++) {

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

		$scope.onZoneChange = (zoneId: number, previousZone: ZoneModel, newZone: ZoneModel) => {

            const fieldHasChanged: string = $scope.whichFieldHasChanged(previousZone, newZone);

            if (_.isUndefined(fieldHasChanged)) {
                return;
            }

            if (zoneId === 0) { // If first zone

                $scope.handleToChange(zoneId);

            } else if (zoneId < $scope.xtdZones.length - 1) { // If middle zone

                if (fieldHasChanged === "to") {

                    $scope.handleToChange(zoneId);

                } else if (fieldHasChanged === "from") {

                    $scope.handleFromChange(zoneId);
                }

            } else { // If last zone
                $scope.handleFromChange(zoneId);
            }

        };

        /**
         * @return 'from' or 'to'
         */
		$scope.whichFieldHasChanged = (previousZone: ZoneModel, newZone: ZoneModel) => {

            if (previousZone.from !== newZone.from) {
                return "from";
            }

            if (previousZone.to !== newZone.to) {
                return "to";
            }
        };

        $scope.handleToChange = (zoneId: number) => {
            $scope.xtdZones[zoneId + 1].from = $scope.xtdZones[zoneId].to; // User has changed to value of the zone
        };

        $scope.handleFromChange = (zoneId: number) => {
            $scope.xtdZones[zoneId - 1].to = $scope.xtdZones[zoneId].from; // User has changed from value of the zone
        };

        $scope.scrollToBottom = () => {

            setTimeout(() => {
                $anchorScroll($location.hash("tools_bottom").hash());
            });
        };

    }
}

export let xtdZones = [() => {

    return {
        templateUrl: "directives/xtdZones/templates/xtdZones.html",
        scope: {
            xtdZones: "=",
            xtdDataSelected: "=",
        },
        controller: XtdZones,
    } as any;

}];
