import { ProgressMode } from "../enums/progress-mode.enum";

export interface ProgressConfig {
	readonly mode: ProgressMode
	activityTypes: string[];
	isMetric: boolean;
	includeCommuteRide: boolean;
	includeIndoorRide: boolean;
}
