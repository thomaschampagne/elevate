/**
 * Declaring MainController
 */
app.controller('MainController', ['$scope', '$location', 'TranslationService', function($scope, $location, TranslationService) {

    // Start application activities only after translation initialization
    TranslationService.init(function () {
        $scope.common_title = TranslationService.formatMessage('settings/common_sec');
        $scope.health_title = TranslationService.formatMessage('settings/health_sec');
        $scope.zone_title = TranslationService.formatMessage('settings/zone_sec');
        $scope.rel_notes_title = TranslationService.formatMessage('settings/rel_notes_sec');
        $scope.about_title = TranslationService.formatMessage('settings/about_sec');
        $scope.donate_title = TranslationService.formatMessage('settings/donate_sec');
        $scope.share_title = TranslationService.formatMessage('settings/share_sec');
        $scope.what_next = TranslationService.formatMessage('settings/what_next');
        $scope.report_bug = TranslationService.formatMessage('settings/report_bug');
    });

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
        if (path === routeMap.commonSettingsRoute) {

            $scope.CommonSettingsActive = $scope.headerActiveClassName;

        } else if (path === routeMap.healthSettingsRoute) {

            $scope.healthSettingsActive = $scope.headerActiveClassName;

        } else if (path === routeMap.zonesSettingsRoute) {

            $scope.zonesSettingsActive = $scope.headerActiveClassName;

        } else if (path === routeMap.releaseNotesRoute) {

            $scope.releaseNotesActive = $scope.headerActiveClassName;

        } else if (path === routeMap.aboutRoute) {

            $scope.aboutActive = $scope.headerActiveClassName;

        } else if (path === routeMap.donateRoute) {

            $scope.donateActive = $scope.headerActiveClassName;

        } else if (path === routeMap.shareRoute) {

            $scope.shareActive = $scope.headerActiveClassName;
        }
    });
}]);
