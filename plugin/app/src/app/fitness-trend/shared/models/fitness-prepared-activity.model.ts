export class FitnessPreparedActivityModel {
	public id: number;
	public date: Date;
	public timestamp: number;
	public dayOfYear: number;
	public year: number;
	public type: string;
	public activityName: string;
	public trainingImpulseScore?: number;
	public powerStressScore?: number;
	public swimStressScore?: number;
}
