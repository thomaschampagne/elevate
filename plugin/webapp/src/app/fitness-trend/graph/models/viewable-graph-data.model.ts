import { GraphPoint } from "./graph-point.model";
import { Marker } from "./marker.model";
import { BaseLine } from "./base-line.model";
import * as _ from "lodash";

export class ViewableGraphData {

	public readonly trainingZonesBaseLines: BaseLine[] =
		[
			{value: 25, label: "Freshness"},
			{value: 5, label: "Neutral"},
			{value: -10, label: "Optimal"},
			{value: -30, label: "Over training"}
		];

	public readonly zeroBaseLine: BaseLine = {value: 0, label: "Zero"};

	public fatigueLine: GraphPoint[] = [];
	public fitnessLine: GraphPoint[] = [];
	public formLine: GraphPoint[] = [];
	public fitnessTrendLines: GraphPoint[][] = [];
	public markers: Marker[] = [];


	constructor(fatigueLine: GraphPoint[],
				fitnessLine: GraphPoint[],
				formLine: GraphPoint[],
				markers: Marker[]) {

		this.fatigueLine = fatigueLine;
		this.fitnessLine = fitnessLine;
		this.formLine = formLine;
		this.markers = markers;

		this.fitnessTrendLines.push(MG.convert.date(this.fatigueLine, "date"));
		this.fitnessTrendLines.push(MG.convert.date(this.fitnessLine, "date"));
		this.fitnessTrendLines.push(MG.convert.date(this.formLine, "date"));
	}

	public getBaseLines(isTrainingZonesEnabled: boolean): BaseLine[] {

		let baseLines = [];

		baseLines.push(this.zeroBaseLine);

		if (isTrainingZonesEnabled) {
			baseLines.push(this.trainingZonesBaseLines);
			baseLines = _.flatten(baseLines);
		}

		return baseLines;
	}
}
