import moment from "moment";
import { DatedAthleteSettings } from "@elevate/shared/models/athlete/athlete-settings/dated-athlete-settings.model";

export class DatedAthleteSettingsTable extends DatedAthleteSettings {
  public sinceAsDate: Date;
  public untilAsDate: Date;

  constructor(datedAthleteSettings: DatedAthleteSettings, previousDatedAthleteSettings: DatedAthleteSettings) {
    super(datedAthleteSettings.since, datedAthleteSettings);

    this.sinceAsDate = this.since ? new Date(this.since) : null;
    this.untilAsDate =
      previousDatedAthleteSettings && previousDatedAthleteSettings.since
        ? moment(previousDatedAthleteSettings.since, DatedAthleteSettings.SINCE_DATE_FORMAT)
            .subtract(1, "days")
            .toDate()
        : null;
  }

  public isNow(): boolean {
    return this.untilAsDate === null;
  }
}
