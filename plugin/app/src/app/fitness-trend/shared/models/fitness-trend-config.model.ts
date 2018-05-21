import { HeartRateImpulseMode } from "../enums/heart-rate-impulse-mode.enum";
import { InitializedFitnessTrendModel } from "./initialized-fitness-trend.model";
import { Moment } from "moment";

export class FitnessTrendConfigModel {
	public heartRateImpulseMode: HeartRateImpulseMode;
	public initializedFitnessTrendModel: InitializedFitnessTrendModel;
	public allowEstimatedPowerStressScore: boolean;
	public allowEstimatedRunningStressScore: boolean;
	public ignoreBeforeDate: Moment;
	public ignoreActivityNamePatterns: string[];
}
