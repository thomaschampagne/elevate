
import { userSettings } from "../../common/scripts/UserSettings";
import { Helper } from "../../common/scripts/Helper";
import { StorageManager } from "../../common/scripts/modules/StorageManager";

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

        console.debug("UserSettings on update", userSettings);

        // Clear local history if coming from version under 5.1.1
        if (Helper.versionCompare("5.1.1", details.previousVersion) === 1) {
            this.clearSyncCache(StorageManager);
        }
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
