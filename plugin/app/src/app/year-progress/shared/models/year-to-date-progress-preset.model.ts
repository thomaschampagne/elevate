import * as _ from "lodash";
import { ProgressType } from "../enums/progress-type.enum";
import { ProgressMode } from "../enums/progress-mode.enum";

export class YearToDateProgressPresetModel {

	public readonly mode: ProgressMode = ProgressMode.YEAR_TO_DATE;
	public progressType: ProgressType;
	public activityTypes: string[];
	public includeCommuteRide: boolean;
	public includeIndoorRide: boolean;
	public targetValue?: number;

	constructor(progressType: ProgressType, activityTypes: string[], includeCommuteRide: boolean, includeIndoorRide: boolean, targetValue?: number) {
		this.progressType = progressType;
		this.activityTypes = activityTypes;
		this.includeCommuteRide = includeCommuteRide;
		this.includeIndoorRide = includeIndoorRide;
		this.targetValue = (_.isNumber(targetValue) && targetValue > 0) ? targetValue : null;
	}
}
