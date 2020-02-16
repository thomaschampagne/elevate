import { ProgressMode } from "../enums/progress-mode.enum";

export interface ProgressConfig {
	mode: ProgressMode;
	activityTypes: string[];
	includeCommuteRide: boolean;
	includeIndoorRide: boolean;
}
