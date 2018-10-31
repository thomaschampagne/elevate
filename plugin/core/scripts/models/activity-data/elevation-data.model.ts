import { ZoneModel } from "../../../../shared/models/zone.model";
import { AscentSpeedDataModel } from "./ascent-speed-data.model";

export class ElevationDataModel {
	public avgElevation: number;
	public accumulatedElevationAscent: number;
	public accumulatedElevationDescent: number;
	public lowerQuartileElevation: number;
	public medianElevation: number;
	public upperQuartileElevation: number;
	public elevationZones: ZoneModel[];
	public ascentSpeedZones: ZoneModel[];
	public ascentSpeed: AscentSpeedDataModel;
}
