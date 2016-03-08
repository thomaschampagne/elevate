// Listening extenal message
chrome.runtime.onMessageExternal.addListener(

    function(request, sender, sendResponse) {

        var storageManager = new StorageManager();

        switch (request.method) {
            case StravistiX.getFromStorageMethod:

                storageManager.storageType = request.params['storage'];
                storageManager.getFromStorage(request.params['key'], function(returnedValue) {
                    sendResponse({
                        data: returnedValue
                    });
                });

                break;

            case StravistiX.setToStorageMethod:

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

    // Disable Segment Time Comparison Features while https://github.com/thomaschampagne/stravistix/issues/179 unfixed
    var enableSegmentTimeComparisonFeature = function(previousInstalledVersion, currentVersion, storageManager, finished) {

        var enable = true; // For re-enable for all at current 3.2.0 version //previousInstalledVersion == '3.0.0' || previousInstalledVersion == '3.0.1' || (parseInt(previousInstalledVersion.split('.')[0]) < 3);

        if (enable) {

            console.debug('Enable Segment Time Comparison Feature...');

            storageManager.setToStorage(
                'displaySegmentTimeComparisonToKOM',
                true,
                function(data) {
                    console.log(data);

                    storageManager.setToStorage(
                        'displaySegmentTimeComparisonToPR',
                        true,
                        function(data) {
                            console.log(data);
                            storageManager.setToStorage(
                                'displaySegmentTimeComparisonToCurrentYearPR',
                                true,
                                function(data) {
                                    console.log(data);
                                    finished();
                                }.bind(this)
                            );
                        }.bind(this)
                    );
                }.bind(this)
            );

        } else {
            console.debug('Enable nothing...');
        }
    };

    var thisVersion = chrome.runtime.getManifest().version;

    if (details.reason == "install") {

        // On install too: persist that extension has been updated.
        // This force local storage clear on install
        var storageManager = new StorageManager();
        storageManager.storageType = StorageManager.storageSyncType;
        storageManager.setToStorage(
            'extensionHasJustUpdated',
            true,
            function(data) {
                console.log(data);
                chrome.tabs.create({
                    url: 'http://thomaschampagne.github.io/stravistix/'
                }, function(tab) {
                    console.log("First install. Display site");
                    chrome.tabs.create({
                        url: chrome.extension.getURL('/options/app/index.html#/')
                    }, function(tab) {
                        console.log("First install. Display settings");
                    });
                });
            }.bind(this)
        );

    } else if (details.reason == "update") {

        console.log("Updated from " + details.previousVersion + " to " + thisVersion + "!");

        // Persist that extension has been updated.
        var storageManager = new StorageManager();
        storageManager.storageType = StorageManager.storageSyncType;
        storageManager.setToStorage(
            'extensionHasJustUpdated',
            true,
            function(data) {
                console.log('Updated');
                console.log(data);
                // Disable Segment Time Comparison Features while https://github.com/thomaschampagne/stravistix/issues/179 unfixed
                // We while re-enable Segment Time Comparison when https://github.com/thomaschampagne/stravistix/issues/179 FIXED
                enableSegmentTimeComparisonFeature(details.previousVersion, thisVersion, storageManager, function() {});
                // End Disable Segment Time Comparison
            }.bind(this)
        );
    }
});
