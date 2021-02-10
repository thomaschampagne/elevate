import { ComputeActivityThreadMessageModel } from "../../models/compute-activity-thread-message.model";
import { AnalysisDataModel } from "@elevate/shared/models";
import { ActivityComputer } from "@elevate/shared/sync";

onmessage = (mainThreadEvent: MessageEvent) => {
  const threadMessage: ComputeActivityThreadMessageModel = mainThreadEvent.data;

  const result: AnalysisDataModel = ActivityComputer.calculate(
    {
      type: threadMessage.activityType,
      trainer: threadMessage.isTrainer,
      hasPowerMeter: threadMessage.hasPowerMeter
    },
    threadMessage.athleteSnapshot,
    threadMessage.userSettings,
    threadMessage.streams,
    threadMessage.returnZones,
    threadMessage.bounds,
    threadMessage.isOwner,
    threadMessage.activitySourceData
  );
  postMessage(result);
};
