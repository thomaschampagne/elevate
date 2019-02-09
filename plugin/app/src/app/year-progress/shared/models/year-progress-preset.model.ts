import { ProgressType } from "../enums/progress-type.enum";
import * as _ from "lodash";

export class YearProgressPresetModel {

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
