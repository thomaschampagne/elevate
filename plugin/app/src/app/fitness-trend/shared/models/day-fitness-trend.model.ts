import * as moment from "moment";
import { DayStressModel } from "./day-stress.model";
import { TrainingZone } from "../enums/training-zone.enum";
import * as _ from "lodash";

export class DayFitnessTrendModel extends DayStressModel {

	public static readonly DATE_FORMAT: string = "YYYY-MM-DD";

	constructor(dayStress: DayStressModel, ctl: number, atl: number, tsb: number) {
		super(dayStress.date, dayStress.previewDay);

		this.ids = dayStress.ids;
		this.types = dayStress.types;
		this.activitiesName = dayStress.activitiesName;
		this.trainingImpulseScore = dayStress.trainingImpulseScore;
		this.powerStressScore = dayStress.powerStressScore;
		this.swimStressScore = dayStress.swimStressScore;
		this.finalStressScore = dayStress.finalStressScore;

		this.dateString = moment(this.date).format(DayFitnessTrendModel.DATE_FORMAT);
		this.ctl = ctl;
		this.atl = atl;
		this.tsb = tsb;
		this.trainingZone = this.findTrainingZone(this.tsb);
	}

	public dateString: string;
	public ctl: number;
	public atl: number;
	public tsb: number;
	public trainingZone: TrainingZone;
	public trainingZoneAsString: string;

	public printFitness(): number {
		return Math.floor(this.ctl * 10) / 10;
	}

	public printFatigue(): number {
		return Math.floor(this.atl * 10) / 10;
	}

	public printForm(): number {
		return Math.floor(this.tsb * 10) / 10;
	}

	public printDate(): string {

		const dayFitnessMoment = moment(this.date);
		const isToday = moment().startOf("day").isSame(dayFitnessMoment);

		let niceDate: string = dayFitnessMoment.format("dddd, MMMM Do YYYY");

		if (isToday) {
			niceDate = "Today, " + niceDate;
		}

		return niceDate;
	}

	public printShortDate(): string {
		return moment(this.date).format("MMM Do YYYY");
	}

	public hasActivities(): boolean {
		return (this.activitiesName.length > 0);
	}

	public printActivities(defaultEmptyValue?: string): string {

		if (this.activitiesName.length === 0) {
			return (defaultEmptyValue) ? defaultEmptyValue : "";
		}
		return this.activitiesName.join("; ");
	}

	public printTypes(defaultEmptyValue?: string): string {

		if (this.types.length === 0) {
			return (defaultEmptyValue) ? defaultEmptyValue : "";
		}
		return this.types.join("; ");

	}

	public printTypesCount(maxType?: number, defaultEmptyValue?: string): string {

		if (this.types.length === 0) {
			return (defaultEmptyValue) ? defaultEmptyValue : "";
		}

		const typesCount = _(this.types).countBy().map((count, type) => {
			return {type: type, count: count};
		}).orderBy("count", "desc").value();

		let result = "";
		_.forEach(typesCount, (obj: any, index: number) => {

			result += obj.count + " " + obj.type + ((obj.count > 1) ? "s" : "");

			if (maxType && index === (maxType - 1)) {
				const remaining = (typesCount.length - 1) - index;
				result += ((remaining > 0) ? " & " + remaining + " more" : "");
				return false;
			}
			if (index < (typesCount.length - 1)) {
				result += ", ";
			}
		});
		return result;
	}

	public findTrainingZone(tsb: number): TrainingZone {

		if (tsb <= TrainingZone.OVERLOAD) {
			return TrainingZone.OVERLOAD;
		}

		if (tsb <= TrainingZone.OPTIMAL) {
			return TrainingZone.OPTIMAL;
		}

		if (tsb <= TrainingZone.NEUTRAL) {
			return TrainingZone.NEUTRAL;
		}

		if (tsb <= TrainingZone.FRESHNESS) {
			return TrainingZone.FRESHNESS;
		}

		return TrainingZone.TRANSITION;
	}

	public printTrainingZone(): string {
		if (!this.trainingZoneAsString) {
			const trainingZoneString = TrainingZone[this.trainingZone].toLowerCase();
			this.trainingZoneAsString = trainingZoneString.charAt(0).toUpperCase() + trainingZoneString.slice(1);
		}
		return this.trainingZoneAsString;
	}
}
