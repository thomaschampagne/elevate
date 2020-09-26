import { ZoneModel } from "../zone.model";
import { PeakModel } from "../peak.model";
import { PeaksData } from "./peaks-data";

export class SpeedDataModel implements PeaksData {
  public genuineAvgSpeed: number;
  public totalAvgSpeed: number;
  public maxSpeed: number;
  public best20min: number;
  public avgPace: number;
  public lowerQuartileSpeed: number;
  public medianSpeed: number;
  public upperQuartileSpeed: number;
  public standardDeviationSpeed: number;
  public speedZones: ZoneModel[];
  public peaks: PeakModel[];
}
