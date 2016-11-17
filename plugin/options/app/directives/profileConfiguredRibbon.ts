interface IProfileConfiguredRibbonScope extends IScope {
    hideAndConfigureProfile: () => void;
    goToAthleteSettings: () => void;
    isProfileConfigured: boolean;
}

class ProfileConfiguredRibbon {

    static $inject: string[] = ['$scope', 'ChromeStorageService', '$location'];

    constructor(public $scope: IProfileConfiguredRibbonScope, public chromeStorageService: ChromeStorageService, public $location: ILocationService) {

        // Considering that profile is configured at first. It's a nominal state before saying that is isn't
        $scope.isProfileConfigured = true;

        // Retrieve profile configured...
        chromeStorageService.getProfileConfigured().then((profileConfigured) => {
            $scope.isProfileConfigured = profileConfigured || !_.isEmpty(profileConfigured);
        });

        $scope.goToAthleteSettings = () => {
            $location.path(routeMap.athleteSettingsRoute);
        };

        $scope.hideAndConfigureProfile = () => {
            chromeStorageService.setProfileConfigured(true).then(() => {
                console.log('Profile configured');
                $scope.isProfileConfigured = true;
            });
        };
    }
}

app.directive('profileConfiguredRibbon', [() => {

    return {
        controller: ProfileConfiguredRibbon,
        templateUrl: 'directives/templates/profileConfiguredRibbon.html'

    };
}]);