import { DeltaType } from "./delta-type.enum";

export class ProgressionAtDayRow {
	public year: number;
	public color: string;
	public previousDate: string;
	public progressTypeLabel: string;
	public progressTypeUnit: string;
	public currentValue: number;
	public delta: number;
	public deltaType: DeltaType;
	public deltaSignSymbol: string;
	public deltaClass: string;
}
