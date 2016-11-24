interface IGenderList {
    type: string;
}

interface IAthleteProfile {
    userGender: string;
    userMaxHr: number;
    userRestHr: number;
    userFTP: number;
    userWeight: number;
}

class AthleteSettingsController {

    public static changedAthleteProfileMessage: string = 'athlete-profile-saved';

    public static $inject = ['$rootScope', '$scope', 'ChromeStorageService', 'AvoidInputKeysService', '$mdDialog', '$window'];

    constructor($rootScope: any, $scope: any, chromeStorageService: ChromeStorageService, AvoidInputKeysService: IAvoidInputKeysService, $mdDialog: IDialogService, $window: IWindowService) {

        $scope.genderList = [{
            type: 'men'
        }, {
            type: 'women'
        }];

        chromeStorageService.fetchUserSettings((userSettingsSynced: IUserSettings) => {
            $scope.userSettingsSynced = userSettingsSynced;
            $scope.userMaxHr = userSettingsSynced.userMaxHr;
            $scope.userRestHr = userSettingsSynced.userRestHr;
            $scope.userFTP = userSettingsSynced.userFTP;
            $scope.userWeight = userSettingsSynced.userWeight;
            $scope.gender = _.findWhere($scope.genderList, {
                type: userSettingsSynced.userGender
            });
            $scope.zones = userSettingsSynced.userHrrZones;
            $scope.$apply();

        });

        $scope.localStorageMustBeCleared = () => {
            chromeStorageService.updateUserSetting('localStorageMustBeCleared', true, () => {
                console.log('localStorageMustBeCleared has been updated to ' + true);
            });
        };

        $scope.userGenderChanged = (gender: IGenderList) => {
            chromeStorageService.updateUserSetting('userGender', gender.type, () => {
                console.log('userGender has been updated to ' + gender.type);
                $scope.localStorageMustBeCleared();
                $scope.profileChanged();
            });
        };

        $scope.userMaxHrChanged = () => {

            setTimeout(() => {
                if (!_.isUndefined($scope.userMaxHr) && !_.isNull($scope.userMaxHr)) {

                    if ($scope.userMaxHr <= $scope.userRestHr) {
                        $scope.healthCommonForm.userMaxHr.$invalid = true;
                        $scope.$apply();

                    } else {
                        chromeStorageService.updateUserSetting('userMaxHr', $scope.userMaxHr, () => {
                            console.log('userMaxHr has been updated to ' + $scope.userMaxHr);
                            $scope.localStorageMustBeCleared();
                            $scope.profileChanged();
                        });
                    }
                }
            }, 500);

        };

        $scope.userRestHrChanged = () => {

            setTimeout(() => {
                if (!_.isUndefined($scope.userRestHr) && !_.isNull($scope.userRestHr)) {


                    if ($scope.userMaxHr <= $scope.userRestHr) {
                        $scope.healthCommonForm.userRestHr.$invalid = true;
                        $scope.$apply();
                    } else {
                        chromeStorageService.updateUserSetting('userRestHr', $scope.userRestHr, () => {
                            console.log('userRestHr has been updated to ' + $scope.userRestHr);
                            $scope.localStorageMustBeCleared();
                            $scope.profileChanged();
                        });
                    }

                }
            }, 500);
        };

        $scope.ftpHasChanged = () => {

            setTimeout(() => {
                if (!_.isUndefined($scope.userFTP)) {
                    chromeStorageService.updateUserSetting('userFTP', $scope.userFTP, () => {
                        console.log('userFTP has been updated to ' + $scope.userFTP);
                        $scope.localStorageMustBeCleared();
                        $scope.profileChanged();
                    });
                }
            }, 500);
        };

        $scope.userWeightChanged = () => {

            setTimeout(() => {
                if (!_.isUndefined($scope.userWeight)) {
                    chromeStorageService.updateUserSetting('userWeight', $scope.userWeight, function () {
                        console.log('userWeight has been updated to ' + $scope.userWeight);
                        $scope.localStorageMustBeCleared();
                        $scope.profileChanged();
                    });
                }
            }, 500);


        };

        $scope.hintModal = ($event: any, title: string, content: string) => {
            $mdDialog.show(
                $mdDialog.alert()
                    .parent(angular.element(document.body))
                    .clickOutsideToClose(true)
                    .title(title)
                    .htmlContent(content)
                    .ariaLabel(content)
                    .ok('Got it!')
                    .targetEvent($event)
            );
        };

        $scope.displayUserMaxHrHelper = ($event: any) => {
            $scope.hintModal($event, 'How to find your max Heart rate value', 'If you don\'t know your own max Heart rate then enter the value <strong> 220 - "your age" </strong>. <br /><br /> For example, if you are 30 years old, then your max HR will be <strong> 220 - 30 = 190 </strong>');
        };

        $scope.displayUserRestHrHelper = ($event: any) => {
            $scope.hintModal($event, 'How to find your resting Heart rate value', 'Measure your resting HR lying down in your bed and relaxed...<br/><br/>zzzZZZZzzzzZZZzzzzzZZz');
        };

        $scope.displayUserFTPHelper = ($event: any) => {
            $scope.hintModal($event, 'How to calculate your Functional Threshold Power', '<strong>Calculating Your FTP</strong><br /><br />We recommend you test for your FTP at least every few weeks to a month while you\'re training. Here are some tips to get the most out of your FTP testing:<br /><br />It\'s extremely taxing on your body (and your training program) to continuously push out 60-minute max efforts. It\'s also difficult to find a stretch of road where you can r\'ide for 60 minutes uninterrupted and maintain a steady wattage. Thus, the easiest way to calculate your FTP is to test your best average power for 20 minutes. We believe 20 minutes is enough time to stress the same physiological systems as a 60-minute effort would and it is easier to consistently do within your season.<br /><br /><table><tr><td>1&nbsp;-&nbsp;</td><td>Try to reproduce the same conditions each test. This means use the same stretch of road or always use the same trainer/rollers</td></tr><tr><td>2&nbsp;-&nbsp;</td><td>Make sure you are fresh (the previous few days should be light in terms of training load)</td></tr><tr><td>3&nbsp;-&nbsp;</td><td>Properly warm up</td></tr></table><br /><br /><i>Explanation by strava.com</i>');
        };

        $scope.avoidInputKeyEdit = ($event: any) => {
            AvoidInputKeysService.apply($event);
        };

        $scope.profileChanged = () => {

            chromeStorageService.getProfileConfigured().then((configured: boolean) => {
                if (!configured) {
                    chromeStorageService.setProfileConfigured(true).then(() => {
                        console.log('Profile configured');
                    });
                }
            });

            $rootScope.$broadcast(AthleteSettingsController.changedAthleteProfileMessage);
        };
    }
}

app.controller("AthleteSettingsController", AthleteSettingsController);