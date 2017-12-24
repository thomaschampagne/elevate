import { ProgressionModel } from "./progression.model";

export class YearProgressModel {

	public year: number;
	public progressions: ProgressionModel[];

	constructor(year: number, progressions: ProgressionModel[]) {
		this.year = year;
		this.progressions = progressions;
	}

}
