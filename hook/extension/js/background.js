// Listening extenal message
chrome.runtime.onMessageExternal.addListener(

    function(request, sender, sendResponse) {

        var storageManager = new StorageManager();

        switch (request.method) {
            case StravaPlus.getFromStorageMethod:

                storageManager.storageType = request.params['storage'];
                storageManager.getFromStorage(request.params['key'], function(returnedValue) {
                    sendResponse({
                        data: returnedValue
                    });
                });

                break;

            case StravaPlus.setToStorageMethod:

                storageManager.storageType = request.params['storage'];
                storageManager.setToStorage(request.params['key'], request.params['value'], function(returnAllData) {
                    sendResponse({
                        data: returnAllData
                    });
                });

                break;

            default:
                return false;
                break;
        }
        return true;
    }
);

// Handle on install
chrome.runtime.onInstalled.addListener(function(details) {

    if (details.reason == "install") {

        chrome.tabs.create({

            url: chrome.extension.getURL('/pages/app/index.html#/')

        }, function(tab) {

            console.log("First install. Display settings");

        });

    } else if (details.reason == "update") {

        var thisVersion = chrome.runtime.getManifest().version;

        console.log("Updated from " + details.previousVersion + " to " + thisVersion + "!");

        // Persist that extension has been updated.
        var storageManager = new StorageManager();
        storageManager.storageType = StorageManager.storageSyncType;
        storageManager.setToStorage(
            'extensionHasJustUpdated',
            true,
            function(data) {
                console.log(data);
            }
        );
    }
});
