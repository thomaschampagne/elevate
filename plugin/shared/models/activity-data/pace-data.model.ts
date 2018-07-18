import { ZoneModel } from "./zone.model";

export class PaceDataModel {
	public avgPace: number;
	public best20min: number;
	public lowerQuartilePace: number;
	public medianPace: number;
	public upperQuartilePace: number;
	public variancePace: number;
	public genuineGradeAdjustedAvgPace: number;
	public paceZones: ZoneModel[];
	public gradeAdjustedPaceZones: ZoneModel[];
	public runningStressScore: number;
	public runningStressScorePerHour: number;
}
