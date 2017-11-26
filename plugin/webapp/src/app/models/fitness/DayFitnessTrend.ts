import * as moment from "moment";
import { DayStress } from "./DayStress";

export class DayFitnessTrend extends DayStress {

	public static readonly DATE_FORMAT: string = "YYYY-MM-DD";

	constructor(dayStress: DayStress, ctl: number, atl: number, tsb: number) {
		super(dayStress.date, dayStress.previewDay);

		this.ids = dayStress.ids;
		this.type = dayStress.type;
		this.activitiesName = dayStress.activitiesName;
		this.trimpScore = dayStress.trimpScore;
		this.powerStressScore = dayStress.powerStressScore;
		this.swimStressScore = dayStress.swimStressScore;
		this.finalStressScore = dayStress.finalStressScore;

		this._dateString = moment(this.date).format(DayFitnessTrend.DATE_FORMAT);
		this._ctl = ctl;
		this._atl = atl;
		this._tsb = tsb;
	}

	private _dateString: string;
	private _ctl: number;
	private _atl: number;
	private _tsb: number;

	get dateString(): string {
		return this._dateString;
	}

	set dateString(value: string) {
		this._dateString = value;
	}

	get ctl(): number {
		return this._ctl;
	}

	set ctl(value: number) {
		this._ctl = value;
	}

	get atl(): number {
		return this._atl;
	}

	set atl(value: number) {
		this._atl = value;
	}

	get tsb(): number {
		return this._tsb;
	}

	set tsb(value: number) {
		this._tsb = value;
	}
}
