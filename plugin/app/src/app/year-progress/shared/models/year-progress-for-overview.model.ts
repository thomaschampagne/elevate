import { YearProgressModel } from "./year-progress.model";
import { YearProgressTypeModel } from "./year-progress-type.model";
import { YearProgressStyleModel } from "../../year-progress-graph/models/year-progress-style.model";
import { Moment } from "moment";
import { ProgressConfig } from "../interfaces/progress-config";

export class YearProgressForOverviewModel {
	public progressConfig: ProgressConfig;
	public momentWatched: Moment;
	public selectedYears: number[];
	public yearProgressStyleModel: YearProgressStyleModel;
	public yearProgressions: YearProgressModel[]; // Progress for each year
	public progressTypes: YearProgressTypeModel[];
}
