import { DayFitnessTrendModel } from "../shared/models/day-fitness-trend.model";

export class FitnessTrendColumnModel {
	public columnDef: string;
	public header: string;
	public toolTip?: string;
	public printCellContent: (dayFitnessTrend: DayFitnessTrendModel) => string;
}
