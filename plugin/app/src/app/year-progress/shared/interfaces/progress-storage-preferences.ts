import { ProgressType } from "../enums/progress-type.enum";
import { ProgressConfig } from "./progress-config";

export interface ProgressStoragePreferences {
	config: {
		get: () => ProgressConfig,
		set: (progressConfig: ProgressConfig) => void
	};
	progressType: {
		get: () => ProgressType,
		set: (progressType: ProgressType) => void
	};
	selectedYears: {
		get: () => number[],
		set: (selectedYears: number[]) => void
	};
	targetValue: {
		get: () => number,
		set: (targetValue: number) => void,
		rm: () => void
	};
	rollingPeriod: {
		get: () => string,
		set: (selectedRollingPeriod: string) => void,
		rm: () => void
	};
	periodMultiplier: {
		get: () => number,
		set: (periodMultiplier: number) => void,
		rm: () => void
	};
	isGraphExpanded: {
		get: () => boolean,
		set: (expanded: boolean) => void
	};
}
