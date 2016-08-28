app.factory('ReleaseNotesService', function() {

    var releaseNotesService = {};

    // releaseNotesService.fetchUserSettings = function(callback) {
    //     chrome.storage.sync.get(userSettings, function(userSettingsSynced) {
    //         callback(userSettingsSynced);
    //     });
    // };
    //
    // releaseNotesService.updateUserSetting = function(key, value, callback) {
    //     var settingToBeUpdated = {};
    //     settingToBeUpdated[key] = value;
    //     chrome.storage.sync.set(settingToBeUpdated, function() {
    //         callback();
    //     });
    // };

    console.log('ReleaseNotesService');

    return releaseNotesService;
});
