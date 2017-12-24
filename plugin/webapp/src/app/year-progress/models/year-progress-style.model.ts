import { YearLineStyleModel } from "./year-line-style.model";

export class YearProgressStyleModel {

	public lineStyles: YearLineStyleModel[] = [];
	public colorMap: Map<number, string>;
	public circleColors: string[] = [];

	constructor(lineStyles: YearLineStyleModel[], colorMap: Map<number, string>, circleColors: string[]) {
		this.lineStyles = lineStyles;
		this.colorMap = colorMap;
		this.circleColors = circleColors;
	}
}
