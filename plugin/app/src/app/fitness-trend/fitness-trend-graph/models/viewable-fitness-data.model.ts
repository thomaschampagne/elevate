import { GraphPointModel } from "../../../shared/models/graphs/graph-point.model";
import { MarkerModel } from "./marker.model";
import { BaseLineModel } from "./base-line.model";
import * as _ from "lodash";

export class ViewableFitnessDataModel {

	public readonly trainingZonesBaseLines: BaseLineModel[] =
		[
			{value: 25, label: "Freshness"},
			{value: 5, label: "Neutral"},
			{value: -10, label: "Optimal"},
			{value: -30, label: "Over training"}
		];

	public readonly zeroBaseLine: BaseLineModel = {value: 0, label: null};

	public fatigueLine: GraphPointModel[] = [];
	public fitnessLine: GraphPointModel[] = [];
	public formLine: GraphPointModel[] = [];
	public fitnessTrendLines: GraphPointModel[][] = [];
	public markers: MarkerModel[] = [];

	public previewFatigueLine: GraphPointModel[] = [];
	public previewFitnessLine: GraphPointModel[] = [];
	public previewFormLine: GraphPointModel[] = [];

	constructor(markers: MarkerModel[],
				fatigueLine: GraphPointModel[],
				fitnessLine: GraphPointModel[],
				formLine: GraphPointModel[],
				previewFatigueLine: GraphPointModel[],
				previewFitnessLine: GraphPointModel[],
				previewFormLine: GraphPointModel[]) {

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

	public getBaseLines(isTrainingZonesEnabled: boolean): BaseLineModel[] {

		let baseLines = [];

		baseLines.push(this.zeroBaseLine);

		if (isTrainingZonesEnabled) {
			baseLines.push(this.trainingZonesBaseLines);
			baseLines = _.flatten(baseLines);
		}

		return baseLines;
	}
}
