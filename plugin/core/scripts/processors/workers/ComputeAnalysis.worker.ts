import { IComputeActivityThreadMessage } from "../../interfaces/IComputeActivityThreadMessage";
import { ActivityComputer } from "../ActivityComputer";
import { AnalysisDataModel } from "../../../shared/models/activity-data/analysis-data.model";

onmessage = (mainThreadEvent: MessageEvent) => {

	const threadMessage: IComputeActivityThreadMessage = mainThreadEvent.data;

	const analysisComputer: ActivityComputer = new ActivityComputer(
		threadMessage.activityType,
		threadMessage.isTrainer,
		threadMessage.userSettings,
		threadMessage.athleteWeight,
		threadMessage.isActivityAuthor,
		threadMessage.hasPowerMeter,
		threadMessage.activityStatsMap,
		threadMessage.activityStream,
		threadMessage.bounds,
		threadMessage.returnZones);
	const result: AnalysisDataModel = analysisComputer.compute();

	postMessage(result);

};
