import ILocationService = angular.ILocationService;
import IDialogService = angular.material.IDialogService;
import ISidenavService = angular.material.ISidenavService;
import IWindowService = angular.IWindowService;
import IScope = angular.IScope;
import ITimeoutService = angular.ITimeoutService;
import ISCEService = angular.ISCEService;

class MainController {

    static $inject = ['$scope', '$location', '$mdSidenav', '$colors', '$mdDialog', '$window'];

    constructor($scope: any, $location: ILocationService, $mdSidenav: ISidenavService, $colors: any, $mdDialog: IDialogService, $window: IWindowService) {

        $scope.$colors = $colors;

        $scope.toggleSidenav = (menu: string) => {
            $mdSidenav(menu).toggle();
        };

        $scope.forward = (target: any) => {
            // Update title page
            $scope.pageTitle = (target.subname) ? target.subname : target.name;
            $location.path(target.link);
        };

        $scope.uiStructure = {
            mainTitle: 'Stravistix',
            sidenav: {
                sections: [{
                    id: 'FITNESS_TREND',
                    name: 'Fitness Trend',
                    icon: 'fitness_center',
                    link: routeMap.fitnessTrendRoute,
                }, {
                    id: 'ACTIVITIES_GRID',
                    name: 'Activities Grid',
                    icon: 'grid_on',
                    link: 'link',
                    hide: true
                }, {
                    id: 'TARGETS',
                    name: 'Targets',
                    icon: 'adjust',
                    link: 'link',
                    hide: true
                }, {
                    id: 'YEAR_PROGRESSION',
                    name: 'Year progression',
                    icon: 'show_chart',
                    link: 'link',
                    hide: true
                }, {
                    id: 'COMMON_SETTINGS',
                    name: 'Common Settings',
                    icon: 'settings',
                    link: routeMap.commonSettingsRoute
                }, {
                    id: 'ATHLETE_SETTINGS',
                    name: 'Athlete Settings',
                    icon: 'accessibility',
                    link: routeMap.athleteSettingsRoute
                }, {
                    id: 'ZONES_SETTINGS',
                    name: 'Zones Settings',
                    icon: 'format_line_spacing',
                    expand: false,
                    link: 'link',
                    actions: [{
                        name: 'Heart rate reserve',
                        subname: 'Customize Heartrate Reserve zones',
                        icon: 'favorite',
                        link: routeMap.hrrZonesSettingsRoute
                    }, {
                        name: 'Cycling Speed',
                        subname: 'Customize Cycling Speed zones',
                        icon: 'directions_bike',
                        link: routeMap.zonesSettingsRoute + '/speed'
                    }, {
                        name: 'Running Pace',
                        subname: 'Customize Running Pace zones',
                        icon: 'directions_walk',
                        link: routeMap.zonesSettingsRoute + '/pace'
                    }, {
                        name: 'Cycling Power',
                        subname: 'Customize Cycling Power zones',
                        icon: 'flash_on',
                        link: routeMap.zonesSettingsRoute + '/power'
                    }, {
                        name: 'Cycling Cadence',
                        subname: 'Customize Cycling Cadence zones',
                        icon: 'autorenew',
                        link: routeMap.zonesSettingsRoute + '/cyclingCadence'
                    }, {
                        name: 'Running Cadence',
                        subname: 'Customize Running Cadence zones',
                        icon: 'transfer_within_a_station',
                        link: routeMap.zonesSettingsRoute + '/runningCadence'
                    }, {
                        name: 'Grade',
                        subname: 'Customize Grade zones',
                        icon: 'trending_up',
                        link: routeMap.zonesSettingsRoute + '/grade'
                    }, {
                        name: 'Elevation',
                        subname: 'Customize Elevation zones',
                        icon: 'terrain',
                        link: routeMap.zonesSettingsRoute + '/elevation'
                    }, {
                        name: 'Cycling Ascent Speed',
                        subname: 'Customize Cycling Ascent Speed zones',
                        icon: 'call_made',
                        link: routeMap.zonesSettingsRoute + '/ascent'
                    }]
                }]
            }
        };

        $scope.updateMenuAndToolbarAlongPageLoaded = () => {

            let path: string = $location.path();

            if (_.isEmpty(path)) {
                path = routeMap.commonSettingsRoute;
            }

            // Find subname or name to auto put title on load
            let sectionFound: any = _.findWhere($scope.uiStructure.sidenav.sections, {
                link: $location.path()
            });

            if (sectionFound) {
                $scope.pageTitle = (sectionFound.subname) ? sectionFound.subname : sectionFound.name;
            } else {

                // Actions... of a section
                let sectionsWithActions: any = _.filter($scope.uiStructure.sidenav.sections, (section: any) => {
                    return !_.isEmpty(section.actions);
                });

                let actionFound: any;
                for (let i = 0; i < sectionsWithActions.length; i++) {

                    let section: any = sectionsWithActions[i];
                    actionFound = _.findWhere(section.actions, {
                        link: path
                    });

                    if (actionFound) {
                        section.expand = true; // Ensure to open menu of selected sub-actions
                        break;
                    }
                }

                if (!actionFound) {
                    $scope.pageTitle = '';
                } else {
                    $scope.pageTitle = (actionFound.subname) ? actionFound.subname : actionFound.name;
                }
            }
        };

        setTimeout(() => { // When loaded..
            $scope.updateMenuAndToolbarAlongPageLoaded();
        });

        /**
         * Donations
         */
        $scope.showDonation = () => {

            $mdDialog.show({
                controller: ($scope: any, $window: IWindowService) => {

                    $scope.hide = () => {
                        $mdDialog.hide();
                    };

                    $scope.goToPaypal = () => {
                        $window.open('https://www.paypal.me/thomaschampagne/' + properties.donateAmount, '_blank');
                    };
                },
                templateUrl: 'views/modals/donate.html',
                parent: angular.element(document.body),
                clickOutsideToClose: true
            });
        };

        if (!_.isEmpty($location.search().showDonation)) {
            $scope.showDonation();
        }

        /**
         * Sharing
         */
        $scope.showSharing = () => {

            $mdDialog.show({
                controller: ($scope: any, $window: IWindowService) => {

                    $scope.hide = () => {
                        $mdDialog.hide();
                    };

                    $scope.shareTwitter = () => {
                        $window.open('https://twitter.com/intent/tweet?text=As%20%23strava%20user,%20you%20should%20try%20%23stravistix%20web%20extension%20by%20%40champagnethomas.%20Get%20it%20here%20%20http://thomaschampagne.github.io/stravistix/.%20%23cycling%20%23running%20%23geek', '_blank');
                    };

                    $scope.shareFacebook = () => {
                        $window.open('https://www.facebook.com/stravistixforstrava', '_blank');
                    };

                    $scope.openPluginPage = () => {
                        $scope.$parent().openPluginPage();
                    };

                },
                templateUrl: 'views/modals/share.html',
                parent: angular.element(document.body),
                clickOutsideToClose: true
            });
        };
        if (!_.isEmpty($location.search().showSharing)) {
            $scope.showSharing();
        }

        /**
         * Plugin page
         */
        $scope.openPluginPage = () => {
            $window.open('http://thomaschampagne.github.io/stravistix/', '_blank');
        };

        /**
         * bug report
         */
        $scope.openBugReport = () => {
            $window.open('https://github.com/thomaschampagne/stravistix/issues', '_blank');
        };

        /**
         * Project sources
         */
        $scope.openProjectSources = () => {
            $window.open('https://github.com/thomaschampagne/stravistix/', '_blank');
        };

        /**
         * Release Notes
         */
        $scope.showReleaseNotes = () => {
            $mdDialog.show({
                controller: ($scope: any, releaseNotesService: ReleaseNotesService, $window: IWindowService) => {

                    $scope.releaseNotes = releaseNotesService.data;

                    $scope.hide = () => {
                        $mdDialog.hide();
                    };

                    $scope.showVersionDiff = (from: string, to: string) => {
                        if (from && to) {
                            $window.open('https://github.com/thomaschampagne/stravistix/compare/' + from + '...' + to, '_blank');
                        }
                    };

                    $scope.openTwitter = () => {
                        $scope.$parent.openTwitter();
                    };

                },
                templateUrl: 'views/modals/releaseNotes.html',
                scope: $scope.$new(),
                parent: angular.element(document.body),
                clickOutsideToClose: true
            });
        };
        if (!_.isEmpty($location.search().showReleaseNotes)) {
            $scope.showReleaseNotes();
        }

        /**
         * About
         */
        $scope.showAbout = () => {
            $mdDialog.show({
                controller: ($scope: any) => {
                    $scope.hide = () => {
                        $mdDialog.hide();
                    };
                },
                templateUrl: 'views/modals/about.html',
                parent: angular.element(document.body),
                clickOutsideToClose: true
            });
        };

        $scope.openTwitter = () => {
            $window.open('https://twitter.com/champagnethomas', '_blank');
        };

    }
}


app.controller('MainController', MainController);
