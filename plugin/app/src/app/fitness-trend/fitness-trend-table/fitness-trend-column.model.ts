import { DayFitnessTrendModel } from "../shared/models/day-fitness-trend.model";
import { FitnessTrendColumnType } from "./fitness-trend-column.enum";

export class FitnessTrendColumnModel {
	public id: string;
	public header: string;
	public description?: string;
	public type: FitnessTrendColumnType;
	public printText?: (dayFitnessTrend: DayFitnessTrendModel) => string;
}
