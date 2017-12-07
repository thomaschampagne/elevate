import { GraphPoint } from "./graph-point.model";
import { Marker } from "./marker.model";

export class ViewableGraphData { // TODO Extract model

	public fatigueLine: GraphPoint[] = [];
	public fitnessLine: GraphPoint[] = [];
	public formLine: GraphPoint[] = [];
	public fitnessTrendLines: GraphPoint[][] = [];
	public markers: Marker[] = [];

	constructor(fatigueLine: GraphPoint[], fitnessLine: GraphPoint[], formLine: GraphPoint[], markers: Marker[]) {
		this.fatigueLine = fatigueLine;
		this.fitnessLine = fitnessLine;
		this.formLine = formLine;
		this.markers = markers;

		this.fitnessTrendLines.push(MG.convert.date(this.fatigueLine, "date"));
		this.fitnessTrendLines.push(MG.convert.date(this.fitnessLine, "date"));
		this.fitnessTrendLines.push(MG.convert.date(this.formLine, "date"));
	}
}
