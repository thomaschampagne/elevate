import * as moment from "moment";
import { DayStress } from "./day-stress.model";

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

		this.dateString = moment(this.date).format(DayFitnessTrend.DATE_FORMAT);
		this.ctl = ctl;
		this.atl = atl;
		this.tsb = tsb;
	}

	public dateString: string;
	public ctl: number;
	public atl: number;
	public tsb: number;

	public printFitness(): string {
		return this.ctl.toFixed(2);
	}

	public printFatigue(): string {
		return this.atl.toFixed(2);
	}

	public printForm(): string {
		return this.tsb.toFixed(2);
	}

	public printDate(): string {

		const dayFitnessMoment = moment(this.date);
		const isToday = moment().startOf("day").isSame(dayFitnessMoment);

		let niceDate: string = dayFitnessMoment.format("dddd, MMMM Do YYYY");

		if (isToday) {
			niceDate = "Today, " + niceDate;
		}

		/*if (this.previewDay) {
			niceDate = "Preview Day, " + niceDate;
		}*/

		return niceDate;
	}

	public printActivities(): string {

		let printed = "Rest day";
		if (this.activitiesName.length > 0) {
			printed = this.activitiesName.join("; ");
		} else if (this.previewDay) {
			printed = "-";
		}
		return printed;
	}

}
