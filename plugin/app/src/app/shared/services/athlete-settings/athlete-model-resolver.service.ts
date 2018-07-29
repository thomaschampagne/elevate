import { Injectable } from "@angular/core";
import { AthleteModelResolver } from "../../../../../../shared/resolvers/athlete-model.resolver";
import { UserSettingsService } from "../user-settings/user-settings.service";
import { PeriodicAthleteSettingsService } from "../periodic-athlete-settings/periodic-athlete-settings.service";
import { UserSettingsModel } from "../../../../../../shared/models/user-settings/user-settings.model";
import { PeriodicAthleteSettingsModel } from "../../../../../../shared/models/athlete-settings/periodic-athlete-settings.model";
import { AthleteModel } from "../../../../../../shared/models/athlete.model";
import * as _ from "lodash";

@Injectable()
export class AthleteModelResolverService {

	public athleteModelResolver: AthleteModelResolver;

	public userSettingsModel: UserSettingsModel;

	constructor(public userSettingsService: UserSettingsService,
				public periodicAthleteSettingsService: PeriodicAthleteSettingsService) {
	}

	/**
	 * Init service. Full-filled means ready
	 */
	public init(): Promise<void> {
		return this.userSettingsService.fetch().then((userSettings: UserSettingsModel) => {
			this.userSettingsModel = userSettings;
			return this.periodicAthleteSettingsService.fetch();
		}).then((periodicAthleteSettingsModels: PeriodicAthleteSettingsModel[]) => {
			this.athleteModelResolver = new AthleteModelResolver(this.userSettingsModel, periodicAthleteSettingsModels);
			return Promise.resolve();
		});
	}

	/**
	 *
	 * @param onDate Date format YYYY-MM-DD
	 * @returns {AthleteModel}
	 */
	public resolve(onDate: string): AthleteModel {

		if (_.isEmpty(this.athleteModelResolver)) {
			throw new Error("AthleteModelResolver do not exists. Please init service at first with AthleteModelResolverService#init()");
		}

		return this.athleteModelResolver.resolve(onDate);
	}
}
