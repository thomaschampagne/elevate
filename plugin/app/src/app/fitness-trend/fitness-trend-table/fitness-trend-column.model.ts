import { DayFitnessTrendModel } from "../shared/models/day-fitness-trend.model";
import { FitnessTrendColumnType } from "./fitness-trend-column.enum";

export class FitnessTrendColumnModel {
	public columnDef: string;
	public header: string;
	public toolTip?: string;
	public type: FitnessTrendColumnType;
	public printText?: (dayFitnessTrend: DayFitnessTrendModel) => string;
}
