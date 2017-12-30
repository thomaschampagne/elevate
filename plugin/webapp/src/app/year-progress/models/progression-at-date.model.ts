import { ProgressType } from "./progress-type.enum";

export class ProgressionAtDayModel {

	public date: Date;
	public year: number;
	public progressType: ProgressType;
	public value: number;
	public color: string;

	constructor(date: Date, year: number, progressType: ProgressType, value: number, color: string) {
		this.date = date;
		this.year = year;
		this.progressType = progressType;
		this.value = value;
		this.color = color;
	}
}
