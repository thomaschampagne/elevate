import { ProgressType } from "./progress-type.enum";
import * as _ from "lodash";

export class YearProgressPresetModel {

	public id: string;
	public progressType: ProgressType;
	public activityTypes: string[];
	public targetValue?: number;

	constructor(id: string, progressType: ProgressType, activityTypes: string[], targetValue: number) {
		this.id = id;
		this.progressType = progressType;
		this.activityTypes = activityTypes;
		this.targetValue = (_.isNumber(targetValue)) ? targetValue : null;
	}
}
