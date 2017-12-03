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

	public printFitness(): string {
		return this._ctl.toFixed(2);
	}

	public printFatigue(): string {
		return this._atl.toFixed(2);
	}

	public printForm(): string {
		return this._tsb.toFixed(2);
	}

	public printDate(): string {

		const todayMoment = moment().startOf("day");
		const dayFitnessMoment = moment(this.date);

		let niceDate: string = null;

		if (this.previewDay) {
			niceDate = "Preview Day";
		} else if (todayMoment.isSame(dayFitnessMoment)) {
			niceDate = "Today";
		} else {
			niceDate = dayFitnessMoment.format("MMM DD YYYY");
		}
		return niceDate;
	}

	public printActivities(): string {
		let printed = "Rest day";
		if (this.activitiesName.length > 0) {
			printed = this.activitiesName.join("; ");
		}
		return printed
	}

	get dateString(): string {
		return this._dateString;
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
