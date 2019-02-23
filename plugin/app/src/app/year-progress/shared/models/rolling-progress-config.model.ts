import { ProgressMode } from "../enums/progress-mode.enum";
import { YearToDateProgressConfigModel } from "./year-to-date-progress-config.model";
import { ProgressConfig } from "../interfaces/progress-config";

export class RollingProgressConfigModel extends YearToDateProgressConfigModel {

	public static instanceFrom(progressConfig: ProgressConfig): RollingProgressConfigModel {

		if (progressConfig.mode !== ProgressMode.ROLLING) {
			throw new Error("progressConfig.mode !== ProgressMode.ROLLING");
		}

		return new RollingProgressConfigModel(progressConfig.activityTypes, progressConfig.isMetric,
			progressConfig.includeCommuteRide, progressConfig.includeIndoorRide, (<RollingProgressConfigModel>progressConfig).rollingDays);
	}

	public readonly mode = ProgressMode.ROLLING; // Overrides mode

	public readonly rollingDays: number;

	constructor(typesFilter: string[], isMetric: boolean, includeCommuteRide: boolean,
				includeIndoorRide: boolean, rollingDays: number) {
		super(typesFilter, isMetric, includeCommuteRide, includeIndoorRide);
		this.rollingDays = rollingDays;
	}
}
