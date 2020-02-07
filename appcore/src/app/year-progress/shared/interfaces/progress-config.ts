import { ProgressMode } from "../enums/progress-mode.enum";
import { ElevateSport } from "../../../../../modules/shared/enums";

export interface ProgressConfig {
	readonly mode: ProgressMode;
	activityTypes: ElevateSport[];
	includeCommuteRide: boolean;
	includeIndoorRide: boolean;
}
