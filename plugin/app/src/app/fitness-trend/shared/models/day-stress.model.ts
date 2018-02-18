export class DayStressModel {

	public ids: number[];
	public date: Date;
	public timestamp: number;
	public types: string[];
	public activitiesName: string[];

	public trainingImpulseScore?: number = null;
	public powerStressScore?: number = null;
	public swimStressScore?: number = null;

	public finalStressScore: number = null;
	public previewDay: boolean;

	constructor(date: Date, previewDay: boolean) {
		this.ids = [];
		this.date = date;
		this.timestamp = date.getTime();
		this.types = [];
		this.activitiesName = [];
		this.previewDay = previewDay;
	}

	public printTrainingImpulseScore(): string {
		return (this.trainingImpulseScore) ? this.trainingImpulseScore.toFixed(0) : "-";
	}

	public printPowerStressScore(): string {
		return (this.powerStressScore) ? this.powerStressScore.toFixed(0) : "-";
	}

	public printSwimStressScore(): string {
		return (this.swimStressScore) ? this.swimStressScore.toFixed(0) : "-";
	}

	public printFinalStressScore(): string {
		return (this.finalStressScore) ? this.finalStressScore.toFixed(0) : "-";
	}


}
