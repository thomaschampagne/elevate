import { AthleteSnapshot } from "@elevate/shared/models/athlete/athlete-snapshot.model";

export class FitnessPreparedActivityModel {
  public id: number | string;
  public date: Date;
  public timestamp: number;
  public dayOfYear: number;
  public year: number;
  public type: string;
  public name: string;
  public hasPowerMeter: boolean;
  public athleteSnapshot: AthleteSnapshot;
  public heartRateStressScore?: number;
  public trainingImpulseScore?: number;
  public powerStressScore?: number;
  public runningStressScore?: number;
  public swimStressScore?: number;
}
