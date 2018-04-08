import { UpFlatDownSumTotalModel } from "./up-flat-down-sum-total.model";
import { UpFlatDownModel } from "./up-flat-down.model";
import { ZoneModel } from "./zone.model";

export class GradeDataModel {
	public avgGrade: number;
	public avgMaxGrade: number;
	public avgMinGrade: number;
	public lowerQuartileGrade: number;
	public medianGrade: number;
	public upperQuartileGrade: number;
	public upFlatDownInSeconds: UpFlatDownSumTotalModel;
	public upFlatDownMoveData: UpFlatDownModel;
	public upFlatDownDistanceData: UpFlatDownModel;
	public upFlatDownCadencePaceData: UpFlatDownModel | null;
	public gradeProfile: string;
	public gradeZones: ZoneModel[];
}
