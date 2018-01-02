import { GraphPointModel } from "../../../shared/models/graphs/graph-point.model";
import { MarkerModel } from "../../../fitness-trend/fitness-trend-graph/models/marker.model";
import * as _ from "lodash";

export class ViewableYearProgressDataModel {

	public yearLines: GraphPointModel[][] = [];
	public markers: MarkerModel[] = [];

	constructor(markers: MarkerModel[]) {
		this.markers = markers;
	}

	public setGraphicsYearLines(yearLines: GraphPointModel[][]): void {
		this.yearLines = [];
		_.forEach(yearLines, (yearLine: GraphPointModel[]) => {
			this.yearLines.push(MG.convert.date(yearLine, "date"));
		});

	}
}
