// This code is from Google, so let's not modify it too much, just add gaNewElem and gaElems:
import * as _ from "lodash";
import * as Q from "q";
import {env} from "../config/env";
import {IAthleteUpdate} from "./interfaces/IAthleteUpdate";
import {ISyncResult} from "./synchronizer/ActivitiesSynchronizer";
import {HerokuEndpoints} from "../../common/scripts/modules/HerokuEndpoint";

const currentDate: any = new Date();
(function (i: any, s: any, o: any, g: any, r: any, a?: any, m?: any) {
    i.GoogleAnalyticsObject = r;
    i[r] = i[r] || function () {
        (i[r].q = i[r].q || []).push(arguments);
    }, i[r].l = 1 * currentDate;
    a = s.createElement(o),
        m = s.getElementsByTagName(o)[0];
    a.async = 1;
    a.src = g;
    m.parentNode.insertBefore(a, m);
})(window, document, "script", "//www.google-analytics.com/analytics.js", "follow");

follow("create", env.analyticsTrackingID, "auto");
follow("send", "pageview");

export class AthleteUpdate { // TODO Refactor outside + rerun specs

    /**
     * Provide IAthleteUpdate object
     * @param stravaId
     * @param name
     * @param version
     * @param isPremium
     * @param isPro
     * @param locale
     * @param hrMin
     * @param hrMax
     * @returns {IAthleteUpdate}
     */
    public static create(stravaId: number,
                         name: string,
                         version: string,
                         isPremium: boolean,
                         isPro: boolean,
                         locale?: string,
                         hrMin?: number,
                         hrMax?: number): IAthleteUpdate {

        if (stravaId < 1 || _.isEmpty(name) || _.isEmpty(version) || !_.isBoolean(isPremium) || !_.isBoolean(isPro)) {
            return null;
        }

        let status: number = 0; // Free by default
        if (isPremium) {
            status = 1;
        }
        if (isPro) {
            status = 2;
        }
        const athleteUpdate: IAthleteUpdate = {
            stravaId,
            name: _.isEmpty(name) ? null : name,
            version,
            status,
            hrMin,
            hrMax,
        };

        if (!_.isEmpty(locale)) {
            athleteUpdate.locale = locale;
        }

        return athleteUpdate;
    }

    public static commit(athleteUpdate: IAthleteUpdate): Q.IPromise<any> {

        const deferred = Q.defer<ISyncResult>();
        const endPoint = HerokuEndpoints.resolve(env.endPoint) + "/api/athlete/update";

        $.post({
            url: endPoint,
            data: JSON.stringify(athleteUpdate),
            dataType: "json",
            contentType: "application/json",
            success: (response: any) => {
                deferred.resolve(response);
            },
            error: (jqXHR: JQueryXHR, textStatus: string, errorThrown: string) => {
                console.warn("Endpoint <" + endPoint + "> not reachable", jqXHR);
                deferred.reject({textStatus, errorThrown});
            },
        });

        return deferred.promise;
    }
}
