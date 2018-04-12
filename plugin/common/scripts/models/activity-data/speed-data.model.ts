import { ZoneModel } from "./zone.model";

export class SpeedDataModel {
	public genuineAvgSpeed: number;
	public totalAvgSpeed: number;
	public avgPace: number;
	public lowerQuartileSpeed: number;
	public medianSpeed: number;
	public upperQuartileSpeed: number;
	public varianceSpeed: number;
	public standardDeviationSpeed: number;
	public speedZones: ZoneModel[];
}
