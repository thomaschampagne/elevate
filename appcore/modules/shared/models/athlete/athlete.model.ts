import { Gender } from "./gender.enum";
import { AthleteSettingsModel, DatedAthleteSettingsModel } from "./athlete-settings";
import { AbstractAthleteModel } from "./abstract-athlete.model";
import { PracticeLevel } from "./athlete-level.enum";
import { ElevateSport } from "../../enums";

export class AthleteModel extends AbstractAthleteModel {
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
    public datedAthleteSettings: DatedAthleteSettingsModel[],
    public firstName: string | null = null,
    public lastName: string | null = null,
    public birthDate: Date | null = null,
    public practiceLevel: PracticeLevel | null = null,
    public sports: ElevateSport[] = []
  ) {
    super();
    this.datedAthleteSettings =
      !datedAthleteSettings || datedAthleteSettings.length === 0
        ? [DatedAthleteSettingsModel.DEFAULT_MODEL]
        : datedAthleteSettings;
  }

  public static getDefaultDatedAthleteSettings(): DatedAthleteSettingsModel[] {
    const foreverSettings = Object.assign({}, DatedAthleteSettingsModel.DEFAULT_MODEL);
    foreverSettings.since = null;
    return [DatedAthleteSettingsModel.DEFAULT_MODEL, foreverSettings];
  }

  /**
   *
   */
  public getCurrentSettings(): AthleteSettingsModel {
    const lastDatedAthleteSettingsModel = this.datedAthleteSettings[this.datedAthleteSettings.length - 1];
    return lastDatedAthleteSettingsModel ? lastDatedAthleteSettingsModel.toAthleteSettingsModel() : null;
  }
}
