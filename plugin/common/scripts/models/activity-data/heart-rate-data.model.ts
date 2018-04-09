import { ZoneModel } from "./zone.model";

export class HeartRateDataModel {
	public HRSS: number;
	public HRSSPerHour: number;
	public TRIMP: number;
	public TRIMPPerHour: number;
	public fthr: number;
	public lowerQuartileHeartRate: number;
	public medianHeartRate: number;
	public upperQuartileHeartRate: number;
	public averageHeartRate: number;
	public maxHeartRate: number;
	public activityHeartRateReserve: number;
	public activityHeartRateReserveMax: number;
	public heartRateZones: ZoneModel[];
}
