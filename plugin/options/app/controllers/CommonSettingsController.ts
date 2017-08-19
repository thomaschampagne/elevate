import * as angular from "angular";
import {ILocationService, ISCEService} from "angular";
import * as _ from "lodash";
import {IUserSettings} from "../../../common/scripts/interfaces/IUserSettings";
import {ChromeStorageService} from "../services/ChromeStorageService";
import {ICommonSettingsService, ISection, ISectionContent} from "../services/CommonSettingsService";

export class CommonSettingsController {

    public static $inject = ["$scope", "CommonSettingsService", "ChromeStorageService", "$location", "$mdDialog", "$sce"];

    constructor($scope: any, CommonSettingsService: ICommonSettingsService, chromeStorageService: ChromeStorageService, $location: ILocationService, $mdDialog: angular.material.IDialogService, $sce: ISCEService) {

        // Define options structure
        $scope.sections = CommonSettingsService.provideSections();

        chromeStorageService.fetchUserSettings((userSettingsSynced: IUserSettings) => {

            $scope.userMaxHr = userSettingsSynced.userMaxHr;
            $scope.userRestHr = userSettingsSynced.userRestHr;
            $scope.userFTP = userSettingsSynced.userFTP;

            _.forEach($scope.sections, (section: ISection) => {

                _.forEach(section.sectionContent, (option: ISectionContent) => {

                    if (option.optionType === "checkbox") {

                        // option.active = _.propertyOf(userSettingsSynced)(option.optionKey);
                        option.active = _.propertyOf(userSettingsSynced)(option.optionKey);

                        if (option.optionEnableSub) {
                            _.forEach(option.optionEnableSub, (subKey: string) => {
                                $scope.displaySubOption(subKey, _.propertyOf(userSettingsSynced)(option.optionKey));
                            });
                        }

                    } else if (option.optionType === "list") {
                        option.active = _.find(option.optionList, {
                            key: _.propertyOf(userSettingsSynced)(option.optionKey),
                        });
                    } else if (option.optionType === "number") {
                        option.value = _.propertyOf(userSettingsSynced)(option.optionKey);
                    } else {
                        console.error("Option type not supported");
                    }
                });
            });

            $scope.$apply();
        });

        $scope.toggleCheckOption = (option: ISectionContent) => {

            chromeStorageService.updateUserSetting(option.optionKey, option.active, () => {
                console.log(option.optionKey + " has been updated to " + option.active);
            });

            // Enable/disable sub option if needed
            if (option.optionEnableSub) {
                // Replace this to find option object from option.optionEnableSub
                _.forEach(option.optionEnableSub, (subKey: string) => {
                    $scope.displaySubOption(subKey, option.active);
                });
            }
        };

        $scope.displaySubOption = (subOptionKey: string, show: boolean) => {
            _.forEach($scope.sections, (section: ISection) => {
                const optionFound: ISectionContent = _.find(section.sectionContent, {
                    optionKey: subOptionKey,
                });
                if (optionFound) {
                    optionFound.hidden = !show;
                }
            });
        };

        $scope.toggleSelectOption = (option: ISectionContent) => {

            chromeStorageService.updateUserSetting(option.optionKey, option.active.key, () => {
                console.log(option.optionKey + " has been updated to " + option.active);
            });
        };

        $scope.toggleIntegerOption = (option: ISectionContent) => {

            if (_.isNull(option.value) || _.isUndefined(option.value)) {

                chromeStorageService.fetchUserSettings((userSettings: IUserSettings) => {
                    const resetValue = _.propertyOf(userSettings)(option.optionKey);
                    console.log(option.optionKey + " value not compliant, Reset to  " + resetValue);
                    option.value = resetValue;
                });

            } else {
                // Save !
                chromeStorageService.updateUserSetting(option.optionKey, option.value, () => {
                    console.log(option.optionKey + " has been updated to " + option.value);
                });
            }
        };

        $scope.displayOptionHelper = (optionKeyParam: string) => {

            let option: ISectionContent = null;

            _.forEach($scope.sections, (section: ISection) => {

                const optionSearch: ISectionContent = _.find(section.sectionContent, {
                    optionKey: optionKeyParam,
                });

                if (optionSearch) {
                    option = optionSearch;

                }
            });

            if (option) {

                $mdDialog.show({
                    controller: ($scope: any) => {
                        $scope.title = option.optionTitle;
                        $scope.htmlContent = $sce.trustAsHtml(option.optionHtml); // Mark the html as "trusted" with Strict Contextual Escaping ($sce)
                        $scope.hide = () => {
                            $mdDialog.hide();
                        };
                    },
                    templateUrl: "views/modals/settingHint.html",
                    parent: angular.element(document.body),
                    clickOutsideToClose: true,
                });
            }
        };

        // Trigger auto click on activity page extended data click
        const viewOptionHelperId: number = $location.search().viewOptionHelperId;

        if (!_.isUndefined(viewOptionHelperId)) {
            $scope.displayOptionHelper(viewOptionHelperId);
        }

        // Apply search text if searchText GET param exist
        if ($location.search().searchText) {
            $scope.searchText = $location.search().searchText;
        }

    }
}
