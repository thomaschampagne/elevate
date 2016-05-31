app.factory('ChromeStorageService', function() {

    chromeStorageService = {};

    chromeStorageService.fetchUserSettings = function(callback) {
        chrome.storage.sync.get(userSettings, function(userSettingsSynced) {
            callback(userSettingsSynced);
        });
    };

    chromeStorageService.updateUserSetting = function(key, value, callback) {

        var settingToBeUpdated = {};

        if (key.split('.').length > 1) { // Supporting keys saving path eg: targets.year.Ride

            var settingToBeUpdatedAsStr = "{@}";
            _.each(key.split('.'), function(key, index, list) {
                key = '"' + key + '"';
                if (index === 0) {
                    settingToBeUpdatedAsStr = settingToBeUpdatedAsStr.replace('@', key + ':{@}');
                } else if (index < list.length - 1) {
                    settingToBeUpdatedAsStr = settingToBeUpdatedAsStr.replace('@', key + ':{@}');
                } else if (index === list.length - 1) { // end
                    settingToBeUpdatedAsStr = settingToBeUpdatedAsStr.replace('@', key + ':' + value);
                }
            });
            settingToBeUpdated = JSON.parse(settingToBeUpdatedAsStr);
        } else {
            settingToBeUpdated[key] = value;
        }

        console.debug('Update with: ' + settingToBeUpdated);

        chrome.storage.sync.set(settingToBeUpdated, function() {
            callback();
        });
    };
    return chromeStorageService;
});
