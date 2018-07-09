import { PeriodModel } from "./period.model";

export class LastPeriodModel extends PeriodModel {

	public key: string;
	public label: string;

	constructor(from: Date, to: Date, key: string, label: string) {
		super(from, to);
		this.key = key;
		this.label = label;
	}
}
