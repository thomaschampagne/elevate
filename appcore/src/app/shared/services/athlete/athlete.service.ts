import { AthleteDao } from "../../dao/athlete/athlete.dao";
import _ from "lodash";
import { AppError } from "../../models/app-error.model";
import { AthleteModel } from "@elevate/shared/models/athlete/athlete.model";
import { DatedAthleteSettings } from "@elevate/shared/models/athlete/athlete-settings/dated-athlete-settings.model";

/**
 * The latest managed period must have "since" as "forever"
 */
export abstract class AthleteService {
  protected constructor(public readonly athleteModelDao: AthleteDao) {}

  /**
   * Provides athlete model with dated settings sorted by descending periods
   */
  public fetch(): Promise<AthleteModel> {
    return this.athleteModelDao.findOne().then((athleteModel: AthleteModel) => {
      athleteModel.datedAthleteSettings = _.sortBy(athleteModel.datedAthleteSettings, (model: DatedAthleteSettings) => {
        const sortOnDate: Date = _.isNull(model.since) ? new Date(0) : new Date(model.since);
        return sortOnDate.getTime() * -1;
      });
      return Promise.resolve(athleteModel);
    });
  }

  /**
   * Add a athlete dated settings.
   */
  public addSettings(datedAthleteSettings: DatedAthleteSettings): Promise<DatedAthleteSettings[]> {
    return this.validateSingle(datedAthleteSettings)
      .then(() => {
        return this.fetch();
      })
      .then((athleteModel: AthleteModel) => {
        // Check if period already exists
        const alreadyExistingDatedSettings = _.find(athleteModel.datedAthleteSettings, {
          since: datedAthleteSettings.since
        });

        if (!_.isEmpty(alreadyExistingDatedSettings)) {
          return Promise.reject(
            new AppError(
              AppError.DATED_ATHLETE_SETTINGS_EXISTS,
              "Dated athlete settings already exists. You should edit it instead."
            )
          );
        }

        if (athleteModel.datedAthleteSettings.length > 0) {
          athleteModel.datedAthleteSettings = _.flatten([datedAthleteSettings, athleteModel.datedAthleteSettings]);
        } else {
          // No existing DatedAthleteSettings stored... Add the current
          athleteModel.datedAthleteSettings.push(datedAthleteSettings);

          // And append a default forever DatedAthleteSettings must be created
          const defaultForeverDatedAthleteSettings = _.cloneDeep(datedAthleteSettings);
          defaultForeverDatedAthleteSettings.since = null;
          athleteModel.datedAthleteSettings.push(defaultForeverDatedAthleteSettings);
        }

        return this.validateUpdate(athleteModel).then(updatedAthleteModel => {
          return Promise.resolve(updatedAthleteModel.datedAthleteSettings);
        });
      });
  }

  public validateUpdate(athleteModel: AthleteModel): Promise<AthleteModel> {
    return this.validate(athleteModel.datedAthleteSettings).then(() => {
      return this.update(athleteModel);
    });
  }

  public validateInsert(athleteModel: AthleteModel): Promise<AthleteModel> {
    return this.validate(athleteModel.datedAthleteSettings).then(() => {
      return this.insert(athleteModel);
    });
  }

  public update(athleteModel: AthleteModel): Promise<AthleteModel> {
    return this.athleteModelDao.update(athleteModel);
  }

  public insert(athleteModel: AthleteModel): Promise<AthleteModel> {
    return this.athleteModelDao.insert(athleteModel);
  }

  /**
   * Reset (replace existing) athlete DatedAthleteSettings with default AthleteSettings
   */
  public resetSettings(): Promise<DatedAthleteSettings[]> {
    return this.fetch()
      .then((athleteModel: AthleteModel) => {
        athleteModel.datedAthleteSettings = [];
        return this.update(athleteModel);
      })
      .then(() => {
        return this.addSettings(DatedAthleteSettings.DEFAULT_MODEL);
      });
  }

