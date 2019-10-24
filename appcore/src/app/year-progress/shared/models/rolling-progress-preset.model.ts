import { ProgressType } from "../enums/progress-type.enum";
import { ProgressMode } from "../enums/progress-mode.enum";
import { YearToDateProgressPresetModel } from "./year-to-date-progress-preset.model";

export class RollingProgressPresetModel extends YearToDateProgressPresetModel {

	public readonly mode: ProgressMode = ProgressMode.ROLLING;
	public rollingPeriod: string;
	public periodMultiplier: number;

	constructor(progressType: ProgressType, activityTypes: string[], includeCommuteRide: boolean, includeIndoorRide: boolean, targetValue: number,
				selectedRollingPeriod: string, periodMultiplier: number) {
		super(progressType, activityTypes, includeCommuteRide, includeIndoorRide, targetValue);
		this.rollingPeriod = selectedRollingPeriod;
		this.periodMultiplier = periodMultiplier;
	}
}
