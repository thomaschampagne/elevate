import { UpFlatDownModel } from "./up-flat-down.model";
import { ZoneModel } from "../zone.model";
import { PeaksData } from "./peaks-data";
import { PeakModel } from "../peak.model";

export class CadenceDataModel implements PeaksData {
  public cadenceActivePercentage: number;
  public cadenceActiveTime: number;
  public averageCadence: number;
  public averageActiveCadence: number;
  public standardDeviationCadence: number;
  public totalOccurrences: number;
  public maxCadence: number;
  public lowerQuartileCadence: number;
  public medianCadence: number;
  public upperQuartileCadence: number;
  public upFlatDownCadencePaceData?: UpFlatDownModel;
  public averageDistancePerOccurrence: number;
  public cadenceZones: ZoneModel[];
  public peaks: PeakModel[];
}
