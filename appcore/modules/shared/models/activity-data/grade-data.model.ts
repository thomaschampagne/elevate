import { UpFlatDownModel } from "./up-flat-down.model";
import { ZoneModel } from "../zone.model";
import { GradeProfile } from "../../enums";

export class GradeDataModel {
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
  public gradeZones: ZoneModel[];
}
