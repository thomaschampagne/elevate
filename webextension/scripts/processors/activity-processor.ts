import { AppResourcesModel } from "../models/app-resources.model";
import { ComputeActivityThreadMessageModel } from "../models/compute-activity-thread-message.model";
import { VacuumProcessor } from "./vacuum-processor";
import { UserSettings } from "@elevate/shared/models/user-settings/user-settings.namespace";
import { ActivityStats } from "@elevate/shared/models/sync/activity.model";
import { ActivityEssentials } from "@elevate/shared/models/activity-data/activity-essentials.model";
import { AthleteSnapshotResolver } from "@elevate/shared/resolvers/athlete-snapshot.resolver";
import { AthleteSnapshot } from "@elevate/shared/models/athlete/athlete-snapshot.model";
import { Gender } from "@elevate/shared/models/athlete/gender.enum";
import { ActivityInfoModel } from "@elevate/shared/models/activity-data/activity-info.model";
import { Streams } from "@elevate/shared/models/activity-data/streams.model";
import ExtensionUserSettings = UserSettings.ExtensionUserSettings;

const ComputeAnalysisWorker = require("worker-loader?inline!./workers/compute-analysis.worker");

export class ActivityProcessor {
  protected appResources: AppResourcesModel;
  protected vacuumProcessor: VacuumProcessor;
  protected athleteModelResolver: AthleteSnapshotResolver;
  protected zones: any;
  protected activityInfo: ActivityInfoModel;
  protected computeAnalysisThread: Worker;
  protected userSettings: ExtensionUserSettings;

  constructor(
    vacuumProcessor: VacuumProcessor,
    athleteModelResolver: AthleteSnapshotResolver,
    appResources: AppResourcesModel,
    userSettings: ExtensionUserSettings,
    activityInfo: ActivityInfoModel
  ) {
    this.vacuumProcessor = vacuumProcessor;
    this.athleteModelResolver = athleteModelResolver;
    this.appResources = appResources;
    this.userSettings = userSettings;
    this.activityInfo = activityInfo;
    this.zones = this.userSettings.zones;
  }

  public getAnalysisData(
    activityInfo: ActivityInfoModel,
    bounds: number[],
    callback: (athleteSnapshot: AthleteSnapshot, stats: ActivityStats, hasPowerMeter: boolean) => void
  ): void {
    if (!this.activityInfo.type) {
      console.error("No activity type set for ActivityProcessor");
    }

    setTimeout(() => {
      // Call VacuumProcessor for getting data, compute them and cache them
      this.vacuumProcessor.getActivityStream(
        this.activityInfo,
        (
          activityEssentials: ActivityEssentials,
          streams: Streams,
          athleteWeight: number,
          athleteGender: Gender,
          hasPowerMeter: boolean
        ) => {
          // Get stream on page

          const onDate = this.activityInfo.startTime ? this.activityInfo.startTime : new Date();
          const athleteSnapshot: AthleteSnapshot = this.athleteModelResolver.resolve(onDate);

          // Use as many properties of the author if user 'isOwner'
          if (!this.activityInfo.isOwner) {
            athleteSnapshot.athleteSettings.weight = athleteWeight;
            (athleteSnapshot as any).gender = athleteGender;
          }

          console.log("Compute with AthleteSnapshotModel", JSON.stringify(athleteSnapshot));

          // Compute data in a background thread to avoid UI locking
          this.computeAnalysisThroughDedicatedThread(
            hasPowerMeter,
            athleteSnapshot,
            activityEssentials,
            streams,
            bounds,
            (resultFromThread: ActivityStats) => {
              callback(athleteSnapshot, resultFromThread, hasPowerMeter);
            }
          );
        }
      );
    });
  }

  private computeAnalysisThroughDedicatedThread(
    hasPowerMeter: boolean,
    athleteSnapshot: AthleteSnapshot,
    activityEssentials: ActivityEssentials,
    streams: Streams,
    bounds: number[],
    callback: (activityStats: ActivityStats) => void
  ): void {
    // Lets create that worker/thread!
    this.computeAnalysisThread = new ComputeAnalysisWorker();

    // Send user and activity data to the thread
    // He will compute them in the background
    const threadMessage: ComputeActivityThreadMessageModel = {
      activityType: this.activityInfo.type,
      supportsGap: this.activityInfo.supportsGap,
      isTrainer: this.activityInfo.isTrainer,
      appResources: this.appResources,
      userSettings: this.userSettings,
      isOwner: this.activityInfo.isOwner,
      athleteSnapshot: athleteSnapshot,
      hasPowerMeter: hasPowerMeter,
      activityEssentials: activityEssentials,
      streams: streams,
      bounds: bounds,
      returnPeaks: true,
      returnZones: true
    };

    this.computeAnalysisThread.postMessage(threadMessage);

    // Listen messages from thread. Thread will send to us the result of computation
    this.computeAnalysisThread.onmessage = (messageFromThread: MessageEvent) => {
      callback(messageFromThread.data);
      // Finish and kill thread
      this.computeAnalysisThread.terminate();
    };
  }
}
