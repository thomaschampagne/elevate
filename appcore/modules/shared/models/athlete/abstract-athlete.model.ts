import { Gender } from "./gender.enum";

export abstract class AbstractAthleteModel {
  public abstract readonly gender: Gender;
}
