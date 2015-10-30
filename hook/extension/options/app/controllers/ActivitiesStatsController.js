app.controller("ActivitiesStatsController", ['$scope', '$location', 'SyncService', 'TokenService', function($scope, $location, SyncService, TokenService) {

    
    $scope.crop = function() {
        var currentActivitiesOnStorage = angular.fromJson(localStorage.getItem('activities'));
        currentActivitiesOnStorage = currentActivitiesOnStorage.slice(10);
        localStorage.setItem('activities', angular.toJson(currentActivitiesOnStorage));
        $scope.loadActivities();
    };
    

    $scope.loadActivities = function() {
        var currentActivitiesOnStorage = angular.fromJson(localStorage.getItem('activities'));
        $scope.activities = currentActivitiesOnStorage;
        // Update displayed count
        $scope.activitiesCount = (currentActivitiesOnStorage) ? currentActivitiesOnStorage.length : 0;
    };

    $scope.sync = function() { // Sync button listener

        $scope.isSyncing = true;

        SyncService.sync($scope.stravaAccessToken).then(function() {

            console.log('Sync finished');

            // Sync done
            $scope.isSyncing = false;

            // Update last sync date
            localStorage.setItem('lastSyncDate', Math.floor(Date.now() / 1000));

            $scope.loadActivities();

        }, function(error) {
            // Sync error
            $scope.isSyncing = false;
            $scope.syncError = error;

        }, function(update) {
            // Sync update
            $scope.syncUpdate = update;
        });
    };

    $scope.loadActivities();

    $scope.isSyncing = false;

    // If no access token, user should have one
    // Display button to connect to strava with this data binding and ng-hide
    $scope.stravaAccessToken = TokenService.getStravaAccessToken();

    if ($scope.stravaAccessToken) {
        console.debug('Cool we have the access token: ' + $scope.stravaAccessToken);

        $scope.sync();

    } else {
        console.debug('No access token retrieved');

        $scope.stravaApiAuthorizeUrl = 'https://www.strava.com/oauth/authorize?client_id=' + Config.stravaApiClientId + '&redirect_uri=' + Config.stravaApiCallBackUrl + '?thenFwdTo=' + btoa(Config.stravaApiFwdToUrl) + '&response_type=code&scope=view_private';
        // Show button to connect
        $scope.connectToStravaButton = true;
    }
}]);
