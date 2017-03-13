class Helper {

    public static KPH_TO_MPH_RATIO: number = 0.621371;
    public static getFromStorageMethod: string = 'getFromStorage';
    public static setToStorageMethod: string = 'setToStorage';
    public static removeFromStorageMethod: string = 'removeFromStorage'
    public static reloadBrowserTabMethod: string = 'reloadBrowserTab';
    public static getStorageUsageMethod: string = 'getStorageUsage';

    public static getSpeedUnitData(): ISpeedUnitData {
        let measurementPreference: string = window.currentAthlete.get('measurement_preference');
        let units: string = (measurementPreference == 'meters') ? 'km' : 'mi';
        let speedUnitPerHour: string = (measurementPreference == 'meters') ? 'km/h' : 'mi/h';
        let speedUnitFactor: number = (speedUnitPerHour == 'km/h') ? 1 : Helper.KPH_TO_MPH_RATIO;

        let speedUnitData: ISpeedUnitData = {
            speedUnitPerHour: speedUnitPerHour,
            speedUnitFactor: speedUnitFactor,
            units: units
        };
        return speedUnitData;
    }

    public static HHMMSStoSeconds(str: string): string { // TODO Must return number WTF ?!

        let p: Array<string> = str.split(':'),
            s: any = 0,
            m = 1;

        while (p.length > 0) {
            s += m * parseInt(p.pop(), 10);
            m *= 60;
        }
        return (<string>s);
    }

    public static secondsToHHMMSS(secondsParam: number, trimLeadingZeros?: boolean): string {

        let secNum: number = secondsParam; // don't forget the second param
        let hours: number = Math.floor(secNum / 3600);
        let minutes: number = Math.floor((secNum - (hours * 3600)) / 60);
        let seconds: number = secNum - (hours * 3600) - (minutes * 60);

        let time: string = ((hours < 10) ? "0" + hours.toFixed(0) : hours.toFixed(0) );
        time += ':' + ((minutes < 10) ? "0" + minutes.toFixed(0) : minutes.toFixed(0) );
        time += ':' + ((seconds < 10) ? "0" + seconds.toFixed(0) : seconds.toFixed(0) );

        return (trimLeadingZeros ? Helper.trimLeadingZerosHHMMSS(time) : time);
    }


    public static trimLeadingZerosHHMMSS(time: string): string {
        let result: string = time.replace(/^(0*:)*/, '').replace(/^0*/, '') || "0";
        if (result.indexOf(":") < 0) {
            return result + "s";
        }
        return result;
    }

    public static weightedPercentiles(values: Array<number>, weights: Array<number>, percentiles: Array<number>): Array<number> {
        // inspired from https://en.wikipedia.org/wiki/Weighted_median and https://en.wikipedia.org/wiki/Percentile#Definition_of_the_Weighted_Percentile_method
        let list: Array<any> = [];
        let tot: number = 0;
        for (let i: number = 0; i < values.length; i++) {
            list.push({value: values[i], weight: weights[i]});
            tot += weights[i];
        }
        list.sort((a, b) => {
            return a.value - b.value;
        });
        let result: Array<number> = [];
        for (let i: number = 0; i < percentiles.length; i++) {
            result.push(0);
        }

        let cur: number = 0;
        for (let i: number = 0; i < list.length; i++) {
            for (let j: number = 0; j < percentiles.length; j++) {
                // found the sample matching the percentile
                if (cur < percentiles[j] * tot && (cur + list[i].weight) > (percentiles[j] - 0.00001) * tot) {
                    result[j] = list[i].value;
                }
            }
            cur += list[i].weight;
        }

        return result;
    }

    public static heartrateFromHeartRateReserve(hrr: number, maxHr: number, restHr: number): number {
        return Math.abs(Math.floor(hrr / 100 * (maxHr - restHr) + restHr));
    };

    public static heartRateReserveFromHeartrate(hr: number, maxHr: number, restHr: number): number {
        return (hr - restHr) / (maxHr - restHr);
    };

    /**
     * Sending message to store key:value into storageType via background page
     */
    public static setToStorage(extensionId: string, storageType: string, key: string, value: any, callback?: Function): Q.Promise<any> {

        let deferred: Q.Deferred<any> = Q.defer();

        // Sending message to background page
        chrome.runtime.sendMessage(extensionId, {
            method: Helper.setToStorageMethod,
            params: {
                storage: storageType,
                'key': key,
                'value': value
            }
        }, (response: any) => {
            if (callback) callback(response);
            deferred.resolve(response);
        });

        return deferred.promise;
    }


    /**
     * Sending message to get key:value into storageType via background page
     * @param extensionId
     * @param storageType StorageManager.storageLocalType || StorageManager.storageSyncType
     * @param key
     * @param callback
     * @return {Promise<any>}
     */
    public static getFromStorage(extensionId: string, storageType: string, key: string, callback?: Function): Q.Promise<any> {

        let deferred: Q.Deferred<any> = Q.defer();

        // Sending message to background page
        chrome.runtime.sendMessage(extensionId, {
            method: Helper.getFromStorageMethod,
            params: {
                storage: storageType,
                'key': key
            }
        }, (response: any) => {
            if (callback) callback(response);
            deferred.resolve(response);
        });

        return deferred.promise;
    }

    public static removeFromStorage(extensionId: string, storageType: string, key: string, callback?: Function): Q.Promise<any> {

        let deferred: Q.Deferred<any> = Q.defer();

        // Sending message to background page
        chrome.runtime.sendMessage(extensionId, {
            method: Helper.removeFromStorageMethod,
            params: {
                storage: storageType,
                'key': key
            }
        }, (response: any) => {
            if (callback) callback(response);
            deferred.resolve(response);
        });

        return deferred.promise;
    }

    public static reloadBrowserTab(extensionId: string, sourceTabId: number) {

        chrome.runtime.sendMessage(extensionId, {
            method: Helper.reloadBrowserTabMethod,
            params: {
                sourceTabId: sourceTabId,
            }
        }, (response: any) => {
            console.log(response);
        });
    }

    public static getStorageUsage(extensionId: string, storageType: string, callback?: Function): Q.IPromise<IStorageUsage> {

        let deferred: Q.Deferred<any> = Q.defer();

        // Sending message to background page
        chrome.runtime.sendMessage(extensionId, {
            method: Helper.getStorageUsageMethod,
            params: {
                storage: storageType
            }
        }, (response: any) => {
            if (callback) callback(response.data);
            deferred.resolve(response.data);
        });

        return deferred.promise;
    }

    public static formatNumber(n: any, c?: any, d?: any, t?: any): string {

        c = isNaN(c = Math.abs(c)) ? 2 : c,
            d = d == undefined ? "." : d,
            t = t == undefined ? "," : t;

        let s: any = n < 0 ? "-" : "";

        let i: any = parseInt(n = Math.abs(+n || 0).toFixed(c)) + "";

        let j: any;
        j = (j = i.length) > 3 ? j % 3 : 0;

        return s + (j ? i.substr(0, j) + t : "") + i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + t) + (c ? d + Math.abs(n - i).toFixed(c).slice(2) : "");
    };


    public static secondsToDHM(sec_num: number, trimZeros?: boolean): string {
        let days: number = Math.floor(sec_num / 86400);
        let hours: number = Math.floor((sec_num - (days * 86400)) / 3600);
        let minutes: number = Math.floor((sec_num - (days * 86400) - (hours * 3600)) / 60);
        if (trimZeros && days === 0) {
            if (hours === 0) {
                return minutes + 'm';
            }
            return hours + 'h ' + minutes + 'm';
        }
        return days + 'd ' + hours + 'h ' + minutes + 'm';
    };

    public static guid(): string {
        // from http://stackoverflow.com/a/105074
        function s4() {
            return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
        }

        return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
    };

    public static params(urlLocation: Location): any {

        let params: any = {};

        if (urlLocation) {
            let parts = urlLocation.search.substring(1).split('&');
            for (let i = 0; i < parts.length; i++) {
                let nv: Array<string> = parts[i].split('=');
                if (!nv[0]) continue;
                params[nv[0]] = nv[1] || true;
            }
        }
        return params;
    }


    /**
     * Compares two software version numbers (e.g. "1.7.1" or "1.2b").
     *
     * This function was born in http://stackoverflow.com/a/6832721.
     *
     * @param {string} v1 The first version to be compared.
     * @param {string} v2 The second version to be compared.
     * @param {object} [options] Optional flags that affect comparison behavior:
     * <ul>
     *     <li>
     *         <tt>lexicographical: true</tt> compares each part of the version strings lexicographically instead of
     *         naturally; this allows suffixes such as "b" or "dev" but will cause "1.10" to be considered smaller than
     *         "1.2".
     *     </li>
     *     <li>
     *         <tt>zeroExtend: true</tt> changes the result if one version string has less parts than the other. In
     *         this case the shorter string will be padded with "zero" parts instead of being considered smaller.
     *     </li>
     * </ul>
     * @returns {number|NaN}
     * <ul>
     *    <li>0 if the versions are equal</li>
     *    <li>a negative integer iff v1 < v2</li>
     *    <li>a positive integer iff v1 > v2</li>
     *    <li>NaN if either version string is in the wrong format</li>
     * </ul>
     *
     * @copyright by Jon Papaioannou (["john", "papaioannou"].join(".") + "@gmail.com")
     * @license This function is in the public domain. Do what you want with it, no strings attached.
     */
    public static versionCompare(v1: string, v2: string, options?: any): number {
        let lexicographical: boolean = options && options.lexicographical,
            zeroExtend = options && options.zeroExtend,
            v1parts: Array<any> = v1.split('.'),
            v2parts: Array<any> = v2.split('.');

        function isValidPart(x: string) {
            return (lexicographical ? /^\d+[A-Za-z]*$/ : /^\d+$/).test(x);
        }

        if (!v1parts.every(isValidPart) || !v2parts.every(isValidPart)) {
            return NaN;
        }

        if (zeroExtend) {
            while (v1parts.length < v2parts.length) v1parts.push("0");
            while (v2parts.length < v1parts.length) v2parts.push("0");
        }

        if (!lexicographical) {
            v1parts = v1parts.map(Number);
            v2parts = v2parts.map(Number);
        }

        for (let i: number = 0; i < v1parts.length; ++i) {
            if (v2parts.length == i) {
                return 1;
            }

            if (v1parts[i] == v2parts[i]) {
                continue;
            } else if (v1parts[i] > v2parts[i]) {
                return 1;
            } else {
                return -1;
            }
        }

        if (v1parts.length != v2parts.length) {
            return -1;
        }

        return 0;
    }

    public static safeMax(a: number, b: number): number {
        return a == null ? b : Math.max(a, b);
    }

    public static safeMin(a: number, b: number): number {
        return a == null ? b : Math.min(a, b);
    }

}
