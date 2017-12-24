import { GraphPointModel } from "../../shared/models/graphs/graph-point.model";
import { MarkerModel } from "../../fitness-trend/fitness-trend-graph/models/marker.model";
import * as _ from "lodash";
import { YearProgressStyleModel } from "./year-progress-style.model";

export class ViewableYearProgressDataModel {

	public yearLines: GraphPointModel[][] = [];
	public markers: MarkerModel[] = [];
	public style: YearProgressStyleModel;

	constructor(yearLines: GraphPointModel[][], markers: MarkerModel[], yearProgressStyleModel: YearProgressStyleModel) {

		_.forEach(yearLines, (yearLine: GraphPointModel[]) => {
			this.yearLines.push(MG.convert.date(yearLine, "date"));
		});

		this.markers = markers;
		this.style = yearProgressStyleModel;
	}

	public getYearColor(year: number): string {
		return this.style.colorMap.get(year);
	}
}
