import { UpFlatDownModel } from "./up-flat-down.model";
import { ZoneModel } from "./zone.model";

export class CadenceDataModel {
	public cadencePercentageMoving: number;
	public cadenceTimeMoving: number;
	public averageCadenceMoving: number;
	public standardDeviationCadence: number;
	public totalOccurrences: number;
	public lowerQuartileCadence: number;
	public medianCadence: number;
	public upperQuartileCadence: number;
	public upFlatDownCadencePaceData?: UpFlatDownModel;
	public averageDistancePerOccurrence: number;
	public lowerQuartileDistancePerOccurrence: number;
	public medianDistancePerOccurrence: number;
	public upperQuartileDistancePerOccurrence: number;
	public cadenceZones: ZoneModel[];
}
