import { DayFitnessTrendModel } from "../shared/models/day-fitness-trend.model";
import { FitnessTrendColumnType } from "./fitness-trend-column.enum";

export class FitnessTrendColumnModel {
  public id: string;
  public header: string;
  public type: FitnessTrendColumnType;
  public description?: string;
  public width?: number;
  public printText?: (dayFitnessTrend: DayFitnessTrendModel) => string;
}
