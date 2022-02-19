import { ComputeActivityThreadMessageModel } from "../../models/compute-activity-thread-message.model";
import { ActivityStats } from "@elevate/shared/models/sync/activity.model";
import { ActivityComputer } from "@elevate/shared/sync/compute/activity-computer";

onmessage = (mainThreadEvent: MessageEvent) => {
  const threadMessage: ComputeActivityThreadMessageModel = mainThreadEvent.data;

  const result: ActivityStats = ActivityComputer.compute(
    {
      type: threadMessage.activityType,
      trainer: threadMessage.isTrainer,
      hasPowerMeter: threadMessage.hasPowerMeter
    },
    threadMessage.athleteSnapshot,
    threadMessage.userSettings,
    threadMessage.streams,
    threadMessage.returnPeaks,
    threadMessage.returnZones,
    threadMessage.bounds,
    threadMessage.isOwner,
    threadMessage.activityEssentials
  );
  postMessage(result);
};
