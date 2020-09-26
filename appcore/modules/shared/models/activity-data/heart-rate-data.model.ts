import { ZoneModel } from "../zone.model";
import { PeaksData } from "./peaks-data";
import { PeakModel } from "../peak.model";

export class HeartRateDataModel implements PeaksData {
  public HRSS: number;
  public HRSSPerHour: number;
  public TRIMP: number;
  public TRIMPPerHour: number;
  public best20min: number;
  public best60min: number;
  public lowerQuartileHeartRate: number;
  public medianHeartRate: number;
  public upperQuartileHeartRate: number;
  public averageHeartRate: number;
  public maxHeartRate: number;
  public activityHeartRateReserve: number;
  public activityHeartRateReserveMax: number;
  public heartRateZones: ZoneModel[];
  public peaks: PeakModel[];
}
