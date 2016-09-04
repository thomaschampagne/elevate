app.factory('ChromeStorageService', function() {

    var chromeStorageService = {};

    chromeStorageService.fetchUserSettings = function(callback) {
        chrome.storage.sync.get(userSettings, function(userSettingsSynced) {
            callback(userSettingsSynced);
        });
    };

    chromeStorageService.updateUserSetting = function(key, value, callback) {
        var settingToBeUpdated = {};
        settingToBeUpdated[key] = value;
        chrome.storage.sync.set(settingToBeUpdated, function() {
            callback();
        });
    };
    return chromeStorageService;
});
