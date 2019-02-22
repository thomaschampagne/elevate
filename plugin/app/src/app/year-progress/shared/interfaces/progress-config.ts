import { ProgressMode } from "../enums/progress-mode.enum";

export interface ProgressConfig {
	readonly mode: ProgressMode
	readonly activityTypes: string[];
	readonly years: number[];
	readonly isMetric: boolean;
	readonly includeCommuteRide: boolean;
	readonly includeIndoorRide: boolean;
}
