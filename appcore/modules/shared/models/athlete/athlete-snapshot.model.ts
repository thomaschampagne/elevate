import { AbstractAthleteModel } from "./abstract-athlete.model";
import { Gender } from "./gender.enum";
import { AthleteSettingsModel } from "./athlete-settings";

export class AthleteSnapshotModel extends AbstractAthleteModel {
  constructor(
    public readonly gender: Gender,
    public readonly age: number,
    public readonly athleteSettings: AthleteSettingsModel
  ) {
    super();
  }

  public equals(otherSnapshot: AthleteSnapshotModel): boolean {
    const isSame =
      otherSnapshot &&
      (this.athleteSettings.maxHr !== otherSnapshot.athleteSettings.maxHr ||
        this.athleteSettings.restHr !== otherSnapshot.athleteSettings.restHr ||
        this.athleteSettings.cyclingFtp !== otherSnapshot.athleteSettings.cyclingFtp ||
        this.athleteSettings.runningFtp !== otherSnapshot.athleteSettings.runningFtp ||
        this.athleteSettings.lthr.default !== otherSnapshot.athleteSettings.lthr.default ||
        this.athleteSettings.lthr.cycling !== otherSnapshot.athleteSettings.lthr.cycling ||
        this.athleteSettings.lthr.running !== otherSnapshot.athleteSettings.lthr.running ||
        this.athleteSettings.weight !== otherSnapshot.athleteSettings.weight ||
        this.athleteSettings.swimFtp !== otherSnapshot.athleteSettings.swimFtp ||
        this.age !== otherSnapshot.age ||
        this.gender !== otherSnapshot.gender);
    return !isSame;
  }
}
