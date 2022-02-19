import { AthleteSettings } from "./athlete-settings.model";

export class DatedAthleteSettings extends AthleteSettings {
  public static readonly DEFAULT_SINCE: string =
    new Date().getFullYear() +
    "-" +
    (new Date().getMonth() + 1).toString().padStart(2, "0") +
    "-" +
    new Date().getDate().toString().padStart(2, "0");
  public static readonly SINCE_DATE_FORMAT: string = "YYYY-MM-DD";
  public static readonly DEFAULT_MODEL: DatedAthleteSettings = new DatedAthleteSettings(
    DatedAthleteSettings.DEFAULT_SINCE,
    AthleteSettings.DEFAULT_MODEL
  );
  /**
   * Start period date. A null value means since "forever"
   */
  public since: string = null;

  /**
   * @param since Date format YYYY-MM-DD
   * @param athleteSettingsModel AthleteSettingsModel
   */
  constructor(since: string, athleteSettingsModel: AthleteSettings) {
    super(
      athleteSettingsModel.maxHr,
      athleteSettingsModel.restHr,
      athleteSettingsModel.lthr,
      athleteSettingsModel.cyclingFtp,
      athleteSettingsModel.runningFtp,
      athleteSettingsModel.swimFtp,
      athleteSettingsModel.weight
    );
    this.since = since;
  }

  public static asInstance(datedAthleteSettings: DatedAthleteSettings): DatedAthleteSettings {
    return new DatedAthleteSettings(
      datedAthleteSettings.since,
      new AthleteSettings(
        datedAthleteSettings.maxHr,
        datedAthleteSettings.restHr,
        datedAthleteSettings.lthr,
        datedAthleteSettings.cyclingFtp,
        datedAthleteSettings.runningFtp,
        datedAthleteSettings.swimFtp,
        datedAthleteSettings.weight
      )
    );
  }

  public toAthleteSettingsModel(): AthleteSettings {
    return new AthleteSettings(
      this.maxHr,
      this.restHr,
      this.lthr,
      this.cyclingFtp,
      this.runningFtp,
      this.swimFtp,
      this.weight
    );
  }

  public isForever(): boolean {
    return this.since === null;
  }
}
