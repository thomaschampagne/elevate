import { Delta } from "./delta.model";

export class ProgressionAtDayRow {
	public year: number;
	public color: string;
	public currentValue: number;
	public progressTypeLabel: string;
	public progressTypeUnit: string;
	public deltaPreviousYear: Delta;
	public deltaCurrentYear: Delta;
}
