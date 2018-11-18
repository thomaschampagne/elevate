import { AthleteModel } from "@elevate/shared/models";

export class FitnessPreparedActivityModel {
	public id: number;
	public date: Date;
	public timestamp: number;
	public dayOfYear: number;
	public year: number;
	public type: string;
	public name: string;
	public hasPowerMeter: boolean;
	public athleteModel: AthleteModel;
	public heartRateStressScore?: number;
	public trainingImpulseScore?: number;
	public powerStressScore?: number;
	public runningStressScore?: number;
	public swimStressScore?: number;
}
