app.controller("ComonSettingsController", ['$scope', 'Notifier', '$timeout', '$location', function($scope, Notifier, $timeout, $location) {

    // Define options structure
    $scope.sections = settingsSectionsModule.data;

    ChromeStorageModule.fetchUserSettings(function(userSettingsSynced) {

        $scope.userMaxHr = parseInt(userSettingsSynced.userMaxHr);
        $scope.userRestHr = parseInt(userSettingsSynced.userRestHr);
        $scope.userFTP = parseInt(userSettingsSynced.userFTP);

        _.each($scope.sections, function(section) {

            _.each(section.sectionContent, function(option) {

                if (option.optionType === 'checkbox') {
                    option.active = userSettingsSynced[option.optionKey];

                } else if (option.optionType === 'list') {
                    option.active = _.findWhere(option.optionList, {
                        key: userSettingsSynced[option.optionKey]
                    });
                }

            });
        });

        $scope.$apply();
    });

    $scope.toggleCheckOption = function(option) {

        // console.debug(!option.active);
        var bool = option.active;
        // var bool = !option.active;

        ChromeStorageModule.updateUserSetting(option.optionKey, bool, function() {
            console.log(option.optionKey + ' has been updated to ' + bool);
        });
    };

    $scope.toggleSelectOption = function(option) {
        ChromeStorageModule.updateUserSetting(option.optionKey, option.active.key, function() {
            console.log(option.optionKey + ' has been updated to ' + option.active);
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
            Notifier(option.optionTitle, option.optionHtml);
        }
    }

    // Trigger auto click on activity page extended data click
    var viewOptionHelperId = $location.search().viewOptionHelperId;

    if (!_.isUndefined(viewOptionHelperId)) {
        $scope.displayOptionHelper(viewOptionHelperId);
    }

}]);
