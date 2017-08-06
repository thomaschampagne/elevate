class InstallUpdateHandler {

    protected static handleInstall() {

        chrome.tabs.create({
            url: "http://thomaschampagne.github.io/stravistix/", // TODO Get from config/constants
        }, (tab: chrome.tabs.Tab) => {
            console.log("First install. Display website new tab:", tab);
            chrome.tabs.create({
                url: chrome.extension.getURL("/options/app/index.html#!/"), // TODO Get from config/constants
            }, (tab: chrome.tabs.Tab) => {
                console.log("First install. Display settings:", tab);
            });
        });
    }

    protected static getUserSettings(): Promise<any> {
        return new Promise<any>((resolve, reject) => {
            SystemJS.import("common/scripts/UserSettings.js").then((module) => {
                resolve(module.userSettings);
            }, (err) => {
                reject(err);
            });
        });
    }

    protected static getHelper(): Promise<any> {
        return new Promise<any>((resolve, reject) => {
            SystemJS.import("common/scripts/Helper.js").then((module) => {
                resolve(module.Helper);
            }, (err) => {
                reject(err);
            });
        });
    }

    protected static getStorageManager(): Promise<any> {
        return new Promise<any>((resolve, reject) => {
            SystemJS.import("common/scripts/modules/StorageManager.js").then((module) => {
                resolve(module.StorageManager);
            }, (err) => {
                reject(err);
            });
        });
    }

    public static listen() {

        chrome.runtime.onInstalled.addListener((details) => {
            if (details.reason === "install") {
                this.handleInstall(); // Pop in tab webapp and plugin page
            } else if (details.reason === "update") {
                this.handleUpdate(details);
            }
        });
    }

    protected static handleUpdate(details: any) {

        const thisVersion: string = chrome.runtime.getManifest().version;

        console.log("Updated from " + details.previousVersion + " to " + thisVersion + "!");

        Promise.all([
            this.getUserSettings(),
            this.getHelper(),
            this.getStorageManager(),
        ]).then((modules) => {

            const userSettings = modules[0];
            const Helper = modules[1];
            const StorageManager = modules[2];

            console.debug("UserSettings on update", userSettings);

            // Clear local history if coming from version under 5.1.1
            if (Helper.versionCompare("5.1.1", details.previousVersion) === 1) {
                this.clearSyncCache(StorageManager);
            }

        }, (err) => {
            console.error(err);
        });
    }

    protected static clearSyncCache(injectedStorageManagerModule: any): void {

        const storageManagerOnLocal = new injectedStorageManagerModule(); // typeof StorageManager
        const storageType: string = injectedStorageManagerModule.storageLocalType;

        storageManagerOnLocal.removeFromStorage(storageType, "computedActivities", () => {
            storageManagerOnLocal.removeFromStorage(storageType, "lastSyncDateTime", () => {
                storageManagerOnLocal.removeFromStorage(storageType, "syncWithAthleteProfile", () => {
                    console.log("Local History cleared");
                });
            });
        });
    }
}

InstallUpdateHandler.listen();
