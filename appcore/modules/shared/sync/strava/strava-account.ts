import { Gender } from "../../models/athlete/gender.enum";

export class StravaAccount {
  constructor(
    public readonly id: number,
    public readonly username: string,
    public readonly firstname: string,
    public readonly lastname: string,
    public readonly city: string,
    public readonly state: string,
    public readonly country: string,
    public readonly gender: Gender
  ) {
    this.id = id;
    this.username = username;
    this.firstname = firstname;
    this.lastname = lastname;
    this.city = city;
    this.state = state;
    this.country = country;
    this.gender = gender;
  }
}
