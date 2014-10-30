function StorageManager() {}

StorageManager.storageSyncType = 'sync';
StorageManager.storageLocalType = 'local';


StorageManager.setCookie = function setCookie(cname, cvalue, exdays) {
    var d = new Date();
    d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
    var expires = "expires=" + d.toUTCString();
    document.cookie = cname + "=" + cvalue + "; " + expires + "; path=/";
};

StorageManager.setCookieSeconds = function setCookie(cname, cvalue, seconds) {
    var d = new Date();
    d.setTime(d.getTime() + (seconds * 1000));
    var expires = "expires=" + d.toUTCString();
    document.cookie = cname + "=" + cvalue + "; " + expires + "; path=/";
};

StorageManager.getCookie = function getCookie(cname) {
    var name = cname + "=";
    var ca = document.cookie.split(';');
    for (var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') c = c.substring(1);
        if (c.indexOf(name) != -1) return c.substring(name.length, c.length);
    }
    return null;
};

StorageManager.prototype = {

    storageType: null,

    /**
     *
     */
    getFromStorage: function getFromStorage(key, callback) {

        this.hasChromeLastError();

        if (this.storageType == 'sync') {
            chrome.storage.sync.get(userSettings, function(userSettingsResponseData) {
                console.log(userSettingsResponseData);
                var result = userSettingsResponseData[key];
                result = (typeof result === 'undefined') ? null : result;
                callback(result);
            });

        }
        //TODO handle getFromStorage local storage in StorageManager
        else if (this.storageType == 'local') {

            chrome.storage.local.get([key], function(value) {
                value = value[key];
                value = (typeof value == 'undefined') ? null : value;
                callback(value);
            });

        } else {
            console.error('Storage type not available');
        }

    },

    /**
     *
     */
    hasChromeLastError: function hasChromeLastError() {
        if (chrome.runtime.lastError) {
            console.warn(chrome.runtime.lastError.message);
        }
    },

    /**
     *
     */
    setToStorage: function setToStorage(key, value, callback) {

        this.hasChromeLastError();

        if (this.storageType == 'sync') {

            chrome.storage.sync.get(userSettings, function(userSettingsResponseData) {

                userSettingsResponseData[key] = value; // Set value to key

                chrome.storage.sync.set(userSettingsResponseData, function() {
                    // Reload and callback sync get values
                    chrome.storage.sync.get(userSettings, function(userSettingsResponseData) {

                        callback(userSettingsResponseData);

                    });
                });
            });
        }
        //TODO handle setToStorage local storage in StorageManager
        else if (this.storageType == 'local') {

            chrome.storage.local.get(null, function(allData) {
                allData[key] = value;
                chrome.storage.local.set(allData);
                callback(allData);
            });
        } else {
            console.error('Storage type not available');
        }
    },

    /**
     *
     */
    printStorage: function printStorage() {
        if (this.storageType == 'sync') {
            chrome.storage.sync.get(null, function(data) {
                console.log(data);
            });

        } else if (this.storageType == 'local') {
            chrome.storage.local.get(null, function(data) {
                console.log(data);
            });

        } else {
            console.error('Storage type not available');
        }
    },
}
