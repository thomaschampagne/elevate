import { ZoneModel } from "./zone.model";

export class PowerDataModel {
	public hasPowerMeter: boolean;
	public avgWatts: number;
	public avgWattsPerKg: number;
	public weightedPower: number;
	public ftp: number;
	public variabilityIndex: number;
	public punchFactor: number;
	public powerStressScore: number;
	public powerStressScorePerHour: number;
	public weightedWattsPerKg: number;
	public lowerQuartileWatts: number;
	public medianWatts: number;
	public upperQuartileWatts: number;
	public powerZones: ZoneModel[];
	public isEstimatedRunningPower?: boolean;
}
