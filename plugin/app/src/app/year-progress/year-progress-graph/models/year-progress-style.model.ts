export class YearProgressStyleModel {

	public yearsColorsMap: Map<number, string>;
	public colors: string[] = [];

	constructor(yearsColorsMap: Map<number, string>, colors: string[]) {
		this.yearsColorsMap = yearsColorsMap;
		this.colors = colors;
	}
}
