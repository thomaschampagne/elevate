import * as _ from "lodash";

import { Helper } from "../../../common/scripts/Helper";

export let xtdDataFilter = () => {

    const formatTime: Function = (seconds: number) => {
        return Helper.secondsToHHMMSS(seconds, true);
    };

    return (value: number, type: string) => {
        let result: string = "";
        if (type === "speed") {
            const mph: number = value * 0.621371192;
            result = mph.toFixed(2) + " mph";
        } else if (type === "pace") {
            result = formatTime(value) + "/km | " + formatTime(value / 0.621371192) + "/mi";
        }
        if (_.isEmpty(result)) {
            return null;
        }
        return result;
    };
};
/**
 * Return the right preview value when using custom xtd zones along units type
 */
