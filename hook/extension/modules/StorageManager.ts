class StorageManager {

    public static storageSyncType: string = 'sync';
    public static storageLocalType: string = 'local';
    private storageType: string;

    constructor(storageType: string) {
        this.storageType = storageType;
    }

    public static setCookie(cname: string, cvalue: any, exdays: number): void {
        let d: Date = new Date();
        d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
        let expires = "expires=" + d.toUTCString();
        document.cookie = cname + "=" + cvalue + "; " + expires + "; path=/";
    }

    public static setCookieSeconds(cname: string, cvalue: any, seconds: number): void {
        let d: Date = new Date();
        d.setTime(d.getTime() + (seconds * 1000));
        let expires = "expires=" + d.toUTCString();
        document.cookie = cname + "=" + cvalue + "; " + expires + "; path=/";
    }

    public static getCookie(cname: string): string {
        let name: string = cname + "=";
        let ca: Array<string> = document.cookie.split(';');
        for (let i: number = 0; i < ca.length; i++) {
            let c: string = ca[i];
            while (c.charAt(0) === ' ') c = c.substring(1);
            if (c.indexOf(name) != -1) return c.substring(name.length, c.length);
        }
        return null;
    }

    public getFromStorage(key: string, callback: (result: any) => void): void {

        console.debug('GETTING: ' + key);

        this.hasChromeLastError();

        if (this.storageType === 'sync') {
            chrome.storage.sync.get(userSettings, function (userSettingsResponseData) {
                console.log(userSettingsResponseData);
                let result: any = userSettingsResponseData[key];
                result = (typeof result === 'undefined') ? null : result;
                console.debug('HAS BEEN GET: ' + key + ' has value of: ', result);
                callback(result);
            });
        } else if (this.storageType === 'local') {
            chrome.storage.local.get([key], function (value) {
                value = value[key];
                value = (typeof value === 'undefined') ? null : value;
                callback(value);
            });
        } else {
            console.error('Storage type not available');
        }
    }

    public setToStorage(key: string, value: any, callback: (userSettingsResponseData: any) => void): void {

        console.debug('SETTING: ' + key + '=' + value);

        this.hasChromeLastError();

        if (this.storageType === 'sync') {

            chrome.storage.sync.get(userSettings, function (userSettingsResponseData) {

                userSettingsResponseData[key] = value; // Set value to key

                chrome.storage.sync.set(userSettingsResponseData, function () {
                    // Reload and callback sync get values
                    chrome.storage.sync.get(userSettings, function (userSettingsResponseData) {

                        console.debug('HAS BEEN SET: ' + key + ' has now value of: ', userSettingsResponseData[key]);

                        callback(userSettingsResponseData);

                    });
                });
            });
        } else if (this.storageType === 'local') {

            chrome.storage.local.get(null, function (allData) {
                allData[key] = value;
                chrome.storage.local.set(allData);
                callback(allData);
            });
        } else {
            console.error('Storage type not available');
        }
    }

    protected hasChromeLastError() {
        if (chrome.runtime.lastError) {
            console.warn(chrome.runtime.lastError.message);
        }
    }

    public printStorage(): void {
        if (this.storageType === 'sync') {
            chrome.storage.sync.get(null, function (data) {
                console.log(data);
            });

        } else if (this.storageType === 'local') {
            chrome.storage.local.get(null, function (data) {
                console.log(data);
            });

        } else {
            console.error('Storage type not available');
        }
    }

}
