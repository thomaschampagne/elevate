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

            // Move & convert userHrrZones to generic heartrate zones
            if (Helper.versionCompare("5.11.0", details.previousVersion) === 1) {
                migration_from_previous_version_under_5_11_0(Helper);
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

/**
 * Migration from previous version under 5.11.0
 */
let migration_from_previous_version_under_5_11_0 = function(Helper: any) {
    const removeDeprecatedHrrZonesKey = function(callback: Function): void {
        chrome.storage.sync.remove(["userHrrZones"], () => {
            callback();
        });
    };

    chrome.storage.sync.get(null, (currentUserSavedSettings: any) => {
        const savedUserHrrZones = currentUserSavedSettings.userHrrZones; // Get user current zones
        if (savedUserHrrZones) {
            if (savedUserHrrZones.length > 0) { // If user has zones
                const newHeartRateZones: any = [];
                for (let i = 0; i < savedUserHrrZones.length; i++) {
                    const hrrZone: any = savedUserHrrZones[i];
                    newHeartRateZones.push({
                        from: Helper.heartrateFromHeartRateReserve(hrrZone.fromHrr, currentUserSavedSettings.userMaxHr, currentUserSavedSettings.userRestHr),
                        to: Helper.heartrateFromHeartRateReserve(hrrZone.toHrr, currentUserSavedSettings.userMaxHr, currentUserSavedSettings.userRestHr),
                    });
                }

                if (!currentUserSavedSettings.zones) {
                    currentUserSavedSettings.zones = {};
                }

                currentUserSavedSettings.zones.heartRate = newHeartRateZones;
                chrome.storage.sync.set(currentUserSavedSettings, () => { // Inject updated zones (inc. new heartrate)
                    removeDeprecatedHrrZonesKey(() => { // Remove deprecated hrr zones
                        chrome.storage.sync.get(null, (results: any) => { // Show final result
                            console.log("Migration to 5.11.0 done");
                            console.log("Updated settings: ", results);
                        });
                    });
                });
            } else {  // Key exists
                removeDeprecatedHrrZonesKey(() => {
                    console.log("userHrrZones key removed");
                });
            }
        }
    });
};
