import { parentPort, workerData } from "worker_threads";
import { ActivityComputeProcessor } from "../processors/activity-compute/activity-compute.processor";
import { AthleteSnapshot } from "@elevate/shared/models/athlete/athlete-snapshot.model";
import { ActivityEssentials } from "@elevate/shared/models/activity-data/activity-essentials.model";
import { UserSettings } from "@elevate/shared/models/user-settings/user-settings.namespace";
import { Streams } from "@elevate/shared/models/activity-data/streams.model";
import { Activity } from "@elevate/shared/models/sync/activity.model";

export interface ActivityComputeWorkerParams {
  activity: Partial<Activity>;
  athleteSnapshot: AthleteSnapshot;
  userSettings: UserSettings.BaseUserSettings;
  streams: Streams;
  deflateStreams: boolean;
  returnPeaks: boolean;
  returnZones: boolean;
  bounds: number[];
  isOwner: boolean;
  activityEssentials: ActivityEssentials;
}

ActivityComputeProcessor.compute(
  workerData.activity,
  workerData.athleteSnapshot,
  workerData.userSettings,
  workerData.streams,
  workerData.deflateStreams,
  workerData.returnPeaks,
  workerData.returnZones,
  workerData.bounds,
  workerData.isOwner,
  workerData.activityEssentials
)
  .then(result => {
    parentPort.postMessage({ data: result });
  })
  .catch(error => {
    parentPort.postMessage({ error: error });
  });
