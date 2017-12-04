export class DayStress {

	public ids: number[];
	public date: Date;
	public timestamp: number;
	public type: string[];
	public activitiesName: string[];

	public trimpScore?: number = null;
	public powerStressScore?: number = null;
	public swimStressScore?: number = null;
	public finalStressScore: number = null;

	public previewDay: boolean;

	constructor(date: Date, previewDay: boolean) {
		this.ids = [];
		this.date = date;
		this.timestamp = date.getTime();
		this.type = [];
		this.activitiesName = [];
		this.previewDay = previewDay;
	}

	public printTrimpScore(): string {
		return this.trimpScore.toFixed(0);
	}

	public printPowerStressScore(): string {
		return this.powerStressScore.toFixed(0);
	}

	public printSwimStressScore(): string {
		return this.swimStressScore.toFixed(0);
	}

	public printFinalStressScore(): string {
		return this.finalStressScore.toFixed(0);
	}

}
