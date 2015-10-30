/**
 * Declaring MainController
 */
app.controller('MainController', function($scope, $location) {

    // Bootstrap active class name for active menu
    $scope.headerActiveClassName = 'active';

    // Clear healthSettings fields on call 
    $scope.resetFields = function() {
        $scope.CommonSettingsActive = null;
        $scope.healthSettingsActive = null;
        $scope.zonesSettingsActive = null;
        $scope.releaseNotesActive = null;
        $scope.aboutActive = null;
        $scope.donateActive = null;
        $scope.shareActive = null;
    };

    // Watch for location changes
    $scope.location = $location;
    $scope.$watch('location.path()', function(path) {

        // Reset header li element classes on watch path change
        $scope.resetFields();

        // Apply proper
        if (path === Config.routeMap.commonSettingsRoute) {

            $scope.CommonSettingsActive = $scope.headerActiveClassName;

        } else if (path === Config.routeMap.healthSettingsRoute) {

            $scope.healthSettingsActive = $scope.headerActiveClassName;

        } else if (path === Config.routeMap.zonesSettingsRoute) {

            $scope.zonesSettingsActive = $scope.headerActiveClassName;

        } else if (path === Config.routeMap.releaseNotesRoute) {

            $scope.releaseNotesActive = $scope.headerActiveClassName;

        } else if (path === Config.routeMap.aboutRoute) {

            $scope.aboutActive = $scope.headerActiveClassName;

        } else if (path === Config.routeMap.donateRoute) {

            $scope.donateActive = $scope.headerActiveClassName;

        } else if (path === Config.routeMap.shareRoute) {

            $scope.shareActive = $scope.headerActiveClassName;
        }
    });
});
