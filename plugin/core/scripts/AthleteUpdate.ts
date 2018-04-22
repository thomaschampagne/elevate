import { CoreEnv } from "../config/core-env";
import * as Q from "q";
import * as _ from "lodash";
import { AthleteUpdateModel } from "./models/athlete-update.model";
import { SyncResultModel } from "../../shared/models/sync/sync-result.model";
import { HerokuEndpoints } from "../../shared/HerokuEndpoint";

export class AthleteUpdate {

	/**
	 * Provide AthleteUpdateModel object
	 * @param stravaId
	 * @param name
	 * @param version
	 * @param isPremium
	 * @param isPro
	 * @param locale
	 * @param hrMin
	 * @param hrMax
	 * @returns {AthleteUpdateModel}
	 */
	public static create(stravaId: number,
						 name: string,
						 version: string,
						 isPremium: boolean,
						 isPro: boolean,
						 locale?: string,
						 hrMin?: number,
						 hrMax?: number): AthleteUpdateModel {

		if (stravaId < 1 || _.isEmpty(name) || _.isEmpty(version) || !_.isBoolean(isPremium) || !_.isBoolean(isPro)) {
			return null;
		}

		let status = 0; // Free by default
		if (isPremium) {
			status = 1;
		}
		if (isPro) {
			status = 2;
		}
		const athleteUpdate: AthleteUpdateModel = {
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

	public static commit(athleteUpdate: AthleteUpdateModel): Q.IPromise<any> {

		const deferred = Q.defer<SyncResultModel>();
		const endPoint = HerokuEndpoints.resolve(CoreEnv.endPoint) + "/api/athlete/update";

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
