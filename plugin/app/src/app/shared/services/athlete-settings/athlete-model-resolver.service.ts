import { Injectable } from "@angular/core";
import { UserSettingsService } from "../user-settings/user-settings.service";
import { DatedAthleteSettingsService } from "../dated-athlete-settings/dated-athlete-settings.service";
import * as _ from "lodash";
import { AthleteModel, DatedAthleteSettingsModel, UserSettingsModel } from "@elevate/shared/models";
import { AthleteModelResolver } from "@elevate/shared/resolvers";

@Injectable()
export class AthleteModelResolverService {

	public athleteModelResolver: AthleteModelResolver;

	public userSettingsModel: UserSettingsModel;

	constructor(public userSettingsService: UserSettingsService,
				public datedAthleteSettingsService: DatedAthleteSettingsService) {
	}

	/**
	 * Update or update AthleteModelResolver dependency with up-to-date UserSettingsModel & DatedAthleteSettingsModels.
	 */
	public update(): Promise<void> {
		return this.userSettingsService.fetch().then((userSettings: UserSettingsModel) => {
			this.userSettingsModel = userSettings;
			return this.datedAthleteSettingsService.fetch();
		}).then((datedAthleteSettingsModels: DatedAthleteSettingsModel[]) => {
			this.athleteModelResolver = new AthleteModelResolver(this.userSettingsModel, datedAthleteSettingsModels);
			return Promise.resolve();
		});
	}

	/**
	 * Resolve the proper AthleteModel along UserSettingsModel.hasDatedAthleteSettings and activity date
	 * @param onDate Date format YYYY-MM-DD or Date object
	 * @returns {AthleteModel}
	 */
	public resolve(onDate: string | Date): AthleteModel {

		if (_.isEmpty(this.athleteModelResolver)) {
			throw new Error("AthleteModelResolver do not exists. Please update service at first with AthleteModelResolverService#update()");
		}

		return this.athleteModelResolver.resolve(onDate);
	}

	/**
	 * Resolve current being used AthleteModel
	 * @returns {AthleteModel}
	 */
	public getCurrent(): AthleteModel {
		return this.athleteModelResolver.resolve(new Date());
	}
}
