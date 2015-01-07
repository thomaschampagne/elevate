app.filter('hrrToBpmFilter', function() {
    return function(hrr, maxHr, restHr) {
        return (parseFloat(hrr) / 100 * (parseInt(maxHr) - parseInt(restHr)) + parseInt(restHr)).toFixed(0);
    };
});