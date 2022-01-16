import { IpcListener } from "./ipc-listener.interface";
import { inject, singleton } from "tsyringe";
import { ActivityComputeWorkerParams } from "../workers/activity-compute.worker";
import { WorkerService } from "../worker-service";
import { WorkerType } from "../enum/worker-type.enum";
import { UserSettings } from "@elevate/shared/models/user-settings/user-settings.namespace";
import { IpcTunnelService } from "@elevate/shared/electron/ipc-tunnel";
import { AthleteSnapshot } from "@elevate/shared/models/athlete/athlete-snapshot.model";
import { Streams } from "@elevate/shared/models/activity-data/streams.model";
import { Activity } from "@elevate/shared/models/sync/activity.model";
import { Channel } from "@elevate/shared/electron/channels.enum";
import DesktopUserSettings = UserSettings.DesktopUserSettings;

@singleton()
export class IpcComputeActivityListener implements IpcListener {
  constructor(@inject(WorkerService) private readonly workerService: WorkerService) {}

  public startListening(ipcTunnelService: IpcTunnelService): void {
    // Compute activity
    ipcTunnelService.on<Array<[Activity, AthleteSnapshot, Streams, DesktopUserSettings]>, Activity>(
      Channel.computeActivity,
      payload => {
        const [activity, athleteSnapshot, streams, desktopUserSettings] = payload[0];
        return this.handleComputeActivity(activity, athleteSnapshot, streams, desktopUserSettings);
      }
    );
  }

  public handleComputeActivity(
    activity: Activity,
    athleteSnapshot: AthleteSnapshot,
    streams: Streams,
    userSettings: DesktopUserSettings
  ): Promise<Activity> {
    const workerParams: ActivityComputeWorkerParams = {
      activity: activity,
      athleteSnapshot: athleteSnapshot,
      userSettings: userSettings,
      streams: streams,
      deflateStreams: false,
      returnPeaks: true,
      returnZones: false,
      bounds: null,
      isOwner: true,
      activityEssentials: null
    };

    return this.workerService
      .exec<ActivityComputeWorkerParams, { computedActivity: Activity }>(WorkerType.ACTIVITY_COMPUTE, workerParams)
      .then(result => Promise.resolve(result.computedActivity));
  }
}
