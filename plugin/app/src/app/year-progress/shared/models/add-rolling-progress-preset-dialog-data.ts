import { ProgressMode } from "../enums/progress-mode.enum";
import { AddYearToDateProgressPresetDialogData } from "./add-year-to-date-progress-preset-dialog-data";
import { YearProgressTypeModel } from "./year-progress-type.model";


export class AddRollingProgressPresetDialogData extends AddYearToDateProgressPresetDialogData {

	public readonly mode: ProgressMode = ProgressMode.ROLLING;
	public rollingPeriod: string;
	public periodMultiplier: number;

	constructor(yearProgressTypeModel: YearProgressTypeModel, activityTypes: string[], includeCommuteRide: boolean, includeIndoorRide: boolean,
				targetValue: number, selectedRollingPeriod: string, periodMultiplier: number) {
		super(yearProgressTypeModel, activityTypes, includeCommuteRide, includeIndoorRide, targetValue);
		this.rollingPeriod = selectedRollingPeriod;
		this.periodMultiplier = periodMultiplier;
	}
}
