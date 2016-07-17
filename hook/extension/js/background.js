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

        // Persist that extension has been updated
        var storageManager = new StorageManager();
        storageManager.storageType = StorageManager.storageSyncType;
        storageManager.setToStorage(
            'extensionHasJustUpdated',
            true,
            function(data) {
                console.log('Updated');
                console.log(data);

                if (versionCompare('3.9.0', details.previousVersion) == 1) {

                    console.log('Reset zones...');
                    // Reset userHrrZones...
                    storageManager.setToStorage('userHrrZones', userSettings.userHrrZones, function(data) {
                        console.log('userHrrZones revert to ', userSettings.userHrrZones);
                        console.log(data);

                        // Reset zones..
                        storageManager.setToStorage('zones', userSettings.zones, function(data) {
                            console.log('zones revert to ', userSettings.zones);
                            console.log(data);
                        });
                    });
                }

            }.bind(this)
        );
    }
});

/**
 * Compares two software version numbers (e.g. "1.7.1" or "1.2b").
 *
 * This function was born in http://stackoverflow.com/a/6832721.
 *
 * @param {string} v1 The first version to be compared.
 * @param {string} v2 The second version to be compared.
 * @param {object} [options] Optional flags that affect comparison behavior:
 * <ul>
 *     <li>
 *         <tt>lexicographical: true</tt> compares each part of the version strings lexicographically instead of
 *         naturally; this allows suffixes such as "b" or "dev" but will cause "1.10" to be considered smaller than
 *         "1.2".
 *     </li>
 *     <li>
 *         <tt>zeroExtend: true</tt> changes the result if one version string has less parts than the other. In
 *         this case the shorter string will be padded with "zero" parts instead of being considered smaller.
 *     </li>
 * </ul>
 * @returns {number|NaN}
 * <ul>
 *    <li>0 if the versions are equal</li>
 *    <li>a negative integer iff v1 < v2</li>
 *    <li>a positive integer iff v1 > v2</li>
 *    <li>NaN if either version string is in the wrong format</li>
 * </ul>
 *
 * @copyright by Jon Papaioannou (["john", "papaioannou"].join(".") + "@gmail.com")
 * @license This function is in the public domain. Do what you want with it, no strings attached.
 */
function versionCompare(v1, v2, options) {
    var lexicographical = options && options.lexicographical,
        zeroExtend = options && options.zeroExtend,
        v1parts = v1.split('.'),
        v2parts = v2.split('.');

    function isValidPart(x) {
        return (lexicographical ? /^\d+[A-Za-z]*$/ : /^\d+$/).test(x);
    }

    if (!v1parts.every(isValidPart) || !v2parts.every(isValidPart)) {
        return NaN;
    }

    if (zeroExtend) {
        while (v1parts.length < v2parts.length) v1parts.push("0");
        while (v2parts.length < v1parts.length) v2parts.push("0");
    }

    if (!lexicographical) {
        v1parts = v1parts.map(Number);
        v2parts = v2parts.map(Number);
    }

    for (var i = 0; i < v1parts.length; ++i) {
        if (v2parts.length == i) {
            return 1;
        }

        if (v1parts[i] == v2parts[i]) {
            continue;
        } else if (v1parts[i] > v2parts[i]) {
            return 1;
        } else {
            return -1;
        }
    }

    if (v1parts.length != v2parts.length) {
        return -1;
    }

    return 0;
}
