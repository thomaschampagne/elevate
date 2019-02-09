import { YearProgressModel } from "./year-progress.model";
import { YearProgressTypeModel } from "./year-progress-type.model";
import { YearProgressStyleModel } from "../../year-progress-graph/models/year-progress-style.model";
import { Moment } from "moment";

export class YearProgressForOverviewModel {
	public momentWatched: Moment;
	public selectedYears: number[];
	public selectedActivityTypes: string[];
	public yearProgressStyleModel: YearProgressStyleModel;
	public yearProgressions: YearProgressModel[]; // Progress for each year
	public progressTypes: YearProgressTypeModel[];
}
