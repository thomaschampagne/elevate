app.factory('TranslationService', ['$http', function($http) {

    // This is where we will store the value of the current locale
    // Using chrome locale for starters
    var currentLocale = window.navigator.language;
    var globalizeInst = null;
    translationService   = {};
    translationService.init = function (callback) {
        if (globalizeInst !== null)
            callback();
        // Start the data loading here
        var extensionId = chrome.runtime.id;
        var cldrLoc = 'chrome-extension://' + extensionId + '/node_modules/cldr-data/supplemental/likelySubtags.json';
        var localeMessages = [];
        localeMessages.push('chrome-extension://' + extensionId + '/locales/' + currentLocale + '.json');
        localeMessages.push('chrome-extension://' + extensionId + '/locales/root.json');
        // Need to load CLRD data first
        // Hard Assumptions:
        // 1) CLDR data has to be available
        // 2) root.json will always load successfully because it is the fallback translationService
        // 3) When [locale].json fails to load, it means that browser locale is not supported by StravistiX. We load en-US as fallback
        $http.get(cldrLoc).then(function(response) {
            // var jsonResp = response.data;
            Globalize.load(response.data);
            var loadCnt = 0;
            for (var i = 0; i < localeMessages.length; i++) {
                $http.get(localeMessages[i]).then(
                    // Locale file load success
                    function(response) {
                        Globalize.loadMessages(response.data);
                        loadCnt++;
                        if (loadCnt === localeMessages.length) {
                            globalizeInst = Globalize(currentLocale);
                            callback();
                        }
                    },
                    // Locale file load failure, load en-US as backup
                    function (response) {
                        // Try getting en-US locale file
                        $http.get('chrome-extension://' + extensionId + '/locales/en-US.json').then(
                            function (response) {
                                Globalize.loadMessages(response.data);
                                if (loadCnt === localeMessages.length) {
                                    globalizeInst = Globalize('en-US');
                                    callback();
                                }
                            }
                        );
                    }
                );
            }
        });
    };

    translationService.formatMessage = function(msgKey, subsVals) {
        var transText = Helper.formatMessage(globalizeInst, msgKey, subsVals);
        return transText;
    };

    return translationService;
}]);
