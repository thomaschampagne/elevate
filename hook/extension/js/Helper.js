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

Helper.weightedPercentiles = function(values, weights, percentiles) {
    // inspired from https://en.wikipedia.org/wiki/Weighted_median and https://en.wikipedia.org/wiki/Percentile#Definition_of_the_Weighted_Percentile_method
    var list = [];
    var tot = 0;
    for (var i = 0; i < values.length; i++) {
        list.push({ value : values[i], weight : weights[i]});
        tot += weights[i];
    }
    list.sort(function(a, b) {
        return a.value - b.value;
    });
    var result = [];
    for (var i = 0; i < percentiles.length; i++) {
        result.push(0);
    }

    var cur = 0;
    for (var i = 0; i < list.length; i++) {
        for (var j = 0; j < percentiles.length; j++) {
            // found the sample matching the percentile
            if (cur < percentiles[j] * tot && (cur + list[i].weight) > (percentiles[j] - 0.00001) * tot) {
                result[j] = list[i].value;
            }
        }
        cur += list[i].weight;
    }

    return result;
};

// Use abstract equality == for "is number" test
Helper.isEven = function(n) {
    return n == parseFloat(n) ? !(n % 2) : void 0;
}


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

Helper.formatNumber = function(n, c, d, t) {
    var c = isNaN(c = Math.abs(c)) ? 2 : c,
        d = d == undefined ? "." : d,
        t = t == undefined ? "," : t,
        s = n < 0 ? "-" : "",
        i = parseInt(n = Math.abs(+n || 0).toFixed(c)) + "",
        j = (j = i.length) > 3 ? j % 3 : 0;
    return s + (j ? i.substr(0, j) + t : "") + i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + t) + (c ? d + Math.abs(n - i).toFixed(c).slice(2) : "");
};

Helper.secondsToDHM = function(sec_num, trimZeros) {
    var days = Math.floor(sec_num / 86400);
    var hours = Math.floor((sec_num - (days * 86400)) / 3600);
    var minutes = Math.floor((sec_num - (days * 86400) - (hours * 3600)) / 60);
    if (trimZeros && days === 0) {
        if (hours === 0) {
            return minutes + 'm';
        }
        return hours + 'h ' + minutes + 'm';
    }
    return days + 'd ' + hours + 'h ' + minutes + 'm';
};

Helper.trimLeadingZerosHHMMSS = function(time) {
    var result = time.replace(/^(0*:)*/, '').replace(/^0*/, '') || "0";
    if (result.indexOf(":") < 0) {
        return result + "s";
    }
    return result;
};

Helper.guid = function() {
    // from http://stackoverflow.com/a/105074
    function s4() {
        return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
    }
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
};

// #10 - Helper method to translate a DOM node by looking-up all valid children
/**
 * Input Variables:
 * globalizeInstance: Current Active instance of Globalize
 * rootDOMNode: Array of elements where elements need to be translated
 *
 * Element Translation: It depends on two attributes on the elements.
 *      Attribute 1: mssg_id - This provides mechanism to look-up translated text from string library
 *      Attribute 2: mssg_subStr - This allows to specify substitution strings such as version number
 * need to be placed in translation and created dynamically
 **/
Helper.translateDOMNode = function(globalizeInstance, rootDOMNode) {
    var elemWithTrnId = $(rootDOMNode).find("[mssg_id]");
    var messageKey,
        transText,
        subStr,
        subStrArray;
    subStrArray = [];
    for (var i = 0; i < elemWithTrnId.length; i++) {
        messageKey = $(elemWithTrnId[i]).attr("mssg_id");
        if (messageKey != null || messageKey != 'undefined') {
            subStr = $(elemWithTrnId[i]).attr("mssg_subStr");
            if (subStr != null && subStr != '') {
                subStrArray = subStr.split(";");
                transText = globalizeInstance.formatMessage(messageKey, subStrArray);
            } else {
                transText = globalizeInstance.formatMessage(messageKey);
            }
            elemWithTrnId[i].innerHTML = transText;
        }
    }
};

// #10 - Generate a title using the key and substitution Variables
Helper.formatMessage = function(globalizeInstance, messageKey, subStrVal) {
    var subStrArray = [];
    if (subStrVal)
    {
        subStrArray = subStrVal.split(";");
    }
    return globalizeInstance.formatMessage(messageKey, subStrArray);
};
