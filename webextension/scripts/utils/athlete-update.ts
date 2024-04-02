import { ExtensionEnv } from "../../config/extension-env";
import * as Q from "q";
import _ from "lodash";
import { AthleteUpdateModel } from "../models/athlete-update.model";
import { SyncResultModel } from "@elevate/shared/models/sync/sync-result.model";
import { DistributedEndpointsResolver } from "@elevate/shared/resolvers/distributed-endpoints.resolver";

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
  public static create(
    stravaId: number,
    name: string,
    version: string,
    isPremium: boolean,
    isPro: boolean,
    locale?: string,
    hrMin?: number,
    hrMax?: number
  ): AthleteUpdateModel {
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
      hrMax
    };

    if (!_.isEmpty(locale)) {
      athleteUpdate.locale = locale;
    }

    return athleteUpdate;
  }
}
