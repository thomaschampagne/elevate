// Data Access Object Service
app.config(['$provide', function($provide) {

    $provide.factory('DaoService', function($http, $q, $location) {

        var DaoService = {};

        DaoService.saveToLocal = function(key, value, callback) {
            var obj = {};
            obj[key] = value;
            chrome.storage.local.set(obj);
            if (callback) {
                chrome.storage.local.get(key, function(savedObject) {
                    callback(savedObject);
                });
            }
        };

        DaoService.getFromLocal = function(key, callback) {
            chrome.storage.local.get(key, function(val) {
                callback(val);
            });
        };

        return DaoService;
    });
}]);