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

        ChromeStorageModule.updateUserSetting(option.optionKey, option.active, function() {
            console.log(option.optionKey + ' has been updated to ' + option.active);
        });
    };

    $scope.toggleSelectOption = function(option) {
        ChromeStorageModule.updateUserSetting(option.optionKey, option.active.key, function() {
            console.log(option.optionKey + ' has been updated to ' + option.active);
        });
    };

    $scope.displayOptionHelper = function(title, content) {
        Notifier(title, content);
    }

    // Trigger auto click on activity page extended data click
    var viewOptionHelperId = $location.search().viewOptionHelperId;
    if (!_.isUndefined(viewOptionHelperId)) {
        $timeout(function() {
            angular.element(document.getElementById(viewOptionHelperId)).triggerHandler('click');
        }, 0);
    }
    
}]);
