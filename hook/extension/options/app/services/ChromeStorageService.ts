interface ChromeStorageService {
    fetchUserSettings: (callback: (userSettingsSynced: UserSettings) => void) => void;
    updateUserSetting: (key: string, value: any, callback: () => void) => void;
}

app.factory('ChromeStorageService', () => {

    let chromeStorageService: ChromeStorageService = {
        fetchUserSettings: null,
        updateUserSetting: null
    }

    chromeStorageService.fetchUserSettings = (callback: (userSettingsSynced: UserSettings) => void) => {
        chrome.storage.sync.get(userSettings, (userSettingsSynced: UserSettings) => {
            callback(userSettingsSynced);
        });
    };

    chromeStorageService.updateUserSetting = (key: string, value: any, callback: () => void) => {
        let settingToBeUpdated: any = {};
        settingToBeUpdated[key] = value;
        chrome.storage.sync.set(settingToBeUpdated, () => {
            callback();
        });
    };
    return chromeStorageService;
});
