import {userSettings} from "../UserSettings";

export interface IStorageUsage {
    bytesInUse: number;
    quotaBytes: number;
    percentUsage: number;
}

export class StorageManager {

    public static storageSyncType: string = "sync";
    public static storageLocalType: string = "local";

    public static setCookie(cname: string, cvalue: any, exdays: number): void {
        const d: Date = new Date();
        d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
        const expires = "expires=" + d.toUTCString();
        document.cookie = cname + "=" + cvalue + "; " + expires + "; path=/";
    }

    public static setCookieSeconds(cname: string, cvalue: any, seconds: number): void {
        const d: Date = new Date();
        d.setTime(d.getTime() + (seconds * 1000));
        const expires = "expires=" + d.toUTCString();
        document.cookie = cname + "=" + cvalue + "; " + expires + "; path=/";
    }

    public static getCookie(cname: string): string {
        const name: string = cname + "=";
        const ca: string[] = document.cookie.split(";");
        for (let i: number = 0; i < ca.length; i++) {
            let c: string = ca[i];
            while (c.charAt(0) === " ") c = c.substring(1);
            if (c.indexOf(name) != -1) return c.substring(name.length, c.length);
        }
        return null;
    }

    public getFromStorage(storageType: string, key: string, callback: (result: any) => void): void {

        const accessMethod = "[getFromStorage<" + storageType + ">]";

        console.debug(accessMethod + " with key <" + key + ">");

        this.hasChromeLastError();

        if (storageType === "sync") {

            chrome.storage.sync.get(userSettings, function(userSettingsResponseData) {
                console.log(userSettingsResponseData);
                let result: any = userSettingsResponseData[key];
                result = (typeof result === "undefined") ? null : result;
                console.debug("HAS BEEN GET: " + key + " has value of: ", result);
                callback(result);
            });

        } else if (storageType === "local") {

            chrome.storage.local.get([key], function(result) {
                result = result[key];
                console.debug(accessMethod + " " + key + " @ chrome.storage.local = ", result);
                result = (typeof result === "undefined") ? null : result;
                console.debug(accessMethod + " Reply with " + key + " = ", result);
                callback(result);
            });

        } else {
            console.error("Storage type not available");
        }
    }

    public setToStorage(storageType: string, key: string, value: any, callback: (userSettingsResponseData: any) => void): void {

        console.debug("setToStorage: " + key + "=" + value);

        this.hasChromeLastError();

        if (storageType === "sync") {

            chrome.storage.sync.get(userSettings, function(userSettingsResponseData) {

                userSettingsResponseData[key] = value; // Set value to key

                chrome.storage.sync.set(userSettingsResponseData, function() {
                    // Reload and callback sync get values
                    chrome.storage.sync.get(userSettings, function(userSettingsResponseData) {

                        console.debug("HAS BEEN SET: " + key + " has now value of: ", userSettingsResponseData[key]);

                        callback(userSettingsResponseData);

                    });
                });
            });

        } else if (storageType === "local") {

            chrome.storage.local.get(null, function(allData) {
                allData[key] = value;
                chrome.storage.local.set(allData);
                callback(allData);
            });
        } else {
            console.error("Storage type not available");
        }
    }

    public removeFromStorage(storageType: string, key: string, callback: (chromeRuntimeError: chrome.runtime.LastError) => void): void {

        this.hasChromeLastError();

        if (storageType === "sync") {
            chrome.storage.sync.remove([key], () => {
                callback((chrome.runtime.lastError) ? chrome.runtime.lastError : null);
            });
        } else if (storageType === "local") {
            chrome.storage.local.remove([key], () => {
                callback((chrome.runtime.lastError) ? chrome.runtime.lastError : null);
            });

        } else {
            console.error("Storage type not available");
        }

    }

    getStorageUsage(storageType: string, callback: (response: IStorageUsage) => void) {

        this.hasChromeLastError();

        if (storageType === "local") {
            chrome.storage.local.getBytesInUse((bytesInUse: number) => {

                callback({
                    bytesInUse,
                    quotaBytes: chrome.storage.local.QUOTA_BYTES,
                    percentUsage: bytesInUse / chrome.storage.local.QUOTA_BYTES * 100,
                } as IStorageUsage);
            });
        } else if (storageType === "sync") {
            chrome.storage.sync.getBytesInUse((bytesInUse: number) => {
                callback({
                    bytesInUse,
                    quotaBytes: chrome.storage.local.QUOTA_BYTES,
                    percentUsage: bytesInUse / chrome.storage.sync.QUOTA_BYTES * 100,
                } as IStorageUsage);
            });

        } else {
            console.error("Storage type not available");
        }

    }

    protected hasChromeLastError() {
        if (chrome.runtime.lastError) {
            console.error(chrome.runtime.lastError.message);
        }
    }

    public printStorage(storageType: string): void {
        if (storageType === "sync") {
            chrome.storage.sync.get(null, function(data) {
                console.log(data);
            });

        } else if (storageType === "local") {
            chrome.storage.local.get(null, function(data) {
                console.log(data);
            });

        } else {
            console.error("Storage type not available");
        }
    }
}
