import { Gender } from "./gender.enum";
import { AbstractAthlete } from "./abstract.athlete";
import { PracticeLevel } from "./athlete-level.enum";
import { DatedAthleteSettings } from "./athlete-settings/dated-athlete-settings.model";
import { AthleteSettings } from "./athlete-settings/athlete-settings.model";
import { ElevateSport } from "../../enums/elevate-sport.enum";

export class AthleteModel extends AbstractAthlete {
  public static readonly DEFAULT_MODEL: AthleteModel = new AthleteModel(
    Gender.MEN,
    AthleteModel.getDefaultDatedAthleteSettings(),
    null,
    null,
    null,
    null,
    []
  );

  constructor(
    public gender: Gender,
    public datedAthleteSettings: DatedAthleteSettings[],
    public firstName: string | null = null,
    public lastName: string | null = null,
    public birthDate: Date | null = null,
    public practiceLevel: PracticeLevel | null = null,
    public sports: ElevateSport[] = []
  ) {
    super();
    this.datedAthleteSettings =
      !datedAthleteSettings || datedAthleteSettings.length === 0
        ? [DatedAthleteSettings.DEFAULT_MODEL]
        : datedAthleteSettings;
  }

  public static getDefaultDatedAthleteSettings(): DatedAthleteSettings[] {
    const foreverSettings = Object.assign({}, DatedAthleteSettings.DEFAULT_MODEL);
    foreverSettings.since = null;
    return [DatedAthleteSettings.DEFAULT_MODEL, foreverSettings];
  }

  /**
   *
   */
  public getCurrentSettings(): AthleteSettings {
    const lastDatedAthleteSettings = this.datedAthleteSettings[this.datedAthleteSettings.length - 1];
    return lastDatedAthleteSettings ? lastDatedAthleteSettings.toAthleteSettingsModel() : null;
  }
}
