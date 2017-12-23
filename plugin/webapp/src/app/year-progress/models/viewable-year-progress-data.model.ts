import { GraphPointModel } from "../../shared/models/graphs/graph-point.model";
import { MarkerModel } from "../../fitness-trend/fitness-trend-graph/models/marker.model";
import { YearLineStyleModel } from "./year-line-style.model";
import * as _ from "lodash";

export class ViewableYearProgressDataModel {

	public yearLines: GraphPointModel[][] = [];
	public markers: MarkerModel[] = [];
	public yearLineStyleModels: YearLineStyleModel[] = [];
	public circleColors: string[] = [];

	constructor(yearLines: GraphPointModel[][], markers: MarkerModel[], yearLineStyleModels: YearLineStyleModel[]) {

		_.forEach(yearLines, (yearLine: GraphPointModel[]) => {
			this.yearLines.push(MG.convert.date(yearLine, "date"));
		});

		this.markers = markers;
		this.yearLineStyleModels = yearLineStyleModels;
		this.circleColors = _.map(this.yearLineStyleModels, "stroke");
	}
}
