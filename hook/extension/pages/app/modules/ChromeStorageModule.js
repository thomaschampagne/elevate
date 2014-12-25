var ChromeStorageModule = angular.module("ChromeStorageModule", ['']);

ChromeStorageModule.fetchUserSettings = function(callback) {
    chrome.storage.sync.get(userSettings, function(userSettingsSynced) {
        callback(userSettingsSynced);
    });
};

ChromeStorageModule.updateUserSetting = function(key, value, callback) {

    var settingToBeUpdated = {};
    settingToBeUpdated[key] = value;
    chrome.storage.sync.set(settingToBeUpdated, function() {
        callback();
    });
};
