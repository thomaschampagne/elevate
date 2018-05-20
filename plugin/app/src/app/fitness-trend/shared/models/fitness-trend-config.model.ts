import { HeartRateImpulseMode } from "../enums/heart-rate-impulse-mode.enum";
import { InitializedFitnessTrendModel } from "./initialized-fitness-trend.model";

export class FitnessTrendConfigModel {
	public heartRateImpulseMode: HeartRateImpulseMode;
	public initializedFitnessTrendModel: InitializedFitnessTrendModel;
	public allowEstimatedPowerStressScore: boolean;
	public allowEstimatedRunningStressScore: boolean;
}
