import { UpFlatDownModel } from "./up-flat-down.model";
import { ZoneModel } from "../zone.model";
import { GradeProfile } from "../../enums";
import { PeaksData } from "./peaks-data";
import { PeakModel } from "../peak.model";

export class GradeDataModel implements PeaksData {
  public avgGrade: number;
  public avgMaxGrade: number;
  public avgMinGrade: number;
  public lowerQuartileGrade: number;
  public medianGrade: number;
  public upperQuartileGrade: number;
  public upFlatDownInSeconds: UpFlatDownModel;
  public upFlatDownMoveData: UpFlatDownModel;
  public upFlatDownDistanceData: UpFlatDownModel;
  public upFlatDownCadencePaceData: UpFlatDownModel | null;
  public gradeProfile: GradeProfile;
  public peaks: PeakModel[];
  public gradeZones: ZoneModel[];
}
