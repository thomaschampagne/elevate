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

	public readonly zeroBaseLine: BaseLine = {value: 0, label: null};

	public fatigueLine: GraphPoint[] = [];
	public fitnessLine: GraphPoint[] = [];
	public formLine: GraphPoint[] = [];
	public fitnessTrendLines: GraphPoint[][] = [];
	public markers: Marker[] = [];

	public previewFatigueLine: GraphPoint[] = [];
	public previewFitnessLine: GraphPoint[] = [];
	public previewFormLine: GraphPoint[] = [];

	constructor(markers: Marker[],
				fatigueLine: GraphPoint[],
				fitnessLine: GraphPoint[],
				formLine: GraphPoint[],
				previewFatigueLine: GraphPoint[],
				previewFitnessLine: GraphPoint[],
				previewFormLine: GraphPoint[]) {

		this.markers = markers;

		this.fatigueLine = fatigueLine;
		this.fitnessLine = fitnessLine;
		this.formLine = formLine;
		this.previewFatigueLine = previewFatigueLine;
		this.previewFitnessLine = previewFitnessLine;
		this.previewFormLine = previewFormLine;

		this.fitnessTrendLines.push(MG.convert.date(this.fatigueLine, "date"));
		this.fitnessTrendLines.push(MG.convert.date(this.fitnessLine, "date"));
		this.fitnessTrendLines.push(MG.convert.date(this.formLine, "date"));
		this.fitnessTrendLines.push(MG.convert.date(this.previewFatigueLine, "date"));
		this.fitnessTrendLines.push(MG.convert.date(this.previewFitnessLine, "date"));
		this.fitnessTrendLines.push(MG.convert.date(this.previewFormLine, "date"));
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
