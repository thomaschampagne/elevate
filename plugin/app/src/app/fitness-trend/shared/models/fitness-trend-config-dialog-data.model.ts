import { FitnessTrendConfigModel } from "./fitness-trend-config.model";

export class FitnessTrendConfigDialogData {
	public fitnessTrendConfigModel: FitnessTrendConfigModel;
	public lastFitnessActiveDate: Date;
	public isPowerMeterEnabled: boolean;
	public expandEstimatedStressScorePanel: boolean;
}
