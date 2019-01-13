import { AthleteModel } from "@elevate/shared/models";

export class DayStressModel {

	public ids: number[];
	public date: Date;
	public timestamp: number;
	public types: string[];
	public activitiesName: string[];
	public athleteModel: AthleteModel;

	public heartRateStressScore?: number = null;
	public trainingImpulseScore?: number = null;
	public powerStressScore?: number = null;
	public runningStressScore?: number = null;
	public swimStressScore?: number = null;

	public heartRateStressScores: number[];
	public trainingImpulseScores: number[];
	public powerStressScores: number[];
	public runningStressScores: number[];
	public swimStressScores: number[];
	public finalStressScores: number[];

	public finalStressScore: number = null;
	public previewDay: boolean;

	constructor(date: Date, previewDay: boolean) {
		this.ids = [];
		this.date = date;
		this.timestamp = date.getTime();
		this.types = [];
		this.activitiesName = [];
		this.previewDay = previewDay;

		this.heartRateStressScores = [];
		this.trainingImpulseScores = [];
		this.powerStressScores = [];
		this.runningStressScores = [];
		this.swimStressScores = [];
		this.finalStressScores = [];
	}

	public printHeartRateStressScore(): string {
		return this.printNumericValue(this.heartRateStressScore);
	}

	public printTrainingImpulseScore(): string {
		return this.printNumericValue(this.trainingImpulseScore);
	}

	public printPowerStressScore(): string {
		return this.printNumericValue(this.powerStressScore);
	}

	public printRunningStressScore(): string {
		return this.printNumericValue(this.runningStressScore);
	}

	public printSwimStressScore(): string {
		return this.printNumericValue(this.swimStressScore);
	}

	public printFinalStressScore(): string {
		return this.printNumericValue(this.finalStressScore);
	}

	protected printNumericValue(value: number): string {
		return (value) ? Math.floor(value).toString() : "-";
	}

	protected printValues(values: any[], defaultEmptyValue: string): string {
		if (values.length === 0) {
			return (defaultEmptyValue) ? defaultEmptyValue : "";
		}
		return values.map((value: any) => value || defaultEmptyValue).join("\n\n");
	}

}
