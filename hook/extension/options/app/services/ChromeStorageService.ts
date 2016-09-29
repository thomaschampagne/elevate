interface IChromeStorageService {
    fetchUserSettings: (callback: (userSettingsSynced: IUserSettings) => void) => void;
    updateUserSetting: (key: string, value: any, callback: () => void) => void;
}

app.factory('ChromeStorageService', () => {

    let chromeStorageService: IChromeStorageService = {
        fetchUserSettings: null,
        updateUserSetting: null
    }

    chromeStorageService.fetchUserSettings = (callback: (userSettingsSynced: IUserSettings) => void) => {
        chrome.storage.sync.get(userSettings, (userSettingsSynced: IUserSettings) => {
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
