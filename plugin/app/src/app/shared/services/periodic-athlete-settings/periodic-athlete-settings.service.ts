import { Injectable } from "@angular/core";
import { PeriodicAthleteSettingsModel } from "../../../../../../shared/models/athlete-settings/periodic-athlete-settings.model";
import { PeriodicAthleteSettingsDao } from "../../dao/periodic-athlete-settings/periodic-athlete-settings.dao";
import * as _ from "lodash";
import { AppError } from "../../models/app-error.model";

/**
 * The latest managed period must have "from" as "forever"
 * The earliest managed period must have "to" as "forever"
 */
@Injectable()
export class PeriodicAthleteSettingsService {

	constructor(public periodicAthleteSettingsDao: PeriodicAthleteSettingsDao) {
	}

	/**
	 * Provides athlete periodic settings sorted by descending periods
	 * @returns {Promise<PeriodicAthleteSettingsModel[]>}
	 */
	public fetch(): Promise<PeriodicAthleteSettingsModel[]> {
		return this.periodicAthleteSettingsDao.fetch()
			.then((periodicAthleteSettingsModels: PeriodicAthleteSettingsModel[]) => {
				periodicAthleteSettingsModels = _.sortBy(periodicAthleteSettingsModels, (model: PeriodicAthleteSettingsModel) => {
					const sortOnDate: Date = (_.isNull(model.from)) ? new Date(0) : new Date(model.from);
					return sortOnDate.getTime() * -1;
				});
				return Promise.resolve(periodicAthleteSettingsModels);
			});
	}

	/**
	 * Add a athlete periodic settings.
	 * @param {AthletePeriodicSettings} periodicAthleteSettings
	 * @returns {Promise<PeriodicAthleteSettingsModel[]>}
	 */
	public add(periodicAthleteSettings: PeriodicAthleteSettingsModel): Promise<PeriodicAthleteSettingsModel[]> {

		return this.validateSingle(periodicAthleteSettings).then(() => {

			return this.periodicAthleteSettingsDao.fetch();

		}).then((periodicAthleteSettingsModels: PeriodicAthleteSettingsModel[]) => {

			// Check if period already exists
			const alreadyExistingPeriodicSettings = _.find(periodicAthleteSettingsModels, {from: periodicAthleteSettings.from});

			if (!_.isEmpty(alreadyExistingPeriodicSettings)) {
				return Promise.reject(new AppError(AppError.PERIODIC_ATHLETE_SETTINGS_EXISTS, "Periodic athlete settings already exists. You should edit it instead."));
			}

			if (periodicAthleteSettingsModels.length > 0) {
				periodicAthleteSettingsModels = _.flatten([periodicAthleteSettings, periodicAthleteSettingsModels]);
			} else {

				// No existing PeriodicAthleteSettingsModel stored... Add the current
				periodicAthleteSettingsModels.push(periodicAthleteSettings);

				// And append a default forever PeriodicAthleteSettingsModel must be created
				const defaultForeverPeriodicAthleteSettings = _.cloneDeep(periodicAthleteSettings);
				defaultForeverPeriodicAthleteSettings.from = null;
				periodicAthleteSettingsModels.push(defaultForeverPeriodicAthleteSettings);
			}

			return this.validate(periodicAthleteSettingsModels).then(() => {
				return this.periodicAthleteSettingsDao.save(periodicAthleteSettingsModels);
			});
		});
	}

	/**
	 * Save (replace existing) athlete periodic settings.
	 * @param periodicAthleteSettingsModels
	 * @returns {Promise<PeriodicAthleteSettingsModel[]>}
	 */
	public save(periodicAthleteSettingsModels: PeriodicAthleteSettingsModel[]): Promise<PeriodicAthleteSettingsModel[]> {
		return this.validate(periodicAthleteSettingsModels).then(() => {
			return this.periodicAthleteSettingsDao.save(periodicAthleteSettingsModels);
		});
	}

	/**
	 * Reset (replace existing) athlete periodic settings with default PeriodicAthleteSettingsModel
	 * @returns {Promise<PeriodicAthleteSettingsModel[]>}
	 */
	public reset(): Promise<PeriodicAthleteSettingsModel[]> {
		// Force save empty and add default PeriodicAthleteSettingsModel
		return this.periodicAthleteSettingsDao.save([]).then(() => {
			return this.add(PeriodicAthleteSettingsModel.DEFAULT_MODEL);
		});
	}

