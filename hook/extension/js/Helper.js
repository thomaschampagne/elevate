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
Helper.log = function(tag, object) {
    if (env.debugMode) {
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

Helper.secondsToHHMMSS = function(secondsParam, trimLeadingZeros) {
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
    return trimLeadingZeros ? Helper.trimLeadingZerosHHMMSS(time) : time;
};

Helper.upperQuartile = function(valuesSorted) {
    var q3 = Math.round(0.75 * (valuesSorted.length + 1));
    return (valuesSorted[q3]);
};

Helper.lowerQuartile = function(valuesSorted) {
    var q1 = Math.round(0.25 * (valuesSorted.length + 1));
    return (valuesSorted[q1]);
};

Helper.quartile_95 = function(valuesSorted) {
    var q1 = Math.round(0.95 * (valuesSorted.length + 1));
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
            method: StravistiX.setToStorageMethod,
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
            method: StravistiX.getFromStorageMethod,
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

Helper.includeJs = function(scriptUrl) {
    var link = document.createElement('link');
    link.href = chrome.extension.getURL(scriptUrl);
    link.type = 'text/css';
    link.rel = 'stylesheet';
    (document.head || document.documentElement).appendChild(link);
};

Helper.formatNumber = function(n, c, d, t){
var c = isNaN(c = Math.abs(c)) ? 2 : c, 
    d = d == undefined ? "." : d, 
    t = t == undefined ? "," : t, 
    s = n < 0 ? "-" : "", 
    i = parseInt(n = Math.abs(+n || 0).toFixed(c)) + "", 
    j = (j = i.length) > 3 ? j % 3 : 0;
   return s + (j ? i.substr(0, j) + t : "") + i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + t) + (c ? d + Math.abs(n - i).toFixed(c).slice(2) : "");
};

Helper.secondsToDHM = function (sec_num) {
    var days    = Math.floor(sec_num / 86400);
    var hours   = Math.floor((sec_num - (days * 86400)) / 3600);
    var minutes = Math.floor((sec_num - (days * 86400) - (hours * 3600)) / 60);
    var time    = days + 'd ' + hours + 'h ' + minutes + 'm';
    return time;
};

Helper.trimLeadingZerosHHMMSS = function(time) {
    var result = time.replace(/^(0*:)*/, '').replace(/^0*/, '') || "0";
    if (result.indexOf(":") < 0) {
        return result + "s";
    }
    return result;
};