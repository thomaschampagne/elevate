// Token Service
app.config(['$provide', function($provide) {
    $provide.factory('TokenService', function($http, $q, $location) {
        var TokenService = {};
        TokenService.tryToCatchAndSaveAccessTokenFromUrl = function() {
            if ($location.search().access_token) {
                localStorage.setItem('accessToken', $location.search().access_token);
            }
        };

        TokenService.getStravaAccessToken = function() { // TODO Move to Token Service
            TokenService.tryToCatchAndSaveAccessTokenFromUrl();
            return localStorage.getItem('accessToken');
        };

        return TokenService;
    });
}]);