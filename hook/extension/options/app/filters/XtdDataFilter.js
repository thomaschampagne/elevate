/**
 * Return the right preview value when using custom xtd zones along units type
 */
app.filter('xtdDataFilter', function() {
    return function(value, factor) {
        return value * factor;
    };
});
