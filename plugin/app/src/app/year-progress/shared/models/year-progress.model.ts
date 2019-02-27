import { ProgressModel } from "./progress.model";
import { ProgressMode } from "../enums/progress-mode.enum";

export class YearProgressModel {

	public mode: ProgressMode;
	public year: number;
	public progressions: ProgressModel[];

	constructor(year: number, progressions: ProgressModel[]) {
		this.year = year;
		this.progressions = progressions;
	}

}
