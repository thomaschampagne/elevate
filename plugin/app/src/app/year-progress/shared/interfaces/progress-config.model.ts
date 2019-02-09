import { ProgressMode } from "../enums/progress-mode.enum";

export interface ProgressConfigModel {
	readonly mode: ProgressMode
	readonly typesFilter: string[];
	readonly yearsFilter: number[];
	readonly isMetric: boolean;
	readonly includeCommuteRide: boolean;
	readonly includeIndoorRide: boolean;
}
