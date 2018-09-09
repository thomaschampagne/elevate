import { ComputeActivityThreadMessageModel } from "../../models/compute-activity-thread-message.model";
import { ActivityComputer } from "../ActivityComputer";
import { AnalysisDataModel } from "../../models/activity-data/analysis-data.model";

onmessage = (mainThreadEvent: MessageEvent) => {

	const threadMessage: ComputeActivityThreadMessageModel = mainThreadEvent.data;

	const analysisComputer: ActivityComputer = new ActivityComputer(
		threadMessage.activityType,
		threadMessage.isTrainer,
		threadMessage.userSettings,
		threadMessage.athleteModel,
		threadMessage.isActivityAuthor,
		threadMessage.hasPowerMeter,
		threadMessage.activityStatsMap,
		threadMessage.activityStream,
		threadMessage.bounds,
		threadMessage.returnZones);
	const result: AnalysisDataModel = analysisComputer.compute();

	postMessage(result);

};
