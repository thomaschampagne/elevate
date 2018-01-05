import { DeltaSign } from "./delta-sign.enum";

export class ProgressionAtDayRow {
	public date: string;
	public previousDate: string;
	public progressTypeLabel: string;
	public progressTypeUnit: string;
	public currentValue: number;
	public delta: number;
	public deltaSign: DeltaSign;
	public deltaSignSymbol: string;
	public deltaClass: string;
}
