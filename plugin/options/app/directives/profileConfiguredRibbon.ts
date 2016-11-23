interface IProfileConfiguredRibbonScope extends IScope {
    // remoteAthleteProfileEqualsLocal: (remoteAthleteProfile: IAthleteProfile, localAthleteProfile: IAthleteProfile) => boolean;
    // checkAthleteSettingsRemoteLocalCompliance: () => void;
    isLocalAthleteProfileConfigured: boolean;
    showHistoryNonConsistent: boolean;
    hideHistoryNonConsistent: () => void;
    syncNow: (forceSync: boolean) => void;
    saveDefaultAthleteProfileAndHideRibbon: () => void;
    goToAthleteSettings: () => void;
}

class ProfileConfiguredRibbon {


    public static remoteAthleteProfileEqualsLocal(remoteAthleteProfile: IAthleteProfile, localAthleteProfile: IAthleteProfile) { // TODO move outside ?!

        let remoteEqualsLocal: boolean = true;
        // localAthleteProfile.userMaxHr = 191; // TODO remove testing
        if (remoteAthleteProfile.userGender !== localAthleteProfile.userGender ||
            remoteAthleteProfile.userMaxHr !== localAthleteProfile.userMaxHr ||
            remoteAthleteProfile.userRestHr !== localAthleteProfile.userRestHr ||
            remoteAthleteProfile.userFTP !== localAthleteProfile.userFTP ||
            remoteAthleteProfile.userWeight !== localAthleteProfile.userWeight) {

            // Remote do not matches with local
            remoteEqualsLocal = false;
        }
        return remoteEqualsLocal;
    }

    public static $inject: string[] = ['$scope', 'ChromeStorageService', '$location', '$window'];

    constructor(public $scope: IProfileConfiguredRibbonScope, public chromeStorageService: ChromeStorageService, public $location: ILocationService, public $window: IWindowService) {

        // chromeStorageService.removeFromLocalStorage('athleteProfile'); // TODO ...
        chromeStorageService.getAllFromLocalStorage().then((saved: any) => { // TODO ...
            console.log(saved);
        });

        // Considering that profile is configured at first. It's a nominal state before saying that is isn't
        $scope.isLocalAthleteProfileConfigured = true;

        // Retrieve profile configured and display ribbon to inform user to configure it...
        chromeStorageService.getLocalAthleteProfile().then((localAthleteProfile: IAthleteProfile) => {
            $scope.isLocalAthleteProfileConfigured = !_.isEmpty(localAthleteProfile);
        });

        // Now check for athlete settings compliance between remote and local.
        // Inform user of re-sync if remote athlete settings have changed & a synchronisation exists
        // If yes show history non consistent message.
        if (localStorage.getItem('localNotEqualsRemote')) { // We have detected before that remote != local.

            $scope.showHistoryNonConsistent = true;

        } else {
            chromeStorageService.getLastSyncDate().then((lastSyncDate: number) => {

                if (lastSyncDate !== -1) { // lastSyncDate exists
                    return chromeStorageService.fetchUserSettings(); // Get current default values from user settings (remote synced) and save them as a new profile
                } else { // No sync date
                    return null;
                }

            }).then((userSettings: IUserSettings) => {

                if (!userSettings) {
                    return null;
                }

                console.warn(userSettings);

                let remoteAthleteProfile: IAthleteProfile = {
                    userGender: userSettings.userGender,
                    userMaxHr: userSettings.userMaxHr,
                    userRestHr: userSettings.userRestHr,
                    userFTP: userSettings.userFTP,
                    userWeight: userSettings.userWeight,
                };

                // Compare remote vs local
                chromeStorageService.getLocalAthleteProfile().then((localAthleteProfile: IAthleteProfile) => {

                    if (!localAthleteProfile) {
                        return;
                    }

                    let remoteEqualsLocal: boolean = ProfileConfiguredRibbon.remoteAthleteProfileEqualsLocal(remoteAthleteProfile, localAthleteProfile);

                    // We have detected local != synced on load
                    if (!remoteEqualsLocal) {
                        localStorage.setItem('localNotEqualsRemote', 'true'); // TODO change storage method
                    }
                    console.warn(remoteEqualsLocal);
                    $scope.showHistoryNonConsistent = !remoteEqualsLocal;
                });

            });
        }

        $scope.hideHistoryNonConsistent = () => {
            $scope.showHistoryNonConsistent = false;
            localStorage.removeItem('localNotEqualsRemote');
        };

        $scope.goToAthleteSettings = () => {
            $location.path(routeMap.athleteSettingsRoute);
        };

        $scope.saveDefaultAthleteProfileAndHideRibbon = () => {

            // Get current default values from user settings (remote synced) and save them as a new profile
            chromeStorageService.fetchUserSettings().then((userSettings: IUserSettings) => {

                let newAthleteProfile: IAthleteProfile = {
                    userGender: userSettings.userGender,
                    userMaxHr: userSettings.userMaxHr,
                    userRestHr: userSettings.userRestHr,
                    userFTP: userSettings.userFTP,
                    userWeight: userSettings.userWeight,
                };

                chromeStorageService.setLocalAthleteProfile(newAthleteProfile).then((savedAthleteProfile: IAthleteProfile) => {
                    console.log('Profile configured with', savedAthleteProfile);
                    chromeStorageService.getLocalAthleteProfile().then((localAthleteProfile: IAthleteProfile) => {
                        $scope.isLocalAthleteProfileConfigured = !_.isEmpty(localAthleteProfile);
                    });
                });
            });
        };

        /*
         $scope.$on(AthleteSettingsController.remoteAthleteProfileEqualsLocalMessage, (event: any, remoteAthleteProfileEqualsLocal: boolean) => {

         console.debug(event);
         console.debug(remoteAthleteProfileEqualsLocal + "");
         // $scope.checkAthleteSettingsRemoteLocalCompliance();
         $scope.showHistoryNonConsistent = !remoteAthleteProfileEqualsLocal;
         // TODO if same than remote then dont show ribbon
         // $scope.remoteAthleteProfileEqualsLocal()

         });

         */

        $scope.syncNow = (forceSync: boolean) => {
            localStorage.removeItem('localNotEqualsRemote');
            chrome.tabs.getCurrent((tab: Tab) => {
                $window.open('https://www.strava.com/dashboard?stravistixSync=true&forceSync=' + forceSync + '&sourceTabId=' + tab.id, '_blank', 'width=800, height=600, location=0');
            });
        };

        $scope.$on(AthleteSettingsController.changedAthleteProfileMessage, () => {
            $scope.showHistoryNonConsistent = true;
            localStorage.setItem('localNotEqualsRemote', 'true');
        });

    }
}

app.directive('profileConfiguredRibbon', [() => {

    return {
        controller: ProfileConfiguredRibbon,
        templateUrl: 'directives/templates/profileConfiguredRibbon.html'

    };
}]);