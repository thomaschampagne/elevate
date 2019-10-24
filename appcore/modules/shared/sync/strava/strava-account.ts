import { Gender } from "../../models/athlete";

export class StravaAccount {

	public id: number;
	public username: string;
	public firstname: string;
	public lastname: string;
	public city: string;
	public state: string;
	public country: string;
	public gender: Gender;

	constructor(id: number, username: string, firstname: string, lastname: string, city: string, state: string,
				country: string, gender: Gender) {
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
