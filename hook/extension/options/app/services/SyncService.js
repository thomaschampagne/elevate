// Synchronization Service
app.config(['$provide', function($provide) {

    $provide.factory('SyncService', function($http, $q, $location) {

        var SyncService = {};

        SyncService.sync = function(accessToken) {

            var deferred = $q.defer(); // Promise to sync

            this.accessToken = accessToken;

            // Check if cache exist
            var currentActivitiesOnStorage = angular.fromJson(localStorage.getItem('activities'));

            if (!_.isEmpty(currentActivitiesOnStorage)) {

                // Try to sync since last date now
                var untilTimestamp = localStorage.getItem('lastSyncDate');
                untilTimestamp = (untilTimestamp) ? untilTimestamp : 0;

                // Ask for activities until from timesptamp reached
                SyncService.fetchActivitiesRecursive(untilTimestamp, 25).then(function(result) {

                    // Update local storage
                    var newActivitiesOnStorage = _.flatten(_.union(result, currentActivitiesOnStorage));

                    // Sort by start_date descending
                    newActivitiesOnStorage = _.sortBy(newActivitiesOnStorage, function(item) {
                        return (new Date(item.start_date) * -1);
                    });

                    localStorage.setItem('activities', angular.toJson(newActivitiesOnStorage));

                    // Syncing with existing activities in sotrage finished :)
                    deferred.resolve();

                }, function(error) {
                    deferred.reject(error);
                    console.error(error);

                }, function(fetchedCount) {
                    deferred.notify(fetchedCount + ' activities fetch since timestamp: ' + untilTimestamp);
                });

            } else {

                // Fetch All 
                SyncService.fetchActivitiesRecursive().then(function(result) {

                    // Store result in local storage
                    localStorage.setItem('activities', angular.toJson(result));

                    // Syncing with no activities in sotrage finished :)
                    deferred.resolve();
                }, function(error) {
                    deferred.reject(error);
                    console.error(error);
                }, function(fetchedCount) {
                    deferred.notify('Fetched ' + fetchedCount + ' activities');
                });
            }

            return deferred.promise;
        };

        SyncService.fetchActivitiesRecursive = function(untilTimestamp, perPage, page, deferred, activitiesList) {

            if (!page) {
                page = 1; // Usually start from first page when no page given
            }

            if (!perPage) {
                perPage = 200; // Usually fetch 200 by 200 to reduce API calls
            }

            if (!deferred) {
                deferred = $q.defer();
            }

            if (!activitiesList) {
                activitiesList = [];
            }

            $http.get(Config.apiEndpoint + 'list?accessToken=' + this.accessToken + '&page=' + page + '&per_page=' + perPage)

            .then(function successCallback(response) {

                if (response.data.errors) { // Check for errors first

                    deferred.reject(response);

                } else { // No errors

                    if (_.isEmpty(response.data)) { // No more activities, fetching all is finished here

                        deferred.resolve(activitiesList);

                    } else {

                        // Syncing is asked until activity start date is lower than timestamp given
                        if (untilTimestamp) {

                            var activityCountOnCurrentPage = response.data.length;

                            // Filter activities with start date upper than untilTimestamp
                            var activitiesCompliantWithuntilTimestamp = _.filter(response.data, function(item) {
                                var startDate = Math.floor(new Date(item.start_date) / 1000);
                                return (startDate >= untilTimestamp);
                            });

                            // Append activities
                            activitiesList = _.flatten(_.union(activitiesCompliantWithuntilTimestamp, activitiesList));

                            if (activityCountOnCurrentPage > activitiesCompliantWithuntilTimestamp.length) {
                                deferred.notify(activitiesList.length);
                                deferred.resolve(activitiesList);
                            } else {
                                // Continue to fetch
                                SyncService.fetchActivitiesRecursive(untilTimestamp, perPage, page + 1, deferred, activitiesList);
                            }

                        } else {
                            // Append activities
                            activitiesList = _.flatten(_.union(activitiesList, response.data));
                            SyncService.fetchActivitiesRecursive(untilTimestamp, perPage, page + 1, deferred, activitiesList);
                        }

                        deferred.notify(activitiesList.length);
                    }
                }

            }, function errorCallback(error) {
                deferred.reject(error);
            });
            return deferred.promise;
        }

        return SyncService;
    });
}]);