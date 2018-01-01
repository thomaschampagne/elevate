import { ProgressType } from "./progress-type.enum";

export class YearProgressTypeModel {

	public type: ProgressType;
	public label: string;
	public unit: string;

	constructor(type: ProgressType, label: string, unit?: string) {
		this.type = type;
		this.label = label;
		this.unit = unit;
	}
}
