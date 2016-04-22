app.factory('AvoidInputKeysService', function() {
    return function(evt) {
        if (evt.keyCode !== 38 && evt.keyCode !== 40 && evt.keyCode !== 9 && evt.keyCode !== 16) { // NON key up/down press or SHIFT/TAB
            evt.preventDefault();
        }
    };
});