  /**
   * Edit a dated athlete settings
   */
  public editSettings(
    sinceIdentifier: string,
    datedAthleteSettings: DatedAthleteSettings
  ): Promise<DatedAthleteSettings[]> {
    return this.validateSingle(datedAthleteSettings)
      .then(() => {
        return this.fetch();
      })
      .then((athleteModel: AthleteModel) => {
        // Test if the edited dated athlete settings 'since' conflicts with an existing one
        const isEditChangingSince = sinceIdentifier !== datedAthleteSettings.since;
        const isEditOverridingExistingSettings =
          _.findIndex(athleteModel.datedAthleteSettings, { since: datedAthleteSettings.since }) !== -1;
        const isEditConflictWithExistingSettings = isEditChangingSince && isEditOverridingExistingSettings;

        if (isEditConflictWithExistingSettings) {
          return Promise.reject(
            new AppError(
              AppError.DATED_ATHLETE_SETTINGS_EXISTS,
              "Dated athlete settings do not exists. You should add it instead."
            )
          );
        }

        const indexOfSettingsToEdit = _.findIndex(athleteModel.datedAthleteSettings, {
          since: sinceIdentifier
        });

        if (indexOfSettingsToEdit === -1) {
          return Promise.reject(
            new AppError(
              AppError.DATED_ATHLETE_SETTINGS_DO_NOT_EXISTS,
              "Dated athlete settings do not exists. You should add it instead."
            )
          );
        }

        // Replace with settings given by the user
        athleteModel.datedAthleteSettings[indexOfSettingsToEdit] = datedAthleteSettings;

        return this.validateUpdate(athleteModel).then(updatedAthleteModel => {
          return Promise.resolve(updatedAthleteModel.datedAthleteSettings);
        });
      });
  }

  /**
   * Remove a dated athlete settings
   */
  public removeSettings(sinceIdentifier: string): Promise<DatedAthleteSettings[]> {
    return this.fetch().then((athleteModel: AthleteModel) => {
      if (_.isNull(sinceIdentifier)) {
        return Promise.reject(
          new AppError(
            AppError.DATED_ATHLETE_SETTINGS_FOREVER_MUST_EXISTS,
            "Default forever dated athlete settings cannot be removed."
          )
        );
      }

      const indexOfSettingsToRemove = _.findIndex(athleteModel.datedAthleteSettings, { since: sinceIdentifier });

      if (indexOfSettingsToRemove === -1) {
        return Promise.reject(
          new AppError(
            AppError.DATED_ATHLETE_SETTINGS_DO_NOT_EXISTS,
            "Dated athlete settings do not exists. You should add it instead."
          )
        );
      }

      // Remove dated athlete settings
      athleteModel.datedAthleteSettings.splice(indexOfSettingsToRemove, 1);

      return this.validateUpdate(athleteModel).then(updatedAthleteModel => {
        return Promise.resolve(updatedAthleteModel.datedAthleteSettings);
      });
    });
  }

  public validate(datedAthleteSettings: DatedAthleteSettings[]): Promise<void> {
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
      return Promise.reject(
        new AppError(
          AppError.DATED_ATHLETE_SETTINGS_FOREVER_MUST_EXISTS,
          "Default forever dated athlete settings must exists."
        )
      );
    }

    if (hasDuplicate) {
      return Promise.reject(
        new AppError(AppError.DATED_ATHLETE_SETTINGS_DUPLICATES, "Dated athlete settings have duplicates.")
      );
    }

    return Promise.resolve();
  }

  public validateSingle(datedAthleteSettings: DatedAthleteSettings): Promise<void> {
    let promise = Promise.resolve();

    // Checking date format and validity
    if (datedAthleteSettings) {
      if (!_.isNull(datedAthleteSettings.since)) {
        const isDateWellFormatted = /([0-9]{4})\-([0-9]{2})\-([0-9]{2})/gm.exec(datedAthleteSettings.since);
        const onDate = new Date(datedAthleteSettings.since);
        const isValidDate = !isNaN(onDate.getTime());

        if (!isDateWellFormatted || !isValidDate) {
          promise = Promise.reject(
            new AppError(AppError.DATED_ATHLETE_SETTINGS_INVALID_DATE, "Dated athlete settings has invalid date.")
          );
        }
      }
    } else {
      promise = Promise.reject(
        new AppError(AppError.DATED_ATHLETE_SETTINGS_DO_NOT_EXISTS, "Dated athlete settings do not exists.")
      );
    }

    return promise;
  }

  public clear(): Promise<void> {
    return this.athleteModelDao.clear();
  }
}
