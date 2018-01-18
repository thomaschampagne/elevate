import { GraphPointModel } from "../../../shared/models/graphs/graph-point.model";
import { MarkerModel } from "../../../fitness-trend/fitness-trend-graph/models/marker.model";
import * as _ from "lodash";
import { Moment } from "moment";

export class ViewableYearProgressDataModel {

	public yearLines: GraphPointModel[][] = [];
	public markers: MarkerModel[] = [];
	public markerMoment: Moment;

	constructor() {
		this.markerMoment = null;
	}

	public setGraphicsYearLines(yearLines: GraphPointModel[][]): void {
		this.yearLines = [];
		_.forEach(yearLines, (yearLine: GraphPointModel[]) => {
			this.yearLines.push(MG.convert.date(yearLine, "date"));
		});
	}

	public setMarkerMoment(markerMoment: Moment): void {
		this.markerMoment = markerMoment;
		this.markers = [{
			date: markerMoment.toDate(),
			label: markerMoment.format("MMM Do")
		}];
	}

	public getMarkerMoment(): Moment {
		return this.markerMoment;
	}
}
