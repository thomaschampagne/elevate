import * as moment from "moment";
import { DayStressModel } from "./day-stress.model";
import { TrainingZone } from "../enums/training-zone.enum";
import * as _ from "lodash";

export class DayFitnessTrendModel extends DayStressModel {

	public static readonly DATE_FORMAT: string = "YYYY-MM-DD";

	constructor(dayStress: DayStressModel, ctl: number, atl: number, tsb: number, prevCtl?: number, prevAtl?: number, prevTsb?: number) {
		super(dayStress.date, dayStress.previewDay);

		this.ids = dayStress.ids;
		this.types = dayStress.types;
		this.activitiesName = dayStress.activitiesName;
		this.trainingImpulseScore = dayStress.trainingImpulseScore;
		this.powerStressScore = dayStress.powerStressScore;
		this.swimStressScore = dayStress.swimStressScore;
		this.finalStressScore = dayStress.finalStressScore;
		this.athleteModel = (dayStress.athleteModel) ? dayStress.athleteModel : null;

		this.dateString = moment(this.date).format(DayFitnessTrendModel.DATE_FORMAT);

		this.ctl = ctl;
		this.atl = atl;
		this.tsb = tsb;

		this.prevCtl = (prevCtl) ? prevCtl : null;
		this.prevAtl = (prevAtl) ? prevAtl : null;
		this.prevTsb = (prevTsb) ? prevTsb : null;

		this.trainingZone = this.findTrainingZone(this.tsb);
	}

	public dateString: string;

	public ctl: number;
	public atl: number;
	public tsb: number;

	public prevCtl: number;
	public prevAtl: number;
	public prevTsb: number;

	public trainingZone: TrainingZone;
	public trainingZoneAsString: string;

	public printFitness(): number {
		return _.floor(this.ctl, 1);
	}

	public printFatigue(): number {
		return _.floor(this.atl, 1);
	}

	public printForm(): number {
		return _.floor(this.tsb, 1);
	}

	public printDeltaFitness(): string {
		if (!this.prevCtl) {
			return null;
		}
		const delta = _.floor(this.ctl, 1) - _.floor(this.prevCtl, 1);
		return ((delta >= 0) ? "+" : "") + _.round(delta, 1);
	}

	public printDeltaFatigue(): string {
		if (!this.prevAtl) {
			return null;
		}
		const delta = _.floor(this.atl, 1) - _.floor(this.prevAtl, 1);
		return ((delta >= 0) ? "+" : "") + _.round(delta, 1);
	}

	public printDeltaForm(): string {
		if (!this.prevTsb) {
			return null;
		}
		const delta = _.floor(this.tsb, 1) - _.floor(this.prevTsb, 1);
		return ((delta >= 0) ? "+" : "") + _.round(delta, 1);
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
		return moment(this.date).format("dd, MMM Do YYYY");
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

	public printAthleteSettings(): string {

		if (!this.athleteModel) {
			return null;
		}

		let inlineSettings = "";

		if (_.isNumber(this.heartRateStressScore) || _.isNumber(this.trainingImpulseScore)) {

			inlineSettings += "MaxHr " + this.athleteModel.athleteSettings.maxHr + "bpm. ";
			inlineSettings += "RestHr " + this.athleteModel.athleteSettings.restHr + "bpm. ";

			if (this.athleteModel.athleteSettings.lthr.default
				|| this.athleteModel.athleteSettings.lthr.cycling
				|| this.athleteModel.athleteSettings.lthr.running) {

				let lthrStr = "Lthr ";

				lthrStr += (this.athleteModel.athleteSettings.lthr.default) ? "D:" + this.athleteModel.athleteSettings.lthr.default + "bpm, " : "";
				lthrStr += (this.athleteModel.athleteSettings.lthr.cycling) ? "C:" + this.athleteModel.athleteSettings.lthr.cycling + "bpm, " : "";
				lthrStr += (this.athleteModel.athleteSettings.lthr.running) ? "R:" + this.athleteModel.athleteSettings.lthr.running + "bpm, " : "";
				lthrStr = lthrStr.slice(0, -2);

				inlineSettings += lthrStr + ". ";
			}

		}

		if (_.isNumber(this.powerStressScore) && this.athleteModel.athleteSettings.cyclingFtp) {
			inlineSettings += "Cycling Ftp " + this.athleteModel.athleteSettings.cyclingFtp + "w. ";
		}

		if (_.isNumber(this.runningStressScore) && this.athleteModel.athleteSettings.runningFtp) {
			inlineSettings += "Run Ftp " + this.athleteModel.athleteSettings.runningFtp + "s/km. ";
		}

		if (_.isNumber(this.swimStressScore) && this.athleteModel.athleteSettings.swimFtp) {
			inlineSettings += "Swim Ftp " + this.athleteModel.athleteSettings.swimFtp + "m/min. ";
		}

		inlineSettings += "Weight " + this.athleteModel.athleteSettings.weight + "kg.";

		return inlineSettings;

	}

}
