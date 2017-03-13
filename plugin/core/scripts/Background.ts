// Listening extenal message
import Tab = chrome.tabs.Tab;

class Background {

    public init(): void {
        this.listenForExternalMessages();
        this.listenInstallUpdate();
    }

    private reloadBrowserTab(tabId: number): void {
        console.log('Now reloading tab id ' + tabId)
        chrome.tabs.reload(tabId);
    }

    private listenForExternalMessages(): void {

        chrome.runtime.onMessageExternal.addListener((request, sender, sendResponse) => {

                let storageManager: StorageManager = new StorageManager(request.params.storage);

                switch (request.method) {

                    case Helper.reloadBrowserTabMethod:
                        this.reloadBrowserTab(request.params.sourceTabId)
                        break;

                    case Helper.getFromStorageMethod:
                        storageManager.getFromStorage(request.params.key, function (returnedValue: any) {
                            sendResponse({
                                data: returnedValue
                            });
                        });

                        break;

                    case Helper.setToStorageMethod:
                        storageManager.setToStorage(request.params.key, request.params.value, function (returnAllData: any) {
                            sendResponse({
                                data: returnAllData
                            });
                        });
                        break;

                    case Helper.removeFromStorageMethod:
                        storageManager.storageType = request.params.storage;
                        storageManager.removeFromStorage(request.params.key, function (returnAllData: any) {
                            sendResponse({
                                data: returnAllData
                            });
                        });

                        break;

                    case Helper.getStorageUsageMethod:

                        storageManager.storageType = request.params.storage;
                        storageManager.getStorageUsage(function (response: IStorageUsage) {
                            sendResponse({
                                data: response
                            });
                        });

                        break;


                    default:
                        return false;
                }
                return true;
            }
        );

    }

    private listenInstallUpdate(): void {

        let storageManager: StorageManager = new StorageManager(StorageManager.storageSyncType);

        // Handle on install
        chrome.runtime.onInstalled.addListener((details) => {

            let thisVersion: string = chrome.runtime.getManifest().version;

            if (details.reason === "install") {

                // On install too: persist that extension has been updated.
                // This force local storage clear on install

                chrome.tabs.create({
                    url: 'http://thomaschampagne.github.io/stravistix/'
                }, (tab: Tab) => {
                    console.log("First install. Display website new tab:", tab);
                    chrome.tabs.create({
                        url: chrome.extension.getURL('/options/app/index.html#/')
                    }, (tab: Tab) => {
                        console.log("First install. Display settings:", tab);
                    });
                });

            } else if (details.reason === "update") {

                console.log("Updated from " + details.previousVersion + " to " + thisVersion + "!");

                if (Helper.versionCompare('3.9.0', details.previousVersion) === 1) {

                    // Previous version is inferior to 3.9.0

                    console.log('Reset zones...');

                    // Reset userHrrZones...
                    storageManager.setToStorage('userHrrZones', userSettings.userHrrZones, (data: any) => {
                        console.log('userHrrZones revert to ', userSettings.userHrrZones);
                        console.log(data);

                        // Reset zones..
                        storageManager.setToStorage('zones', userSettings.zones, (data: any) => {
                            console.log('zones revert to ', userSettings.zones);
                            console.log(data);
                        });
                    });
                }

                if (Helper.versionCompare('5.0.1', details.previousVersion) === 1) {
                    // Coming from version under 5.0.1..
                    storageManager.setToStorage('displayExtendedGoals', false, (data: any) => {
                        console.log('displayExtendedGoals set false ', data);
                    });
                }

                // Clear local history if coming from version under 5.1.1
                if (Helper.versionCompare('5.1.1', details.previousVersion) === 1) {
                    this.clearSyncCache();
                }

            }
        });
    }

    public clearSyncCache(): void {

        let storageManagerOnLocal: StorageManager = new StorageManager(StorageManager.storageLocalType);

        storageManagerOnLocal.removeFromStorage('computedActivities', () => {
            storageManagerOnLocal.removeFromStorage('lastSyncDateTime', () => {
                storageManagerOnLocal.removeFromStorage('syncWithAthleteProfile', () => {
                    console.log('Local History cleared');
                });
            });
        });
    }
}

let background = new Background();
background.init();
