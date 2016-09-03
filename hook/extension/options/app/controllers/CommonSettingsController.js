app.controller("CommonSettingsController", ['$scope', 'CommonSettingsService', 'ChromeStorageService', '$timeout', '$location', '$mdDialog', '$sce', function($scope, CommonSettingsService, ChromeStorageService, $timeout, $location, $mdDialog, $sce) {

    // Define options structure
    $scope.sections = CommonSettingsService.provideSections();

    ChromeStorageService.fetchUserSettings(function(userSettingsSynced) {

        $scope.userMaxHr = parseInt(userSettingsSynced.userMaxHr);
        $scope.userRestHr = parseInt(userSettingsSynced.userRestHr);
        $scope.userFTP = parseInt(userSettingsSynced.userFTP);

        _.each($scope.sections, function(section) {

            _.each(section.sectionContent, function(option) {

                if (option.optionType === 'checkbox') {
                    option.active = userSettingsSynced[option.optionKey];

                    if (option.optionEnableSub) {
                        _.each(option.optionEnableSub, function(subKey) {
                            $scope.displaySubOption(subKey, userSettingsSynced[option.optionKey]);
                        });
                    }

                } else if (option.optionType === 'list') {
                    option.active = _.findWhere(option.optionList, {
                        key: userSettingsSynced[option.optionKey]
                    });
                } else if (option.optionType === 'integer') {
                    option.value = userSettingsSynced[option.optionKey];
                } else {
                    console.error('Option type not supported');
                }
            });
        });

        $scope.$apply();
    });

    $scope.toggleCheckOption = function(option) {

        var bool = option.active;

        ChromeStorageService.updateUserSetting(option.optionKey, bool, function() {
            console.log(option.optionKey + ' has been updated to ' + bool);
        });

        // Enable/disable sub option if needed
        if (option.optionEnableSub) {
            // Replace this to find option object from option.optionEnableSub
            _.each(option.optionEnableSub, function(subKey) {
                $scope.displaySubOption(subKey, option.active);
            });
        }
    };

    $scope.displaySubOption = function(subOptionKey, show) {
        _.each($scope.sections, function(section) {
            var optionFound = _.findWhere(section.sectionContent, {
                optionKey: subOptionKey
            });
            if (optionFound) {
                optionFound.hidden = !show;
            }
        });
    };

    $scope.toggleSelectOption = function(option) {

        ChromeStorageService.updateUserSetting(option.optionKey, option.active.key, function() {
            console.log(option.optionKey + ' has been updated to ' + option.active);
        });
    };


    $scope.toggleIntegerOption = function(option) {

        $scope.$watch('option.value', function() {

            if (option.value < 0) {
                if (option.value == -1) {
                    option.value = 0;
                } else {
                    option.value = Math.abs(option.value);
                }
            }

        });

        var saveValue = (_.isNull(option.value) || _.isUndefined(option.value)) ? 0 : option.value;

        ChromeStorageService.updateUserSetting(option.optionKey, saveValue, function() {
            console.log(option.optionKey + ' has been updated to ' + saveValue);
        });
    };

    $scope.displayOptionHelper = function(optionKeyParam) {

        var option = null;

        _.each($scope.sections, function(section) {

            var optionSearch = _.findWhere(section.sectionContent, {
                optionKey: optionKeyParam
            });

            if (optionSearch) {
                option = optionSearch;
                return;
            }
        });

        if (option) {

            $mdDialog.show({
                controller: function($scope) {
                    $scope.title = option.optionTitle;
                    $scope.htmlContent = $sce.trustAsHtml(option.optionHtml); // Mark the html as "trusted" with Strict Contextual Escaping ($sce)
                    $scope.hide = function() {
                        $mdDialog.hide();
                    };
                },
                templateUrl: 'views/modals/settingHint.html',
                parent: angular.element(document.body),
                clickOutsideToClose: true
            });
        }
    };

    // Trigger auto click on activity page extended data click
    var viewOptionHelperId = $location.search().viewOptionHelperId;

    if (!_.isUndefined(viewOptionHelperId)) {
        $scope.displayOptionHelper(viewOptionHelperId);
    }

    // Apply search text if searchText GET param exist
    if ($location.search().searchText) {
        $scope.searchText = $location.search().searchText;
    }

}]);
