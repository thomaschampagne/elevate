/**
 * Return the right preview value when using custom xtd zones along units type
 */
app.filter('xtdDataFilter', function() {

    var formatTime = function (seconds) {
        return Helper.secondsToHHMMSS(seconds).replace('00:', '');
    };

    return function(value, type) {

        var result = '';

        if (type === 'speed') {

            var mph = value * 0.621371192;
            result = ' = ' + mph.toFixed(2) + ' mph';

        } else if (type === 'pace') {

            var seconds = value;
            // console.log();

            //(speed === 0) ? 'infinite' : parseInt((1 / speed) * 60 * 60);

            result = formatTime(seconds) + '/km | ' + formatTime(seconds / 0.621371192) + '/mi';
        };

        return result;
    };


    // TODO give kph and mph for speed

    // TODO give time/km or time/mi for pace
});
