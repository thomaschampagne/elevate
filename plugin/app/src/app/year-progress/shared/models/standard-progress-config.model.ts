import { ProgressMode } from "../enums/progress-mode.enum";
import { ProgressConfigModel } from "../interfaces/progress-config.model";

export class StandardProgressConfigModel implements ProgressConfigModel {

	public readonly mode: ProgressMode = ProgressMode.STANDARD_CUMULATIVE;
	public readonly typesFilter: string[];
	public readonly yearsFilter: number[];
	public readonly isMetric: boolean;
	public readonly includeCommuteRide: boolean;
	public readonly includeIndoorRide: boolean;

	constructor(typesFilter: string[], yearsFilter: number[], isMetric: boolean, includeCommuteRide: boolean, includeIndoorRide: boolean) {
		this.typesFilter = typesFilter;
		this.yearsFilter = yearsFilter;
		this.isMetric = isMetric;
		this.includeCommuteRide = includeCommuteRide;
		this.includeIndoorRide = includeIndoorRide;
	}
}
