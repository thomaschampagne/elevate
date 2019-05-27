import { ComputeActivityThreadMessageModel } from "../../models/compute-activity-thread-message.model";
import { AnalysisDataModel } from "@elevate/shared/models";
import { ActivityComputer } from "@elevate/shared/sync";

onmessage = (mainThreadEvent: MessageEvent) => {

	const threadMessage: ComputeActivityThreadMessageModel = mainThreadEvent.data;

	const analysisComputer: ActivityComputer = new ActivityComputer(
		threadMessage.activityType,
		threadMessage.isTrainer,
		threadMessage.userSettings,
		threadMessage.athleteSnapshot,
		threadMessage.isOwner,
		threadMessage.hasPowerMeter,
		threadMessage.activitySourceData,
		threadMessage.activityStream,
		threadMessage.bounds,
		threadMessage.returnZones);

	const result: AnalysisDataModel = analysisComputer.compute();
	postMessage(result);
};
