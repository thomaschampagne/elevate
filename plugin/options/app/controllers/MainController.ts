import ILocationService = angular.ILocationService;
import IDialogService = angular.material.IDialogService;
import ISidenavService = angular.material.ISidenavService;
import IWindowService = angular.IWindowService;
import IScope = angular.IScope;
import ITimeoutService = angular.ITimeoutService;
import ISCEService = angular.ISCEService;
import IAnchorScrollService = angular.IAnchorScrollService;
import IAnchorScrollProvider = angular.IAnchorScrollProvider;
import IConfirmDialog = angular.material.IConfirmDialog;
import IPromptDialog = angular.material.IPromptDialog;
import IIntervalService = angular.IIntervalService;
import IMedia = angular.material.IMedia;

class MainController {

    static $inject = ['$rootScope', 'ChromeStorageService', '$scope', '$location', '$mdSidenav', '$colors', '$mdDialog', '$window', '$interval', '$mdMedia'];

    constructor($rootScope: any, chromeStorageService: ChromeStorageService, $scope: any, $location: ILocationService, $mdSidenav: ISidenavService, $colors: any, $mdDialog: IDialogService, $window: IWindowService, $interval: IIntervalService, $mdMedia: IMedia) {

        $scope.colors = $colors;

        $scope.updateLastSyncDateDisplay = () => {
            chromeStorageService.getLastSyncDate().then((lastSyncDate: number) => {

                $rootScope.lastSyncDate = lastSyncDate;

                if ($rootScope.lastSyncDate === -1) {
                    // No sync done
                    // Must perform first sync
                    $scope.lastSyncDateDisplay = "Sync your history";

                } else {
                    // A previous sync exists...
                    $scope.lastSyncDateDisplay = "Synced " + moment($scope.lastSyncDate).fromNow();
                }
            });
        };

        // Check if user has already synced his activities
        $scope.updateLastSyncDateDisplay();
        $interval($scope.updateLastSyncDateDisplay, 1000 * 60); // Refresh LastSyncDate displayed every minutes

        // Watch for window resize under 'gt-md' then dispatch event
        $scope.$watch(() => {
            return $mdMedia('gt-md');
        }, (greaterThanMid: boolean) => {
            $scope.sideNavLockedOpen = greaterThanMid;
            setTimeout(() => {
                $rootScope.$broadcast('window-resize-gt-md'); // Emit event after 750ms
            }, 750);
        });

        $scope.toggleSidenav = (menu: string) => {
            $mdSidenav(menu).toggle();
        };

        $scope.forward = (target: any) => {

            if (target.message) {
                let dialog = $mdDialog.confirm()
                    .htmlContent(target.message)
                    .cancel('Hide').ok('Push project higher !');
                $mdDialog.show(dialog).then(() => {
                    $scope.showDonation();
                }, () => {
                    // Ok click
                });

            } else {
                // Update title page
                $scope.pageTitle = (target.subname) ? target.subname : target.name;
                $location.path(target.link);
            }
        };

        $scope.uiStructure = {
            mainTitle: 'Stravistix',
            sidenav: {
                sections: [{
                    id: 'FITNESS_TREND',
                    name: 'Multisports Fitness Trend',
                    // subname: 'Multisports fitness trend based on activities having HR sensor',
                    sup: 'BETA',
                    icon: 'timeline',
                    link: routeMap.fitnessTrendRoute,
                }, {
                    id: 'YEAR_PROGRESSION',
                    sup: 'NEW',
                    name: 'Year Progressions',
                    icon: 'timelapse',
                    link: routeMap.yearProgressRoute,
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
                    },{
                        name: 'Running Power',
                        subname: 'Customize Running Power zones',
                        icon: 'flash_on',
                        link: routeMap.zonesSettingsRoute + '/runningPower'
                    },  {
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
                }, {
                    id: 'DASHBOARD',
                    name: 'Dashboard',
                    icon: 'dashboard',
                    link: 'link',
                    sup: 'SOON',
                    message: '<strong>Work in progress feature</strong></br></br>- Interrogate any stats of your history on a period. STX extended stats included.</br>- Interrogate by sports, by bike, ...</br>- Result goes in a tile in dashboard.</br>- Assign target in option: min, max, average or total to reach.</br>- Fully customisable.',
                }, {
                    id: 'ACTIVITIES_GRID',
                    name: 'Grid',
                    icon: 'grid_on',
                    link: 'link',
                    sup: 'SOON',
                    message: '<strong>Work in progress feature</strong></br></br>- All your activities in a table: <i>A column = A stat</i></br>- STX extended stats included.</br>- Fast searching along stats: Best TRIMP activity? Best W/KG ride ever? ...',
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
         * Strava club page
         */
        $scope.openStravaClub = () => {
            $window.open('https://www.strava.com/clubs/stravistix', '_blank');
        };

        /**
         * FAQ
         */
        $scope.openFAQ = () => {
            $window.open('https://github.com/thomaschampagne/stravistix/wiki/Frequently-Asked-Questions', '_blank');
        };

        /**
         * bug report
         */
        $scope.openBugReport = () => {
            let newIssueURL: string = 'https://github.com/thomaschampagne/stravistix/issues/new?body=**Bug%20description:**%20%0A%0A**Actual%20Behavior:**%20%0A%0A**Expected%20Behavior:**%20%0A%0A**Steps%20to%20Reproduce:**%20%0A-%20...%0A%20-%20...%0A%20-%20...%0A%0A**Chrome%20version**%20%0A%0A**Plugin%20version:**%20%0A%0A**Activities%20links?:**%20%0A%0A**Console%20errors?%20(press%20F12%20to%20see%20developer%20console,%20and%20copy%20paste%20here):**%20%0A%0A```%20%0Aput%20console%20errors%20here%20if%20exist%20%0A```%20%0A%0A**Link%20screenshots%20or%20youtube%20video%20link%20if%20necessary:**';
            $window.open(newIssueURL, '_blank');
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
                controller: ($scope: any, ReleaseNotesService: ReleaseNotesService, $window: IWindowService) => {

                    $scope.releaseNotes = ReleaseNotesService.data;

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
                    chromeStorageService.getLocalStorageUsage().then((storageUsage: IStorageUsage) => {
                        $scope.storageUsage = 'History size: ' + (storageUsage.bytesInUse / (1024 * 1024)).toFixed(1) + 'MB.';
                    });
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

        $scope.syncNow = (forceSync: boolean) => {
            chrome.tabs.getCurrent((tab: Tab) => {
                $window.open('https://www.strava.com/dashboard?stravistixSync=true&forceSync=' + forceSync + '&sourceTabId=' + tab.id, '_blank', 'width=700, height=675, location=0');
            });
        };

        $scope.clearHistory = () => {
            let confirm = $mdDialog.confirm()
                .title('Are you sure to delete your history?')
                .textContent('Performing this action will clear your history of activities synced. Features which depends of your history will not be displayed anymore until you perform a new synchronization.')
                .ariaLabel('Are you sure to delete your history?')
                .ok('Delete my history')
                .cancel('Cancel');

            $mdDialog.show(confirm).then(() => {

                chromeStorageService.removeFromLocalStorage('computedActivities').then(() => {
                    return chromeStorageService.removeFromLocalStorage('lastSyncDateTime');
                }).then(() => {
                    return chromeStorageService.removeFromLocalStorage('syncWithAthleteProfile');
                }).then(() => {
                    $window.location.reload();
                });

            }, () => {
                // Cancel.. do nothing
            });
        };

        $scope.saveHistory = () => {
            chromeStorageService.getAllFromLocalStorage().then((data: any) => {
                data = _.pick(data, 'lastSyncDateTime', 'syncWithAthleteProfile', 'computedActivities'); // Filter data to keep

                if (_.isEmpty(data.computedActivities)) {
                    alert("No history to backup. Perform full sync at first");
                    return;
                }

                // Append current version
                data.pluginVersion = chrome.runtime.getManifest().version;
                let blob = new Blob([angular.toJson(data)], {type: "application/json; charset=utf-8"});
                let filename = moment().format('Y.M.D-H.mm') + '_v' + data.pluginVersion + '.history.json';
                saveAs(blob, filename);

                let dialog = $mdDialog.alert()
                    .htmlContent('<i>' + filename + '</i> file should be dropped in your download folder.')
                    .ok('Got it !');
                $mdDialog.show(dialog);
            });
        };

        $scope.restoreHistory = () => {

            $mdDialog.show({
                controller: ($scope: any) => {
                    $scope.hide = () => {
                        $mdDialog.hide();
                    };
                },
                templateUrl: 'views/modals/restoreHistory.html',
                parent: angular.element(document.body),
                clickOutsideToClose: true
            });
        };
    }
}

app.controller('MainController', MainController);