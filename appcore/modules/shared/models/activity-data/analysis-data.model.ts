import { SpeedDataModel } from "./speed-data.model";
import { PaceDataModel } from "./pace-data.model";
import { PowerDataModel } from "./power-data.model";
import { HeartRateDataModel } from "./heart-rate-data.model";
import { GradeDataModel } from "./grade-data.model";
import { CadenceDataModel } from "./cadence-data.model";
import { ElevationDataModel } from "./elevation-data.model";

export class AnalysisDataModel {
	public moveRatio: number;
	public runningPerformanceIndex: number;
	public speedData: SpeedDataModel;
	public paceData: PaceDataModel;
	public powerData: PowerDataModel;
	public heartRateData: HeartRateDataModel;
	public cadenceData: CadenceDataModel;
	public gradeData: GradeDataModel;
	public elevationData: ElevationDataModel;
}
