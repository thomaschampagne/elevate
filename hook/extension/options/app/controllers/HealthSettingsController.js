app.controller("HealthSettingsController", ['$scope', 'Notifier', 'AvoidInputKeys', function($scope, Notifier, avoidInputKeys) {

    ChromeStorageModule.fetchUserSettings(function(userSettingsSynced) {
        $scope.userMaxHr = parseInt(userSettingsSynced.userMaxHr);
        $scope.userRestHr = parseInt(userSettingsSynced.userRestHr);
        $scope.userFTP = parseInt(userSettingsSynced.userFTP);
        $scope.zones = userSettingsSynced.userHrrZones;
        $scope.$apply();
    });

    $scope.localStorageMustBeCleared = function() {
        ChromeStorageModule.updateUserSetting('localStorageMustBeCleared', true, function() {
            console.log('localStorageMustBeCleared has been updated to ' + true);
        });
    };

    $scope.userMaxHrChanged = function() {

        setTimeout(function() {
            if (!_.isUndefined($scope.userMaxHr) && !_.isNull($scope.userMaxHr)) {

                if ($scope.userMaxHr <= $scope.userRestHr) {
                    $scope.healthCommonForm.userMaxHr.$invalid = true;
                    $scope.$apply();

                } else {
                    ChromeStorageModule.updateUserSetting('userMaxHr', $scope.userMaxHr, function() {
                        console.log('userMaxHr has been updated to ' + $scope.userMaxHr);
                        $scope.localStorageMustBeCleared();
                    });
                }
            }
        }, 500);

    };

    $scope.userRestHrChanged = function() {

        setTimeout(function() {
            if (!_.isUndefined($scope.userRestHr) && !_.isNull($scope.userRestHr)) {


                if ($scope.userMaxHr <= $scope.userRestHr) {
                    $scope.healthCommonForm.userRestHr.$invalid = true;
                    $scope.$apply();
                } else {
                    ChromeStorageModule.updateUserSetting('userRestHr', $scope.userRestHr, function() {
                        console.log('userRestHr has been updated to ' + $scope.userRestHr);
                        $scope.localStorageMustBeCleared();
                    });
                }

            }
        }, 500);
    };

    $scope.ftpHasChanged = function() {

        setTimeout(function() {
            if (!_.isUndefined($scope.userFTP)) {
                ChromeStorageModule.updateUserSetting('userFTP', $scope.userFTP, function() {
                    console.log('userFTP has been updated to ' + $scope.userFTP);
                    $scope.localStorageMustBeCleared();
                });
            }
        }, 500);
    };

    $scope.displayUserMaxHrHelper = function() {
        Notifier('How to find your max Heart rate value', 'If you don\'t know your own max Heart rate then enter the value <strong> 220 - "your age" </strong>. <br /><br /> For example, if you are 30 years old, then your max HR will be <strong> 220 - 30 = 190 </strong>');
    };

    $scope.displayUserRestHrHelper = function() {
        Notifier('How to find your resting Heart rate value', 'Measure your resting HR lying down in your bed and relaxed...<br/><br/>zzzZZZZzzzzZZZzzzzzZZz');
    };

    $scope.displayUserFTPHelper = function() {
        Notifier('How to calculate your Functional Threshold Power', '<strong>Calculating Your FTP</strong><br /><br />We recommend you test for your FTP at least every few weeks to a month while you\'re training. Here are some tips to get the most out of your FTP testing:<br /><br />It\'s extremely taxing on your body (and your training program) to continuously push out 60-minute max efforts. It\'s also difficult to find a stretch of road where you can r\'ide for 60 minutes uninterrupted and maintain a steady wattage. Thus, the easiest way to calculate your FTP is to test your best average power for 20 minutes. We believe 20 minutes is enough time to stress the same physiological systems as a 60-minute effort would and it is easier to consistently do within your season.<br /><br /><table><tr><td>1&nbsp;-&nbsp;</td><td>Try to reproduce the same conditions each test. This means use the same stretch of road or always use the same trainer/rollers</td></tr><tr><td>2&nbsp;-&nbsp;</td><td>Make sure you are fresh (the previous few days should be light in terms of training load)</td></tr><tr><td>3&nbsp;-&nbsp;</td><td>Properly warm up</td></tr></table><br /><br /><i>Explanation by strava.com</i>');
    };

    $scope.avoidInputKeyEdit = function(evt) {
        avoidInputKeys(evt);
    };

}]);
