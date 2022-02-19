import { Gender } from "./gender.enum";
import { AbstractAthlete } from "./abstract.athlete";
import { PracticeLevel } from "./athlete-level.enum";
import { DatedAthleteSettings } from "./athlete-settings/dated-athlete-settings.model";
import { AthleteSettings } from "./athlete-settings/athlete-settings.model";
import { ElevateSport } from "../../enums/elevate-sport.enum";
import { AthleteSnapshot } from "./athlete-snapshot.model";
import { age } from "@elevate/shared/tools/age";

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

  public static asInstance(athleteModel: AthleteModel): AthleteModel {
    return new AthleteModel(
      athleteModel.gender,
      athleteModel.datedAthleteSettings,
      athleteModel.firstName,
      athleteModel.lastName,
      athleteModel.birthDate,
      athleteModel.practiceLevel,
      athleteModel.sports
    );
  }

  public static getDefaultDatedAthleteSettings(): DatedAthleteSettings[] {
    const foreverSettings = Object.assign({}, DatedAthleteSettings.DEFAULT_MODEL);
    foreverSettings.since = null;
    return [DatedAthleteSettings.DEFAULT_MODEL, foreverSettings];
  }

  public static getCurrentAthleteSnapshot(athleteModel: AthleteModel): AthleteSnapshot {
    const athleteModelInstance = AthleteModel.asInstance(athleteModel);
    return new AthleteSnapshot(
      athleteModelInstance.gender,
      athleteModelInstance.birthDate ? age(athleteModelInstance.birthDate) : null,
      athleteModelInstance.getCurrentSettings()
    );
  }

  public getCurrentSettings(): AthleteSettings {
    const lastDatedAthleteSettings = DatedAthleteSettings.asInstance(this.datedAthleteSettings[0]);
    return lastDatedAthleteSettings ? lastDatedAthleteSettings.toAthleteSettingsModel() : null;
  }
}
