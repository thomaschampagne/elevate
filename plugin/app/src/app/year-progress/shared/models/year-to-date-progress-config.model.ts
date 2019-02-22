import { ProgressMode } from "../enums/progress-mode.enum";
import { ProgressConfig } from "../interfaces/progress-config";

export class YearToDateProgressConfigModel implements ProgressConfig {

	public readonly mode: ProgressMode = ProgressMode.YEAR_TO_DATE;
	public readonly activityTypes: string[];
	public readonly isMetric: boolean;
	public readonly includeCommuteRide: boolean;
	public readonly includeIndoorRide: boolean;
	public years: number[] = [];

	public static instanceFrom(progressConfig: ProgressConfig): YearToDateProgressConfigModel {

		if (progressConfig.mode !== ProgressMode.YEAR_TO_DATE) {
			throw new Error("progressConfig.mode !== ProgressMode.YEAR_TO_DATE");
		}

		return new YearToDateProgressConfigModel(progressConfig.activityTypes, progressConfig.isMetric, progressConfig.includeCommuteRide,
			progressConfig.includeIndoorRide);
	}

	constructor(activityTypes: string[], isMetric: boolean, includeCommuteRide: boolean, includeIndoorRide: boolean) {
		this.activityTypes = activityTypes;
		this.isMetric = isMetric;
		this.includeCommuteRide = includeCommuteRide;
		this.includeIndoorRide = includeIndoorRide;
		this.years = [];
	}
}
