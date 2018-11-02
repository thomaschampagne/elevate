import { Injectable } from "@angular/core";
import { DatedAthleteSettingsModel } from "@elevate/shared/models";
import { DatedAthleteSettingsDao } from "../../dao/dated-athlete-settings/dated-athlete-settings.dao";
import * as _ from "lodash";
import { AppError } from "../../models/app-error.model";

/**
 * The latest managed period must have "since" as "forever"
 */
@Injectable()
export class DatedAthleteSettingsService {

	constructor(public datedAthleteSettingsDao: DatedAthleteSettingsDao) {
	}

	/**
	 * Provides athlete dated settings sorted by descending periods
	 * @returns {Promise<DatedAthleteSettingsModel[]>}
	 */
	public fetch(): Promise<DatedAthleteSettingsModel[]> {
		return this.datedAthleteSettingsDao.fetch()
			.then((datedAthleteSettingsModels: DatedAthleteSettingsModel[]) => {
				datedAthleteSettingsModels = _.sortBy(datedAthleteSettingsModels, (model: DatedAthleteSettingsModel) => {
					const sortOnDate: Date = (_.isNull(model.since)) ? new Date(0) : new Date(model.since);
					return sortOnDate.getTime() * -1;
				});
				return Promise.resolve(datedAthleteSettingsModels);
			});
	}

	/**
	 * Add a athlete dated settings.
	 * @param {DatedAthleteSettingsModel} datedAthleteSettings
	 * @returns {Promise<DatedAthleteSettingsModel[]>}
	 */
	public add(datedAthleteSettings: DatedAthleteSettingsModel): Promise<DatedAthleteSettingsModel[]> {

		return this.validateSingle(datedAthleteSettings).then(() => {

			return this.datedAthleteSettingsDao.fetch();

		}).then((datedAthleteSettingsModels: DatedAthleteSettingsModel[]) => {

			// Check if period already exists
			const alreadyExistingDatedSettings = _.find(datedAthleteSettingsModels, {since: datedAthleteSettings.since});

			if (!_.isEmpty(alreadyExistingDatedSettings)) {
				return Promise.reject(new AppError(AppError.DATED_ATHLETE_SETTINGS_EXISTS, "Dated athlete settings already exists. You should edit it instead."));
			}

			if (datedAthleteSettingsModels.length > 0) {
				datedAthleteSettingsModels = _.flatten([datedAthleteSettings, datedAthleteSettingsModels]);
			} else {

				// No existing DatedAthleteSettingsModel stored... Add the current
				datedAthleteSettingsModels.push(datedAthleteSettings);

				// And append a default forever DatedAthleteSettingsModel must be created
				const defaultForeverDatedAthleteSettings = _.cloneDeep(datedAthleteSettings);
				defaultForeverDatedAthleteSettings.since = null;
				datedAthleteSettingsModels.push(defaultForeverDatedAthleteSettings);
			}

			return this.validate(datedAthleteSettingsModels).then(() => {
				return this.datedAthleteSettingsDao.save(datedAthleteSettingsModels);
			});
		});
	}

	/**
	 * Save (replace existing) athlete dated settings.
	 * @param datedAthleteSettingsModels
	 * @returns {Promise<DatedAthleteSettingsModel[]>}
	 */
	public save(datedAthleteSettingsModels: DatedAthleteSettingsModel[]): Promise<DatedAthleteSettingsModel[]> {
		return this.validate(datedAthleteSettingsModels).then(() => {
			return this.datedAthleteSettingsDao.save(datedAthleteSettingsModels);
		});
	}

	/**
	 * Reset (replace existing) athlete dated settings with default DatedAthleteSettingsModel
	 * @returns {Promise<DatedAthleteSettingsModel[]>}
	 */
	public reset(): Promise<DatedAthleteSettingsModel[]> {
		// Force save empty and add default DatedAthleteSettingsModel
		return this.datedAthleteSettingsDao.save([]).then(() => {
			return this.add(DatedAthleteSettingsModel.DEFAULT_MODEL);
		});
	}

