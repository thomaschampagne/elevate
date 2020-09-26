import { ZoneModel } from "../zone.model";

export class PaceDataModel {
  public avgPace: number;
  public totalAvgPace: number;
  public best20min: number;
  public maxPace: number;
  public lowerQuartilePace: number;
  public medianPace: number;
  public upperQuartilePace: number;
  public standardDeviationPace: number;
  public genuineGradeAdjustedAvgPace: number;
  public paceZones: ZoneModel[];
  public runningStressScore: number;
  public runningStressScorePerHour: number;
  public swimStressScore: number;
  public swimStressScorePerHour: number;
}
