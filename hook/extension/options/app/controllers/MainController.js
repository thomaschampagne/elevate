/**
 * Declaring MainController
 */
app.controller('MainController', function($scope, $location, $mdSidenav, $mdToast, $colors, $mdDialog, $routeParams, $window) {

    $scope.$colors = $colors;

    $scope.toggleSidenav = function(menu) {
        $mdSidenav(menu).toggle();
    };

    $scope.forward = function(target) {
        // Update title page
        // $scope.updateTitle(target);
        $scope.pageTitle = (target.subname) ? target.subname : target.name;
        $location.path(target.link);
    };

    $scope.uiStructure = {
        mainTitle: 'Stravistix',
        sidenav: {
            sections: [{
                name: 'Fitness Trend',
                icon: 'fitness_center',
                link: routeMap.fitnessTrendRoute,
            }, {
                name: 'Activities Grid',
                icon: 'grid_on',
                link: 'link',
                hide: true
            }, {
                name: 'Targets',
                icon: 'adjust',
                link: 'link',
                hide: true
            }, {
                name: 'Year progression',
                icon: 'show_chart',
                link: 'link',
                hide: true
            }, {
                name: 'Fitness Trend',
                icon: 'fitness_center',
                link: 'link',
                hide: true
            }, {
                name: 'Activities Grid',
                icon: 'grid_on',
                link: 'link',
                hide: true
            }, {
                name: 'Targets',
                icon: 'adjust',
                link: 'link',
                hide: true
            }, {
                name: 'Year progression',
                icon: 'show_chart',
                link: 'link',
                hide: true
            }, {
                name: 'Common Settings',
                icon: 'settings',
                link: routeMap.commonSettingsRoute
            }, {
                name: 'Athlete Settings',
                icon: 'accessibility',
                link: routeMap.athleteSettingsRoute
            }, {
                name: 'Zones Settings',
                icon: 'format_line_spacing',
                expand: true,
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
                    name: 'Runing Pace',
                    subname: 'Customize Runing Pace zones',
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

    $scope.findCurrentPageTitle = function() {

        var path = $location.path();

        if (_.isEmpty(path)) {
            path = routeMap.commonSettingsRoute;
        }

        // Find subname or nam to auto put title on load
        var sectionFound = _.findWhere($scope.uiStructure.sidenav.sections, {
            link: $location.path()
        });

        if (sectionFound) {
            return (sectionFound.subname) ? sectionFound.subname : sectionFound.name;
        } else {

            var zonesSection = _.findWhere($scope.uiStructure.sidenav.sections, {
                name: 'Zones Settings'
            });

            var actionFound = _.findWhere(zonesSection.actions, {
                link: path
            });

            return (actionFound.subname) ? actionFound.subname : actionFound.name;
        }
    };

    setTimeout(function() { // When loaded..
        $scope.pageTitle = $scope.findCurrentPageTitle();
    });

    /**
     * Donations
     */
    $scope.showDonation = function() {

        $mdDialog.show({
            controller: function($scope, $window) {

                $scope.hide = function() {
                    $mdDialog.hide();
                };

                $scope.goToPaypal = function() {
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
    $scope.showSharing = function() {

        $mdDialog.show({
            controller: function($scope, $window) {

                $scope.hide = function() {
                    $mdDialog.hide();
                };

                $scope.shareTwitter = function() {
                    $window.open('https://twitter.com/intent/tweet?text=As%20%23strava%20user,%20you%20should%20try%20%23stravistix%20web%20extension%20by%20%40champagnethomas.%20Get%20it%20here%20%20http://thomaschampagne.github.io/stravistix/.%20%23cycling%20%23running%20%23geek', '_blank');
                };

                $scope.shareFacebook = function() {
                    $window.open('https://www.facebook.com/stravistixforstrava', '_blank');
                };

                $scope.shareDirect = function() {
                    $window.open('http://thomaschampagne.github.io/stravistix/', '_blank');
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
     * bug report
     */
    $scope.showBugReport = function() {
        $window.open('https://github.com/thomaschampagne/stravistix/issues', '_blank');
    };

    /**
     * Project sources
     */
    $scope.showProjectSources = function() {
        $window.open('https://github.com/thomaschampagne/stravistix/', '_blank');
    };

    /**
     * Release Notes
     */
    $scope.showReleaseNotes = function() {
        $mdDialog.show({
            controller: function($scope, ReleaseNotesService, $window) {

                $scope.releaseNotes = ReleaseNotesService.data;

                $scope.hide = function() {
                    $mdDialog.hide();
                };

                $scope.showVersionDiff = function(from, to) {
                    if (from && to) {
                        $window.open('https://github.com/thomaschampagne/stravistix/compare/' + from + '...' + to, '_blank');
                    }
                };

                $scope.showTwitter = function() {
                    $scope.$parent.showTwitter();
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
    $scope.showAbout = function() {
        $mdDialog.show({
            controller: function($scope) {
                $scope.hide = function() {
                    $mdDialog.hide();
                };
            },
            templateUrl: 'views/modals/about.html',
            parent: angular.element(document.body),
            clickOutsideToClose: true
        });
    };

    $scope.showTwitter = function() {
        $window.open('https://twitter.com/champagnethomas', '_blank');
    };
});
