import { Injectable } from "@angular/core";
import { AthleteModel, DatedAthleteSettingsModel } from "@elevate/shared/models";
import { AthleteDao } from "../../dao/athlete/athlete-dao.service";
import * as _ from "lodash";
import { AppError } from "../../models/app-error.model";

/**
 * The latest managed period must have "since" as "forever"
 */
@Injectable()
export class AthleteService {

    constructor(public athleteModelDao: AthleteDao) {
    }

    /**
     * Provides athlete model with dated settings sorted by descending periods
     */
    public fetch(): Promise<AthleteModel> {
        return this.athleteModelDao.fetch()
            .then((athleteModel: AthleteModel) => {

                athleteModel.datedAthleteSettings = _.sortBy(athleteModel.datedAthleteSettings, (model: DatedAthleteSettingsModel) => {
                    const sortOnDate: Date = (_.isNull(model.since)) ? new Date(0) : new Date(model.since);
                    return sortOnDate.getTime() * -1;
                });

                return Promise.resolve(athleteModel);
            });
    }

    /**
     * Add a athlete dated settings.
     */
    public addSettings(datedAthleteSettings: DatedAthleteSettingsModel): Promise<DatedAthleteSettingsModel[]> {

        return this.validateSingle(datedAthleteSettings).then(() => {

            return this.fetch();

        }).then((athleteModel: AthleteModel) => {

            // Check if period already exists
            const alreadyExistingDatedSettings = _.find(athleteModel.datedAthleteSettings, {since: datedAthleteSettings.since});

            if (!_.isEmpty(alreadyExistingDatedSettings)) {
                return Promise.reject(new AppError(AppError.DATED_ATHLETE_SETTINGS_EXISTS, "Dated athlete settings already exists. You should edit it instead."));
            }

            if (athleteModel.datedAthleteSettings.length > 0) {
                athleteModel.datedAthleteSettings = _.flatten([datedAthleteSettings, athleteModel.datedAthleteSettings]);
            } else {

                // No existing DatedAthleteSettingsModel stored... Add the current
                athleteModel.datedAthleteSettings.push(datedAthleteSettings);

                // And append a default forever DatedAthleteSettingsModel must be created
                const defaultForeverDatedAthleteSettings = _.cloneDeep(datedAthleteSettings);
                defaultForeverDatedAthleteSettings.since = null;
                athleteModel.datedAthleteSettings.push(defaultForeverDatedAthleteSettings);
            }

            return this.save(athleteModel).then(savedAthleteModel => {
                return Promise.resolve(savedAthleteModel.datedAthleteSettings);
            });
        });
    }

    /**
     * Save (replace existing) athlete model.
     */
    public save(athleteModel: AthleteModel): Promise<AthleteModel> {
        return this.validate(athleteModel.datedAthleteSettings).then(() => {
            return (<Promise<AthleteModel>> this.athleteModelDao.save(athleteModel));
        });
    }

    public saveProperty<V>(path: string | string[], value: V): Promise<AthleteModel> {
        return this.athleteModelDao.upsertProperty<V>(path, value);
    }

    /**
     * Reset (replace existing) athlete DatedAthleteSettings with default AthleteSettings
     */
    public resetSettings(): Promise<DatedAthleteSettingsModel[]> {

        return this.fetch().then((athleteModel: AthleteModel) => {
            athleteModel.datedAthleteSettings = [];
            return this.athleteModelDao.save(athleteModel);
        }).then(() => {
            return this.addSettings(DatedAthleteSettingsModel.DEFAULT_MODEL);
        });
    }

    /**
     * Edit a dated athlete settings
     */
    public editSettings(sinceIdentifier: string, datedAthleteSettings: DatedAthleteSettingsModel): Promise<DatedAthleteSettingsModel[]> {

        return this.validateSingle(datedAthleteSettings).then(() => {

            return this.fetch();

        }).then((athleteModel: AthleteModel) => {

            // Test if the edited dated athlete settings 'since' conflicts with an existing one
            const isEditChangingSince = (sinceIdentifier !== datedAthleteSettings.since);
            const isEditOverridingExistingSettings = (_.findIndex(athleteModel.datedAthleteSettings, {since: datedAthleteSettings.since}) !== -1);
            const isEditConflictWithExistingSettings = (isEditChangingSince && isEditOverridingExistingSettings);

            if (isEditConflictWithExistingSettings) {
                return Promise.reject(new AppError(AppError.DATED_ATHLETE_SETTINGS_EXISTS,
                    "Dated athlete settings do not exists. You should add it instead."));
            }

            const indexOfSettingsToEdit = _.findIndex(athleteModel.datedAthleteSettings, {since: sinceIdentifier});

            if (indexOfSettingsToEdit === -1) {
                return Promise.reject(new AppError(AppError.DATED_ATHLETE_SETTINGS_DO_NOT_EXISTS,
                    "Dated athlete settings do not exists. You should add it instead."));
            }

            // Replace with settings given by the user
            athleteModel.datedAthleteSettings[indexOfSettingsToEdit] = datedAthleteSettings;

            return this.save(athleteModel).then(savedAthleteModel => {
                return Promise.resolve(savedAthleteModel.datedAthleteSettings);
            });
        });
    }

    /**
     * Remove a dated athlete settings
     */
    public removeSettings(sinceIdentifier: string): Promise<DatedAthleteSettingsModel[]> {

        return this.fetch().then((athleteModel: AthleteModel) => {

            if (_.isNull(sinceIdentifier)) {
                return Promise.reject(new AppError(AppError.DATED_ATHLETE_SETTINGS_FOREVER_MUST_EXISTS,
                    "Default forever dated athlete settings cannot be removed."));
            }

            const indexOfSettingsToRemove = _.findIndex(athleteModel.datedAthleteSettings, {since: sinceIdentifier});

            if (indexOfSettingsToRemove === -1) {
                return Promise.reject(new AppError(AppError.DATED_ATHLETE_SETTINGS_DO_NOT_EXISTS,
                    "Dated athlete settings do not exists. You should add it instead."));
            }

            // Remove dated athlete settings
            athleteModel.datedAthleteSettings.splice(indexOfSettingsToRemove, 1);

            return this.save(athleteModel).then(savedAthleteModel => {
                return Promise.resolve(savedAthleteModel.datedAthleteSettings);
            });

        });
    }

    public validate(datedAthleteSettings: DatedAthleteSettingsModel[]): Promise<void> {

        let hasForeverSettings = false;
        let hasDuplicate = false;

        const keyOccurrences = _.countBy(datedAthleteSettings, "since");

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
