import { Injectable } from "@angular/core";
import * as _ from "lodash";
import { DatedAthleteSettingsModel } from "@elevate/shared/models";

@Injectable()
export class DatedAthleteSettingsDao {

	public static readonly DATED_ATHLETE_SETTINGS_KEY: string = "datedAthleteSettings";

	constructor() {
	}

	public fetch(): Promise<DatedAthleteSettingsModel[]> {

		return new Promise<DatedAthleteSettingsModel[]>((resolve: Function, reject: Function) => {

			this.browserStorageLocal().get(DatedAthleteSettingsDao.DATED_ATHLETE_SETTINGS_KEY, (result: { datedAthleteSettings: DatedAthleteSettingsModel[] }) => {
				const error = this.getChromeError();
				if (error) {
					reject(error.message);
				} else {
					const datedAthleteSettingsModels = (_.isEmpty(result.datedAthleteSettings)) ? [] : result.datedAthleteSettings;
					resolve(datedAthleteSettingsModels);
				}
			});

		});
	}

	public save(datedAthleteSettingsModels: DatedAthleteSettingsModel[]): Promise<DatedAthleteSettingsModel[]> {

		return new Promise<DatedAthleteSettingsModel[]>((resolve: Function, reject: Function) => {

			datedAthleteSettingsModels = _.sortBy(datedAthleteSettingsModels, (model: DatedAthleteSettingsModel) => {
				const sortOnDate: Date = (_.isNull(model.since)) ? new Date(0) : new Date(model.since);
				return sortOnDate.getTime() * -1;
			});

			const datedAthleteSettingsData = {};
			datedAthleteSettingsData[DatedAthleteSettingsDao.DATED_ATHLETE_SETTINGS_KEY] = datedAthleteSettingsModels;

			this.browserStorageLocal().set(datedAthleteSettingsData, () => {
				const error = this.getChromeError();
				if (error) {
					reject(error.message);
				} else {
					this.fetch().then((models: DatedAthleteSettingsModel[]) => {
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
