var Constants = {
    VERSION: chrome.runtime.getManifest().version,
    EXTENSION_ID: chrome.runtime.id,
    OPTIONS_URL: 'chrome-extension://' + chrome.runtime.id + '/options/app/index.html',
};
