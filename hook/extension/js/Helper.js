/**
 *   Contructor
 */
function Helper() {

}

/**
 * Define prototype
 */
Helper.prototype = {

};

/**
 * Static method call test
 */
Helper.saveMe = function() {
    console.log('I save you !');
};

Helper.log = function(tag, object) {
    if (StravaPlus.debugMode) {
        console.log('<' + tag + '>');
        console.log(object);
        console.log('</' + tag + '>');
    }
};

Helper.median = function(valuesSorted) {
    var half = Math.floor(valuesSorted.length / 2);
    if (valuesSorted.length % 2)
        return valuesSorted[half];
    else
        return (valuesSorted[half - 1] + valuesSorted[half]) / 2.0;
};

Helper.HHMMSStoSeconds = function(str) {
    var p = str.split(':'),
        s = 0,
        m = 1;

    while (p.length > 0) {
        s += m * parseInt(p.pop(), 10);
        m *= 60;
    }
    return s;
};

Helper.secondsToHHMMSS = function(secondsParam) {
    var sec_num = parseInt(secondsParam, 10); // don't forget the second param
    var hours = Math.floor(sec_num / 3600);
    var minutes = Math.floor((sec_num - (hours * 3600)) / 60);
    var seconds = sec_num - (hours * 3600) - (minutes * 60);
    if (hours < 10) {
        hours = "0" + hours;
    }
    if (minutes < 10) {
        minutes = "0" + minutes;
    }
    if (seconds < 10) {
        seconds = "0" + seconds;
    }
    var time = hours + ':' + minutes + ':' + seconds;
    return time;
};

Helper.upperQuartile = function(valuesSorted) {
    var q3 = Math.round(0.75 * (valuesSorted.length + 1));
    return (valuesSorted[q3]);
};

Helper.lowerQuartile = function(valuesSorted) {
    var q1 = Math.round(0.25 * (valuesSorted.length + 1));
    return (valuesSorted[q1]);
};

Helper.heartrateFromHeartRateReserve = function(hrr, maxHr, restHr) {
    return (parseFloat(hrr) / 100 * (parseInt(maxHr) - parseInt(restHr)) + parseInt(restHr)).toFixed(0);
};

Helper.heartRateReserveFromHeartrate = function(hr, maxHr, restHr) {
    return (parseFloat(hr) - parseInt(restHr)) / (parseInt(maxHr) - parseInt(restHr));
};


Helper.setToStorage = function(extensionId, storageType, key, value, callback) {

    // Sending message to background page
    chrome.runtime.sendMessage(extensionId, {
            method: StravaPlus.setToStorageMethod,
            params: {
                storage: storageType,
                'key': key,
                'value': value
            }
        },
        function(response) {
            callback(response);
        }
    );
};

Helper.getFromStorage = function(extensionId, storageType, key, callback) {
    // Sending message to background page
    chrome.runtime.sendMessage(extensionId, {
            method: StravaPlus.getFromStorageMethod,
            params: {
                storage: storageType,
                'key': key
            }
        },
        function(response) {
            callback(response);
        }
    );
};
