app.filter('translationFilter', ['TranslationService', function(TranslationService) {
    return function(transKey) {
            var subsVals = "";
            return TranslationService.formatMessage(transKey, subsVals);
    };
}]);