	/**
	 * Edit a dated athlete settings
	 * @param {string} sinceIdentifier
	 * @param {DatedAthleteSettingsModel} datedAthleteSettings
	 * @returns {Promise<DatedAthleteSettingsModel[]>}
	 */
	public edit(sinceIdentifier: string, datedAthleteSettings: DatedAthleteSettingsModel): Promise<DatedAthleteSettingsModel[]> {

		return this.validateSingle(datedAthleteSettings).then(() => {

			return this.datedAthleteSettingsDao.fetch();

		}).then((datedAthleteSettingsModels: DatedAthleteSettingsModel[]) => {

			// Test if the edited dated athlete settings 'since' conflicts with an existing one
			const isEditChangingSince = (sinceIdentifier !== datedAthleteSettings.since);
			const isEditOverridingExistingSettings = (_.findIndex(datedAthleteSettingsModels, {since: datedAthleteSettings.since}) !== -1);
			const isEditConflictWithExistingSettings = (isEditChangingSince && isEditOverridingExistingSettings);

			if (isEditConflictWithExistingSettings) {
				return Promise.reject(new AppError(AppError.DATED_ATHLETE_SETTINGS_EXISTS,
					"Dated athlete settings do not exists. You should add it instead."));
			}

			const indexOfSettingsToEdit = _.findIndex(datedAthleteSettingsModels, {since: sinceIdentifier});

			if (indexOfSettingsToEdit === -1) {
				return Promise.reject(new AppError(AppError.DATED_ATHLETE_SETTINGS_DO_NOT_EXISTS,
					"Dated athlete settings do not exists. You should add it instead."));
			}

			// Replace with settings given by the user
			datedAthleteSettingsModels[indexOfSettingsToEdit] = datedAthleteSettings;

			return this.validate(datedAthleteSettingsModels).then(() => {
				return this.datedAthleteSettingsDao.save(datedAthleteSettingsModels);
			});
		});
	}

	/**
	 * Remove a dated athlete settings
	 * @param {string} sinceIdentifier
	 * @returns {Promise<DatedAthleteSettingsModel[]>}
	 */
	public remove(sinceIdentifier: string): Promise<DatedAthleteSettingsModel[]> {

		return this.datedAthleteSettingsDao.fetch().then((datedAthleteSettingsModels: DatedAthleteSettingsModel[]) => {

			if (_.isNull(sinceIdentifier)) {
				return Promise.reject(new AppError(AppError.DATED_ATHLETE_SETTINGS_FOREVER_MUST_EXISTS,
					"Default forever dated athlete settings cannot be removed."));
			}

			const indexOfSettingsToRemove = _.findIndex(datedAthleteSettingsModels, {since: sinceIdentifier});

			if (indexOfSettingsToRemove === -1) {
				return Promise.reject(new AppError(AppError.DATED_ATHLETE_SETTINGS_DO_NOT_EXISTS,
					"Dated athlete settings do not exists. You should add it instead."));
			}

			// Remove dated athlete settings
			datedAthleteSettingsModels.splice(indexOfSettingsToRemove, 1);

			return this.validate(datedAthleteSettingsModels).then(() => {
				return this.datedAthleteSettingsDao.save(datedAthleteSettingsModels);
			});
		});
	}

	/**
	 *
	 * @param periodAthleteSettings
	 */
	public validate(periodAthleteSettings: DatedAthleteSettingsModel[]): Promise<void> {

		let hasForeverSettings = false;
		let hasDuplicate = false;

		const keyOccurrences = _.countBy(periodAthleteSettings, "since");

		_.mapKeys(keyOccurrences, (count: number, key: string) => {
			if (key === "null") {
				hasForeverSettings = true;
			}
			if (count > 1) {
				hasDuplicate = true;
			}
			return null;
		});

		if (!hasForeverSettings) {
			return Promise.reject(new AppError(AppError.DATED_ATHLETE_SETTINGS_FOREVER_MUST_EXISTS,
				"Default forever dated athlete settings must exists."));
		}

		if (hasDuplicate) {
			return Promise.reject(new AppError(AppError.DATED_ATHLETE_SETTINGS_DUPLICATES,
				"Dated athlete settings have duplicates."));
		}

		return Promise.resolve();
	}

	/**
	 *
	 * @param datedAthleteSettingsModel
	 */
	public validateSingle(datedAthleteSettingsModel: DatedAthleteSettingsModel): Promise<void> {

		let promise = Promise.resolve();

		// Checking date format and validity
		if (datedAthleteSettingsModel) {

			if (!_.isNull(datedAthleteSettingsModel.since)) {
				const isDateWellFormatted = (/([0-9]{4})\-([0-9]{2})\-([0-9]{2})/gm).exec(datedAthleteSettingsModel.since);
				const onDate = new Date(datedAthleteSettingsModel.since);
				const isValidDate = !isNaN(onDate.getTime());

				if (!isDateWellFormatted || !isValidDate) {
					promise = Promise.reject(new AppError(AppError.DATED_ATHLETE_SETTINGS_INVALID_DATE, "Dated athlete settings has invalid date."));

				}
			}

		} else {
			promise = Promise.reject(new AppError(AppError.DATED_ATHLETE_SETTINGS_DO_NOT_EXISTS, "Dated athlete settings do not exists."));
		}

		return promise;
	}
}
