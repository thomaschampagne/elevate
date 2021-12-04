import _ from "lodash";
import { DatedAthleteSettings } from "../models/athlete/athlete-settings/dated-athlete-settings.model";
import { AthleteSettings } from "../models/athlete/athlete-settings/athlete-settings.model";
import { AthleteSnapshot } from "../models/athlete/athlete-snapshot.model";
import { AthleteModel } from "../models/athlete/athlete.model";
import { age } from "@elevate/shared/tools/age";

/**
 * Shared by core and app to resolve AthleteModel for a given activity date
 */
export class AthleteSnapshotResolver {
  public athleteModel: AthleteModel;

  constructor(athleteModel: AthleteModel) {
    this.athleteModel = athleteModel ? athleteModel : AthleteModel.DEFAULT_MODEL;

    this.athleteModel.datedAthleteSettings = _.sortBy(
      this.athleteModel.datedAthleteSettings,
      (model: DatedAthleteSettings) => {
        const sortOnDate: Date = _.isNull(model.since) ? new Date(0) : new Date(model.since);
        return sortOnDate.getTime() * -1;
      }
    );
  }

  public static getShortDateString(onDate: string | Date): string {
    let onDateString: string;

    if (onDate instanceof Date) {
      const isValidDate = !isNaN(onDate.getTime());
      if (!isValidDate) {
        return null;
      }
      onDateString =
        onDate.getFullYear() +
        "-" +
        (onDate.getMonth() + 1).toString().padStart(2, "0") +
        "-" +
        onDate.getDate().toString().padStart(2, "0");
    } else {
      if (_.isEmpty(onDate) || isNaN(new Date(onDate).getTime())) {
        return null;
      }
      onDateString = onDate;
    }

    return onDateString;
  }

  /**
   * Resolve the proper AthleteModel and activity date
   * @param onDate Date format YYYY-MM-DD or Date object
   */
  public resolve(onDate: string | Date): AthleteSnapshot {
    const onDateString: string = AthleteSnapshotResolver.getShortDateString(onDate);

    let datedAthleteSettings: DatedAthleteSettings;

    if (_.isNull(onDateString)) {
      // No compliant date given

      const foreverDatedAthleteSettings = _.last<DatedAthleteSettings>(this.athleteModel.datedAthleteSettings);
      datedAthleteSettings = foreverDatedAthleteSettings
        ? foreverDatedAthleteSettings
        : DatedAthleteSettings.DEFAULT_MODEL;

      datedAthleteSettings = DatedAthleteSettings.asInstance(datedAthleteSettings);
    } else {
      // Find the AthleteSnapshotModel for the given date
      datedAthleteSettings = this.resolveDatedAthleteSettingsAtDate(onDateString);
    }

    const athleteAge = this.athleteModel.birthDate && onDate ? age(this.athleteModel.birthDate, onDate) : null;

    return datedAthleteSettings
      ? new AthleteSnapshot(this.athleteModel.gender, athleteAge, datedAthleteSettings.toAthleteSettingsModel())
      : new AthleteSnapshot(this.athleteModel.gender, athleteAge, AthleteSettings.DEFAULT_MODEL);
  }

  public getCurrent(): AthleteSnapshot {
    return this.resolve(new Date());
  }

  public resolveDatedAthleteSettingsAtDate(onDate: string): DatedAthleteSettings {
    const onDateTime: number = new Date(onDate).getTime();

    const datedAthleteSettings: DatedAthleteSettings = _.find<DatedAthleteSettings>(
      this.athleteModel.datedAthleteSettings,
      (datedAthleteSettings: DatedAthleteSettings) => {
        const fromDate = datedAthleteSettings.since ? new Date(datedAthleteSettings.since) : new Date(0);
        return onDateTime >= fromDate.getTime();
      }
    );

    return datedAthleteSettings ? DatedAthleteSettings.asInstance(datedAthleteSettings) : null;
  }
}