	/**
	 * Edit a periodic athlete settings
	 * @param {string} fromIdentifier
	 * @param {PeriodicAthleteSettingsModel} periodicAthleteSettings
	 * @returns {Promise<PeriodicAthleteSettingsModel[]>}
	 */
	public edit(fromIdentifier: string, periodicAthleteSettings: PeriodicAthleteSettingsModel): Promise<PeriodicAthleteSettingsModel[]> {

		return this.validateSingle(periodicAthleteSettings).then(() => {

			return this.periodicAthleteSettingsDao.fetch();

		}).then((periodicAthleteSettingsModels: PeriodicAthleteSettingsModel[]) => {

			// Test if the edited periodic athlete settings 'from' conflicts with an existing one
			const isEditChangingFrom = (fromIdentifier !== periodicAthleteSettings.from);
			const isEditOverridingExistingSettings = (_.findIndex(periodicAthleteSettingsModels, {from: periodicAthleteSettings.from}) !== -1);
			const isEditConflictWithExistingSettings = (isEditChangingFrom && isEditOverridingExistingSettings);

			if (isEditConflictWithExistingSettings) {
				return Promise.reject(new AppError(AppError.PERIODIC_ATHLETE_SETTINGS_EXISTS,
					"Periodic athlete settings do not exists. You should add it instead."));
			}

			const indexOfSettingsToEdit = _.findIndex(periodicAthleteSettingsModels, {from: fromIdentifier});

			if (indexOfSettingsToEdit === -1) {
				return Promise.reject(new AppError(AppError.PERIODIC_ATHLETE_SETTINGS_DO_NOT_EXISTS,
					"Periodic athlete settings do not exists. You should add it instead."));
			}

			// Replace with settings given by the user
			periodicAthleteSettingsModels[indexOfSettingsToEdit] = periodicAthleteSettings;

			return this.validate(periodicAthleteSettingsModels).then(() => {
				return this.periodicAthleteSettingsDao.save(periodicAthleteSettingsModels);
			});
		});
	}

	/**
	 * Remove a periodic athlete settings
	 * @param {string} fromIdentifier
	 * @returns {Promise<PeriodicAthleteSettingsModel[]>}
	 */
	public remove(fromIdentifier: string): Promise<PeriodicAthleteSettingsModel[]> {

		return this.periodicAthleteSettingsDao.fetch().then((periodicAthleteSettingsModels: PeriodicAthleteSettingsModel[]) => {

			if (_.isNull(fromIdentifier)) {
				return Promise.reject(new AppError(AppError.PERIODIC_ATHLETE_SETTINGS_FOREVER_MUST_EXISTS,
					"Default forever periodic athlete settings cannot be removed."));
			}

			const indexOfSettingsToRemove = _.findIndex(periodicAthleteSettingsModels, {from: fromIdentifier});

			if (indexOfSettingsToRemove === -1) {
				return Promise.reject(new AppError(AppError.PERIODIC_ATHLETE_SETTINGS_DO_NOT_EXISTS,
					"Periodic athlete settings do not exists. You should add it instead."));
			}

			// Remove periodic athlete settings
			periodicAthleteSettingsModels.splice(indexOfSettingsToRemove, 1);

			return this.validate(periodicAthleteSettingsModels).then(() => {
				return this.periodicAthleteSettingsDao.save(periodicAthleteSettingsModels);
			});
		});
	}

	/**
	 *
	 * @param periodAthleteSettings
	 */
	public validate(periodAthleteSettings: PeriodicAthleteSettingsModel[]): Promise<void> {

		let hasForeverSettings = false;
		let hasDuplicate = false;

		const keyOccurrences = _.countBy(periodAthleteSettings, "from");

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
			return Promise.reject(new AppError(AppError.PERIODIC_ATHLETE_SETTINGS_FOREVER_MUST_EXISTS,
				"Default forever periodic athlete settings must exists."));
		}

		if (hasDuplicate) {
			return Promise.reject(new AppError(AppError.PERIODIC_ATHLETE_SETTINGS_DUPLICATES,
				"Periodic athlete settings have duplicates."));
		}

		return Promise.resolve();
	}

	/**
	 *
	 * @param periodicAthleteSettingsModel
	 */
	public validateSingle(periodicAthleteSettingsModel: PeriodicAthleteSettingsModel): Promise<void> {

		let promise = Promise.resolve();

		// Checking date format and validity
		if (periodicAthleteSettingsModel) {

			if (!_.isNull(periodicAthleteSettingsModel.from)) {
				const isDateWellFormatted = (/([0-9]{4})\-([0-9]{2})\-([0-9]{2})/gm).exec(periodicAthleteSettingsModel.from);
				const onDate = new Date(periodicAthleteSettingsModel.from);
				const isValidDate = (onDate instanceof Date && !isNaN(onDate.getTime()));

				if (!isDateWellFormatted || !isValidDate) {
					promise = Promise.reject(new AppError(AppError.PERIODIC_ATHLETE_SETTINGS_INVALID_DATE, "Periodic athlete settings has invalid date."));

				}
			}

		} else {
			promise = Promise.reject(new AppError(AppError.PERIODIC_ATHLETE_SETTINGS_DO_NOT_EXISTS, "Periodic athlete settings do not exists."));
		}

		return promise;
	}
}
