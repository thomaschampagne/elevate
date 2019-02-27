import { ProgressType } from "../enums/progress-type.enum";

export class ProgressAtDayModel {

	public date: Date;
	public year: number;
	public progressType: ProgressType;
	public value: number;
	public color: string;

}
