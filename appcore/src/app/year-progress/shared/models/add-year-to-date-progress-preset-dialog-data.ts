import { YearProgressTypeModel } from "./year-progress-type.model";
import { ProgressMode } from "../enums/progress-mode.enum";

export class AddYearToDateProgressPresetDialogData {
	public readonly mode: ProgressMode = ProgressMode.YEAR_TO_DATE;
	public yearProgressTypeModel: YearProgressTypeModel;
	public activityTypes: string[];
	public includeCommuteRide: boolean;
	public includeIndoorRide: boolean;
	public targetValue: number;

	constructor(yearProgressTypeModel: YearProgressTypeModel, activityTypes: string[], includeCommuteRide: boolean, includeIndoorRide: boolean, targetValue: number) {
		this.yearProgressTypeModel = yearProgressTypeModel;
		this.activityTypes = activityTypes;
		this.includeCommuteRide = includeCommuteRide;
		this.includeIndoorRide = includeIndoorRide;
		this.targetValue = (targetValue) ? targetValue : null;
	}
}
