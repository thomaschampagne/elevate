import {Helper} from "./Helper";
import {IStorageUsage, StorageManager} from "./modules/StorageManager";

class Background {

    private storageManager: StorageManager = new StorageManager();

    public init(): void {
        this.listenForExternalMessages();
    }

    private reloadBrowserTab(tabId: number): void {
        console.log("Now reloading tab id " + tabId);
        chrome.tabs.reload(tabId);
    }

    private listenForExternalMessages(): void {

        chrome.runtime.onMessageExternal.addListener((request, sender, sendResponse) => {

            switch (request.method) {

                case Helper.reloadBrowserTabMethod:
                    this.reloadBrowserTab(request.params.sourceTabId);
                    break;

                case Helper.getFromStorageMethod:
                    this.storageManager.getFromStorage(request.params.storage, request.params.key, function(returnedValue: any) {
                        sendResponse({
                            data: returnedValue,
                        });
                    });
                    break;

                case Helper.setToStorageMethod:
                    this.storageManager.setToStorage(request.params.storage, request.params.key, request.params.value, function(returnAllData: any) {
                        sendResponse({
                            data: returnAllData,
                        });
                    });
                    break;

                case Helper.removeFromStorageMethod:
                    this.storageManager.removeFromStorage(request.params.storage, request.params.key, function(returnAllData: any) {
                        sendResponse({
                            data: returnAllData,
                        });
                    });
                    break;

                case Helper.getStorageUsageMethod:
                    this.storageManager.getStorageUsage(request.params.storage, function(response: IStorageUsage) {
                        sendResponse({
                            data: response,
                        });
                    });
                    break;

                default:
                    throw new Error("Not existing method");

            }
            return true;
        });
    }
}

const background = new Background();
background.init();
