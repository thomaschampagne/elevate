import { FitnessTrendConfigModel } from "./fitness-trend-config.model";

export class FitnessTrendConfigDialogData {
	public fitnessTrendConfigModel: FitnessTrendConfigModel;
	public lastFitnessActiveDate: Date;
	public hasCyclingFtp: boolean;
	public hasRunningFtp: boolean;
	public isPowerMeterEnabled: boolean;
	public expandEstimatedStressScorePanel: boolean;
}
