import { Injectable } from "@angular/core";
import { PeriodicAthleteSettingsModel } from "../../../../../../shared/models/athlete-settings/periodic-athlete-settings.model";
import * as _ from "lodash";

@Injectable()
export class PeriodicAthleteSettingsDao {

	public static readonly PERIODIC_ATHLETE_SETTINGS_KEY: string = "periodicAthleteSettings";

	constructor() {
	}

	public fetch(): Promise<PeriodicAthleteSettingsModel[]> {

		return new Promise<PeriodicAthleteSettingsModel[]>((resolve: Function, reject: Function) => {

			this.browserStorageLocal().get(PeriodicAthleteSettingsDao.PERIODIC_ATHLETE_SETTINGS_KEY, (result: { periodicAthleteSettings: PeriodicAthleteSettingsModel[] }) => {
				const error = this.getChromeError();
				if (error) {
					reject(error.message);
				} else {
					const periodicAthleteSettingsModels = (_.isEmpty(result.periodicAthleteSettings)) ? [] : result.periodicAthleteSettings;
					resolve(periodicAthleteSettingsModels);
				}
			});

		});
	}

	public save(athletePeriodSettings: PeriodicAthleteSettingsModel[]): Promise<PeriodicAthleteSettingsModel[]> {

		return new Promise<PeriodicAthleteSettingsModel[]>((resolve: Function, reject: Function) => {

			athletePeriodSettings = _.sortBy(athletePeriodSettings, (model: PeriodicAthleteSettingsModel) => {
				const sortOnDate: Date = (_.isNull(model.since)) ? new Date(0) : new Date(model.since);
				return sortOnDate.getTime() * -1;
			});

			const athletePeriodSettingsData = {};
			athletePeriodSettingsData[PeriodicAthleteSettingsDao.PERIODIC_ATHLETE_SETTINGS_KEY] = athletePeriodSettings;

			this.browserStorageLocal().set(athletePeriodSettingsData, () => {
				const error = this.getChromeError();
				if (error) {
					reject(error.message);
				} else {
					this.fetch().then((models: PeriodicAthleteSettingsModel[]) => {
						resolve(models);
					});
				}
			});

		});
	}

	/**
	 *
	 * @returns {chrome.storage.SyncStorageArea}
	 */
	public browserStorageLocal(): chrome.storage.LocalStorageArea {
		return chrome.storage.local;
	}

	/**
	 *
	 * @returns {chrome.runtime.LastError}
	 */
	public getChromeError(): chrome.runtime.LastError {
		return chrome.runtime.lastError;
	}

}
