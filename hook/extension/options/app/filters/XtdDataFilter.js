/**
 * Return the right preview value when using custom xtd zones along units type
 */
app.filter('xtdDataFilter', function() {
    return function(value, type) {

    	var result = '';

    	if(type === 'speed') {
    		var mph = value * 0.621371192;
    		result = mph.toFixed(2) + ' mph';
    	} else if (type === 'pace') {
    		result = '/km ... ';
    	};

        return result;
    };


    // TODO give kph and mph for speed

    // TODO give time/km or time/mi for pace
});
